// 属性表数据录入组件
function AttributeFormDataEntry({ projectId, form, fields, onClose, onSuccess }) {
  const [existingData, setExistingData] = React.useState([]); // 已录入的数据
  const [selectedParentPath, setSelectedParentPath] = React.useState([]); // 选中的上级路径
  const [newValue, setNewValue] = React.useState(''); // 新录入的值
  const [currentLevel, setCurrentLevel] = React.useState(1); // 当前操作的级别
  const [loading, setLoading] = React.useState(false);
  const [importing, setImporting] = React.useState(false); // Excel导入中

  // 文件选择器引用
  const fileInputRef = React.useRef(null);

  // 获取属性表结构信息
  const getLevelFields = () => {
    return form.structure?.levelFields || [];
  };

  const getLevelCount = () => {
    return form.structure?.levels || 0;
  };

  // 获取某级别的字段信息
  const getFieldInfo = (level) => {
    const levelField = getLevelFields().find(lf => lf.level === level);
    if (!levelField) return null;
    return fields.find(f => f.id === levelField.fieldId);
  };

  // 获取某级别的字段ID
  const getFieldId = (level) => {
    const levelField = getLevelFields().find(lf => lf.level === level);
    return levelField?.fieldId;
  };

  // 初始化
  React.useEffect(() => {
    loadExistingData();
  }, [form]);

  // 加载已有数据
  const loadExistingData = () => {
    if (form && form.data) {
      setExistingData(form.data);
    } else {
      setExistingData([]);
    }
  };

  // Excel导入功能
  const handleExcelImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      alert('请选择Excel文件（.xlsx 或 .xls）');
      event.target.value = '';
      return;
    }

    setImporting(true);

    try {
      // 延迟执行，确保 loading 状态被渲染
      await new Promise(resolve => setTimeout(resolve, 50));

      const data = await readExcelFile(file);
      await processExcelData(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  // 读取Excel文件
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            reject(new Error('Excel文件至少需要包含表头行和一行数据'));
            return;
          }
          
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Excel文件解析失败：' + error.message));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('文件读取失败'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  // 处理Excel数据（属性表特殊逻辑）
  const processExcelData = async (excelData) => {
    const levelFields = getLevelFields();
    const levelCount = getLevelCount();
    
    if (levelFields.length === 0) {
      throw new Error('属性表结构未定义');
    }

    // 跳过第一行（表头）
    const dataRows = excelData.slice(1).filter(row => row && row.length > 0);
    
    if (dataRows.length === 0) {
      throw new Error('Excel文件中没有数据');
    }

    // 属性表需要按级别顺序读取列
    // 每行数据的列数应等于级别数
    const existingDataSet = new Set(
      existingData.map(d => {
        return levelFields.map(lf => d[lf.fieldId] || '').join('|');
      })
    );

    const recordsToImport = [];
    const importedKeys = new Set();

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      const rowNumber = rowIndex + 2;
      
      const record = {};
      
      // 按级别顺序读取
      for (let level = 1; level <= levelCount; level++) {
        const levelField = levelFields.find(lf => lf.level === level);
        if (!levelField) continue;
        
        const colIndex = level - 1;
        const cellValue = row[colIndex];
        const fieldInfo = getFieldInfo(level);
        
        // 空值检查
        if (cellValue === undefined || cellValue === null || cellValue === '') {
          throw new Error(`第${rowNumber}行：第${level}级属性"${fieldInfo?.name || ''}"不能为空`);
        }
        
        record[levelField.fieldId] = String(cellValue).trim();
      }
      
      // 构建唯一键检查重复
      const recordKey = levelFields.map(lf => record[lf.fieldId] || '').join('|');
      
      if (importedKeys.has(recordKey)) {
        throw new Error(`第${rowNumber}行：数据在Excel中重复`);
      }
      
      if (existingDataSet.has(recordKey)) {
        throw new Error(`第${rowNumber}行：数据与已有记录重复`);
      }
      
      importedKeys.add(recordKey);
      
      // 添加ID和时间戳
      record.id = `DATA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${rowIndex}`;
      record.createdAt = new Date().toISOString();
      
      recordsToImport.push(record);
    }

    // 批量保存
    for (const record of recordsToImport) {
      await window.dndDB.addFormData(projectId, form.id, record);
    }

    alert(`成功导入 ${recordsToImport.length} 条数据`);

    // 刷新数据
    const formList = await window.dndDB.getFormsByProjectId(projectId);
    const updatedForm = formList.find(f => f.id === form.id);
    if (updatedForm && updatedForm.data) {
      setExistingData(updatedForm.data);
    }

    onSuccess();
  };

  // 获取某级别在指定上级路径下的所有值
  const getValuesAtLevel = (level, parentPath = []) => {
    const fieldId = getFieldId(level);
    if (!fieldId) return [];

    // 筛选符合上级路径的数据
    let filteredData = existingData;
    
    for (let i = 1; i < level; i++) {
      const parentFieldId = getFieldId(i);
      const parentValue = parentPath[i - 1];
      if (parentValue !== undefined) {
        filteredData = filteredData.filter(d => d[parentFieldId] === parentValue);
      }
    }

    // 提取该级别的唯一值
    const values = [...new Set(filteredData.map(d => d[fieldId]).filter(v => v !== undefined && v !== ''))];
    return values.sort();
  };

  // 获取第1级的所有值
  const getLevel1Values = () => {
    return getValuesAtLevel(1);
  };

  // 选择上级值
  const handleSelectParent = (level, value) => {
    const newPath = [...selectedParentPath];
    newPath[level - 1] = value;
    // 清除更低级别的选择
    for (let i = level; i < getLevelCount(); i++) {
      newPath[i] = undefined;
    }
    setSelectedParentPath(newPath.filter(v => v !== undefined));
    // 设置当前操作级别为下一级
    setCurrentLevel(Math.min(level + 1, getLevelCount()));
    setNewValue('');
  };

  // 直接选择要添加数据的级别
  const handleSelectLevel = (level) => {
    setCurrentLevel(level);
    // 如果选择的级别比当前路径深，保持路径
    // 如果选择更高级别，截断路径
    if (level <= selectedParentPath.length) {
      setSelectedParentPath(selectedParentPath.slice(0, level - 1));
    }
    setNewValue('');
  };

  // 检查值是否已存在（同级唯一性）
  const isValueExists = (level, value, parentPath) => {
    const existingValues = getValuesAtLevel(level, parentPath);
    return existingValues.includes(value);
  };

  // 添加新值
  const handleAddValue = async () => {
    if (!newValue.trim()) {
      alert('请输入值');
      return;
    }

    // 检查是否需要先选择上级
    if (currentLevel > 1 && selectedParentPath.length < currentLevel - 1) {
      alert(`请先选择上级（第 ${selectedParentPath.length + 1} 级）`);
      return;
    }

    // 检查同级唯一性
    if (isValueExists(currentLevel, newValue.trim(), selectedParentPath)) {
      alert(`"${newValue.trim()}" 在当前级别已存在`);
      return;
    }

    setLoading(true);

    try {
      const currentFieldId = getFieldId(currentLevel);
      const levelCount = getLevelCount();
      
      // 如果是第1级或最后一级，直接创建新记录
      // 如果是中间级别，尝试复用上级已存在但当前级别为空的记录
      let shouldUpdate = false;
      let recordToUpdate = null;
      
      if (currentLevel > 1 && currentLevel < levelCount) {
        // 查找符合上级路径且当前级别为空的记录
        recordToUpdate = existingData.find(record => {
          // 检查上级路径是否匹配
          for (let i = 1; i < currentLevel; i++) {
            const fieldId = getFieldId(i);
            if (record[fieldId] !== selectedParentPath[i - 1]) {
              return false;
            }
          }
          // 检查当前级别是否为空
          const currentValue = record[currentFieldId];
          if (currentValue === undefined || currentValue === null || currentValue === '') {
            return true;
          }
          return false;
        });
        
        if (recordToUpdate) {
          shouldUpdate = true;
        }
      }
      
      // 如果是最后一级，也尝试复用
      if (currentLevel === levelCount && currentLevel > 1) {
        recordToUpdate = existingData.find(record => {
          // 检查上级路径是否匹配
          for (let i = 1; i < currentLevel; i++) {
            const fieldId = getFieldId(i);
            if (record[fieldId] !== selectedParentPath[i - 1]) {
              return false;
            }
          }
          // 检查当前级别是否为空
          const currentValue = record[currentFieldId];
          if (currentValue === undefined || currentValue === null || currentValue === '') {
            return true;
          }
          return false;
        });
        
        if (recordToUpdate) {
          shouldUpdate = true;
        }
      }

      if (shouldUpdate && recordToUpdate) {
        // 更新已有记录
        const updatedRecord = { ...recordToUpdate };
        updatedRecord[currentFieldId] = newValue.trim();
        updatedRecord.updatedAt = new Date().toISOString();
        
        await window.dndDB.updateFormData(projectId, form.id, recordToUpdate.id, updatedRecord);
      } else {
        // 创建新记录
        const newRecord = {
          id: `ATTR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString()
        };

        // 填充上级路径的值
        for (let i = 1; i < currentLevel; i++) {
          const fieldId = getFieldId(i);
          newRecord[fieldId] = selectedParentPath[i - 1];
        }

        // 填充当前级别的值
        newRecord[currentFieldId] = newValue.trim();

        // 保存到数据库
        await window.dndDB.addFormData(projectId, form.id, newRecord);
      }

      // 刷新数据
      const formList = await window.dndDB.getFormsByProjectId(projectId);
      const updatedForm = formList.find(f => f.id === form.id);
      if (updatedForm && updatedForm.data) {
        setExistingData(updatedForm.data);
      }

      setNewValue('');
      onSuccess();
      
      alert('数据添加成功！');
    } catch (error) {
      alert('添加失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 渲染级别选择器
  const renderLevelSelector = () => {
    return (
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm text-gray-600">选择要添加数据的级别：</span>
        {Array.from({ length: getLevelCount() }, (_, i) => i + 1).map(level => {
          const fieldInfo = getFieldInfo(level);
          return (
            <button
              key={level}
              onClick={() => handleSelectLevel(level)}
              className={`px-3 py-1 rounded-full text-sm transition-all ${
                currentLevel === level
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              第{level}级 ({fieldInfo?.name || '未知'})
            </button>
          );
        })}
      </div>
    );
  };

  // 渲染上级选择（级联下拉）
  const renderParentSelectors = () => {
    if (currentLevel === 1) return null;

    return (
      <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700">请先选择上级：</h4>
        {Array.from({ length: currentLevel - 1 }, (_, i) => i + 1).map(level => {
          const fieldInfo = getFieldInfo(level);
          const parentPath = selectedParentPath.slice(0, level - 1);
          const availableValues = getValuesAtLevel(level, parentPath);
          const selectedValue = selectedParentPath[level - 1];

          return (
            <div key={level} className="flex items-center space-x-3">
              <label className="w-24 text-sm text-gray-600">
                第{level}级 ({fieldInfo?.name}):
              </label>
              <select
                value={selectedValue || ''}
                onChange={(e) => handleSelectParent(level, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                disabled={level > 1 && !selectedParentPath[level - 2]}
              >
                <option value="">请选择</option>
                {availableValues.map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
              {availableValues.length === 0 && level === 1 && (
                <span className="text-xs text-yellow-600">暂无数据，请先添加第1级</span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染新值输入
  const renderValueInput = () => {
    const fieldInfo = getFieldInfo(currentLevel);
    const canInput = currentLevel === 1 || selectedParentPath.length >= currentLevel - 1;

    return (
      <div className="p-4 bg-purple-50 rounded-lg">
        <h4 className="text-sm font-medium text-purple-700 mb-3">
          添加第 {currentLevel} 级数据 ({fieldInfo?.name})
        </h4>
        
        {!canInput ? (
          <p className="text-sm text-gray-500">请先选择上级</p>
        ) : (
          <div className="flex space-x-3">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder={`输入${fieldInfo?.name || '值'}`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              onKeyPress={(e) => e.key === 'Enter' && handleAddValue()}
            />
            <button
              onClick={handleAddValue}
              disabled={loading || !newValue.trim()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {loading ? '添加中...' : '添加'}
            </button>
          </div>
        )}

        {/* 显示当前路径 */}
        {selectedParentPath.length > 0 && (
          <div className="mt-3 text-sm text-gray-600">
            <span>当前路径：</span>
            {selectedParentPath.map((val, idx) => (
              <span key={idx}>
                {idx > 0 && ' → '}
                <span className="font-medium">{val}</span>
              </span>
            ))}
            {newValue && (
              <>
                <span> → </span>
                <span className="font-medium text-purple-600">{newValue}</span>
                <span className="text-purple-400">（待添加）</span>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // 渲染已有数据表格
  const renderDataTable = () => {
    const levelCount = getLevelCount();
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {Array.from({ length: levelCount }, (_, i) => i + 1).map(level => {
                const fieldInfo = getFieldInfo(level);
                return (
                  <th 
                    key={level}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    第{level}级 ({fieldInfo?.name || '未知'})
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {existingData.length === 0 ? (
              <tr>
                <td colSpan={levelCount} className="px-4 py-8 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              existingData.map((record, idx) => (
                <tr key={record.id || idx} className="hover:bg-gray-50">
                  {Array.from({ length: levelCount }, (_, i) => i + 1).map(level => {
                    const fieldId = getFieldId(level);
                    return (
                      <td key={level} className="px-4 py-3 text-sm text-gray-900">
                        {record[fieldId] || '-'}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            属性表数据录入 - {form.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {getLevelCount()} 级属性表 | 已有 {existingData.length} 条数据
          </p>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 级别选择器 */}
          {renderLevelSelector()}

          {/* 上级选择 */}
          {renderParentSelectors()}

          {/* 新值输入 */}
          {renderValueInput()}

          {/* 已有数据表格 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              已录入数据 ({existingData.length} 条)
            </h4>
            {renderDataTable()}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          {/* 左侧：Excel导入 */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={handleExcelImport}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
              disabled={loading || importing}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {importing ? 'Excel导入中...' : 'Excel表导入'}
            </button>
          </div>
          
          {/* 右侧：关闭 */}
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={importing}
          >
            关闭
          </button>
        </div>

        {/* Excel导入加载遮罩 */}
        {importing && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
              <div className="text-gray-700 font-medium text-lg">正在导入Excel数据...</div>
              <div className="text-gray-500 text-sm mt-2">请稍候，这可能需要几秒钟</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.DNDComponents.AttributeFormDataEntry = AttributeFormDataEntry;

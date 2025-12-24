// 数据录入对话框组件（支持基础表和属性表）
function DataEntryDialog({ isOpen, onClose, formId, formName, projectId }) {
  // 表单结构和字段信息
  const [form, setForm] = React.useState(null);
  const [formStructure, setFormStructure] = React.useState(null);
  const [fieldDetails, setFieldDetails] = React.useState({});
  const [allForms, setAllForms] = React.useState([]);
  const [attributeFormData, setAttributeFormData] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  
  // 录入数据
  const [entryData, setEntryData] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  const [importing, setImporting] = React.useState(false); // Excel导入中

  // 属性表相关状态
  const [existingData, setExistingData] = React.useState([]); // 属性表已有数据
  const [selectedParentPath, setSelectedParentPath] = React.useState([]); // 选中的上级路径
  const [newValue, setNewValue] = React.useState(''); // 新录入的值
  const [currentLevel, setCurrentLevel] = React.useState(1); // 当前操作的级别

  // 文件选择器引用
  const fileInputRef = React.useRef(null);

  // 判断是否为属性表
  const isAttributeForm = () => {
    return form?.type === '属性表单';
  };

  // 加载表单结构和字段详情
  React.useEffect(() => {
    if (!isOpen || !formId) return;
    
    const loadFormData = async () => {
      setLoading(true);
      try {
        // 获取所有表单
        const forms = await window.dndDB.getFormsByProjectId(projectId);
        setAllForms(forms);
        
        const currentForm = forms.find(f => f.id === formId);
        
        if (!currentForm || !currentForm.structure) {
          alert('表单结构未定义');
          onClose();
          return;
        }
        
        setForm(currentForm);
        setFormStructure(currentForm.structure);
        
        // 获取所有字段详情
        const fields = await window.dndDB.getFieldsByProjectId(projectId);
        const fieldMap = {};
        fields.forEach(f => {
          fieldMap[f.id] = f;
        });
        setFieldDetails(fieldMap);
        
        // 根据表单类型初始化
        if (currentForm.type === '属性表单') {
          // 属性表：加载已有数据
          setExistingData(currentForm.data || []);
          setCurrentLevel(1);
          setSelectedParentPath([]);
          setNewValue('');
        } else {
          // 基础表：初始化录入数据
          const initialData = {};
          if (currentForm.structure.fields) {
            currentForm.structure.fields.forEach(fieldConfig => {
              if (fieldConfig.hasDefault && fieldConfig.defaultValue !== undefined && fieldConfig.defaultValue !== '') {
                initialData[fieldConfig.fieldId] = fieldConfig.defaultValue;
              } else {
                initialData[fieldConfig.fieldId] = '';
              }
            });
          }
          setEntryData(initialData);
          
          // 加载属性表数据（用于基础表中的属性字段）
          if (currentForm.structure.fields) {
            await loadAttributeFormData(currentForm.structure.fields, forms);
          }
        }
        
      } catch (error) {
        console.error('加载表单失败:', error);
        alert('加载表单失败: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadFormData();
  }, [isOpen, formId, projectId]);

  // 加载属性表数据
  const loadAttributeFormData = async (structureFields, forms) => {
    const attrData = {};
    
    // 找出所有属性字段配置
    const attrFields = structureFields.filter(f => f.isAttributeField);
    
    for (const af of attrFields) {
      if (!af.attributeFormId) continue;
      
      const attributeForm = forms.find(f => f.id === af.attributeFormId);
      if (attributeForm) {
        attrData[af.attributeFormId] = {
          formName: attributeForm.name,
          structure: attributeForm.structure,
          data: attributeForm.data || []
        };
      }
    }
    
    setAttributeFormData(attrData);
  };

  // Excel导入功能
  const handleExcelImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls'].includes(fileExtension)) {
      alert('请选择Excel文件（.xlsx 或 .xls）');
      event.target.value = '';
      return;
    }

    setImporting(true);

    try {
      const data = await readExcelFile(file);
      await processExcelData(data);
    } catch (error) {
      alert(error.message);
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

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

  const processExcelData = async (excelData) => {
    if (!formStructure || !formStructure.fields) {
      throw new Error('表单结构未定义');
    }

    const formFields = formStructure.fields;
    const dataRows = excelData.slice(1).filter(row => row && row.length > 0);
    
    if (dataRows.length === 0) {
      throw new Error('Excel文件中没有数据');
    }

    // 获取已有数据用于主键检测
    const existingData = form?.data || [];
    const primaryKeyFieldConfig = formFields.find(f => f.isPrimaryKey);
    const existingPrimaryKeys = new Set(existingData.map(d => d[primaryKeyFieldConfig?.fieldId]));
    const importPrimaryKeys = new Set();

    const recordsToImport = [];

    for (let rowIndex = 0; rowIndex < dataRows.length; rowIndex++) {
      const row = dataRows[rowIndex];
      const rowNumber = rowIndex + 2;
      
      const record = {};
      
      for (let colIndex = 0; colIndex < formFields.length; colIndex++) {
        const fieldConfig = formFields[colIndex];
        const fieldInfo = fieldDetails[fieldConfig.fieldId];
        const cellValue = row[colIndex];
        
        // 必填字段校验
        if (fieldConfig.required && (cellValue === undefined || cellValue === null || cellValue === '')) {
          throw new Error(`第${rowNumber}行：字段"${fieldInfo?.name || fieldConfig.fieldId}"为必填项，不能为空`);
        }
        
        // 类型校验和转换
        if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
          const validatedValue = validateAndConvertValue(cellValue, fieldInfo, rowNumber);
          record[fieldConfig.fieldId] = validatedValue;
        } else {
          record[fieldConfig.fieldId] = fieldConfig.hasDefault ? fieldConfig.defaultValue : '';
        }
      }
      
      // 主键重复检测
      if (primaryKeyFieldConfig) {
        const pkValue = record[primaryKeyFieldConfig.fieldId];
        const pkFieldInfo = fieldDetails[primaryKeyFieldConfig.fieldId];
        
        if (importPrimaryKeys.has(pkValue)) {
          throw new Error(`第${rowNumber}行：主键字段"${pkFieldInfo?.name}"的值"${pkValue}"在Excel中重复`);
        }
        if (existingPrimaryKeys.has(pkValue)) {
          throw new Error(`第${rowNumber}行：主键字段"${pkFieldInfo?.name}"的值"${pkValue}"与已有数据重复`);
        }
        importPrimaryKeys.add(pkValue);
      }
      
      record.id = `DATA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${rowIndex}`;
      record.createdAt = new Date().toISOString();
      
      recordsToImport.push(record);
    }

    // 批量保存
    for (const record of recordsToImport) {
      await window.dndDB.addFormData(projectId, formId, record);
    }

    alert(`成功导入 ${recordsToImport.length} 条数据`);
    
    // 刷新表单数据
    const forms = await window.dndDB.getFormsByProjectId(projectId);
    const updatedForm = forms.find(f => f.id === formId);
    if (updatedForm) {
      setForm(updatedForm);
    }
  };

  const validateAndConvertValue = (value, fieldInfo, rowNumber) => {
    if (!fieldInfo) return value;

    const fieldType = fieldInfo.type;
    const fieldName = fieldInfo.name;

    switch (fieldType) {
      case '整数':
        const intVal = parseInt(value, 10);
        if (isNaN(intVal)) {
          throw new Error(`第${rowNumber}行：字段"${fieldName}"应为整数，但值为"${value}"`);
        }
        return intVal;
      
      case '小数':
        const floatVal = parseFloat(value);
        if (isNaN(floatVal)) {
          throw new Error(`第${rowNumber}行：字段"${fieldName}"应为小数，但值为"${value}"`);
        }
        return floatVal;
      
      case '布尔':
        const boolStr = String(value).toLowerCase().trim();
        if (['true', '是', '1', 'yes', 'y'].includes(boolStr)) return true;
        if (['false', '否', '0', 'no', 'n'].includes(boolStr)) return false;
        throw new Error(`第${rowNumber}行：字段"${fieldName}"应为布尔值（是/否），但值为"${value}"`);
      
      case '日期':
        if (typeof value === 'number') {
          const date = XLSX.SSF.parse_date_code(value);
          if (date) {
            return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          }
        }
        const dateObj = new Date(value);
        if (isNaN(dateObj.getTime())) {
          throw new Error(`第${rowNumber}行：字段"${fieldName}"应为有效日期，但值为"${value}"`);
        }
        return value;
      
      case '时间':
        if (typeof value === 'number') {
          const totalSeconds = Math.round(value * 24 * 60 * 60);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        }
        return String(value);
      
      default:
        return String(value);
    }
  };

  // 获取字段配置（从表单结构中）
  const getFieldConfig = (fieldId) => {
    if (!formStructure || !formStructure.fields) return null;
    return formStructure.fields.find(f => f.fieldId === fieldId);
  };

  // 获取同一属性表中级别更高（数字更小）的属性字段
  const getHigherLevelAttributeFields = (fieldId) => {
    const config = getFieldConfig(fieldId);
    if (!config || !config.isAttributeField) return [];

    const attributeFormId = config.attributeFormId;
    const currentLevel = config.level;

    // 找出同一属性表中级别更高的字段
    return formStructure.fields
      .filter(f => f.isAttributeField && f.attributeFormId === attributeFormId && f.level < currentLevel)
      .sort((a, b) => a.level - b.level);
  };

  // 获取属性字段的可选值（基于上级选择进行过滤）
  const getAttributeFieldOptions = (fieldId) => {
    const config = getFieldConfig(fieldId);
    if (!config || !config.isAttributeField) return [];

    const attrFormData = attributeFormData[config.attributeFormId];
    if (!attrFormData || !attrFormData.data || attrFormData.data.length === 0) {
      return [];
    }

    const currentLevel = config.level;
    const levelFields = attrFormData.structure?.levelFields || [];
    
    // 获取当前级别对应的字段ID
    const currentLevelField = levelFields.find(lf => lf.level === currentLevel);
    if (!currentLevelField) return [];

    let filteredData = attrFormData.data;

    // 根据上级选择过滤
    const higherFields = getHigherLevelAttributeFields(fieldId);
    for (const hf of higherFields) {
      const hfLevelField = levelFields.find(lf => lf.level === hf.level);
      if (hfLevelField) {
        const selectedValue = entryData[hf.fieldId];
        if (selectedValue) {
          filteredData = filteredData.filter(d => d[hfLevelField.fieldId] === selectedValue);
        } else {
          // 上级未选择，不能选择当前级别
          return [];
        }
      }
    }

    // 提取当前级别的唯一值
    const values = [...new Set(filteredData.map(d => d[currentLevelField.fieldId]).filter(v => v !== undefined && v !== ''))];
    return values.sort();
  };

  // 当属性字段值变化时，清除下级字段的值
  const handleAttributeFieldChange = (fieldId, value) => {
    const config = getFieldConfig(fieldId);
    if (!config || !config.isAttributeField) {
      handleFieldChange(fieldId, value);
      return;
    }

    // 设置当前字段值
    const newValues = { ...entryData, [fieldId]: value };

    // 清除同一属性表中更低级别字段的值
    const attributeFormId = config.attributeFormId;
    const currentLevel = config.level;

    formStructure.fields
      .filter(f => f.isAttributeField && f.attributeFormId === attributeFormId && f.level > currentLevel)
      .forEach(f => {
        newValues[f.fieldId] = '';
      });

    setEntryData(newValues);
  };

  // 更新字段值
  const handleFieldChange = (fieldId, value) => {
    setEntryData(prev => ({ ...prev, [fieldId]: value }));
  };

  // 提交数据
  const handleSubmit = async () => {
    // 验证必填字段
    for (const fieldConfig of formStructure.fields) {
      const value = entryData[fieldConfig.fieldId];
      if (value === undefined || value === null || value === '') {
        const fieldInfo = fieldDetails[fieldConfig.fieldId];
        alert(`请填写字段: ${fieldInfo?.name || fieldConfig.fieldId}`);
        return;
      }
    }
    
    setSubmitting(true);
    try {
      // 构建数据记录
      const record = { ...entryData };
      
      // 添加数据到表单
      await window.dndDB.addFormData(projectId, formId, record);
      
      alert('数据添加成功！');
      
      // 清空表单，准备下一条录入（保留默认值）
      const clearedData = {};
      formStructure.fields.forEach(fieldConfig => {
        if (fieldConfig.hasDefault && fieldConfig.defaultValue !== undefined) {
          clearedData[fieldConfig.fieldId] = fieldConfig.defaultValue;
        } else {
          clearedData[fieldConfig.fieldId] = '';
        }
      });
      setEntryData(clearedData);
      
    } catch (error) {
      alert('添加失败: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 渲染字段输入控件
  const renderFieldInput = (fieldConfig) => {
    const fieldInfo = fieldDetails[fieldConfig.fieldId];
    if (!fieldInfo) {
      return <span className="text-red-500 text-sm">字段未找到</span>;
    }
    
    const value = entryData[fieldConfig.fieldId] || '';
    const fieldId = fieldConfig.fieldId;
    
    // 属性字段 - 显示下拉选择（带级联过滤）
    if (fieldConfig.isAttributeField) {
      const options = getAttributeFieldOptions(fieldId);
      const higherFields = getHigherLevelAttributeFields(fieldId);
      const hasUnselectedHigher = higherFields.some(hf => !entryData[hf.fieldId]);
      
      return (
        <select
          value={value}
          onChange={(e) => handleAttributeFieldChange(fieldId, e.target.value)}
          disabled={hasUnselectedHigher}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            hasUnselectedHigher ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        >
          <option value="">
            {hasUnselectedHigher ? '-- 请先选择上级 --' : '-- 请选择 --'}
          </option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    
    // 根据字段类型渲染不同输入控件
    switch (fieldInfo.type) {
      case '整数':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入整数"
          />
        );
        
      case '浮点数':
        return (
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入数字"
          />
        );
        
      case '逻辑':
        return (
          <select
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- 请选择 --</option>
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        );
        
      case '日期/时间':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
        
      case '富文本':
        return (
          <textarea
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="请输入内容"
          />
        );
        
      case '字符串':
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            maxLength={fieldInfo.length || undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={fieldInfo.length ? `最多${fieldInfo.length}个字符` : '请输入'}
          />
        );
    }
  };

  // ==================== 属性表相关函数 ====================
  
  // 获取属性表的级别字段
  const getLevelFields = () => {
    return formStructure?.levelFields || [];
  };

  // 获取属性表的级数
  const getLevelCount = () => {
    return formStructure?.levels || 0;
  };

  // 获取某级别的字段信息
  const getAttrFieldInfo = (level) => {
    const levelField = getLevelFields().find(lf => lf.level === level);
    if (!levelField) return null;
    return fieldDetails[levelField.fieldId];
  };

  // 获取某级别的字段ID
  const getAttrFieldId = (level) => {
    const levelField = getLevelFields().find(lf => lf.level === level);
    return levelField?.fieldId;
  };

  // 获取某级别在选定上级路径下的可选值
  const getAttrLevelOptions = (level) => {
    if (level === 1) {
      // 第一级：从所有数据中获取不重复的值
      const fieldId = getAttrFieldId(1);
      const values = [...new Set(existingData.map(d => d[fieldId]).filter(v => v !== undefined && v !== ''))];
      return values;
    } else {
      // 下级：根据上级选择过滤
      const fieldId = getAttrFieldId(level);
      let filteredData = existingData;
      
      // 按上级路径过滤
      for (let i = 1; i < level; i++) {
        const parentFieldId = getAttrFieldId(i);
        const parentValue = selectedParentPath[i - 1];
        if (parentValue) {
          filteredData = filteredData.filter(d => d[parentFieldId] === parentValue);
        }
      }
      
      const values = [...new Set(filteredData.map(d => d[fieldId]).filter(v => v !== undefined && v !== ''))];
      return values;
    }
  };

  // 选择上级属性值
  const handleSelectParent = (level, value) => {
    const newPath = [...selectedParentPath];
    newPath[level - 1] = value;
    // 清除下级选择
    for (let i = level; i < getLevelCount(); i++) {
      newPath[i] = undefined;
    }
    setSelectedParentPath(newPath);
    setCurrentLevel(level + 1);
    setNewValue('');
  };

  // 添加属性表数据
  const handleAddAttrData = async () => {
    if (!newValue.trim()) {
      alert('请输入值');
      return;
    }

    // 检查是否有完整的上级路径（如果不是第一级）
    if (currentLevel > 1) {
      for (let i = 1; i < currentLevel; i++) {
        if (!selectedParentPath[i - 1]) {
          alert(`请先选择第${i}级`);
          return;
        }
      }
    }

    // 检查重复
    const fieldId = getAttrFieldId(currentLevel);
    let checkData = existingData;
    for (let i = 1; i < currentLevel; i++) {
      const parentFieldId = getAttrFieldId(i);
      checkData = checkData.filter(d => d[parentFieldId] === selectedParentPath[i - 1]);
    }
    const isDuplicate = checkData.some(d => d[fieldId] === newValue.trim());
    if (isDuplicate) {
      alert('该值已存在');
      return;
    }

    setSubmitting(true);
    try {
      // 构建数据记录
      const record = {};
      for (let i = 1; i < currentLevel; i++) {
        record[getAttrFieldId(i)] = selectedParentPath[i - 1];
      }
      record[fieldId] = newValue.trim();

      await window.dndDB.addFormData(projectId, formId, record);
      
      // 刷新数据
      const forms = await window.dndDB.getFormsByProjectId(projectId);
      const updatedForm = forms.find(f => f.id === formId);
      if (updatedForm) {
        setForm(updatedForm);
        setExistingData(updatedForm.data || []);
      }
      
      setNewValue('');
      alert('添加成功！');
    } catch (error) {
      alert('添加失败：' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ==================== 属性表界面 ====================
  if (isAttributeForm()) {
    const levelCount = getLevelCount();
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150]">
        <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[85vh] flex flex-col">
          {/* 标题栏 - 紫色主题 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-purple-600 text-white rounded-t-lg">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🏷️</span>
              <div>
                <h2 className="text-lg font-semibold">属性表录入</h2>
                <p className="text-sm text-purple-200">{formName || formId} · {levelCount}级属性</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* 录入区域 */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                加载中...
              </div>
            ) : (
              <div className="space-y-4">
                {/* 级别选择器 */}
                {Array.from({ length: levelCount }, (_, i) => i + 1).map(level => {
                  const fieldInfo = getAttrFieldInfo(level);
                  const options = getAttrLevelOptions(level);
                  const isActive = level === currentLevel;
                  const isSelectable = level <= currentLevel;
                  const selectedValue = selectedParentPath[level - 1];
                  
                  return (
                    <div 
                      key={level}
                      className={`border rounded-lg p-4 ${
                        isActive 
                          ? 'border-purple-400 bg-purple-50' 
                          : isSelectable 
                            ? 'border-gray-300' 
                            : 'border-gray-200 bg-gray-50 opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium text-gray-700">
                          <span className="text-purple-600 mr-2">第{level}级</span>
                          {fieldInfo?.name || `级别${level}`}
                        </label>
                        {isActive && (
                          <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                            当前级别
                          </span>
                        )}
                      </div>
                      
                      {isSelectable ? (
                        level < currentLevel ? (
                          // 已选择的上级
                          <div className="flex items-center space-x-2">
                            <select
                              value={selectedValue || ''}
                              onChange={(e) => handleSelectParent(level, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white"
                            >
                              <option value="">-- 请选择 --</option>
                              {options.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <span className="text-green-600">✓</span>
                          </div>
                        ) : (
                          // 当前级别 - 可以选择已有值或输入新值
                          <div className="space-y-2">
                            {options.length > 0 && (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleSelectParent(level, e.target.value);
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded"
                              >
                                <option value="">-- 选择已有值 --</option>
                                {options.map((opt, i) => (
                                  <option key={i} value={opt}>{opt}</option>
                                ))}
                              </select>
                            )}
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                                placeholder="输入新值..."
                                className="flex-1 px-3 py-2 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <button
                                onClick={handleAddAttrData}
                                disabled={submitting || !newValue.trim()}
                                className={`px-4 py-2 rounded ${
                                  submitting || !newValue.trim()
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                }`}
                              >
                                {submitting ? '添加中...' : '添加'}
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="text-gray-400 text-sm">请先选择上级</div>
                      )}
                    </div>
                  );
                })}

                {/* 已有数据预览 */}
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">
                    已录入数据 ({existingData.length}条)
                  </h4>
                  {existingData.length > 0 ? (
                    <div className="max-h-40 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            {getLevelFields().map(lf => (
                              <th key={lf.fieldId} className="px-2 py-1 text-left">
                                {fieldDetails[lf.fieldId]?.name || lf.fieldId}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {existingData.slice(0, 20).map((record, idx) => (
                            <tr key={idx} className="border-b">
                              {getLevelFields().map(lf => (
                                <td key={lf.fieldId} className="px-2 py-1">
                                  {record[lf.fieldId] || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {existingData.length > 20 && (
                        <p className="text-xs text-gray-400 mt-1 text-center">
                          仅显示前20条，共{existingData.length}条
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">暂无数据</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 底部按钮 */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end bg-gray-50 rounded-b-lg">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== 基础表界面（原有逻辑） ====================
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150]">
      <div className="bg-white rounded-lg shadow-xl w-[550px] max-h-[85vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <span className="text-xl">📝</span>
            <div>
              <h2 className="text-lg font-semibold">数据录入</h2>
              <p className="text-sm text-blue-100">{formName || formId}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 录入表单 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              加载中...
            </div>
          ) : formStructure ? (
            <div className="space-y-4">
              {formStructure.fields.map((fieldConfig, index) => {
                const fieldInfo = fieldDetails[fieldConfig.fieldId];
                return (
                  <div key={index} className={`border rounded-lg p-4 ${
                    fieldConfig.isAttributeField ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-gray-700">
                        {fieldConfig.isPrimaryKey && <span className="text-yellow-600 mr-1">🔑</span>}
                        {fieldConfig.isAttributeField && (
                          <span className="text-purple-600 mr-1">
                            第{fieldConfig.level}级
                          </span>
                        )}
                        {fieldInfo?.name || fieldConfig.fieldId}
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <span className="text-xs text-gray-400">
                        {fieldInfo?.type || '未知类型'}
                        {fieldConfig.isAttributeField && ' · 属性字段'}
                      </span>
                    </div>
                    {renderFieldInput(fieldConfig)}
                    {fieldConfig.hasDefault && (
                      <p className="text-xs text-gray-400 mt-1">
                        默认值: {fieldConfig.defaultValue}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              表单结构未定义
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50 rounded-b-lg">
          {/* 左侧：Excel导入 */}
          <div className="flex items-center space-x-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <button
              onClick={handleExcelImport}
              disabled={importing || !formStructure}
              className={`px-4 py-2 rounded flex items-center ${
                importing || !formStructure
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {importing ? 'Excel导入中...' : 'Excel表导入'}
            </button>
            <p className="text-xs text-gray-500">
              提交后表单将清空，可继续录入
            </p>
          </div>
          
          {/* 右侧：关闭和提交 */}
          <div className="space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
            >
              关闭
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || importing || !formStructure}
              className={`px-6 py-2 rounded ${
                submitting || importing || !formStructure
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {submitting ? '提交中...' : '提交数据'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DataEntryDialog = DataEntryDialog;

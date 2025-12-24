// 表单查看组件（显示表单结构和数据）
function FormViewer({ projectId, form, fields, forms, onClose }) {
  const [viewMode, setViewMode] = React.useState('data'); // 'data' 或 'structure'
  const [mergedData, setMergedData] = React.useState([]); // 合表的合并数据
  const [derivedData, setDerivedData] = React.useState([]); // 衍生表的计算数据
  const [baseFormData, setBaseFormData] = React.useState([]); // 基础表数据
  const [loading, setLoading] = React.useState(false);
  
  // 编辑对话框状态
  const [editDialog, setEditDialog] = React.useState({ show: false, record: null });
  const [editFormData, setEditFormData] = React.useState({});
  const [saving, setSaving] = React.useState(false);

  // 初始化
  React.useEffect(() => {
    if (isMergedForm()) {
      loadMergedData();
    } else if (isDerivedForm()) {
      loadDerivedData();
    } else {
      loadBaseFormData();
    }
  }, [form]);

  // 加载基础表数据
  const loadBaseFormData = async () => {
    setLoading(true);
    try {
      const latestForms = await window.dndDB.getFormsByProjectId(projectId);
      const currentForm = latestForms.find(f => f.id === form.id);
      setBaseFormData(currentForm?.data || []);
    } catch (error) {
      console.error('加载基础表数据失败:', error);
      setBaseFormData(form.data || []);
    } finally {
      setLoading(false);
    }
  };

  // 判断是否为合表
  const isMergedForm = () => {
    return form.subType === '合表';
  };

  // 判断是否为衍生表
  const isDerivedForm = () => {
    return form.subType === '衍生表';
  };

  // 判断是否为属性表
  const isAttributeForm = () => {
    return form.type === '属性表单';
  };

  // 加载衍生表数据（从源表获取并计算）
  const loadDerivedData = async () => {
    setLoading(true);
    try {
      const sourceFormId = form.structure?.sourceFormId;
      
      // 从数据库重新获取最新的表单数据
      const latestForms = await window.dndDB.getFormsByProjectId(projectId);
      const sourceForm = latestForms.find(f => f.id === sourceFormId);
      
      if (!sourceForm || !sourceForm.data) {
        setDerivedData([]);
        return;
      }

      const derivedFields = form.structure?.derivedFields || [];
      
      // 对每条源数据计算衍生字段
      const computedData = sourceForm.data.map(record => {
        const newRecord = { ...record };
        
        // 计算每个衍生字段
        derivedFields.forEach(df => {
          newRecord[df.fieldId] = evaluateExpression(df.expression, record, derivedFields, df);
        });
        
        return newRecord;
      });

      setDerivedData(computedData);
    } catch (error) {
      console.error('加载衍生表数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 通用刷新数据函数
  const refreshData = () => {
    if (isMergedForm()) {
      loadMergedData();
    } else if (isDerivedForm()) {
      loadDerivedData();
    } else {
      loadBaseFormData();
    }
  };

  // 保存编辑（在组件顶层定义，供编辑对话框使用）
  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      // 对于衍生表，操作源表；对于基础表，操作自身
      const targetFormId = isDerivedForm() ? form.structure?.sourceFormId : form.id;
      const primaryKey = form.structure?.primaryKey;
      const pkValue = editDialog.record[primaryKey];
      
      // 合并原数据和编辑后的数据
      const updatedRecord = { ...editDialog.record, ...editFormData };
      
      console.log('保存编辑 - targetFormId:', targetFormId);
      console.log('保存编辑 - primaryKey:', primaryKey);
      console.log('保存编辑 - pkValue:', pkValue);
      console.log('保存编辑 - projectId:', projectId);
      console.log('保存编辑 - updatedRecord:', updatedRecord);
      
      const result = await window.dndDB.updateFormData(projectId, targetFormId, pkValue, updatedRecord);
      console.log('保存编辑 - 更新结果:', result);
      
      alert('保存成功！');
      setEditDialog({ show: false, record: null });
      refreshData(); // 重新加载数据
    } catch (error) {
      console.error('保存编辑失败:', error);
      alert('保存失败：' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // 计算表达式的值
  const evaluateExpression = (expr, record, allDerivedFields, derivedFieldConfig = null) => {
    try {
      // 检查是否是分段函数（连续或离散）
      if (expr && (expr.startsWith('PIECEWISE(') || expr.startsWith('PIECEWISE_DISCRETE('))) {
        return evaluatePiecewise(record, derivedFieldConfig, allDerivedFields);
      }

      let evalExpr = expr;
      
      // 替换字段引用为实际值
      const fieldRefs = expr.match(/\[([^\]]+)\]/g) || [];
      for (const ref of fieldRefs) {
        const fieldNameInBracket = ref.slice(1, -1);
        
        // 先查找源表字段
        const sourceFields = form.structure?.fields?.filter(f => f.isSourceField) || [];
        const sourceField = sourceFields.find(sf => getFieldName(sf.fieldId) === fieldNameInBracket);
        if (sourceField) {
          const value = record[sourceField.fieldId];
          evalExpr = evalExpr.replace(ref, value !== undefined && value !== '' ? value : 0);
          continue;
        }

        // 再查找衍生字段
        const derivedField = allDerivedFields.find(df => df.fieldName === fieldNameInBracket);
        if (derivedField) {
          const derivedValue = evaluateExpression(derivedField.expression, record, allDerivedFields, derivedField);
          evalExpr = evalExpr.replace(ref, derivedValue);
        }
      }

      // 将 ^ 转换为 ** (JavaScript指数运算符)
      evalExpr = evalExpr.replace(/\^/g, '**');

      // 验证表达式安全性（允许数字、运算符、小数点、括号、空格、星号）
      if (!/^[\d\s\+\-\*\/\.\(\)]+$/.test(evalExpr)) {
        return 'ERROR';
      }

      const result = eval(evalExpr);
      return typeof result === 'number' ? (Number.isInteger(result) ? result : parseFloat(result.toFixed(2))) : 'ERROR';
    } catch (e) {
      return 'ERROR';
    }
  };

  // 计算分段函数的值
  const evaluatePiecewise = (record, derivedFieldConfig, allDerivedFields) => {
    try {
      if (!derivedFieldConfig || !derivedFieldConfig.expressionConfig) {
        return 'ERROR';
      }

      const config = derivedFieldConfig.expressionConfig;
      const { segmentField, segmentFieldType, anchors, rightmostValue, discreteGroups, defaultValue } = config;
      
      // 获取分段对象的值
      let segmentValue = record[segmentField];
      if (segmentValue === undefined || segmentValue === '') {
        return '-';
      }

      // 离散分段
      if (segmentFieldType === 'discrete') {
        const strValue = String(segmentValue);
        const groups = discreteGroups || [];
        for (const group of groups) {
          if (group.values && group.values.includes(strValue)) {
            return group.mappedValue;
          }
        }
        return defaultValue || '-';
      }

      // 连续分段
      const anchorList = anchors || [];
      if (anchorList.length === 0) return 'ERROR';
      
      segmentValue = parseFloat(segmentValue);

      // 遍历锚点，找到对应的区间
      for (let i = 0; i < anchorList.length; i++) {
        const anchor = anchorList[i];
        const prevAnchor = i > 0 ? anchorList[i - 1] : null;
        const prevBelongRight = prevAnchor?.belong === 'right';

        if (i === 0) {
          // 第一个锚点
          if (anchor.belong === 'left') {
            if (segmentValue <= anchor.value) {
              return anchor.leftValue;
            }
          } else if (anchor.belong === 'independent') {
            if (segmentValue < anchor.value) {
              return anchor.leftValue;
            }
            if (segmentValue === anchor.value) {
              return anchor.equalValue;
            }
          } else { // right
            if (segmentValue < anchor.value) {
              return anchor.leftValue;
            }
          }
        } else {
          // 后续锚点
          const leftBound = prevAnchor.value;
          const leftInclusive = prevBelongRight;

          if (anchor.belong === 'left') {
            if ((leftInclusive ? segmentValue >= leftBound : segmentValue > leftBound) && 
                segmentValue <= anchor.value) {
              return anchor.leftValue;
            }
          } else if (anchor.belong === 'independent') {
            if ((leftInclusive ? segmentValue >= leftBound : segmentValue > leftBound) && 
                segmentValue < anchor.value) {
              return anchor.leftValue;
            }
            if (segmentValue === anchor.value) {
              return anchor.equalValue;
            }
          } else { // right
            if ((leftInclusive ? segmentValue >= leftBound : segmentValue > leftBound) && 
                segmentValue < anchor.value) {
              return anchor.leftValue;
            }
          }
        }
      }

      // 最右侧区间
      const lastAnchor = anchorList[anchorList.length - 1];
      const rightInclusive = lastAnchor.belong === 'right';
      if (rightInclusive ? segmentValue >= lastAnchor.value : segmentValue > lastAnchor.value) {
        return rightmostValue;
      }

      return 'ERROR';
    } catch (e) {
      console.error('Piecewise evaluation error:', e);
      return 'ERROR';
    }
  };

  // 加载合表的合并数据
  const loadMergedData = async () => {
    setLoading(true);
    try {
      const sourceForms = form.structure?.sourceForms || [];
      const primaryKey = form.structure?.primaryKey;

      // 收集所有源表的数据
      const dataMap = new Map();

      for (const sf of sourceForms) {
        const sourceForm = forms.find(f => f.id === sf.formId);
        if (sourceForm && sourceForm.data) {
          sourceForm.data.forEach(record => {
            const pkValue = record[primaryKey];
            if (pkValue) {
              if (!dataMap.has(pkValue)) {
                dataMap.set(pkValue, { [primaryKey]: pkValue });
              }
              // 合并字段
              Object.keys(record).forEach(key => {
                if (key !== 'id' && key !== 'createdAt') {
                  dataMap.get(pkValue)[key] = record[key];
                }
              });
            }
          });
        }
      }

      setMergedData(Array.from(dataMap.values()));
    } catch (error) {
      console.error('加载合表数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取字段名称
  const getFieldName = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  // 获取字段类型
  const getFieldType = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.type : '未知';
  };

  // 获取表单的字段列表
  const getFormFields = () => {
    if (isAttributeForm()) {
      return form.structure?.levelFields?.map(lf => ({
        fieldId: lf.fieldId,
        level: lf.level,
        isPrimaryKey: false,
        isLevelField: true
      })) || [];
    }
    return form.structure?.fields || [];
  };

  // 获取表单数据
  const getFormData = () => {
    if (isMergedForm()) {
      return mergedData;
    }
    if (isDerivedForm()) {
      return derivedData;
    }
    return baseFormData;
  };

  // 渲染结构视图
  const renderStructureView = () => {
    const formFields = getFormFields();

    return (
      <div className="space-y-4">
        {/* 基本信息 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">基本信息</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">表单类型：</span>
              <span className="text-gray-900 font-medium">{form.type}</span>
            </div>
            <div>
              <span className="text-gray-500">子类型：</span>
              <span className="text-gray-900 font-medium">{form.subType || '-'}</span>
            </div>
            {form.structure?.primaryKey && (
              <div>
                <span className="text-gray-500">主键：</span>
                <span className="text-gray-900 font-medium">{getFieldName(form.structure.primaryKey)}</span>
              </div>
            )}
            {isAttributeForm() && (
              <div>
                <span className="text-gray-500">级数：</span>
                <span className="text-gray-900 font-medium">{form.structure?.levels} 级</span>
              </div>
            )}
          </div>
        </div>

        {/* 合表源表信息 */}
        {isMergedForm() && form.structure?.sourceForms && (
          <div className="bg-orange-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-orange-700 mb-2">源表单 ({form.structure.sourceForms.length} 个)</h4>
            <div className="space-y-1">
              {form.structure.sourceForms.map((sf, idx) => (
                <div key={idx} className="text-sm text-orange-600">
                  {idx + 1}. {sf.formName}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 衍生表源表信息 */}
        {isDerivedForm() && form.structure?.sourceFormName && (
          <div className="bg-pink-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-pink-700 mb-2">数据源</h4>
            <div className="text-sm text-pink-600">{form.structure.sourceFormName}</div>
          </div>
        )}

        {/* 衍生字段表达式 */}
        {isDerivedForm() && form.structure?.derivedFields && (
          <div className="bg-pink-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-pink-700 mb-2">衍生字段 ({form.structure.derivedFields.length} 个)</h4>
            <div className="space-y-2">
              {form.structure.derivedFields.map((df, idx) => (
                <div key={idx} className="text-sm">
                  <span className="text-pink-700 font-medium">{df.fieldName}</span>
                  <span className="text-gray-500 mx-2">=</span>
                  <code className="px-2 py-1 bg-white rounded text-pink-600">{df.expression}</code>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 字段列表 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">字段列表 ({formFields.length} 个)</h4>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">字段名称</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">字段类型</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">角色/属性</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {formFields.map((fieldConfig, idx) => (
                  <tr key={idx} className={fieldConfig.isPrimaryKey ? 'bg-blue-50' : fieldConfig.isDerivedField ? 'bg-pink-50' : ''}>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {fieldConfig.isDerivedField ? fieldConfig.fieldName : getFieldName(fieldConfig.fieldId)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {fieldConfig.isDerivedField ? fieldConfig.type : getFieldType(fieldConfig.fieldId)}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {fieldConfig.isPrimaryKey && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">主键</span>
                        )}
                        {fieldConfig.isRelatedField && (
                          <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">关联字段</span>
                        )}
                        {fieldConfig.isAttributeField && (
                          <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                            属性字段 Lv{fieldConfig.level}
                          </span>
                        )}
                        {fieldConfig.isLevelField && (
                          <span className="px-1.5 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                            第{fieldConfig.level}级
                          </span>
                        )}
                        {fieldConfig.isDerivedField && (
                          <span className="px-1.5 py-0.5 text-xs bg-pink-100 text-pink-700 rounded">衍生字段</span>
                        )}
                        {fieldConfig.isSourceField && (
                          <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">源字段</span>
                        )}
                        {fieldConfig.required && !fieldConfig.isPrimaryKey && (
                          <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">必填</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 渲染数据视图
  const renderDataView = () => {
    const formFields = getFormFields();
    const data = getFormData();
    const actionColumn = form.structure?.actionColumn;

    if (loading) {
      return (
        <div className="text-center py-8 text-gray-500">
          加载数据中...
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          暂无数据
          {!isMergedForm() && (
            <p className="text-sm mt-2">请点击"添加数据"录入数据</p>
          )}
          {isMergedForm() && (
            <p className="text-sm mt-2">请先在源表单中录入数据</p>
          )}
          {isDerivedForm() && (
            <p className="text-sm mt-2">请先在源表单中录入数据</p>
          )}
        </div>
      );
    }

    // 获取要显示的字段配置
    const displayFields = formFields.map(f => ({
      fieldId: f.fieldId,
      fieldName: f.isDerivedField ? f.fieldName : getFieldName(f.fieldId),
      isDerivedField: f.isDerivedField
    }));

    // 处理操作栏按钮点击
    const handleEdit = async (record) => {
      // 获取源表的字段配置（只编辑基础字段，不编辑衍生字段）
      const sourceFields = formFields.filter(f => f.isSourceField);
      
      // 初始化编辑数据
      const initialData = {};
      sourceFields.forEach(sf => {
        initialData[sf.fieldId] = record[sf.fieldId] ?? '';
      });
      
      setEditFormData(initialData);
      setEditDialog({ show: true, record: record });
    };

    const handleDelete = async (record) => {
      if (!confirm('确定要删除这条记录吗？')) return;
      
      try {
        // 对于衍生表，操作源表；对于基础表，操作自身
        const targetFormId = isDerivedForm() ? form.structure?.sourceFormId : form.id;
        const primaryKey = form.structure?.primaryKey;
        const pkValue = record[primaryKey];
        
        console.log('删除操作 - targetFormId:', targetFormId);
        console.log('删除操作 - primaryKey:', primaryKey);
        console.log('删除操作 - pkValue:', pkValue);
        console.log('删除操作 - projectId:', projectId);
        console.log('删除操作 - record:', record);
        
        await window.dndDB.deleteFormData(projectId, targetFormId, pkValue);
        alert('删除成功！');
        refreshData(); // 重新加载数据
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败：' + error.message);
      }
    };

    const handleTop = async (record) => {
      try {
        // 对于衍生表，操作源表；对于基础表，操作自身
        const targetFormId = isDerivedForm() ? form.structure?.sourceFormId : form.id;
        const primaryKey = form.structure?.primaryKey;
        const pkValue = record[primaryKey];
        
        // 切换置顶状态
        const isCurrentlyTop = record._isTop === true;
        const updates = {
          _isTop: !isCurrentlyTop,
          _topTime: isCurrentlyTop ? null : new Date().toISOString()
        };
        
        console.log('置顶操作 - targetFormId:', targetFormId);
        console.log('置顶操作 - primaryKey:', primaryKey);
        console.log('置顶操作 - pkValue:', pkValue);
        console.log('置顶操作 - isCurrentlyTop:', isCurrentlyTop);
        console.log('置顶操作 - updates:', updates);
        
        const result = await window.dndDB.updateFormData(projectId, targetFormId, pkValue, { ...record, ...updates });
        console.log('置顶操作 - 更新结果:', result);
        
        refreshData(); // 重新加载数据
      } catch (error) {
        console.error('置顶操作失败:', error);
        alert('操作失败：' + error.message);
      }
    };

    // 对数据进行排序：置顶的在前面，按置顶时间倒序
    const sortedData = [...data].sort((a, b) => {
      if (a._isTop && !b._isTop) return -1;
      if (!a._isTop && b._isTop) return 1;
      if (a._isTop && b._isTop) {
        return new Date(b._topTime || 0) - new Date(a._topTime || 0);
      }
      return 0;
    });

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">#</th>
              {displayFields.map((f, idx) => (
                <th 
                  key={idx} 
                  className={`px-3 py-2 text-left text-xs font-medium ${
                    f.isDerivedField ? 'text-pink-600 bg-pink-50' : 'text-gray-500'
                  }`}
                >
                  {f.fieldName}
                </th>
              ))}
              {/* 操作栏表头 */}
              {actionColumn?.enabled && (
                <th className="px-3 py-2 text-center text-xs font-medium text-orange-600 bg-orange-50">
                  {actionColumn.title || '操作'}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map((record, idx) => (
              <tr key={record.id || idx} className={`hover:bg-gray-50 ${record._isTop ? 'bg-yellow-50' : ''}`}>
                <td className="px-3 py-2 text-sm text-gray-400">
                  {record._isTop && <span className="text-yellow-500 mr-1">📌</span>}
                  {idx + 1}
                </td>
                {displayFields.map((f, fIdx) => (
                  <td 
                    key={fIdx} 
                    className={`px-3 py-2 text-sm ${
                      f.isDerivedField ? 'text-pink-600 bg-pink-50 font-medium' : 'text-gray-900'
                    }`}
                  >
                    {formatCellValue(record[f.fieldId])}
                  </td>
                ))}
                {/* 操作栏单元格 */}
                {actionColumn?.enabled && (
                  <td className="px-3 py-2 bg-orange-50">
                    <div className="flex justify-center gap-1 flex-wrap">
                      {actionColumn.buttons?.edit?.enabled && (
                        <button
                          onClick={() => handleEdit(record)}
                          className="px-2 py-1 text-xs text-white rounded hover:opacity-80"
                          style={{ backgroundColor: actionColumn.buttons.edit.color || '#3b82f6' }}
                        >
                          {actionColumn.buttons.edit.text || '修改'}
                        </button>
                      )}
                      {actionColumn.buttons?.delete?.enabled && (
                        <button
                          onClick={() => handleDelete(record)}
                          className="px-2 py-1 text-xs text-white rounded hover:opacity-80"
                          style={{ backgroundColor: actionColumn.buttons.delete.color || '#ef4444' }}
                        >
                          {actionColumn.buttons.delete.text || '删除'}
                        </button>
                      )}
                      {actionColumn.buttons?.top?.enabled && (
                        <button
                          onClick={() => handleTop(record)}
                          className="px-2 py-1 text-xs text-white rounded hover:opacity-80"
                          style={{ backgroundColor: actionColumn.buttons.top.color || '#f59e0b' }}
                        >
                          {record._isTop 
                            ? (actionColumn.buttons.top.textOn || '取消置顶')
                            : (actionColumn.buttons.top.textOff || '置顶')
                          }
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // 格式化单元格值
  const formatCellValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-300">-</span>;
    }
    if (typeof value === 'boolean') {
      return value ? '是' : '否';
    }
    return String(value);
  };

  // 获取标签颜色
  const getTypeColor = () => {
    if (isAttributeForm()) return 'purple';
    if (isMergedForm()) return 'orange';
    if (form.subType === '独立基础表') return 'green';
    if (form.subType === '关联基础表') return 'blue';
    return 'gray';
  };

  const color = getTypeColor();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {form.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-0.5 text-xs rounded bg-${color}-100 text-${color}-700`}>
                  {form.subType || form.type}
                </span>
                <span className="text-sm text-gray-500">
                  {getFormData().length} 条数据
                </span>
              </div>
            </div>
            {/* 视图切换 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('data')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'data' 
                    ? 'bg-white shadow text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                数据
              </button>
              <button
                onClick={() => setViewMode('structure')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'structure' 
                    ? 'bg-white shadow text-gray-900' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                结构
              </button>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'structure' ? renderStructureView() : renderDataView()}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            关闭
          </button>
        </div>
      </div>
      
      {/* 编辑对话框 */}
      {editDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
            {/* 标题 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
              <h3 className="text-lg font-semibold">✏️ 编辑数据</h3>
              <p className="text-sm text-blue-100 mt-1">修改基础字段数据</p>
            </div>
            
            {/* 表单内容 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {getFormFields().filter(f => f.isSourceField).map((fieldConfig, idx) => {
                  const fieldInfo = fields.find(f => f.id === fieldConfig.fieldId);
                  const isPK = fieldConfig.isPrimaryKey;
                  
                  return (
                    <div key={idx} className={`p-3 rounded border ${isPK ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isPK && <span className="text-yellow-600 mr-1">🔑</span>}
                        {fieldInfo?.name || fieldConfig.fieldId}
                        {isPK && <span className="text-xs text-gray-400 ml-2">(主键，不可修改)</span>}
                      </label>
                      {isPK ? (
                        <input
                          type="text"
                          value={editFormData[fieldConfig.fieldId] || ''}
                          disabled
                          className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-500 cursor-not-allowed"
                        />
                      ) : (
                        <input
                          type={fieldInfo?.type === '整数' || fieldInfo?.type === '小数' ? 'number' : 'text'}
                          value={editFormData[fieldConfig.fieldId] || ''}
                          onChange={(e) => setEditFormData(prev => ({
                            ...prev,
                            [fieldConfig.fieldId]: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 底部按钮 */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setEditDialog({ show: false, record: null })}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                disabled={saving}
              >
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className={`px-4 py-2 rounded text-white ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.FormViewer = FormViewer;
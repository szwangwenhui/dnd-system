// 数据编辑对话框组件（用于修改单条记录）
function DataEditDialog({ isOpen, onClose, formId, formName, recordData, projectId, onSuccess }) {
  // 表单结构和字段信息
  const [formStructure, setFormStructure] = React.useState(null);
  const [fieldDetails, setFieldDetails] = React.useState({});
  const [attributeFormData, setAttributeFormData] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  
  // 编辑数据
  const [editData, setEditData] = React.useState({});
  const [submitting, setSubmitting] = React.useState(false);
  
  // 主键字段ID
  const [primaryKeyId, setPrimaryKeyId] = React.useState(null);

  // 加载表单结构和初始化数据
  React.useEffect(() => {
    if (!isOpen || !formId || !recordData) return;
    
    const loadFormData = async () => {
      setLoading(true);
      try {
        // 获取所有表单
        const forms = await window.dndDB.getFormsByProjectId(projectId);
        const currentForm = forms.find(f => f.id === formId);
        
        if (!currentForm || !currentForm.structure) {
          alert('表单结构未定义');
          onClose();
          return;
        }
        
        setFormStructure(currentForm.structure);
        setPrimaryKeyId(currentForm.structure.primaryKey);
        
        // 获取所有字段详情
        const fields = await window.dndDB.getFieldsByProjectId(projectId);
        const fieldMap = {};
        fields.forEach(f => {
          fieldMap[f.id] = f;
        });
        setFieldDetails(fieldMap);
        
        // 初始化编辑数据（从recordData复制）
        const initialData = {};
        currentForm.structure.fields.forEach(fieldConfig => {
          initialData[fieldConfig.fieldId] = recordData[fieldConfig.fieldId] ?? '';
        });
        setEditData(initialData);
        
        // 加载属性表数据
        await loadAttributeFormData(currentForm.structure.fields, forms);
        
      } catch (error) {
        console.error('加载表单失败:', error);
        alert('加载表单失败: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadFormData();
  }, [isOpen, formId, recordData, projectId]);

  // 加载属性表数据
  const loadAttributeFormData = async (structureFields, forms) => {
    const attrData = {};
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

  // 获取字段配置
  const getFieldConfig = (fieldId) => {
    if (!formStructure || !formStructure.fields) return null;
    return formStructure.fields.find(f => f.fieldId === fieldId);
  };

  // 获取上级属性字段
  const getHigherLevelAttributeFields = (fieldId) => {
    const config = getFieldConfig(fieldId);
    if (!config || !config.isAttributeField) return [];
    const attributeFormId = config.attributeFormId;
    const currentLevel = config.level;
    return formStructure.fields
      .filter(f => f.isAttributeField && f.attributeFormId === attributeFormId && f.level < currentLevel)
      .sort((a, b) => a.level - b.level);
  };

  // 获取属性字段选项
  const getAttributeFieldOptions = (fieldId) => {
    const config = getFieldConfig(fieldId);
    if (!config || !config.isAttributeField) return [];

    const attrFormData = attributeFormData[config.attributeFormId];
    if (!attrFormData || !attrFormData.data || attrFormData.data.length === 0) return [];

    const currentLevel = config.level;
    const levelFields = attrFormData.structure?.levelFields || [];
    const currentLevelField = levelFields.find(lf => lf.level === currentLevel);
    if (!currentLevelField) return [];

    let filteredData = attrFormData.data;
    const higherFields = getHigherLevelAttributeFields(fieldId);
    for (const hf of higherFields) {
      const hfLevelField = levelFields.find(lf => lf.level === hf.level);
      if (hfLevelField) {
        const selectedValue = editData[hf.fieldId];
        if (selectedValue) {
          filteredData = filteredData.filter(d => d[hfLevelField.fieldId] === selectedValue);
        } else {
          return [];
        }
      }
    }

    const values = [...new Set(filteredData.map(d => d[currentLevelField.fieldId]).filter(v => v !== undefined && v !== ''))];
    return values.sort();
  };

  // 属性字段变化时清除下级
  const handleAttributeFieldChange = (fieldId, value) => {
    const config = getFieldConfig(fieldId);
    if (!config || !config.isAttributeField) {
      handleFieldChange(fieldId, value);
      return;
    }

    const newValues = { ...editData, [fieldId]: value };
    const attributeFormId = config.attributeFormId;
    const currentLevel = config.level;

    formStructure.fields
      .filter(f => f.isAttributeField && f.attributeFormId === attributeFormId && f.level > currentLevel)
      .forEach(f => {
        newValues[f.fieldId] = '';
      });

    setEditData(newValues);
  };

  // 更新字段值
  const handleFieldChange = (fieldId, value) => {
    setEditData(prev => ({ ...prev, [fieldId]: value }));
  };

  // 提交修改
  const handleSubmit = async () => {
    // 验证必填字段
    for (const fieldConfig of formStructure.fields) {
      if (fieldConfig.required) {
        const value = editData[fieldConfig.fieldId];
        if (value === undefined || value === null || value === '') {
          const fieldInfo = fieldDetails[fieldConfig.fieldId];
          alert(`请填写必填字段: ${fieldInfo?.name || fieldConfig.fieldId}`);
          return;
        }
      }
    }
    
    setSubmitting(true);
    try {
      // 获取主键值
      const pkValue = recordData[primaryKeyId];
      
      // 更新数据
      await window.dndDB.updateFormData(projectId, formId, pkValue, editData);
      
      alert('数据修改成功！');
      
      if (onSuccess) onSuccess();
      onClose();
      
    } catch (error) {
      alert('修改失败: ' + error.message);
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
    
    const value = editData[fieldConfig.fieldId] ?? '';
    const fieldId = fieldConfig.fieldId;
    const isPrimaryKey = fieldConfig.isPrimaryKey;
    
    // 主键字段禁止编辑
    if (isPrimaryKey) {
      return (
        <input
          type="text"
          value={value}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
        />
      );
    }
    
    // 属性字段
    if (fieldConfig.isAttributeField) {
      const options = getAttributeFieldOptions(fieldId);
      const higherFields = getHigherLevelAttributeFields(fieldId);
      const hasUnselectedHigher = higherFields.some(hf => !editData[hf.fieldId]);
      
      return (
        <select
          value={value}
          onChange={(e) => handleAttributeFieldChange(fieldId, e.target.value)}
          disabled={hasUnselectedHigher}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            hasUnselectedHigher ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        >
          <option value="">{hasUnselectedHigher ? '-- 请先选择上级 --' : '-- 请选择 --'}</option>
          {options.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    
    // 根据字段类型渲染
    switch (fieldInfo.type) {
      case '整数':
        return (
          <input type="number" value={value} onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        );
      case '浮点数':
        return (
          <input type="number" step="0.01" value={value} onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        );
      case '逻辑':
        return (
          <select value={value} onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">-- 请选择 --</option>
            <option value="true">是</option>
            <option value="false">否</option>
          </select>
        );
      case '日期/时间':
        return (
          <input type="datetime-local" value={value} onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        );
      case '富文本':
        return (
          <textarea value={value} onChange={(e) => handleFieldChange(fieldId, e.target.value)} rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        );
      default:
        return (
          <input type="text" value={value} onChange={(e) => handleFieldChange(fieldId, e.target.value)}
            maxLength={fieldInfo.length || undefined}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150]">
      <div className="bg-white rounded-lg shadow-xl w-[550px] max-h-[85vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-green-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <span className="text-xl">✏️</span>
            <div>
              <h2 className="text-lg font-semibold">编辑数据</h2>
              <p className="text-sm text-green-100">{formName || formId}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-green-200 text-2xl leading-none">×</button>
        </div>

        {/* 编辑表单 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-2"></div>
              加载中...
            </div>
          ) : formStructure ? (
            <div className="space-y-4">
              {formStructure.fields.map((fieldConfig, index) => {
                const fieldInfo = fieldDetails[fieldConfig.fieldId];
                return (
                  <div key={index} className={`border rounded-lg p-4 ${
                    fieldConfig.isPrimaryKey ? 'border-yellow-200 bg-yellow-50' :
                    fieldConfig.isAttributeField ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium text-gray-700">
                        {fieldConfig.isPrimaryKey && <span className="text-yellow-600 mr-1">🔑</span>}
                        {fieldConfig.isAttributeField && <span className="text-purple-600 mr-1">第{fieldConfig.level}级</span>}
                        {fieldInfo?.name || fieldConfig.fieldId}
                        {fieldConfig.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      <span className="text-xs text-gray-400">
                        {fieldInfo?.type || '未知类型'}
                        {fieldConfig.isPrimaryKey && ' · 主键(不可修改)'}
                      </span>
                    </div>
                    {renderFieldInput(fieldConfig)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">表单结构未定义</div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
          <button onClick={onClose} className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100">
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !formStructure}
            className={`px-6 py-2 rounded ${
              submitting || !formStructure
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {submitting ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}

window.DataEditDialog = DataEditDialog;

// 表单数据编辑组件
function FormDataEditor({ projectId, form, fields, data, onClose }) {
  const [formData, setFormData] = React.useState(data || {});
  const [calculatedFields, setCalculatedFields] = React.useState({});
  const [isSaving, setIsSaving] = React.useState(false);

  // 初始化：计算衍生字段
  React.useEffect(() => {
    calculateDerivedFields(formData);
  }, []);

  // 获取字段详情
  const getFieldDetail = (fieldId) => {
    return fields.find(f => f.id === fieldId);
  };

  // 处理输入变化
  const handleInputChange = (fieldId, value) => {
    const newFormData = {
      ...formData,
      [fieldId]: value
    };
    setFormData(newFormData);
    calculateDerivedFields(newFormData);
  };

  // 计算衍生字段
  const calculateDerivedFields = (data) => {
    const calculated = {};
    const fullContext = { ...data };
    
    if (form.structure && form.structure.fields) {
      form.structure.fields.forEach(formField => {
        const fieldDetail = getFieldDetail(formField.fieldId);
        
        if (fieldDetail && fieldDetail.nature === '衍生字段' && formField.expression) {
          try {
            const result = window.expressionEngine.evaluate(formField.expression, fullContext);
            calculated[formField.fieldId] = result;
          } catch (error) {
            calculated[formField.fieldId] = '计算错误';
          }
        }
      });
    }
    
    setCalculatedFields(calculated);
  };

  // 获取字段值
  const getFieldValue = (fieldId) => {
    const fieldDetail = getFieldDetail(fieldId);
    if (fieldDetail && fieldDetail.nature === '衍生字段') {
      return calculatedFields[fieldId] !== undefined ? calculatedFields[fieldId] : '';
    }
    return formData[fieldId] || '';
  };

  // 保存修改
  const handleSave = async () => {
    setIsSaving(true);

    try {
      const dataToSave = {
        ...formData,
        ...calculatedFields
      };

      await window.dndDB.updateFormData(projectId, form.id, data.id, dataToSave);
      alert('保存成功！');
      onClose();
    } catch (error) {
      alert('保存失败：' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染输入框
  const renderInput = (fieldId, formField) => {
    const fieldDetail = getFieldDetail(fieldId);
    if (!fieldDetail) return null;

    const value = getFieldValue(fieldId);
    const isReadonly = fieldDetail.nature === '衍生字段' || fieldId === form.structure.primaryKey;

    return (
      <div key={fieldId} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {fieldDetail.name}
          {fieldId === form.structure.primaryKey && (
            <span className="ml-2 text-xs text-blue-600">(主键，不可修改)</span>
          )}
          {fieldDetail.nature === '衍生字段' && (
            <span className="ml-2 text-xs text-purple-600">(自动计算)</span>
          )}
        </label>
        
        <input
          type={fieldDetail.type === '整数' || fieldDetail.type === '浮点数' ? 'number' : 'text'}
          step={fieldDetail.type === '浮点数' ? '0.01' : '1'}
          value={value}
          onChange={(e) => handleInputChange(fieldId, e.target.value)}
          readOnly={isReadonly}
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
            isReadonly 
              ? 'bg-gray-100 text-gray-600 cursor-not-allowed border-gray-200' 
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        
        {fieldDetail.nature === '衍生字段' && formField && formField.expression && (
          <p className="mt-1 text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
            公式：{formField.expression}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            编辑数据：{form.name}
          </h3>
        </div>

        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {/* 主键字段 */}
          {form.structure.primaryKey && renderInput(form.structure.primaryKey, { required: true })}
          
          {/* 其他字段 */}
          {form.structure.fields && form.structure.fields.map(field => 
            renderInput(field.fieldId, field)
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isSaving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>
    </div>
  );
}

window.FormDataEditor = FormDataEditor;
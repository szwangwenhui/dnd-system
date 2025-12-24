// 表单数据录入组件
function FormDataEntry({ projectId, form, fields, onClose, onSaved }) {
  const [formData, setFormData] = React.useState({});
  const [calculatedFields, setCalculatedFields] = React.useState({});
  const [isSaving, setIsSaving] = React.useState(false);

  // 初始化：计算一次衍生字段
  React.useEffect(() => {
    calculateDerivedFields({});
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
    
    // 重新计算所有衍生字段
    calculateDerivedFields(newFormData);
  };

  // 计算衍生字段
  const calculateDerivedFields = (data) => {
    const calculated = {};
    
    // 构建完整的数据上下文（包括主键）
    const fullContext = {
      ...data
    };
    
    if (form.structure && form.type === '对象表单') {
      // 添加主键到上下文
      if (form.structure.primaryKey) {
        if (!fullContext[form.structure.primaryKey]) {
          fullContext[form.structure.primaryKey] = data[form.structure.primaryKey] || 0;
        }
      }
      
      // 计算每个衍生字段
      if (form.structure.fields) {
        form.structure.fields.forEach(formField => {
          const fieldDetail = getFieldDetail(formField.fieldId);
          
          if (fieldDetail && fieldDetail.nature === '衍生字段' && formField.expression) {
            try {
              const result = window.expressionEngine.evaluate(formField.expression, fullContext);
              calculated[formField.fieldId] = result;
            } catch (error) {
              console.error('计算错误:', formField.expression, error);
              calculated[formField.fieldId] = '计算错误';
            }
          }
        });
      }
    }
    
    setCalculatedFields(calculated);
  };

  // 获取字段值（基础字段从formData，衍生字段从calculatedFields）
  const getFieldValue = (fieldId) => {
    const fieldDetail = getFieldDetail(fieldId);
    if (fieldDetail && fieldDetail.nature === '衍生字段') {
      return calculatedFields[fieldId] !== undefined ? calculatedFields[fieldId] : '';
    }
    return formData[fieldId] || '';
  };

  // 验证表单
  const validateForm = () => {
    // 验证主键
    if (form.structure.primaryKey) {
      const pkValue = formData[form.structure.primaryKey];
      if (!pkValue || pkValue.toString().trim() === '') {
        const pkField = getFieldDetail(form.structure.primaryKey);
        alert(`请输入${pkField ? pkField.name : '主键'}`);
        return false;
      }
    }

    // 验证必填字段
    if (form.structure.fields) {
      for (let formField of form.structure.fields) {
        if (formField.required) {
          const fieldDetail = getFieldDetail(formField.fieldId);
          // 只验证基础字段（衍生字段自动计算）
          if (fieldDetail && fieldDetail.nature === '基础字段') {
            const value = formData[formField.fieldId];
            if (!value || value.toString().trim() === '') {
              alert(`请输入${fieldDetail.name}`);
              return false;
            }
          }
        }
      }
    }

    return true;
  };

  // 保存数据
  const handleSave = async () => {
    // 验证
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      // 合并基础数据和计算数据
      const dataToSave = {
        ...formData,
        ...calculatedFields
      };

      // 保存到数据库
      await window.dndDB.addFormData(projectId, form.id, dataToSave);
      
      alert('数据保存成功！');
      
      // 清空表单
      setFormData({});
      setCalculatedFields({});
      calculateDerivedFields({});
      
      // 通知父组件刷新
      if (onSaved) {
        onSaved();
      }
      
      // 关闭弹窗
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
    const isReadonly = fieldDetail.nature === '衍生字段';

    return (
      <div key={fieldId} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {fieldDetail.name}
          {formField && formField.required && <span className="text-red-500 ml-1">*</span>}
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
              ? 'bg-purple-50 text-purple-900 cursor-not-allowed border-purple-200' 
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          placeholder={isReadonly ? '自动计算' : `请输入${fieldDetail.name}`}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 my-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            添加数据：{form.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            填写表单数据，点击保存后数据将永久保存
          </p>
        </div>

        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {form.type === '对象表单' && form.structure ? (
            <>
              {/* 主键字段 */}
              {form.structure.primaryKey && renderInput(form.structure.primaryKey, { required: true })}
              
              {/* 其他字段 */}
              {form.structure.fields && form.structure.fields.map(field => 
                renderInput(field.fieldId, field)
              )}
            </>
          ) : (
            <p className="text-gray-500 text-center py-8">
              暂不支持属性表单的数据录入
            </p>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? '保存中...' : '保存数据'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.FormDataEntry = FormDataEntry;
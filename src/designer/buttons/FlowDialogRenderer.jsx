// 流程对话框组件 - 用于对话框方式输入参数
// 监听 showFlowDialog 事件，显示表单对话框，收集用户输入后执行流程

function FlowDialogRenderer({ projectId }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dialogConfig, setDialogConfig] = React.useState(null);
  const [formFields, setFormFields] = React.useState([]);
  const [formData, setFormData] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  // 监听显示对话框事件
  React.useEffect(() => {
    const handleShowDialog = async (event) => {
      const config = event.detail;
      setDialogConfig(config);
      setFormData({});
      setIsOpen(true);
      
      // 加载表单字段
      if (config.formId && window.dndDB) {
        setLoading(true);
        try {
          // 获取表单
          const forms = await window.dndDB.getFormsByProjectId(projectId);
          const form = forms.find(f => f.id === config.formId);
          
          if (form && form.structure && form.structure.fields) {
            // 获取项目所有字段
            const allFields = await window.dndDB.getFieldsByProjectId(projectId);
            
            // 匹配表单字段
            const formFieldIds = form.structure.fields.map(f => f.fieldId);
            const matchedFields = formFieldIds.map(fid => {
              const field = allFields.find(f => f.id === fid);
              return field || { id: fid, name: fid };
            });
            
            console.log('对话框表单字段:', matchedFields.length, '个');
            setFormFields(matchedFields);
          } else {
            setFormFields([]);
          }
        } catch (error) {
          console.error('加载表单字段失败:', error);
          setFormFields([]);
        } finally {
          setLoading(false);
        }
      }
    };

    window.addEventListener('showFlowDialog', handleShowDialog);
    return () => window.removeEventListener('showFlowDialog', handleShowDialog);
  }, [projectId]);

  // 更新表单数据
  const updateFormData = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  // 提交表单，执行流程
  const handleSubmit = async () => {
    if (!dialogConfig) return;

    setSubmitting(true);
    try {
      // 触发流程执行
      window.dispatchEvent(new CustomEvent('executeFlow', {
        detail: {
          flowId: dialogConfig.flowId,
          flowName: dialogConfig.flowName,
          params: { formData },
          context: dialogConfig.context,
          showLoading: dialogConfig.showLoading,
          showResult: dialogConfig.showResult
        }
      }));

      setIsOpen(false);
    } catch (error) {
      console.error('执行流程失败:', error);
      alert('执行失败: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 关闭对话框
  const handleClose = () => {
    setIsOpen(false);
    setDialogConfig(null);
    setFormData({});
  };

  // 渲染字段输入
  const renderFieldInput = (field) => {
    const value = formData[field.id] || '';
    const fieldType = field.type || field.fieldType || 'text';

    switch (fieldType) {
      case 'number':
      case 'integer':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
            placeholder={`请输入${field.name}`}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
          />
        );

      case 'textarea':
      case 'longtext':
        return (
          <textarea
            value={value}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none resize-none"
            placeholder={`请输入${field.name}`}
          />
        );

      case 'select':
      case 'enum':
        const options = field.options || field.enumValues || [];
        return (
          <select
            value={value}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
          >
            <option value="">-- 请选择 --</option>
            {options.map((opt, i) => (
              <option key={i} value={typeof opt === 'object' ? opt.value : opt}>
                {typeof opt === 'object' ? opt.label : opt}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => updateFormData(field.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-600">{field.name}</span>
          </label>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => updateFormData(field.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:outline-none"
            placeholder={`请输入${field.name}`}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">
            {dialogConfig?.dialogTitle || '请输入'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 表单内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : formFields.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无字段</div>
          ) : (
            <div className="space-y-4">
              {formFields.map(field => (
                <div key={field.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.name}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {renderFieldInput(field)}
                  {field.description && (
                    <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button
            onClick={handleClose}
            disabled={submitting}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {submitting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

window.FlowDialogRenderer = FlowDialogRenderer;

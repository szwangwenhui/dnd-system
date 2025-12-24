// 数据录入按钮类型实现
// 迁移现有的交互区块数据录入功能

// 数据录入按钮配置渲染组件
function DataEntryButtonConfigRender({ config, onChange, projectId, roleId }) {
  const [forms, setForms] = React.useState([]);
  const [selectedForm, setSelectedForm] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  // 加载表单列表（仅基础表单）
  React.useEffect(() => {
    const loadForms = async () => {
      setLoading(true);
      try {
        if (window.dndDB) {
          const formList = await window.dndDB.getFormsByProjectId(projectId);
          // 只显示基础表单
          const baseForms = formList.filter(f => 
            f.formNature === '基础表单' || 
            f.subType === '独立基础表' || 
            f.subType === '关联基础表'
          );
          setForms(baseForms);

          // 如果已有选中的表单，加载其信息
          if (config.targetFormId) {
            const form = baseForms.find(f => f.id === config.targetFormId);
            setSelectedForm(form);
          }
        }
      } catch (error) {
        console.error('加载表单失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadForms();
  }, [projectId, config.targetFormId]);

  // 选择表单时更新
  const handleFormChange = (formId) => {
    onChange({ targetFormId: formId });
    const form = forms.find(f => f.id === formId);
    setSelectedForm(form);
    if (form) {
      onChange({ targetFormId: formId, targetFormName: form.name });
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-4">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 目标表单选择 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          目标表单 <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          选择用户提交数据要存入的表单（仅显示基础表单）
        </p>
        <select
          value={config.targetFormId || ''}
          onChange={(e) => handleFormChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">-- 请选择表单 --</option>
          {forms.map(form => (
            <option key={form.id} value={form.id}>
              {form.name} ({form.id}) - {form.subType || form.formNature}
            </option>
          ))}
        </select>
      </div>

      {/* 显示选中表单的字段信息 */}
      {selectedForm && selectedForm.structure && (
        <div className="p-3 bg-gray-50 rounded border border-gray-200">
          <div className="text-sm font-medium text-gray-700 mb-2">
            表单字段（{selectedForm.structure.fields?.length || 0}个）
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedForm.structure.fields?.map((field, index) => (
              <span 
                key={index}
                className={`px-2 py-0.5 rounded text-xs ${
                  field.isPrimaryKey 
                    ? 'bg-yellow-100 text-yellow-800' 
                    : field.isAttributeField
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                }`}
              >
                {field.isPrimaryKey && '🔑 '}
                {field.isAttributeField && `L${field.level} `}
                {field.fieldId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 提交后行为 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">提交后行为</label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="afterSubmit"
              value="clear"
              checked={(config.afterSubmit || 'clear') === 'clear'}
              onChange={(e) => onChange({ afterSubmit: e.target.value })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">清空表单，继续录入</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="afterSubmit"
              value="close"
              checked={config.afterSubmit === 'close'}
              onChange={(e) => onChange({ afterSubmit: e.target.value })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">关闭对话框</span>
          </label>
        </div>
      </div>

      {/* 成功提示语 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">成功提示语</label>
        <input
          type="text"
          value={config.successMessage || ''}
          onChange={(e) => onChange({ successMessage: e.target.value })}
          placeholder="数据添加成功！"
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        />
      </div>

      {forms.length === 0 && (
        <div className="text-center text-gray-500 py-4 bg-yellow-50 rounded">
          <p>暂无可用的基础表单</p>
          <p className="text-xs mt-1">请先在"定义表单"中创建基础表单</p>
        </div>
      )}
    </div>
  );
}

// 数据录入按钮执行函数
async function executeDataEntryButton(config, context) {
  console.log('executeDataEntryButton called, config:', config);
  
  if (!config.targetFormId) {
    return { success: false, error: '未配置目标表单' };
  }

  console.log('触发 openDataEntry 事件');
  
  // 触发打开数据录入对话框事件
  window.dispatchEvent(new CustomEvent('openDataEntry', {
    detail: { 
      formId: config.targetFormId,
      formName: config.targetFormName,
      afterSubmit: config.afterSubmit || 'clear',
      successMessage: config.successMessage || '数据添加成功！'
    }
  }));

  return { success: true };
}

// 验证配置
function validateDataEntryButton(config) {
  const errors = [];
  if (!config.targetFormId) {
    errors.push('请选择目标表单');
  }
  return { valid: errors.length === 0, errors };
}

// 注册按钮类型
if (window.ButtonRegistry) {
  window.ButtonRegistry.register('dataEntry', {
    label: '数据录入',
    icon: '📝',
    description: '打开表单录入数据',
    category: 'data',
    renderConfig: DataEntryButtonConfigRender,
    execute: executeDataEntryButton,
    validate: validateDataEntryButton,
    defaultConfig: {
      targetFormId: '',
      targetFormName: '',
      afterSubmit: 'clear',
      successMessage: '数据添加成功！'
    }
  });
}

// 状态切换按钮类型实现
// 支持置顶/取消置顶、启用/禁用等状态切换

// 状态切换按钮配置渲染组件
function StatusToggleButtonConfigRender({ config, onChange, projectId, roleId }) {
  const [forms, setForms] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // 预设的状态类型
  const presetTypes = [
    { value: 'top', label: '置顶', trueText: '置顶', falseText: '取消置顶', icon: '📌' },
    { value: 'enable', label: '启用/禁用', trueText: '启用', falseText: '禁用', icon: '✅' },
    { value: 'publish', label: '发布/下架', trueText: '发布', falseText: '下架', icon: '📢' },
    { value: 'custom', label: '自定义', trueText: '', falseText: '', icon: '⚙️' }
  ];

  // 加载表单列表
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (window.dndDB) {
          const formList = await window.dndDB.getFormsByProjectId(projectId);
          const validForms = formList.filter(f => f.structure && f.structure.fields);
          setForms(validForms);

          const fieldList = await window.dndDB.getFieldsByProjectId(projectId);
          setFields(fieldList);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [projectId]);

  // 获取选中表单的字段列表
  const getSelectedFormFields = () => {
    if (!config.targetFormId) return [];
    const form = forms.find(f => f.id === config.targetFormId);
    if (!form?.structure?.fields) return [];
    
    return form.structure.fields.map(f => {
      const fieldInfo = fields.find(fi => fi.id === f.fieldId);
      return {
        fieldId: f.fieldId,
        fieldName: fieldInfo?.name || f.fieldId,
        fieldType: fieldInfo?.type || '未知'
      };
    });
  };

  // 选择预设类型
  const handlePresetChange = (presetValue) => {
    const preset = presetTypes.find(p => p.value === presetValue);
    if (preset && preset.value !== 'custom') {
      onChange({
        presetType: presetValue,
        trueText: preset.trueText,
        falseText: preset.falseText
      });
    } else {
      onChange({ presetType: presetValue });
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-4">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 关联表单 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          关联表单 <span className="text-red-500">*</span>
        </label>
        <select
          value={config.targetFormId || ''}
          onChange={(e) => {
            const form = forms.find(f => f.id === e.target.value);
            onChange({ 
              targetFormId: e.target.value,
              targetFormName: form?.name || '',
              targetFieldId: '' // 清空字段选择
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">-- 请选择表单 --</option>
          {forms.map(form => (
            <option key={form.id} value={form.id}>
              {form.name} ({form.id})
            </option>
          ))}
        </select>
      </div>

      {/* 目标字段 */}
      {config.targetFormId && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            状态字段 <span className="text-red-500">*</span>
          </label>
          <select
            value={config.targetFieldId || ''}
            onChange={(e) => onChange({ targetFieldId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">-- 请选择字段 --</option>
            {getSelectedFormFields().map(field => (
              <option key={field.fieldId} value={field.fieldId}>
                {field.fieldName} ({field.fieldType})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            选择用于存储状态的字段（建议使用逻辑类型或整数类型）
          </p>
        </div>
      )}

      {/* 状态类型预设 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">状态类型</label>
        <div className="grid grid-cols-2 gap-2">
          {presetTypes.map(preset => (
            <label
              key={preset.value}
              className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                config.presetType === preset.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="presetType"
                value={preset.value}
                checked={config.presetType === preset.value}
                onChange={(e) => handlePresetChange(e.target.value)}
                className="sr-only"
              />
              <span className="mr-2">{preset.icon}</span>
              <span>{preset.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 自定义状态文字 */}
      {config.presetType === 'custom' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">激活时文字</label>
            <input
              type="text"
              value={config.trueText || ''}
              onChange={(e) => onChange({ trueText: e.target.value })}
              placeholder="如：置顶"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">关闭时文字</label>
            <input
              type="text"
              value={config.falseText || ''}
              onChange={(e) => onChange({ falseText: e.target.value })}
              placeholder="如：取消置顶"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      )}

      {/* 状态值设置 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">激活值</label>
          <input
            type="text"
            value={config.trueValue ?? 'true'}
            onChange={(e) => onChange({ trueValue: e.target.value })}
            placeholder="true"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">关闭值</label>
          <input
            type="text"
            value={config.falseValue ?? 'false'}
            onChange={(e) => onChange({ falseValue: e.target.value })}
            placeholder="false"
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      </div>

      {forms.length === 0 && (
        <div className="text-center text-gray-500 py-4 bg-yellow-50 rounded">
          <p>暂无可用的表单</p>
        </div>
      )}
    </div>
  );
}

// 状态切换按钮执行函数
async function executeStatusToggleButton(config, context) {
  if (!config.targetFormId || !config.targetFieldId) {
    return { success: false, error: '未配置关联表单或状态字段' };
  }

  const { targetFormId, targetFieldId, trueValue, falseValue } = config;
  const { recordData, projectId } = context;

  if (!recordData) {
    return { success: false, error: '未获取到记录数据' };
  }

  // 获取当前状态值
  const currentValue = recordData[targetFieldId];
  
  // 切换状态
  const newValue = (currentValue === trueValue || currentValue === true || currentValue === 'true')
    ? (falseValue ?? 'false')
    : (trueValue ?? 'true');

  // 触发状态更新事件
  window.dispatchEvent(new CustomEvent('updateFormRecord', {
    detail: { 
      formId: targetFormId, 
      record: recordData,
      updates: { [targetFieldId]: newValue },
      projectId 
    }
  }));

  return { success: true, newValue };
}

// 验证配置
function validateStatusToggleButton(config) {
  const errors = [];
  if (!config.targetFormId) {
    errors.push('请选择关联表单');
  }
  if (!config.targetFieldId) {
    errors.push('请选择状态字段');
  }
  return { valid: errors.length === 0, errors };
}

// 注册按钮类型
if (window.ButtonRegistry) {
  window.ButtonRegistry.register('statusToggle', {
    label: '状态切换',
    icon: '🔄',
    description: '置顶、启用/禁用等状态切换',
    category: 'form',
    renderConfig: StatusToggleButtonConfigRender,
    execute: executeStatusToggleButton,
    validate: validateStatusToggleButton,
    defaultConfig: {
      targetFormId: '',
      targetFormName: '',
      targetFieldId: '',
      presetType: 'top',
      trueText: '置顶',
      falseText: '取消置顶',
      trueValue: 'true',
      falseValue: 'false'
    }
  });
}

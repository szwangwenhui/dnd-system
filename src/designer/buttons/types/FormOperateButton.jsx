// 表单操作按钮类型实现
// 支持表单的删除、编辑操作

// 表单操作按钮配置渲染组件
function FormOperateButtonConfigRender({ config, onChange, projectId, roleId }) {
  const [forms, setForms] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // 加载表单列表
  React.useEffect(() => {
    const loadForms = async () => {
      setLoading(true);
      try {
        if (window.dndDB) {
          const formList = await window.dndDB.getFormsByProjectId(projectId);
          // 只显示有数据结构的表单
          const validForms = formList.filter(f => f.structure && f.structure.fields);
          setForms(validForms);
        }
      } catch (error) {
        console.error('加载表单失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadForms();
  }, [projectId]);

  if (loading) {
    return <div className="text-center text-gray-500 py-4">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 操作类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          操作类型 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer ${
            config.operateType === 'edit' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
          }`}>
            <input
              type="radio"
              name="operateType"
              value="edit"
              checked={config.operateType === 'edit'}
              onChange={(e) => onChange({ operateType: e.target.value })}
              className="sr-only"
            />
            <span className="mr-1">✏️</span>
            <span>编辑</span>
          </label>
          <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer ${
            config.operateType === 'delete' ? 'border-red-500 bg-red-50' : 'border-gray-200'
          }`}>
            <input
              type="radio"
              name="operateType"
              value="delete"
              checked={config.operateType === 'delete'}
              onChange={(e) => onChange({ operateType: e.target.value })}
              className="sr-only"
            />
            <span className="mr-1">🗑️</span>
            <span>删除</span>
          </label>
          <label className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer ${
            config.operateType === 'view' ? 'border-green-500 bg-green-50' : 'border-gray-200'
          }`}>
            <input
              type="radio"
              name="operateType"
              value="view"
              checked={config.operateType === 'view'}
              onChange={(e) => onChange({ operateType: e.target.value })}
              className="sr-only"
            />
            <span className="mr-1">👁️</span>
            <span>查看</span>
          </label>
        </div>
      </div>

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
              targetFormName: form?.name || ''
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

      {/* 关联方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">关联方式</label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="bindType"
              value="external"
              checked={(config.bindType || 'external') === 'external'}
              onChange={(e) => onChange({ bindType: e.target.value })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">外部关联（对表单整体操作）</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="bindType"
              value="internal"
              checked={config.bindType === 'internal'}
              onChange={(e) => onChange({ bindType: e.target.value })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">内部关联（放在表格列中，对单行操作）</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          外部关联：按钮放在表单外面；内部关联：按钮作为表格的操作列
        </p>
      </div>

      {/* 删除确认 */}
      {config.operateType === 'delete' && (
        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={config.confirmDelete !== false}
              onChange={(e) => onChange({ confirmDelete: e.target.checked })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">删除前确认</span>
          </label>
          {config.confirmDelete !== false && (
            <input
              type="text"
              value={config.confirmMessage || ''}
              onChange={(e) => onChange({ confirmMessage: e.target.value })}
              placeholder="确定要删除这条记录吗？"
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm"
            />
          )}
        </div>
      )}

      {forms.length === 0 && (
        <div className="text-center text-gray-500 py-4 bg-yellow-50 rounded">
          <p>暂无可用的表单</p>
        </div>
      )}
    </div>
  );
}

// 表单操作按钮执行函数
async function executeFormOperateButton(config, context) {
  if (!config.targetFormId) {
    return { success: false, error: '未配置关联表单' };
  }

  if (!config.operateType) {
    return { success: false, error: '未配置操作类型' };
  }

  const { operateType, targetFormId, targetFormName, confirmDelete, confirmMessage } = config;
  const { recordData, projectId } = context;

  switch (operateType) {
    case 'delete':
      // 删除操作
      if (confirmDelete !== false) {
        const confirmed = window.confirm(confirmMessage || '确定要删除这条记录吗？');
        if (!confirmed) {
          return { success: false, cancelled: true };
        }
      }
      
      // 触发删除事件
      window.dispatchEvent(new CustomEvent('deleteFormRecord', {
        detail: { formId: targetFormId, record: recordData, projectId }
      }));
      return { success: true };

    case 'edit':
      // 触发编辑事件
      window.dispatchEvent(new CustomEvent('editFormRecord', {
        detail: { formId: targetFormId, formName: targetFormName, record: recordData, projectId }
      }));
      return { success: true };

    case 'view':
      // 触发查看事件
      window.dispatchEvent(new CustomEvent('viewFormRecord', {
        detail: { formId: targetFormId, formName: targetFormName, record: recordData, projectId }
      }));
      return { success: true };

    default:
      return { success: false, error: '未知的操作类型' };
  }
}

// 验证配置
function validateFormOperateButton(config) {
  const errors = [];
  if (!config.operateType) {
    errors.push('请选择操作类型');
  }
  if (!config.targetFormId) {
    errors.push('请选择关联表单');
  }
  return { valid: errors.length === 0, errors };
}

// 注册按钮类型
if (window.ButtonRegistry) {
  window.ButtonRegistry.register('formOperate', {
    label: '表单操作',
    icon: '📋',
    description: '编辑、删除、查看记录',
    category: 'form',
    renderConfig: FormOperateButtonConfigRender,
    execute: executeFormOperateButton,
    validate: validateFormOperateButton,
    defaultConfig: {
      operateType: 'edit',
      targetFormId: '',
      targetFormName: '',
      bindType: 'external',
      confirmDelete: true,
      confirmMessage: '确定要删除这条记录吗？'
    }
  });
}

// 数据绑定面板
// 用于将区块与表单系统中的字段进行关联
function DataBindingPanel({ block, onUpdate }) {
  if (!block) return null;

  const [forms, setForms] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const binding = block.dataBinding || {};

  // 加载表单和字段数据
  React.useEffect(() => {
    loadFormsAndFields();
  }, []);

  // 从IndexedDB加载表单和字段
  const loadFormsAndFields = async () => {
    setLoading(true);
    try {
      // 获取当前项目ID和角色ID
      const currentProjectId = localStorage.getItem('dnd_current_project');
      const currentRoleId = localStorage.getItem('dnd_current_role');

      if (!currentProjectId) {
        setLoading(false);
        return;
      }

      // 加载表单列表（项目级别）
      const formsData = await loadFromDB('dnd_forms', currentProjectId) || [];
      setForms(formsData);

      // 加载字段列表（角色级别）
      if (currentRoleId) {
        const fieldsData = await loadFromDB('dnd_fields', currentRoleId) || [];
        setFields(fieldsData);
      }
    } catch (error) {
      console.error('加载表单和字段失败:', error);
    }
    setLoading(false);
  };

  // 从IndexedDB读取数据
  const loadFromDB = (storeName, key) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('dnd_database', 1);
      request.onsuccess = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(storeName)) {
          resolve(null);
          return;
        }
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const getRequest = store.get(key);
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };
      request.onerror = () => reject(request.error);
    });
  };

  // 更新绑定
  const updateBinding = (key, value) => {
    onUpdate({
      dataBinding: { ...binding, [key]: value }
    });
  };

  // 清除绑定
  const clearBinding = () => {
    onUpdate({ dataBinding: {} });
  };

  // 根据区块类型获取可绑定的内容类型
  const getBindingOptions = () => {
    switch (block.type) {
      case '显示':
        return [
          { value: 'field', label: '显示字段值' },
          { value: 'fieldLabel', label: '显示字段标签' },
          { value: 'formTitle', label: '显示表单标题' },
          { value: 'static', label: '静态文本' },
          { value: 'list', label: '数据列表' }
        ];
      case '交互':
        return [
          { value: 'input', label: '文本输入' },
          { value: 'select', label: '下拉选择' },
          { value: 'checkbox', label: '复选框' },
          { value: 'radio', label: '单选框' },
          { value: 'date', label: '日期选择' },
          { value: 'file', label: '文件上传' }
        ];
      case '按钮':
        return [
          { value: 'submit', label: '提交表单' },
          { value: 'reset', label: '重置表单' },
          { value: 'navigate', label: '页面跳转' },
          { value: 'custom', label: '自定义操作' }
        ];
      default:
        return [];
    }
  };

  // 获取字段类型对应的交互组件
  const getFieldInputType = (fieldType) => {
    const typeMap = {
      '文本': 'input',
      '数字': 'input',
      '日期': 'date',
      '布尔': 'checkbox',
      '选择': 'select'
    };
    return typeMap[fieldType] || 'input';
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">
        <span className="animate-pulse">加载中...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 绑定类型选择 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">绑定类型</label>
        <select
          value={binding.type || ''}
          onChange={(e) => updateBinding('type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">-- 选择绑定类型 --</option>
          {getBindingOptions().map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* ===== 显示类型区块的绑定设置 ===== */}
      {block.type === '显示' && binding.type === 'field' && (
        <div className="space-y-3 p-3 bg-blue-50 rounded">
          <label className="block text-xs font-medium text-gray-600">绑定字段</label>
          
          {/* 选择表单 */}
          <div>
            <span className="text-xs text-gray-500">所属表单</span>
            <select
              value={binding.formId || ''}
              onChange={(e) => updateBinding('formId', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
            >
              <option value="">-- 选择表单 --</option>
              {forms.map(form => (
                <option key={form.id} value={form.id}>{form.name}</option>
              ))}
            </select>
          </div>

          {/* 选择字段 */}
          <div>
            <span className="text-xs text-gray-500">绑定字段</span>
            <select
              value={binding.fieldId || ''}
              onChange={(e) => {
                const field = fields.find(f => f.id === e.target.value);
                updateBinding('fieldId', e.target.value);
                if (field) {
                  updateBinding('fieldName', field.name);
                  updateBinding('fieldType', field.type);
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
            >
              <option value="">-- 选择字段 --</option>
              {fields.map(field => (
                <option key={field.id} value={field.id}>
                  {field.name} ({field.type})
                </option>
              ))}
            </select>
          </div>

          {/* 显示格式 */}
          <div>
            <span className="text-xs text-gray-500">显示格式</span>
            <select
              value={binding.format || 'default'}
              onChange={(e) => updateBinding('format', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
            >
              <option value="default">默认</option>
              <option value="currency">货币格式</option>
              <option value="percentage">百分比</option>
              <option value="date">日期格式</option>
              <option value="datetime">日期时间</option>
            </select>
          </div>
        </div>
      )}

      {/* 静态文本 */}
      {block.type === '显示' && binding.type === 'static' && (
        <div className="space-y-3 p-3 bg-gray-50 rounded">
          <label className="block text-xs font-medium text-gray-600">静态文本内容</label>
          <textarea
            value={binding.staticText || ''}
            onChange={(e) => updateBinding('staticText', e.target.value)}
            placeholder="输入要显示的文本..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>
      )}

      {/* 数据列表 */}
      {block.type === '显示' && binding.type === 'list' && (
        <div className="space-y-3 p-3 bg-green-50 rounded">
          <label className="block text-xs font-medium text-gray-600">数据列表设置</label>
          
          {/* 数据源表单 */}
          <div>
            <span className="text-xs text-gray-500">数据源表单</span>
            <select
              value={binding.sourceFormId || ''}
              onChange={(e) => updateBinding('sourceFormId', e.target.value)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
            >
              <option value="">-- 选择表单 --</option>
              {forms.map(form => (
                <option key={form.id} value={form.id}>{form.name}</option>
              ))}
            </select>
          </div>

          {/* 显示字段 */}
          <div>
            <span className="text-xs text-gray-500">显示字段（多选）</span>
            <div className="mt-1 max-h-32 overflow-y-auto border border-gray-300 rounded p-2 bg-white">
              {fields.map(field => (
                <label key={field.id} className="flex items-center space-x-2 py-1">
                  <input
                    type="checkbox"
                    checked={(binding.displayFields || []).includes(field.id)}
                    onChange={(e) => {
                      const current = binding.displayFields || [];
                      const updated = e.target.checked
                        ? [...current, field.id]
                        : current.filter(id => id !== field.id);
                      updateBinding('displayFields', updated);
                    }}
                    className="rounded"
                  />
                  <span className="text-xs">{field.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 列表样式 */}
          <div>
            <span className="text-xs text-gray-500">列表样式</span>
            <div className="grid grid-cols-3 gap-1 mt-1">
              {[
                { value: 'table', label: '表格' },
                { value: 'cards', label: '卡片' },
                { value: 'list', label: '列表' }
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateBinding('listStyle', opt.value)}
                  className={`px-2 py-1 text-xs border rounded ${
                    binding.listStyle === opt.value
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 交互类型区块的绑定设置 ===== */}
      {block.type === '交互' && binding.type && (
        <div className="space-y-3 p-3 bg-yellow-50 rounded">
          <label className="block text-xs font-medium text-gray-600">输入控件设置</label>
          
          {/* 绑定字段 */}
          <div>
            <span className="text-xs text-gray-500">绑定字段</span>
            <select
              value={binding.fieldId || ''}
              onChange={(e) => {
                const field = fields.find(f => f.id === e.target.value);
                updateBinding('fieldId', e.target.value);
                if (field) {
                  updateBinding('fieldName', field.name);
                  updateBinding('fieldType', field.type);
                }
              }}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
            >
              <option value="">-- 选择字段 --</option>
              {fields.map(field => (
                <option key={field.id} value={field.id}>
                  {field.name} ({field.type})
                </option>
              ))}
            </select>
          </div>

          {/* 占位符 */}
          <div>
            <span className="text-xs text-gray-500">占位符文本</span>
            <input
              type="text"
              value={binding.placeholder || ''}
              onChange={(e) => updateBinding('placeholder', e.target.value)}
              placeholder="请输入..."
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
            />
          </div>

          {/* 必填 */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={binding.required || false}
              onChange={(e) => updateBinding('required', e.target.checked)}
              className="rounded"
            />
            <span className="text-xs text-gray-600">必填字段</span>
          </label>

          {/* 下拉选项（仅select类型） */}
          {binding.type === 'select' && (
            <div>
              <span className="text-xs text-gray-500">选项（每行一个）</span>
              <textarea
                value={binding.options || ''}
                onChange={(e) => updateBinding('options', e.target.value)}
                placeholder="选项1&#10;选项2&#10;选项3"
                rows={4}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1 font-mono"
              />
            </div>
          )}
        </div>
      )}

      {/* ===== 按钮类型区块的绑定设置 ===== */}
      {block.type === '按钮' && binding.type && (
        <div className="space-y-3 p-3 bg-purple-50 rounded">
          <label className="block text-xs font-medium text-gray-600">按钮设置</label>
          
          {/* 按钮文本 */}
          <div>
            <span className="text-xs text-gray-500">按钮文本</span>
            <input
              type="text"
              value={binding.buttonText || ''}
              onChange={(e) => updateBinding('buttonText', e.target.value)}
              placeholder="点击"
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
            />
          </div>

          {/* 提交表单设置 */}
          {binding.type === 'submit' && (
            <div>
              <span className="text-xs text-gray-500">目标表单</span>
              <select
                value={binding.targetFormId || ''}
                onChange={(e) => updateBinding('targetFormId', e.target.value)}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
              >
                <option value="">-- 选择表单 --</option>
                {forms.map(form => (
                  <option key={form.id} value={form.id}>{form.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* 页面跳转设置 */}
          {binding.type === 'navigate' && (
            <div>
              <span className="text-xs text-gray-500">目标页面URL或ID</span>
              <input
                type="text"
                value={binding.navigateTo || ''}
                onChange={(e) => updateBinding('navigateTo', e.target.value)}
                placeholder="/page/xxx 或 页面ID"
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
              />
            </div>
          )}

          {/* 自定义操作 */}
          {binding.type === 'custom' && (
            <div>
              <span className="text-xs text-gray-500">操作代码（JavaScript）</span>
              <textarea
                value={binding.customCode || ''}
                onChange={(e) => updateBinding('customCode', e.target.value)}
                placeholder="// 自定义操作代码&#10;console.log('clicked');"
                rows={4}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1 font-mono"
              />
            </div>
          )}
        </div>
      )}

      {/* 绑定预览 */}
      {binding.type && (
        <div className="p-3 bg-gray-100 rounded">
          <label className="block text-xs font-medium text-gray-600 mb-2">绑定预览</label>
          <div className="text-xs text-gray-700 space-y-1">
            <div><span className="text-gray-500">类型：</span>{binding.type}</div>
            {binding.fieldId && <div><span className="text-gray-500">字段：</span>{binding.fieldName || binding.fieldId}</div>}
            {binding.formId && <div><span className="text-gray-500">表单：</span>{binding.formId}</div>}
            {binding.buttonText && <div><span className="text-gray-500">文本：</span>{binding.buttonText}</div>}
          </div>
        </div>
      )}

      {/* 清除绑定 */}
      {binding.type && (
        <button
          onClick={clearBinding}
          className="w-full py-2 text-xs text-red-600 border border-red-300 rounded hover:bg-red-50"
        >
          清除数据绑定
        </button>
      )}

      {/* 无表单/字段提示 */}
      {forms.length === 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          ⚠️ 当前项目暂无表单数据。请先在"定义表单"中创建表单和字段。
        </div>
      )}
    </div>
  );
}

window.DataBindingPanel = DataBindingPanel;

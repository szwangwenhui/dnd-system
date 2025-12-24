// 跳转按钮类型实现
// 支持简单跳转和带参数跳转

// 跳转按钮配置渲染组件
function JumpButtonConfigRender({ config, onChange, projectId, roleId }) {
  const [pages, setPages] = React.useState([]);
  const [forms, setForms] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // 加载页面列表和表单列表
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // 加载页面列表
        if (window.dndDB && roleId) {
          const pageList = await window.dndDB.getPagesByRoleId(projectId, roleId);
          setPages(pageList || []);
        }
        // 加载表单列表（用于获取参数来源）
        if (window.dndDB) {
          const formList = await window.dndDB.getFormsByProjectId(projectId);
          setForms(formList || []);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [projectId, roleId]);

  // 获取可用的参数来源（表单字段）
  const getAvailableParams = () => {
    const params = [];
    forms.forEach(form => {
      if (form.structure && form.structure.fields) {
        form.structure.fields.forEach(field => {
          params.push({
            formId: form.id,
            formName: form.name,
            fieldId: field.fieldId,
            label: `${form.name} - ${field.fieldId}`
          });
        });
      }
    });
    return params;
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-4">加载中...</div>;
  }

  return (
    <div className="space-y-4">
      {/* 目标页面 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          目标页面 <span className="text-red-500">*</span>
        </label>
        <select
          value={config.targetPageId || ''}
          onChange={(e) => onChange({ targetPageId: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">-- 请选择页面 --</option>
          {pages.map(page => (
            <option key={page.id} value={page.id}>
              {page.name} ({page.id})
            </option>
          ))}
        </select>
      </div>

      {/* 是否带参数 */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={config.withParams || false}
            onChange={(e) => onChange({ 
              withParams: e.target.checked,
              params: e.target.checked ? (config.params || []) : []
            })}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">带参数跳转</span>
        </label>
        <p className="text-xs text-gray-500 mt-1">
          勾选后可以将当前页面的数据作为参数传递到目标页面
        </p>
      </div>

      {/* 参数配置 */}
      {config.withParams && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">参数列表</span>
            <button
              type="button"
              onClick={() => {
                const newParams = [...(config.params || []), { name: '', source: '' }];
                onChange({ params: newParams });
              }}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              + 添加参数
            </button>
          </div>

          {(!config.params || config.params.length === 0) ? (
            <div className="text-center text-gray-400 text-sm py-2">
              暂无参数，点击上方添加
            </div>
          ) : (
            <div className="space-y-2">
              {config.params.map((param, index) => (
                <div key={index} className="flex items-center space-x-2 flex-wrap">
                  <input
                    type="text"
                    value={param.name || ''}
                    onChange={(e) => {
                      const newParams = [...config.params];
                      newParams[index] = { ...newParams[index], name: e.target.value };
                      onChange({ params: newParams });
                    }}
                    placeholder="参数名"
                    className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                  <select
                    value={param.source || ''}
                    onChange={(e) => {
                      const newParams = [...config.params];
                      newParams[index] = { ...newParams[index], source: e.target.value };
                      onChange({ params: newParams });
                    }}
                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="">-- 参数来源 --</option>
                    <optgroup label="表单字段">
                      {getAvailableParams().map((p, i) => (
                        <option key={i} value={`${p.formId}.${p.fieldId}`}>
                          {p.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="固定值">
                      <option value="__input__">手动输入</option>
                    </optgroup>
                  </select>
                  <select
                    value={param.target || 'URL'}
                    onChange={(e) => {
                      const newParams = [...config.params];
                      newParams[index] = { ...newParams[index], target: e.target.value };
                      onChange({ params: newParams });
                    }}
                    className="w-28 px-2 py-1 border border-gray-300 rounded text-sm"
                    title="参数传递方式"
                  >
                    <option value="URL">URL参数</option>
                    <option value="LocalStorage">LocalStorage</option>
                    <option value="SessionStorage">SessionStorage</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const newParams = config.params.filter((_, i) => i !== index);
                      onChange({ params: newParams });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                  {param.source === '__input__' && (
                    <input
                      type="text"
                      value={param.fixedValue || ''}
                      onChange={(e) => {
                        const newParams = [...config.params];
                        newParams[index] = { ...newParams[index], fixedValue: e.target.value, source: e.target.value };
                        onChange({ params: newParams });
                      }}
                      placeholder="输入固定值"
                      className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 打开方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">打开方式</label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-1">
            <input
              type="radio"
              name="openMode"
              value="current"
              checked={(config.openMode || 'current') === 'current'}
              onChange={(e) => onChange({ openMode: e.target.value })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">当前窗口</span>
          </label>
          <label className="flex items-center space-x-1">
            <input
              type="radio"
              name="openMode"
              value="new"
              checked={config.openMode === 'new'}
              onChange={(e) => onChange({ openMode: e.target.value })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">新窗口</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// 跳转按钮执行函数
async function executeJumpButton(config, context) {
  if (!config.targetPageId) {
    return { success: false, error: '未配置目标页面' };
  }

  const { projectId, roleId } = context;
  
  // 构建URL参数
  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set('pageId', config.targetPageId);
  if (projectId) urlParams.set('projectId', projectId);
  if (roleId) urlParams.set('roleId', roleId);
  
  // 处理传递的参数
  if (config.withParams && config.params && config.params.length > 0) {
    for (const param of config.params) {
      if (param.name && param.source) {
        // 从来源获取值
        let value = null;
        
        // 来源格式: formId.fieldId 或 固定值
        if (param.source.includes('.')) {
          const [formId, fieldId] = param.source.split('.');
          // 尝试从表单数据获取值
          if (context.formDataCache && context.formDataCache[formId]) {
            const records = context.formDataCache[formId];
            if (records && records.length > 0) {
              // 默认取第一条记录的值
              value = records[0][fieldId];
            }
          }
        } else {
          // 固定值
          value = param.source;
        }
        
        if (value !== null && value !== undefined) {
          // 根据参数目标写入
          const target = param.target || 'URL';
          if (target === 'URL') {
            urlParams.set(param.name, String(value));
          } else if (target === 'LocalStorage' && window.ParamWriter) {
            window.ParamWriter.writeToLocalStorage(param.name, value);
          } else if (target === 'SessionStorage' && window.ParamWriter) {
            window.ParamWriter.writeToSessionStorage(param.name, value);
          } else {
            // 默认写入URL
            urlParams.set(param.name, String(value));
          }
        }
      }
    }
  }
  
  const targetUrl = `preview.html?${urlParams.toString()}`;

  // 执行跳转
  if (config.openMode === 'new') {
    window.open(targetUrl, '_blank');
  } else {
    window.location.href = targetUrl;
  }

  return { success: true };
}

// 验证配置
function validateJumpButton(config) {
  const errors = [];
  if (!config.targetPageId) {
    errors.push('请选择目标页面');
  }
  return { valid: errors.length === 0, errors };
}

// 注册按钮类型
if (window.ButtonRegistry) {
  window.ButtonRegistry.register('jump', {
    label: '跳转按钮',
    icon: '🔗',
    description: '跳转到其他页面',
    category: 'navigation',
    renderConfig: JumpButtonConfigRender,
    execute: executeJumpButton,
    validate: validateJumpButton,
    defaultConfig: {
      targetPageId: '',
      withParams: false,
      params: [],
      openMode: 'current'
    }
  });
}


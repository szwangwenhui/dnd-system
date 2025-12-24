// 跳转页面按钮 - 动作按钮类型
// 支持多种参数取值方式：手动输入、区块数据、URL参数透传、系统变量

function NavigateButtonConfig({ config, onChange, projectId, roleId }) {
  const [pages, setPages] = React.useState([]);
  const [blocks, setBlocks] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [currentPageId, setCurrentPageId] = React.useState('');

  // 加载数据
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        if (window.dndDB && roleId) {
          // 加载页面列表
          const pageList = await window.dndDB.getPagesByRoleId(projectId, roleId);
          setPages(pageList || []);
          
          // 获取当前页面ID（从URL或上下文）
          const hash = window.location.hash;
          const pageMatch = hash.match(/page=([^&]+)/);
          if (pageMatch) {
            setCurrentPageId(pageMatch[1]);
          }
        }
        
        // 加载字段列表
        if (window.dndDB) {
          const fieldList = await window.dndDB.getFieldsByProjectId(projectId);
          setFields(fieldList || []);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [projectId, roleId]);

  // 当选择目标页面后，加载该页面的区块
  React.useEffect(() => {
    const loadBlocks = async () => {
      if (currentPageId && window.dndDB) {
        try {
          const page = pages.find(p => p.id === currentPageId);
          if (page && page.design && page.design.blocks) {
            // 获取当前页面的区块（用于区块数据取值）
            setBlocks(page.design.blocks);
          }
        } catch (error) {
          console.error('加载区块失败:', error);
        }
      }
    };
    loadBlocks();
  }, [currentPageId, pages]);

  // 获取区块绑定的表单字段
  const getBlockFields = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block || !block.formId) return [];
    return fields.filter(f => f.formId === block.formId);
  };

  // 获取当前页面可能接收的URL参数（从页面配置中获取，或手动输入）
  const getUrlParams = () => {
    // 常见的URL参数名
    return ['id', 'orderId', 'userId', 'type', 'action', 'from'];
  };

  // 添加参数
  const addParam = () => {
    const newParams = [...(config.params || []), {
      id: Date.now(),
      paramName: '',
      valueType: 'manual',  // manual/blockData/urlParam/system
      manualValue: '',
      blockId: '',
      fieldId: '',
      urlParamName: '',
      systemVar: ''
    }];
    onChange({ params: newParams });
  };

  // 删除参数
  const removeParam = (index) => {
    const newParams = (config.params || []).filter((_, i) => i !== index);
    onChange({ params: newParams });
  };

  // 更新参数
  const updateParam = (index, updates) => {
    const newParams = (config.params || []).map((p, i) => 
      i === index ? { ...p, ...updates } : p
    );
    onChange({ params: newParams });
  };

  // 获取参数值预览
  const getParamPreview = (param) => {
    switch (param.valueType) {
      case 'manual':
        return param.manualValue ? `"${param.manualValue}"` : '(未设置)';
      case 'blockData':
        const field = fields.find(f => f.id === param.fieldId);
        return field ? `{区块.${field.name}}` : '(未设置)';
      case 'urlParam':
        return param.urlParamName ? `{URL.${param.urlParamName}}` : '(未设置)';
      case 'system':
        return param.systemVar || '(未设置)';
      default:
        return '(未设置)';
    }
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
          onChange={(e) => {
            const page = pages.find(p => p.id === e.target.value);
            onChange({ 
              targetPageId: e.target.value,
              targetPageName: page?.name || ''
            });
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          <option value="">-- 请选择页面 --</option>
          {pages.map(page => (
            <option key={page.id} value={page.id}>
              {page.name}
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
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm font-medium text-gray-700">带参数跳转</span>
        </label>
      </div>

      {/* 参数配置 */}
      {config.withParams && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">跳转参数</span>
            <button
              type="button"
              onClick={addParam}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
            >
              <span className="mr-1">+</span> 添加参数
            </button>
          </div>

          {(!config.params || config.params.length === 0) ? (
            <div className="text-center text-gray-400 text-sm py-3 bg-white rounded border border-dashed border-gray-300">
              暂无参数，点击上方添加
            </div>
          ) : (
            <div className="space-y-3">
              {config.params.map((param, index) => (
                <div key={param.id || index} className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">参数 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeParam(index)}
                      className="text-red-400 hover:text-red-600 text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  {/* 参数名 */}
                  <div className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">参数名</label>
                    <input
                      type="text"
                      value={param.paramName || ''}
                      onChange={(e) => updateParam(index, { paramName: e.target.value })}
                      placeholder="如：orderId"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>

                  {/* 取值方式 */}
                  <div className="mb-2">
                    <label className="block text-xs text-gray-500 mb-1">取值方式</label>
                    <select
                      value={param.valueType || 'manual'}
                      onChange={(e) => updateParam(index, { 
                        valueType: e.target.value,
                        manualValue: '',
                        blockId: '',
                        fieldId: '',
                        urlParamName: '',
                        systemVar: ''
                      })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="manual">手动输入</option>
                      <option value="blockData">区块数据</option>
                      <option value="urlParam">URL参数透传</option>
                      <option value="system">系统变量</option>
                    </select>
                  </div>

                  {/* 取值配置 */}
                  <div>
                    {param.valueType === 'manual' && (
                      <input
                        type="text"
                        value={param.manualValue || ''}
                        onChange={(e) => updateParam(index, { manualValue: e.target.value })}
                        placeholder="输入固定值"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      />
                    )}

                    {param.valueType === 'blockData' && (
                      <div className="flex space-x-2">
                        <select
                          value={param.blockId || ''}
                          onChange={(e) => updateParam(index, { blockId: e.target.value, fieldId: '' })}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                        >
                          <option value="">选择区块</option>
                          {blocks.filter(b => b.type === 'form' || b.type === 'list').map(b => (
                            <option key={b.id} value={b.id}>{b.name || b.id}</option>
                          ))}
                        </select>
                        <select
                          value={param.fieldId || ''}
                          onChange={(e) => updateParam(index, { fieldId: e.target.value })}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                          disabled={!param.blockId}
                        >
                          <option value="">选择字段</option>
                          {getBlockFields(param.blockId).map(f => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {param.valueType === 'urlParam' && (
                      <div className="flex space-x-2">
                        <select
                          value={param.urlParamName || ''}
                          onChange={(e) => updateParam(index, { urlParamName: e.target.value })}
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                        >
                          <option value="">选择参数</option>
                          {getUrlParams().map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={param.urlParamName || ''}
                          onChange={(e) => updateParam(index, { urlParamName: e.target.value })}
                          placeholder="或手动输入"
                          className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
                        />
                      </div>
                    )}

                    {param.valueType === 'system' && (
                      <select
                        value={param.systemVar || ''}
                        onChange={(e) => updateParam(index, { systemVar: e.target.value })}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="">选择系统变量</option>
                        <option value="@TODAY">@TODAY - 当前日期</option>
                        <option value="@NOW">@NOW - 当前时间</option>
                        <option value="@TIMESTAMP">@TIMESTAMP - 时间戳</option>
                      </select>
                    )}
                  </div>

                  {/* 预览 */}
                  {param.paramName && (
                    <div className="mt-2 text-xs text-green-600">
                      ✓ {param.paramName} = {getParamPreview(param)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* URL预览 */}
          {config.params && config.params.length > 0 && config.params.some(p => p.paramName) && (
            <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-600">
              <span className="font-medium">预览：</span>
              ?{config.params.filter(p => p.paramName).map(p => 
                `${p.paramName}=${getParamPreview(p)}`
              ).join('&')}
            </div>
          )}
        </div>
      )}

      {/* 打开方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">打开方式</label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="radio"
              checked={(config.openMode || 'current') === 'current'}
              onChange={() => onChange({ openMode: 'current' })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">当前窗口</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="radio"
              checked={config.openMode === 'new'}
              onChange={() => onChange({ openMode: 'new' })}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm">新窗口</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// 执行跳转
async function executeNavigateButton(config, context) {
  if (!config.targetPageId) {
    return { success: false, error: '未配置目标页面' };
  }

  // 构建URL参数
  let queryString = '';
  if (config.withParams && config.params && config.params.length > 0) {
    const paramParts = [];
    
    for (const param of config.params) {
      if (!param.paramName) continue;
      
      let value = '';
      switch (param.valueType) {
        case 'manual':
          value = param.manualValue || '';
          break;
        case 'blockData':
          // 从上下文中获取区块数据
          if (context.blockData && param.fieldId) {
            value = context.blockData[param.fieldId] || '';
          }
          break;
        case 'urlParam':
          // 从当前URL获取参数
          const urlParams = new URLSearchParams(window.location.search);
          value = urlParams.get(param.urlParamName) || '';
          break;
        case 'system':
          // 系统变量
          switch (param.systemVar) {
            case '@TODAY':
              value = new Date().toISOString().split('T')[0];
              break;
            case '@NOW':
              value = new Date().toISOString();
              break;
            case '@TIMESTAMP':
              value = Date.now().toString();
              break;
          }
          break;
      }
      
      if (value !== '') {
        paramParts.push(`${param.paramName}=${encodeURIComponent(value)}`);
      }
    }
    
    if (paramParts.length > 0) {
      queryString = '?' + paramParts.join('&');
    }
  }

  // 执行跳转
  const targetUrl = `#page=${config.targetPageId}${queryString}`;
  
  if (config.openMode === 'new') {
    const currentUrl = window.location.href.split('#')[0];
    window.open(currentUrl + targetUrl, '_blank');
  } else {
    window.location.hash = `page=${config.targetPageId}`;
    if (queryString) {
      // 更新URL参数
      const newUrl = window.location.pathname + queryString + `#page=${config.targetPageId}`;
      window.history.pushState({}, '', newUrl);
    }
    
    // 触发导航事件
    window.dispatchEvent(new CustomEvent('navigateToPage', {
      detail: { 
        pageId: config.targetPageId, 
        params: config.params,
        queryString
      }
    }));
  }

  return { success: true };
}

// 验证配置
function validateNavigateButton(config) {
  const errors = [];
  if (!config.targetPageId) {
    errors.push('请选择目标页面');
  }
  if (config.withParams && config.params) {
    config.params.forEach((param, index) => {
      if (param.paramName && !param.valueType) {
        errors.push(`参数 ${index + 1} 未设置取值方式`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

// 注册按钮类型
if (window.ButtonRegistry) {
  window.ButtonRegistry.register('navigate', {
    label: '跳转页面',
    icon: '🔗',
    description: '跳转到指定页面，可带参数',
    category: 'action',
    renderConfig: NavigateButtonConfig,
    execute: executeNavigateButton,
    validate: validateNavigateButton,
    defaultConfig: {
      targetPageId: '',
      targetPageName: '',
      withParams: false,
      params: [],
      openMode: 'current'
    }
  });
}

window.NavigateButtonConfig = NavigateButtonConfig;

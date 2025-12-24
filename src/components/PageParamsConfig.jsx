// 页面参数配置弹窗组件
// 功能：配置页面需要读取的参数

function PageParamsConfig({ 
  projectId,
  roleId,
  page,
  allPages,  // 所有页面列表（用于选择跳转目标）
  onSave,    // (paramConfig) => void
  onCancel   // () => void
}) {
  // 系统预定义参数
  const [availableParams, setAvailableParams] = React.useState([]);
  
  // 当前配置
  const [requiredParams, setRequiredParams] = React.useState([]);
  const [optionalParams, setOptionalParams] = React.useState([]);
  const [customParams, setCustomParams] = React.useState([]);
  const [missingAction, setMissingAction] = React.useState('error');
  const [redirectPageId, setRedirectPageId] = React.useState('');
  const [defaultValues, setDefaultValues] = React.useState({});
  
  // 新增自定义参数表单
  const [newCustomParam, setNewCustomParam] = React.useState({
    name: '',
    label: '',
    source: 'URL',
    dataType: 'string',
    defaultValue: ''
  });

  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('required'); // 'required' | 'optional' | 'custom' | 'missing'

  // 加载数据
  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 获取系统预定义参数
      const params = window.dndDB.getAvailableParams();
      setAvailableParams(params);

      // 获取页面当前配置
      const config = await window.dndDB.getPageParams(projectId, roleId, page.id);
      setRequiredParams(config.requiredParams || []);
      setOptionalParams(config.optionalParams || []);
      setCustomParams(config.customParams || []);
      setMissingAction(config.missingAction || 'error');
      setRedirectPageId(config.redirectPageId || '');
      setDefaultValues(config.defaultValues || {});
    } catch (error) {
      console.error('加载参数配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 切换必需参数
  const toggleRequiredParam = (paramName) => {
    const exists = requiredParams.find(p => p.name === paramName);
    if (exists) {
      setRequiredParams(requiredParams.filter(p => p.name !== paramName));
    } else {
      const paramDef = availableParams.find(p => p.name === paramName);
      setRequiredParams([...requiredParams, {
        name: paramName,
        source: paramDef?.defaultSource || 'URL',
        label: paramDef?.label || paramName
      }]);
      // 如果在可选中，移除
      setOptionalParams(optionalParams.filter(p => p.name !== paramName));
    }
  };

  // 切换可选参数
  const toggleOptionalParam = (paramName) => {
    const exists = optionalParams.find(p => p.name === paramName);
    if (exists) {
      setOptionalParams(optionalParams.filter(p => p.name !== paramName));
    } else {
      const paramDef = availableParams.find(p => p.name === paramName);
      setOptionalParams([...optionalParams, {
        name: paramName,
        source: paramDef?.defaultSource || 'URL',
        label: paramDef?.label || paramName
      }]);
      // 如果在必需中，移除
      setRequiredParams(requiredParams.filter(p => p.name !== paramName));
    }
  };

  // 更新参数来源
  const updateParamSource = (paramName, source, isRequired) => {
    if (isRequired) {
      setRequiredParams(requiredParams.map(p => 
        p.name === paramName ? { ...p, source } : p
      ));
    } else {
      setOptionalParams(optionalParams.map(p => 
        p.name === paramName ? { ...p, source } : p
      ));
    }
  };

  // 添加自定义参数
  const addCustomParam = () => {
    if (!newCustomParam.name) {
      alert('请输入参数名称');
      return;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newCustomParam.name)) {
      alert('参数名只能包含字母、数字、下划线，且不能以数字开头');
      return;
    }
    // 检查是否重复
    const allParamNames = [
      ...availableParams.map(p => p.name),
      ...customParams.map(p => p.name)
    ];
    if (allParamNames.includes(newCustomParam.name)) {
      alert('参数名已存在');
      return;
    }

    setCustomParams([...customParams, { ...newCustomParam }]);
    setNewCustomParam({
      name: '',
      label: '',
      source: 'URL',
      dataType: 'string',
      defaultValue: ''
    });
  };

  // 删除自定义参数
  const removeCustomParam = (paramName) => {
    setCustomParams(customParams.filter(p => p.name !== paramName));
  };

  // 更新默认值
  const updateDefaultValue = (paramName, value) => {
    setDefaultValues({
      ...defaultValues,
      [paramName]: value
    });
  };

  // 保存配置
  const handleSave = () => {
    const config = {
      requiredParams,
      optionalParams,
      customParams,
      missingAction,
      redirectPageId,
      defaultValues
    };

    // 验证
    const validation = window.dndDB.validatePageParams(config);
    if (!validation.valid) {
      alert('配置错误：\n' + validation.errors.join('\n'));
      return;
    }

    onSave(config);
  };

  // 获取参数是否已选中
  const isParamRequired = (name) => requiredParams.some(p => p.name === name);
  const isParamOptional = (name) => optionalParams.some(p => p.name === name);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">加载中...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            配置页面参数 - {page.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            设置页面访问时需要读取的参数
          </p>
        </div>

        {/* Tab导航 */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {[
              { key: 'required', label: '必需参数', count: requiredParams.length },
              { key: 'optional', label: '可选参数', count: optionalParams.length },
              { key: 'custom', label: '自定义参数', count: customParams.length },
              { key: 'missing', label: '缺失处理' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 必需参数 */}
          {activeTab === 'required' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                勾选页面必须的参数，缺少这些参数时页面将按"缺失处理"配置执行
              </p>
              {availableParams.map(param => (
                <div key={param.name} className="flex items-start p-3 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={isParamRequired(param.name)}
                    onChange={() => toggleRequiredParam(param.name)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{param.label}</span>
                        <span className="ml-2 text-xs text-gray-400 font-mono">{param.name}</span>
                      </div>
                      {isParamRequired(param.name) && (
                        <select
                          value={requiredParams.find(p => p.name === param.name)?.source || param.defaultSource}
                          onChange={(e) => updateParamSource(param.name, e.target.value, true)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          {param.sources.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{param.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 可选参数 */}
          {activeTab === 'optional' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                勾选页面可选的参数，缺少时使用默认值或忽略
              </p>
              {availableParams.map(param => (
                <div key={param.name} className="flex items-start p-3 border border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={isParamOptional(param.name)}
                    onChange={() => toggleOptionalParam(param.name)}
                    disabled={isParamRequired(param.name)}
                    className="mt-1 w-4 h-4 text-blue-600 rounded disabled:opacity-50"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-gray-900">{param.label}</span>
                        <span className="ml-2 text-xs text-gray-400 font-mono">{param.name}</span>
                        {isParamRequired(param.name) && (
                          <span className="ml-2 text-xs text-blue-600">(已设为必需)</span>
                        )}
                      </div>
                      {isParamOptional(param.name) && (
                        <select
                          value={optionalParams.find(p => p.name === param.name)?.source || param.defaultSource}
                          onChange={(e) => updateParamSource(param.name, e.target.value, false)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          {param.sources.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{param.description}</p>
                    {isParamOptional(param.name) && (
                      <div className="mt-2">
                        <input
                          type="text"
                          placeholder="默认值（可选）"
                          value={defaultValues[param.name] || ''}
                          onChange={(e) => updateDefaultValue(param.name, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 自定义参数 */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                添加业务特定的自定义参数
              </p>
              
              {/* 已添加的自定义参数 */}
              {customParams.length > 0 && (
                <div className="space-y-2">
                  {customParams.map(param => (
                    <div key={param.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{param.label || param.name}</span>
                        <span className="ml-2 text-xs text-gray-400 font-mono">{param.name}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          来源: {param.source} | 类型: {param.dataType}
                        </span>
                      </div>
                      <button
                        onClick={() => removeCustomParam(param.name)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 添加新参数表单 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-3">添加新参数</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">参数名 *</label>
                    <input
                      type="text"
                      value={newCustomParam.name}
                      onChange={(e) => setNewCustomParam({ ...newCustomParam, name: e.target.value })}
                      placeholder="如: orderId"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">显示名称</label>
                    <input
                      type="text"
                      value={newCustomParam.label}
                      onChange={(e) => setNewCustomParam({ ...newCustomParam, label: e.target.value })}
                      placeholder="如: 订单ID"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">参数来源</label>
                    <select
                      value={newCustomParam.source}
                      onChange={(e) => setNewCustomParam({ ...newCustomParam, source: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="URL">URL参数</option>
                      <option value="LocalStorage">LocalStorage</option>
                      <option value="SessionStorage">SessionStorage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">数据类型</label>
                    <select
                      value={newCustomParam.dataType}
                      onChange={(e) => setNewCustomParam({ ...newCustomParam, dataType: e.target.value })}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="string">字符串</option>
                      <option value="number">数字</option>
                      <option value="boolean">布尔值</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">默认值</label>
                    <input
                      type="text"
                      value={newCustomParam.defaultValue}
                      onChange={(e) => setNewCustomParam({ ...newCustomParam, defaultValue: e.target.value })}
                      placeholder="参数缺失时的默认值"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
                <button
                  onClick={addCustomParam}
                  className="mt-3 px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  + 添加参数
                </button>
              </div>
            </div>
          )}

          {/* 缺失处理 */}
          {activeTab === 'missing' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                当必需参数缺失时的处理方式
              </p>
              
              <div className="space-y-3">
                <label className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="missingAction"
                    value="error"
                    checked={missingAction === 'error'}
                    onChange={(e) => setMissingAction(e.target.value)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">显示错误提示</div>
                    <p className="text-sm text-gray-500">显示错误信息，不加载页面内容</p>
                  </div>
                </label>

                <label className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="missingAction"
                    value="redirect"
                    checked={missingAction === 'redirect'}
                    onChange={(e) => setMissingAction(e.target.value)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-medium text-gray-900">跳转到指定页面</div>
                    <p className="text-sm text-gray-500">自动跳转到其他页面（如登录页）</p>
                    {missingAction === 'redirect' && (
                      <select
                        value={redirectPageId}
                        onChange={(e) => setRedirectPageId(e.target.value)}
                        className="mt-2 w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="">-- 选择跳转页面 --</option>
                        {allPages.filter(p => p.id !== page.id).map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </label>

                <label className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="missingAction"
                    value="default"
                    checked={missingAction === 'default'}
                    onChange={(e) => setMissingAction(e.target.value)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">使用默认值</div>
                    <p className="text-sm text-gray-500">使用配置的默认值继续加载页面</p>
                  </div>
                </label>

                <label className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="missingAction"
                    value="ignore"
                    checked={missingAction === 'ignore'}
                    onChange={(e) => setMissingAction(e.target.value)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">忽略（继续加载）</div>
                    <p className="text-sm text-gray-500">忽略缺失的参数，继续加载页面</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            已配置: {requiredParams.length} 个必需, {optionalParams.length} 个可选, {customParams.length} 个自定义
          </div>
          <div className="space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PageParamsConfig = PageParamsConfig;

console.log('[DND2] PageParamsConfig.jsx 加载完成');

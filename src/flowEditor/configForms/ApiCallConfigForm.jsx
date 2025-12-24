// 调用接口节点配置表单
function ApiCallConfigForm({ node, nodes, onUpdate }) {
  const config = node.config || {};
  const headers = config.headers || [];
  const params = config.params || [];
  
  const availableNodes = nodes.filter(n => n.id !== node.id);
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  // 添加请求头
  const addHeader = () => {
    updateConfig('headers', [...headers, { id: Date.now(), name: '', value: '' }]);
  };

  const updateHeader = (index, updates) => {
    const newHeaders = [...headers];
    newHeaders[index] = { ...newHeaders[index], ...updates };
    updateConfig('headers', newHeaders);
  };

  const removeHeader = (index) => {
    updateConfig('headers', headers.filter((_, i) => i !== index));
  };

  // 添加参数
  const addParam = () => {
    updateConfig('params', [...params, { id: Date.now(), name: '', valueType: 'fixed', value: '' }]);
  };

  const updateParam = (index, updates) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], ...updates };
    updateConfig('params', newParams);
  };

  const removeParam = (index) => {
    updateConfig('params', params.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {/* 接口地址 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          接口地址 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={config.url || ''}
          onChange={(e) => updateConfig('url', e.target.value)}
          placeholder="如：https://api.example.com/user/{user.id}"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          支持变量插值：{'{变量名}'}
        </p>
      </div>

      {/* 请求方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">请求方式</label>
        <div className="flex space-x-2">
          {['GET', 'POST', 'PUT', 'DELETE'].map(method => (
            <button
              key={method}
              onClick={() => updateConfig('method', method)}
              className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                config.method === method
                  ? method === 'GET' ? 'bg-green-600 text-white' :
                    method === 'POST' ? 'bg-blue-600 text-white' :
                    method === 'PUT' ? 'bg-yellow-600 text-white' :
                    'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {method}
            </button>
          ))}
        </div>
      </div>

      {/* 请求头 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">请求头（可选）</label>
        {headers.length > 0 && (
          <div className="space-y-2 mb-2">
            {headers.map((header, index) => (
              <div key={header.id} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={header.name}
                  onChange={(e) => updateHeader(index, { name: e.target.value })}
                  placeholder="Header名"
                  className="w-36 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                <span className="text-gray-500">:</span>
                <input
                  type="text"
                  value={header.value}
                  onChange={(e) => updateHeader(index, { value: e.target.value })}
                  placeholder="值，如：Bearer {token}"
                  className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                <button onClick={() => removeHeader(index)} className="text-red-400 hover:text-red-300">✕</button>
              </div>
            ))}
          </div>
        )}
        <button onClick={addHeader} className="text-sm text-blue-400 hover:text-blue-300">+ 添加请求头</button>
      </div>

      {/* 请求参数 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          请求参数
          <span className="text-xs text-gray-500 ml-2">
            ({config.method === 'GET' ? 'URL参数' : '请求体'})
          </span>
        </label>
        {params.length > 0 && (
          <div className="space-y-2 mb-2">
            {params.map((param, index) => (
              <div key={param.id} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={param.name}
                  onChange={(e) => updateParam(index, { name: e.target.value })}
                  placeholder="参数名"
                  className="w-28 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                <select
                  value={param.valueType}
                  onChange={(e) => updateParam(index, { valueType: e.target.value })}
                  className="w-20 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                >
                  <option value="fixed">固定</option>
                  <option value="variable">变量</option>
                </select>
                <input
                  type="text"
                  value={param.value}
                  onChange={(e) => updateParam(index, { value: e.target.value })}
                  placeholder={param.valueType === 'variable' ? 'user.id' : '值'}
                  className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                <button onClick={() => removeParam(index)} className="text-red-400 hover:text-red-300">✕</button>
              </div>
            ))}
          </div>
        )}
        <button onClick={addParam} className="text-sm text-blue-400 hover:text-blue-300">+ 添加参数</button>
      </div>

      {/* 响应处理 */}
      <div className="border-t border-gray-600 pt-4 space-y-3">
        <h4 className="text-sm font-medium text-gray-300">响应处理</h4>
        <div>
          <label className="block text-xs text-gray-400 mb-1">存入变量</label>
          <input
            type="text"
            value={config.outputVar || ''}
            onChange={(e) => updateConfig('outputVar', e.target.value)}
            placeholder="如：apiResult"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">取值路径（从返回JSON中提取）</label>
          <input
            type="text"
            value={config.outputPath || ''}
            onChange={(e) => updateConfig('outputPath', e.target.value)}
            placeholder="如：data.result 或留空取整个响应"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
          />
        </div>
      </div>

      {/* 异常处理 */}
      <div className="border-t border-gray-600 pt-4 space-y-3">
        <h4 className="text-sm font-medium text-gray-300">异常处理</h4>
        <div className="flex items-center space-x-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">超时时间</label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={config.timeout || 30}
                onChange={(e) => updateConfig('timeout', parseInt(e.target.value) || 30)}
                min="1"
                className="w-20 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
              <span className="text-gray-400 text-sm">秒</span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">失败后 → 跳转到</label>
          <select
            value={config.failNodeId || ''}
            onChange={(e) => updateConfig('failNodeId', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 结束流程 --</option>
            {availableNodes.map(n => (
              <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 使用场景 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">常见使用场景</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• 调用短信接口发送验证码</li>
          <li>• 调用支付接口创建支付订单</li>
          <li>• 调用第三方API获取物流信息</li>
        </ul>
      </div>
    </div>
  );
}

window.ApiCallConfigForm = ApiCallConfigForm;

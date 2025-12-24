// 右侧属性面板（加宽版）
function NodePropertiesPanel({ node, forms, fields, pages, nodes, onUpdate, onEdit, onDelete }) {
  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 p-8">
        <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
        <p className="text-center">选择一个节点<br/>查看和编辑属性</p>
        <p className="text-xs text-gray-600 mt-4 text-center">
          从左侧拖拽原语到画布<br/>
          点击输出点并连接到输入点
        </p>
      </div>
    );
  }

  const primitive = window.PrimitiveRegistry.get(node.type);
  
  const getColorClass = (color) => {
    const map = { green: 'bg-green-500', red: 'bg-red-500', blue: 'bg-blue-500', yellow: 'bg-yellow-500', orange: 'bg-orange-500', purple: 'bg-purple-500', indigo: 'bg-indigo-500', gray: 'bg-gray-500' };
    return map[color] || map.gray;
  };

  const handleNameChange = (e) => {
    onUpdate({ name: e.target.value });
  };

  // 快速配置某些字段
  const handleConfigChange = (key, value) => {
    onUpdate({ config: { ...node.config, [key]: value } });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl ${getColorClass(primitive?.color)}`}>
            {primitive?.icon || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={node.name}
              onChange={handleNameChange}
              className="w-full bg-transparent text-white font-semibold text-lg border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1"
            />
            <p className="text-gray-500 text-sm">{node.id} · {primitive?.name || node.type}</p>
          </div>
        </div>
      </div>
      
      {/* 内容 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 基本信息 */}
        <div>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">基本信息</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">类型</span>
              <span className="text-gray-200 text-sm">{primitive?.name || node.type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">位置</span>
              <span className="text-gray-400 text-sm font-mono">({node.x}, {node.y})</span>
            </div>
            {primitive?.description && (
              <div>
                <span className="text-gray-500 text-sm">描述</span>
                <p className="text-gray-400 text-sm mt-1">{primitive.description}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 配置区域 */}
        <div>
          <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">节点配置</h3>
          
          {/* 开始/结束节点 */}
          {(node.type === 'start' || node.type === 'end') && (
            <p className="text-gray-500 text-sm">此节点无需配置</p>
          )}
          
          {/* 数据操作节点快速配置 */}
          {['read', 'write', 'update', 'delete'].includes(node.type) && (
            <div className="space-y-3">
              <div>
                <label className="text-gray-500 text-sm block mb-1">目标表单</label>
                <select
                  value={node.config?.formId || ''}
                  onChange={(e) => {
                    const form = forms.find(f => f.id === e.target.value);
                    handleConfigChange('formId', e.target.value);
                    handleConfigChange('formName', form?.name || '');
                  }}
                  className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">选择表单...</option>
                  {forms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              
              {node.type === 'read' && (
                <div>
                  <label className="text-gray-500 text-sm block mb-1">存入变量</label>
                  <input
                    type="text"
                    value={node.config?.outputVar || ''}
                    onChange={(e) => handleConfigChange('outputVar', e.target.value)}
                    placeholder="变量名"
                    className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>
              )}
              
              <button
                onClick={onEdit}
                className="w-full text-blue-400 hover:text-blue-300 text-sm py-2 border border-gray-600 rounded hover:bg-gray-700"
              >
                详细配置...
              </button>
            </div>
          )}
          
          {/* 分支节点 */}
          {node.type === 'binaryBranch' && (
            <div className="space-y-3">
              <div>
                <label className="text-gray-500 text-sm block mb-1">判断条件</label>
                <input
                  type="text"
                  value={node.config?.expression || ''}
                  onChange={(e) => handleConfigChange('expression', e.target.value)}
                  placeholder="如：user.余额 >= 100"
                  className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          )}
          
          {/* 提示节点 */}
          {node.type === 'alert' && (
            <div className="space-y-3">
              <div>
                <label className="text-gray-500 text-sm block mb-1">提示类型</label>
                <div className="flex space-x-2">
                  {['success', 'error', 'warning', 'info'].map(t => (
                    <button
                      key={t}
                      onClick={() => handleConfigChange('alertType', t)}
                      className={`flex-1 py-1.5 rounded text-xs ${
                        node.config?.alertType === t 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {{success:'成功',error:'错误',warning:'警告',info:'信息'}[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-gray-500 text-sm block mb-1">提示内容</label>
                <input
                  type="text"
                  value={node.config?.message || ''}
                  onChange={(e) => handleConfigChange('message', e.target.value)}
                  placeholder="输入提示文字"
                  className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}
          
          {/* 跳转节点 */}
          {node.type === 'jump' && (
            <div className="space-y-3">
              <div>
                <label className="text-gray-500 text-sm block mb-1">目标页面</label>
                <select
                  value={node.config?.pageId || ''}
                  onChange={(e) => {
                    const page = pages.find(p => p.id === e.target.value);
                    handleConfigChange('pageId', e.target.value);
                    handleConfigChange('pageName', page?.name || '');
                  }}
                  className="w-full bg-gray-700 text-gray-200 rounded px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">选择页面...</option>
                  {pages.map(p => <option key={p.id} value={p.id}>[{p.roleName}] {p.name}</option>)}
                </select>
              </div>
            </div>
          )}
          
          {/* 其他节点显示配置摘要 */}
          {!['start', 'end', 'read', 'write', 'update', 'delete', 'binaryBranch', 'alert', 'jump'].includes(node.type) && (
            <div className="space-y-3">
              {primitive?.toDocument && (
                <div className="bg-gray-700 rounded p-3 text-sm text-gray-300 font-mono">
                  {primitive.toDocument(node.config || {})}
                </div>
              )}
              <button
                onClick={onEdit}
                className="w-full text-blue-400 hover:text-blue-300 text-sm py-2 border border-gray-600 rounded hover:bg-gray-700"
              >
                编辑配置...
              </button>
            </div>
          )}
        </div>
        
        {/* 配置JSON预览 */}
        {node.config && Object.keys(node.config).length > 0 && (
          <div>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">配置数据</h3>
            <pre className="bg-gray-900 rounded p-3 text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify(node.config, null, 2)}
            </pre>
          </div>
        )}
      </div>
      
      {/* 底部按钮 */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <button
          onClick={onEdit}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          编辑节点
        </button>
        {primitive?.canDelete !== false && (
          <button
            onClick={onDelete}
            className="w-full py-2.5 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/10 text-sm"
          >
            删除节点
          </button>
        )}
      </div>
    </div>
  );
}

window.NodePropertiesPanel = NodePropertiesPanel;

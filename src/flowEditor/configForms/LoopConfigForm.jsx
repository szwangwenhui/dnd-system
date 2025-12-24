// 循环节点配置表单
function LoopConfigForm({ node, nodes, onUpdate }) {
  const config = node.config || {};
  
  const availableNodes = nodes.filter(n => n.id !== node.id);
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  return (
    <div className="space-y-4">
      {/* 循环方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          循环方式 <span className="text-red-400">*</span>
        </label>
        <div className="space-y-2">
          <label className="flex items-center text-sm text-gray-300 p-2 rounded hover:bg-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={config.loopType === 'array' || !config.loopType}
              onChange={() => updateConfig('loopType', 'array')}
              className="mr-3"
            />
            <div>
              <span className="font-medium">遍历数组</span>
              <p className="text-xs text-gray-500">逐个处理数组中的每个元素</p>
            </div>
          </label>
          <label className="flex items-center text-sm text-gray-300 p-2 rounded hover:bg-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={config.loopType === 'count'}
              onChange={() => updateConfig('loopType', 'count')}
              className="mr-3"
            />
            <div>
              <span className="font-medium">固定次数</span>
              <p className="text-xs text-gray-500">执行指定次数的循环</p>
            </div>
          </label>
          <label className="flex items-center text-sm text-gray-300 p-2 rounded hover:bg-gray-700 cursor-pointer">
            <input
              type="radio"
              checked={config.loopType === 'condition'}
              onChange={() => updateConfig('loopType', 'condition')}
              className="mr-3"
            />
            <div>
              <span className="font-medium">条件循环</span>
              <p className="text-xs text-gray-500">满足条件时持续循环</p>
            </div>
          </label>
        </div>
      </div>

      {/* 遍历数组配置 */}
      {(config.loopType === 'array' || !config.loopType) && (
        <div className="border border-blue-600 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-blue-400">遍历数组配置</h4>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              数据源（数组变量）<span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={config.arraySource || ''}
              onChange={(e) => updateConfig('arraySource', e.target.value)}
              placeholder="如：orderList、cartItems"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">当前项变量名</label>
              <input
                type="text"
                value={config.itemVar || 'item'}
                onChange={(e) => updateConfig('itemVar', e.target.value)}
                placeholder="item"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">当前索引变量名</label>
              <input
                type="text"
                value={config.indexVar || 'index'}
                onChange={(e) => updateConfig('indexVar', e.target.value)}
                placeholder="index"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
          </div>
          
          <p className="text-xs text-gray-500">
            💡 循环内可用 {config.itemVar || 'item'} 访问当前元素，{config.indexVar || 'index'} 访问当前索引（从0开始）
          </p>
        </div>
      )}

      {/* 固定次数配置 */}
      {config.loopType === 'count' && (
        <div className="border border-green-600 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-green-400">固定次数配置</h4>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">循环次数</label>
            <div className="flex items-center space-x-3">
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="radio"
                  checked={config.countType !== 'variable'}
                  onChange={() => updateConfig('countType', 'fixed')}
                  className="mr-2"
                />
                固定值
              </label>
              <label className="flex items-center text-sm text-gray-300">
                <input
                  type="radio"
                  checked={config.countType === 'variable'}
                  onChange={() => updateConfig('countType', 'variable')}
                  className="mr-2"
                />
                变量值
              </label>
            </div>
          </div>
          
          <div>
            {config.countType !== 'variable' ? (
              <input
                type="number"
                value={config.countValue || 1}
                onChange={(e) => updateConfig('countValue', parseInt(e.target.value) || 1)}
                min="1"
                className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            ) : (
              <input
                type="text"
                value={config.countVariable || ''}
                onChange={(e) => updateConfig('countVariable', e.target.value)}
                placeholder="如：retryCount"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            )}
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">当前次数变量名</label>
            <input
              type="text"
              value={config.indexVar || 'index'}
              onChange={(e) => updateConfig('indexVar', e.target.value)}
              placeholder="index"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
          </div>
        </div>
      )}

      {/* 条件循环配置 */}
      {config.loopType === 'condition' && (
        <div className="border border-yellow-600 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-yellow-400">条件循环配置</h4>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              继续条件 <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={config.condition || ''}
              onChange={(e) => updateConfig('condition', e.target.value)}
              placeholder="如：count < 10、retryCount <= 3"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              当条件为真时继续循环，为假时退出
            </p>
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">最大循环次数（防止死循环）</label>
            <input
              type="number"
              value={config.maxIterations || 100}
              onChange={(e) => updateConfig('maxIterations', parseInt(e.target.value) || 100)}
              min="1"
              className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            />
          </div>
        </div>
      )}

      {/* 循环体和结束后节点 */}
      <div className="border-t border-gray-600 pt-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            循环体 → 第一个节点
          </label>
          <select
            value={config.bodyNode || ''}
            onChange={(e) => updateConfig('bodyNode', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 通过连线指定 --</option>
            {availableNodes.map(n => (
              <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            循环结束后 → 跳转到
          </label>
          <select
            value={config.afterNode || ''}
            onChange={(e) => updateConfig('afterNode', e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            <option value="">-- 通过连线指定 --</option>
            {availableNodes.map(n => (
              <option key={n.id} value={n.id}>{n.name} ({n.id})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 预览 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">循环预览</h4>
        <div className="bg-gray-900 rounded p-3 text-xs font-mono">
          {(config.loopType === 'array' || !config.loopType) && (
            <>
              <div className="text-purple-400">
                for ({config.indexVar || 'index'}, {config.itemVar || 'item'}) in {config.arraySource || '数组'} {'{'}
              </div>
              <div className="text-gray-400 pl-4">// 循环体...</div>
              <div className="text-purple-400">{'}'}</div>
            </>
          )}
          {config.loopType === 'count' && (
            <>
              <div className="text-green-400">
                for ({config.indexVar || 'index'} = 0; {config.indexVar || 'index'} {'<'} {config.countType === 'variable' ? config.countVariable || '?' : config.countValue || 1}; {config.indexVar || 'index'}++) {'{'}
              </div>
              <div className="text-gray-400 pl-4">// 循环体...</div>
              <div className="text-green-400">{'}'}</div>
            </>
          )}
          {config.loopType === 'condition' && (
            <>
              <div className="text-yellow-400">
                while ({config.condition || '条件'}) {'{'}
              </div>
              <div className="text-gray-400 pl-4">// 循环体...</div>
              <div className="text-yellow-400">{'}'}</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

window.LoopConfigForm = LoopConfigForm;

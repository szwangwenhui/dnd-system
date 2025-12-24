// 聚合计算节点配置表单
function AggregateConfigForm({ node, onUpdate }) {
  const config = node.config || {};
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  // 聚合方式
  const aggregateMethods = [
    { value: 'sum', label: '求和 SUM', icon: 'Σ', desc: '计算所有值的总和', needField: true },
    { value: 'count', label: '计数 COUNT', icon: '#', desc: '统计记录数量', needField: false },
    { value: 'avg', label: '平均值 AVG', icon: 'x̄', desc: '计算平均值', needField: true },
    { value: 'max', label: '最大值 MAX', icon: '↑', desc: '找出最大值', needField: true },
    { value: 'min', label: '最小值 MIN', icon: '↓', desc: '找出最小值', needField: true }
  ];

  const selectedMethod = aggregateMethods.find(m => m.value === config.method) || aggregateMethods[0];

  return (
    <div className="space-y-4">
      {/* 数据源 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          数据源（数组变量）<span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={config.sourceVar || ''}
          onChange={(e) => updateConfig('sourceVar', e.target.value)}
          placeholder="如：orderList、cartItems、scores"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
        />
        <p className="text-xs text-gray-500 mt-1">
          必须是数组类型的变量
        </p>
      </div>

      {/* 聚合方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          聚合方式 <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-1 gap-2">
          {aggregateMethods.map(method => (
            <label 
              key={method.value}
              className={`flex items-center p-3 rounded border-2 cursor-pointer transition-all ${
                config.method === method.value 
                  ? 'bg-indigo-900/30 border-indigo-500' 
                  : 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
              }`}
            >
              <input
                type="radio"
                checked={config.method === method.value}
                onChange={() => updateConfig('method', method.value)}
                className="sr-only"
              />
              <span className="w-8 h-8 rounded bg-indigo-600 text-white flex items-center justify-center text-lg mr-3">
                {method.icon}
              </span>
              <div className="flex-1">
                <div className="text-sm text-white font-medium">{method.label}</div>
                <div className="text-xs text-gray-400">{method.desc}</div>
              </div>
              {config.method === method.value && (
                <span className="text-indigo-400">✓</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* 聚合字段 */}
      {selectedMethod.needField && (
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            聚合字段 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={config.field || ''}
            onChange={(e) => updateConfig('field', e.target.value)}
            placeholder="如：金额、数量、分数"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            数组中每个对象的哪个字段参与计算
          </p>
        </div>
      )}

      {/* 存入变量 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          存入变量 <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={config.outputVar || ''}
          onChange={(e) => updateConfig('outputVar', e.target.value)}
          placeholder="如：totalAmount、orderCount、avgScore"
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm font-mono"
        />
      </div>

      {/* 预览 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">聚合预览</h4>
        <div className="bg-gray-900 rounded p-3 text-sm font-mono">
          <span className="text-indigo-400">{config.outputVar || '???'}</span>
          <span className="text-gray-500"> = </span>
          <span className="text-yellow-400">{(config.method || 'SUM').toUpperCase()}</span>
          <span className="text-white">(</span>
          <span className="text-green-400">{config.sourceVar || '数组'}</span>
          {selectedMethod.needField && (
            <>
              <span className="text-gray-500">.</span>
              <span className="text-blue-400">{config.field || '字段'}</span>
            </>
          )}
          <span className="text-white">)</span>
        </div>
      </div>

      {/* 使用场景 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">常见使用场景</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• 计算购物车总金额：<code className="text-indigo-300">SUM(cartItems.金额)</code></li>
          <li>• 统计订单数量：<code className="text-indigo-300">COUNT(orderList)</code></li>
          <li>• 找出最高分：<code className="text-indigo-300">MAX(scores.分数)</code></li>
          <li>• 计算平均评分：<code className="text-indigo-300">AVG(reviews.rating)</code></li>
        </ul>
      </div>
    </div>
  );
}

window.AggregateConfigForm = AggregateConfigForm;

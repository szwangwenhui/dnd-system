// 循环开始节点配置表单
function LoopStartConfigForm({ config, onChange, pages, forms, blocks, fields, nodes, projectId, flowId }) {
  const defaultConfig = {
    loopType: 'forEach',
    forEachConfig: { 
      sourceVar: '',
      sourceVarName: '',
      itemVar: 'item',
      indexVar: 'index'
    },
    whileConfig: {
      conditionType: 'expression',
      expression: '',
      leftVariableId: '',
      leftVariablePath: '',
      operator: '!=',
      rightType: 'constant',
      rightValue: '',
      rightVariableId: '',
      rightVariablePath: '',
      maxCount: 100,
      countVar: 'loopCount'
    },
    loopEndNodeId: ''
  };

  const [localConfig, setLocalConfig] = React.useState({
    ...defaultConfig,
    ...config,
    forEachConfig: { ...defaultConfig.forEachConfig, ...(config?.forEachConfig || {}) },
    whileConfig: { ...defaultConfig.whileConfig, ...(config?.whileConfig || {}) }
  });

  // 加载变量列表
  const [variables, setVariables] = React.useState([]);
  
  React.useEffect(() => {
    const loadVariables = async () => {
      console.log('LoopStartConfigForm 加载变量, projectId:', projectId, 'flowId:', flowId);
      if (!projectId || !flowId) {
        console.warn('缺少projectId或flowId，无法加载变量');
        return;
      }
      try {
        // 获取项目所有变量，然后按flowId过滤
        const allVars = await window.dndDB.getVariables(projectId);
        const flowVars = (allVars || []).filter(v => v.flowId === flowId);
        console.log('加载到的变量:', flowVars);
        console.log('数组类型变量:', flowVars?.filter(v => v.dataType === 'array'));
        setVariables(flowVars);
      } catch (error) {
        console.error('加载变量失败:', error);
      }
    };
    loadVariables();
  }, [projectId, flowId]);

  // 单个路径更新
  const updateConfig = (path, value) => {
    setLocalConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      onChange(newConfig);
      return newConfig;
    });
  };

  // 获取数组类型的变量
  const getArrayVariables = () => {
    return (variables || []).filter(v => v.dataType === 'array');
  };

  // 获取循环结束节点
  const getLoopEndNodes = () => {
    return (nodes || []).filter(n => n.type === 'loopEnd');
  };

  // 运算符选项
  const operators = [
    { value: '==', label: '等于' },
    { value: '!=', label: '不等于' },
    { value: '>', label: '大于' },
    { value: '>=', label: '大于等于' },
    { value: '<', label: '小于' },
    { value: '<=', label: '小于等于' }
  ];

  return (
    <div className="space-y-4">
      {/* 循环方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">循环方式</label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              checked={localConfig.loopType === 'forEach'}
              onChange={() => updateConfig('loopType', 'forEach')}
              className="text-purple-500"
            />
            <span className="text-gray-200">遍历对象</span>
            <span className="text-xs text-gray-500">(for item in list)</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              checked={localConfig.loopType === 'while'}
              onChange={() => updateConfig('loopType', 'while')}
              className="text-purple-500"
            />
            <span className="text-gray-200">条件循环</span>
            <span className="text-xs text-gray-500">(while condition)</span>
          </label>
        </div>
      </div>

      {/* 遍历对象配置 */}
      {localConfig.loopType === 'forEach' && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">遍历配置</h4>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              数据来源 <span className="text-red-400">*</span>
              <span className="text-gray-500 ml-2">(选择要遍历的数组变量)</span>
            </label>
            <select
              value={localConfig.forEachConfig.sourceVar}
              onChange={(e) => {
                const variable = variables?.find(v => v.id === e.target.value);
                updateConfig('forEachConfig.sourceVar', e.target.value);
                updateConfig('forEachConfig.sourceVarName', variable?.name || '');
              }}
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-purple-500 focus:outline-none"
            >
              <option value="">-- 选择数组变量 --</option>
              {getArrayVariables().map(v => (
                <option key={v.id} value={v.id}>
                  {v.name || v.id} ({v.sourceFormName || '未知来源'})
                </option>
              ))}
            </select>
            {getArrayVariables().length === 0 && (
              <p className="text-xs text-yellow-500 mt-1">
                💡 暂无数组类型的变量，请先在读取节点中创建数组变量
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                当前项变量名
                <span className="text-gray-500 ml-1">(可自定义)</span>
              </label>
              <input
                type="text"
                value={localConfig.forEachConfig.itemVar}
                onChange={(e) => updateConfig('forEachConfig.itemVar', e.target.value || 'item')}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="item"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                索引变量名
                <span className="text-gray-500 ml-1">(可选)</span>
              </label>
              <input
                type="text"
                value={localConfig.forEachConfig.indexVar}
                onChange={(e) => updateConfig('forEachConfig.indexVar', e.target.value)}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-purple-500 focus:outline-none"
                placeholder="index"
              />
            </div>
          </div>
          
          {localConfig.forEachConfig.sourceVar && (
            <div className="text-xs text-green-400 bg-green-900/30 rounded p-2">
              ✓ 遍历 <strong>{localConfig.forEachConfig.sourceVarName || localConfig.forEachConfig.sourceVar}</strong>，
              每次循环将当前项存入 <strong>${localConfig.forEachConfig.itemVar}</strong>
              {localConfig.forEachConfig.indexVar && (
                <>，索引存入 <strong>${localConfig.forEachConfig.indexVar}</strong></>
              )}
            </div>
          )}
        </div>
      )}

      {/* 条件循环配置 */}
      {localConfig.loopType === 'while' && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">条件循环配置</h4>
          
          {/* 条件设置 */}
          <div className="space-y-3">
            <label className="block text-xs text-gray-400">
              循环条件 <span className="text-red-400">*</span>
              <span className="text-gray-500 ml-2">(当条件为真时继续循环)</span>
            </label>
            
            {/* 左侧变量 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">左侧变量</label>
              <select
                value={localConfig.whileConfig.leftVariableId}
                onChange={(e) => {
                  updateConfig('whileConfig.leftVariableId', e.target.value);
                  updateConfig('whileConfig.leftVariablePath', '');
                }}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-purple-500 focus:outline-none"
              >
                <option value="">-- 选择变量 --</option>
                {(variables || []).map(v => (
                  <option key={v.id} value={v.id}>{v.name || v.id}</option>
                ))}
              </select>
            </div>
            
            {/* 运算符和右侧值 */}
            <div className="flex space-x-2">
              <div className="w-28">
                <label className="block text-xs text-gray-400 mb-1">运算符</label>
                <select
                  value={localConfig.whileConfig.operator}
                  onChange={(e) => updateConfig('whileConfig.operator', e.target.value)}
                  className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-purple-500 focus:outline-none"
                >
                  {operators.map(op => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">右侧值</label>
                <div className="flex space-x-2">
                  <select
                    value={localConfig.whileConfig.rightType}
                    onChange={(e) => updateConfig('whileConfig.rightType', e.target.value)}
                    className="w-24 bg-gray-600 text-gray-200 rounded px-2 py-2 text-sm border border-gray-500"
                  >
                    <option value="constant">常量</option>
                    <option value="variable">变量</option>
                  </select>
                  {localConfig.whileConfig.rightType === 'constant' ? (
                    <input
                      type="text"
                      value={localConfig.whileConfig.rightValue}
                      onChange={(e) => updateConfig('whileConfig.rightValue', e.target.value)}
                      className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-purple-500 focus:outline-none"
                      placeholder="输入值"
                    />
                  ) : (
                    <select
                      value={localConfig.whileConfig.rightVariableId}
                      onChange={(e) => updateConfig('whileConfig.rightVariableId', e.target.value)}
                      className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500"
                    >
                      <option value="">-- 选择变量 --</option>
                      {(variables || []).map(v => (
                        <option key={v.id} value={v.id}>{v.name || v.id}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* 安全设置 */}
          <div className="border-t border-gray-600 pt-3 mt-3">
            <label className="block text-xs text-gray-400 mb-2">🛡️ 安全设置（防止死循环）</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">最大循环次数</label>
                <input
                  type="number"
                  value={localConfig.whileConfig.maxCount}
                  onChange={(e) => updateConfig('whileConfig.maxCount', parseInt(e.target.value) || 100)}
                  className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-purple-500 focus:outline-none"
                  min="1"
                  max="10000"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">计数变量名</label>
                <input
                  type="text"
                  value={localConfig.whileConfig.countVar}
                  onChange={(e) => updateConfig('whileConfig.countVar', e.target.value || 'loopCount')}
                  className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-purple-500 focus:outline-none"
                  placeholder="loopCount"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 关联的循环结束节点 */}
      <div className="bg-gray-700 rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium text-gray-300">关联设置</h4>
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            对应的循环结束节点
            <span className="text-gray-500 ml-2">(可选，用于循环配对)</span>
          </label>
          <select
            value={localConfig.loopEndNodeId}
            onChange={(e) => updateConfig('loopEndNodeId', e.target.value)}
            className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-purple-500 focus:outline-none"
          >
            <option value="">-- 自动匹配 --</option>
            {getLoopEndNodes().map(n => (
              <option key={n.id} value={n.id}>{n.id} ({n.name || '循环结束'})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3">
        <div className="text-xs text-purple-300">
          <strong>💡 使用说明</strong>
          <ul className="mt-1 space-y-1 text-purple-400">
            <li>• 循环开始和循环结束节点之间的节点是<strong>循环体</strong></li>
            <li>• 循环体中可以使用 <strong>跳过</strong> 节点跳过当前迭代</li>
            <li>• 循环体中可以使用 <strong>跳出</strong> 节点结束整个循环</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

window.LoopStartConfigForm = LoopStartConfigForm;

// 属性校验节点配置表单（用于多条件分叉）
// 已集成变量管理：校验对象可从变量管理选择
function PropCheckConfigForm({ 
  node, 
  nodes, 
  onUpdate,
  // 变量管理相关参数
  projectId,
  flowId,
  forms
}) {
  const config = node.config || {};
  const enumRules = config.enumRules || [];
  const rangeRules = config.rangeRules || [];

  // 变量相关状态
  const [variables, setVariables] = React.useState([]);
  const [loadingVars, setLoadingVars] = React.useState(false);
  const [selectedVariable, setSelectedVariable] = React.useState(null);

  // 加载变量列表
  React.useEffect(() => {
    if (projectId) {
      loadVariables();
    }
  }, [projectId]);

  // 加载选中的变量详情
  React.useEffect(() => {
    if (config.variableId && projectId) {
      loadSelectedVariable(config.variableId);
    }
  }, [config.variableId, projectId]);

  const loadVariables = async () => {
    setLoadingVars(true);
    try {
      const vars = await window.dndDB.getVariables(projectId);
      setVariables(vars || []);
    } catch (error) {
      console.error('加载变量列表失败:', error);
    } finally {
      setLoadingVars(false);
    }
  };

  const loadSelectedVariable = async (variableId) => {
    try {
      const variable = await window.dndDB.getVariableById(projectId, variableId);
      setSelectedVariable(variable);
    } catch (error) {
      console.error('加载变量详情失败:', error);
    }
  };
  
  // 找出多条件分叉节点，获取其管道数量
  const multiBranchNodes = nodes.filter(n => n.type === 'multiBranch');
  
  const updateConfig = (key, value) => {
    onUpdate({
      config: { ...config, [key]: value }
    });
  };

  // 批量更新配置
  const updateConfigMultiple = (updates) => {
    onUpdate({
      config: { ...config, ...updates }
    });
  };

  // 选择变量
  const handleSelectVariable = async (variableId) => {
    if (!variableId) {
      setSelectedVariable(null);
      updateConfigMultiple({ variableId: '', variablePath: '', checkTarget: '' });
      return;
    }

    try {
      const variable = await window.dndDB.getVariableById(projectId, variableId);
      setSelectedVariable(variable);
      
      // 记录变量使用
      if (node.id && flowId) {
        await window.dndDB.addVariableUsage(projectId, variableId, node.id, flowId);
      }

      updateConfigMultiple({ variableId: variableId, variablePath: '', checkTarget: variableId });
    } catch (error) {
      console.error('选择变量失败:', error);
    }
  };

  // 获取变量的字段列表
  const getVariableFields = () => {
    if (!selectedVariable || !selectedVariable.sourceFormId || !forms) return [];
    const form = forms.find(f => f.id === selectedVariable.sourceFormId);
    if (!form) return [];
    return form.structure?.fields || [];
  };

  // 获取数据类型文本
  const getDataTypeText = (type) => {
    switch (type) {
      case 'array': return '数组';
      case 'object': return '对象';
      case 'value': return '单值';
      default: return type || '未知';
    }
  };

  // 添加枚举规则
  const addEnumRule = () => {
    updateConfig('enumRules', [
      ...enumRules,
      { id: Date.now(), value: '', pipe: 1 }
    ]);
  };

  // 更新枚举规则
  const updateEnumRule = (index, updates) => {
    const newRules = [...enumRules];
    newRules[index] = { ...newRules[index], ...updates };
    updateConfig('enumRules', newRules);
  };

  // 删除枚举规则
  const removeEnumRule = (index) => {
    updateConfig('enumRules', enumRules.filter((_, i) => i !== index));
  };

  // 添加区间规则
  const addRangeRule = () => {
    updateConfig('rangeRules', [
      ...rangeRules,
      { id: Date.now(), operator: '>=', value: '', pipe: 1 }
    ]);
  };

  // 更新区间规则
  const updateRangeRule = (index, updates) => {
    const newRules = [...rangeRules];
    newRules[index] = { ...newRules[index], ...updates };
    updateConfig('rangeRules', newRules);
  };

  // 删除区间规则
  const removeRangeRule = (index) => {
    updateConfig('rangeRules', rangeRules.filter((_, i) => i !== index));
  };

  // 管道颜色
  const getPipeColor = (pipe) => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
    return colors[(pipe - 1) % colors.length];
  };

  const variableFields = getVariableFields();

  return (
    <div className="space-y-4">
      {/* 说明 */}
      <div className="bg-orange-900/30 border border-orange-700 rounded p-3">
        <p className="text-sm text-orange-300">
          ✓ 属性校验用于配合"多条件分叉"节点，根据属性值决定走哪个管道。
        </p>
      </div>

      {/* 校验对象 - 集成变量管理 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          校验对象 <span className="text-red-400">*</span>
        </label>
        
        {loadingVars ? (
          <div className="text-sm text-gray-400">加载中...</div>
        ) : variables.length === 0 ? (
          <input
            type="text"
            value={config.checkTarget || ''}
            onChange={(e) => updateConfig('checkTarget', e.target.value)}
            placeholder="如：user.会员等级、order.省份、score.分数"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          />
        ) : (
          <div className="space-y-2">
            <select
              value={config.variableId || ''}
              onChange={(e) => handleSelectVariable(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value="">-- 选择变量 --</option>
              {variables.map(v => (
                <option key={v.id} value={v.id}>
                  {v.id} {v.name ? `(${v.name})` : ''} [{getDataTypeText(v.dataType)}]
                </option>
              ))}
            </select>

            {/* 选择字段 */}
            {selectedVariable && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">校验字段:</span>
                {variableFields.length > 0 ? (
                  <select
                    value={config.variablePath || ''}
                    onChange={(e) => {
                      const path = e.target.value;
                      updateConfigMultiple({ 
                        variablePath: path,
                        checkTarget: path ? `${config.variableId}.${path}` : config.variableId
                      });
                    }}
                    className="flex-1 px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                  >
                    <option value="">（整个变量）</option>
                    {variableFields.map(f => (
                      <option key={f.id} value={f.id}>{f.name || f.id}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={config.variablePath || ''}
                    onChange={(e) => {
                      const path = e.target.value;
                      updateConfigMultiple({ 
                        variablePath: path,
                        checkTarget: path ? `${config.variableId}.${path}` : config.variableId
                      });
                    }}
                    placeholder="输入字段路径，如 会员等级"
                    className="flex-1 px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                  />
                )}
              </div>
            )}

            {/* 当前校验目标预览 */}
            {config.checkTarget && (
              <div className="text-xs text-green-400 bg-green-900/30 rounded p-2">
                ✓ 校验目标: {config.checkTarget}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 校验模式 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">校验模式</label>
        <div className="flex space-x-4">
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="radio"
              checked={config.checkMode !== 'range'}
              onChange={() => updateConfig('checkMode', 'enum')}
              className="mr-2"
            />
            枚举匹配（值等于什么，走几号管道）
          </label>
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="radio"
              checked={config.checkMode === 'range'}
              onChange={() => updateConfig('checkMode', 'range')}
              className="mr-2"
            />
            区间判断（值在什么范围，走几号管道）
          </label>
        </div>
      </div>

      {/* 枚举匹配规则 */}
      {config.checkMode !== 'range' && (
        <div className="border border-blue-600 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-blue-400">枚举匹配规则</h4>
          
          {enumRules.length > 0 && (
            <div className="space-y-2">
              {enumRules.map((rule, index) => (
                <div key={rule.id} className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">值 =</span>
                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => updateEnumRule(index, { value: e.target.value })}
                    placeholder="如：金卡"
                    className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <span className="text-gray-400 text-sm">→</span>
                  <div className="flex items-center space-x-1">
                    <span 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getPipeColor(rule.pipe) }}
                    />
                    <select
                      value={rule.pipe}
                      onChange={(e) => updateEnumRule(index, { pipe: parseInt(e.target.value) })}
                      className="w-24 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <option key={n} value={n}>{n}号管道</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removeEnumRule(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button
            onClick={addEnumRule}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            + 添加匹配规则
          </button>
        </div>
      )}

      {/* 区间判断规则 */}
      {config.checkMode === 'range' && (
        <div className="border border-yellow-600 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-yellow-400">区间判断规则（按顺序判断，命中即停）</h4>
          
          {rangeRules.length > 0 && (
            <div className="space-y-2">
              {rangeRules.map((rule, index) => (
                <div key={rule.id} className="flex items-center space-x-2">
                  <select
                    value={rule.operator}
                    onChange={(e) => updateRangeRule(index, { operator: e.target.value })}
                    className="w-20 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  >
                    <option value=">=">≥</option>
                    <option value=">">＞</option>
                    <option value="<=">≤</option>
                    <option value="<">＜</option>
                    <option value="==">＝</option>
                  </select>
                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => updateRangeRule(index, { value: e.target.value })}
                    placeholder="临界值"
                    className="w-24 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <span className="text-gray-400 text-sm">→</span>
                  <div className="flex items-center space-x-1">
                    <span 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getPipeColor(rule.pipe) }}
                    />
                    <select
                      value={rule.pipe}
                      onChange={(e) => updateRangeRule(index, { pipe: parseInt(e.target.value) })}
                      className="w-24 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                    >
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <option key={n} value={n}>{n}号管道</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removeRangeRule(index)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button
            onClick={addRangeRule}
            className="text-sm text-yellow-400 hover:text-yellow-300"
          >
            + 添加区间规则
          </button>
          
          <p className="text-xs text-gray-500">
            💡 规则按从上到下的顺序判断，一旦命中就停止
          </p>
        </div>
      )}

      {/* 默认管道 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          默认管道（都不匹配时）
        </label>
        <div className="flex items-center space-x-2">
          <span 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: getPipeColor(config.defaultPipe || 1) }}
          />
          <select
            value={config.defaultPipe || 1}
            onChange={(e) => updateConfig('defaultPipe', parseInt(e.target.value))}
            className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
          >
            {[1,2,3,4,5,6,7,8].map(n => (
              <option key={n} value={n}>{n}号管道</option>
            ))}
          </select>
        </div>
      </div>

      {/* 流程配合示例 */}
      <div className="border-t border-gray-600 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">流程配合示例</h4>
        <div className="bg-gray-900 rounded p-3 text-xs font-mono">
          <div className="text-blue-400">□↓ 读取用户 → user</div>
          <div className="text-gray-500 pl-4">↓</div>
          <div className="text-orange-400">✓ 对象属性校验（{config.checkTarget || 'user.会员等级'}）</div>
          <div className="text-gray-500 pl-4">↓ 确定走几号管道</div>
          <div className="text-yellow-400">◆ 多条件分叉</div>
          <div className="text-gray-400 pl-4">├─ 1号管道 → 金卡优惠计算</div>
          <div className="text-gray-400 pl-4">├─ 2号管道 → 银卡优惠计算</div>
          <div className="text-gray-400 pl-4">└─ 3号管道 → 普通计算</div>
        </div>
      </div>
    </div>
  );
}

window.PropCheckConfigForm = PropCheckConfigForm;

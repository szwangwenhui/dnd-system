// 表达式计算节点配置表单 - 重构版
// 1. 输出变量：参照读取节点模式，但需用户指定变量类型
// 2. 表达式配置：复用衍生字段的ExpressionBuilder逻辑

function CalculateConfigForm({ node, onUpdate, projectId, flowId, flowName, forms, fields }) {
  const config = node.config || {};
  const nodeId = node.id;
  
  // ========== 输出变量相关状态 ==========
  const [currentVariable, setCurrentVariable] = React.useState(null);
  const [variableName, setVariableName] = React.useState(config?.outputVarName || '');
  const [variableType, setVariableType] = React.useState(config?.outputVarType || 'value');
  const [isCreatingVar, setIsCreatingVar] = React.useState(false);
  const [flowVariables, setFlowVariables] = React.useState([]);

  // ========== 表达式相关状态 ==========
  const [expressionType, setExpressionType] = React.useState(config?.expressionType || '');
  
  // 加法配置
  const [additionConfig, setAdditionConfig] = React.useState(
    config?.expressionConfig?.addition || { constant: 0, terms: [{ coefficient: 1, varId: '' }] }
  );
  
  // 减法配置
  const [subtractionConfig, setSubtractionConfig] = React.useState(
    config?.expressionConfig?.subtraction || { minuend: '', subtrahend: '' }
  );
  
  // 乘法配置
  const [multiplicationConfig, setMultiplicationConfig] = React.useState(
    config?.expressionConfig?.multiplication || { factors: ['', ''] }
  );
  
  // 除法配置
  const [divisionConfig, setDivisionConfig] = React.useState(
    config?.expressionConfig?.division || { dividend: '', divisor: '' }
  );
  
  // 拼接配置
  const [concatConfig, setConcatConfig] = React.useState(
    config?.expressionConfig?.concat || { items: [{ type: 'constant', value: '' }] }
  );
  
  // 赋值配置
  const [assignConfig, setAssignConfig] = React.useState(
    config?.expressionConfig?.assign || { varId: '', path: '' }
  );

  // ========== 加载数据 ==========
  
  // 加载已有变量信息
  React.useEffect(() => {
    if (config?.outputVarId && projectId) {
      loadVariable();
    }
    loadFlowVariables();
  }, [config?.outputVarId, projectId, flowId]);

  const loadVariable = async () => {
    try {
      const variable = await window.dndDB.getVariableById(projectId, config.outputVarId);
      setCurrentVariable(variable);
      if (variable) {
        setVariableName(variable.name || '');
        setVariableType(variable.dataType || 'value');
      }
    } catch (error) {
      console.error('加载变量失败:', error);
    }
  };

  const loadFlowVariables = async () => {
    try {
      const allVars = await window.dndDB.getVariables(projectId);
      const vars = (allVars || []).filter(v => v.flowId === flowId);
      setFlowVariables(vars);
    } catch (error) {
      console.error('加载流程变量失败:', error);
    }
  };

  // ========== 配置更新 ==========
  
  const updateConfig = (updates) => {
    onUpdate({
      config: { ...config, ...updates }
    });
  };

  // 同步表达式配置到父组件
  React.useEffect(() => {
    const expressionConfig = {
      addition: additionConfig,
      subtraction: subtractionConfig,
      multiplication: multiplicationConfig,
      division: divisionConfig,
      concat: concatConfig,
      assign: assignConfig
    };
    
    updateConfig({
      expressionType,
      expressionConfig,
      expressionText: generateExpression()
    });
  }, [expressionType, additionConfig, subtractionConfig, multiplicationConfig, divisionConfig, concatConfig, assignConfig]);

  // ========== 输出变量操作 ==========
  
  // 创建新变量
  const handleCreateVariable = async () => {
    if (!projectId || !flowId || !nodeId) {
      alert('缺少必要参数，无法创建变量');
      return;
    }

    setIsCreatingVar(true);
    try {
      const newVariable = await window.dndDB.addVariable(projectId, {
        name: variableName,
        sourceNodeId: nodeId,
        sourceNodeType: 'calculate',
        sourceFormId: null,
        sourceFormName: null,
        dataType: variableType,
        flowId: flowId,
        flowName: flowName
      });

      setCurrentVariable(newVariable);
      updateConfig({
        outputVarId: newVariable.id,
        outputVarName: variableName,
        outputVarType: variableType
      });
      await loadFlowVariables();
      console.log('计算变量创建成功:', newVariable);
    } catch (error) {
      console.error('创建变量失败:', error);
      alert('创建变量失败: ' + error.message);
    } finally {
      setIsCreatingVar(false);
    }
  };

  // 更新变量描述名称
  const handleUpdateVariableName = async () => {
    if (!currentVariable || !projectId) return;
    
    try {
      await window.dndDB.updateVariable(projectId, currentVariable.id, {
        name: variableName,
        dataType: variableType
      });
      updateConfig({
        outputVarName: variableName,
        outputVarType: variableType
      });
      await loadVariable();
    } catch (error) {
      console.error('更新变量名称失败:', error);
    }
  };

  // ========== 表达式相关方法 ==========
  
  // 获取所有可用变量（流程变量 + 循环变量）
  const getAllVariables = () => {
    const vars = [...flowVariables];
    
    // 添加循环变量
    vars.push(
      { id: '$item', name: '当前项（循环）', dataType: 'object', isLoopVar: true },
      { id: '$index', name: '循环索引', dataType: 'number', isLoopVar: true }
    );
    
    return vars;
  };

  // 获取变量名称
  const getVarName = (varId) => {
    if (!varId) return '';
    const v = getAllVariables().find(x => x.id === varId);
    return v ? (v.name || v.id) : varId;
  };

  // 获取变量的属性列表（用于对象类型）
  const getVarPaths = (varId) => {
    if (!varId) return [];
    
    const variable = getAllVariables().find(v => v.id === varId);
    if (!variable) return [];
    
    // 如果是$item，从数组变量的源表单获取字段
    if (varId === '$item') {
      const arrayVar = flowVariables.find(v => v.dataType === 'array');
      if (arrayVar && arrayVar.sourceFormId) {
        const formFields = fields?.filter(f => f.formId === arrayVar.sourceFormId) || [];
        return formFields.map(f => ({ id: f.id, name: f.name }));
      }
    }
    
    // 如果是对象变量，从源表单获取字段
    if (variable.dataType === 'object' && variable.sourceFormId) {
      const formFields = fields?.filter(f => f.formId === variable.sourceFormId) || [];
      return formFields.map(f => ({ id: f.id, name: f.name }));
    }
    
    return [];
  };

  // 生成表达式文本
  const generateExpression = () => {
    switch (expressionType) {
      case 'addition':
        return generateAdditionExpression();
      case 'subtraction':
        return generateSubtractionExpression();
      case 'multiplication':
        return generateMultiplicationExpression();
      case 'division':
        return generateDivisionExpression();
      case 'concat':
        return generateConcatExpression();
      case 'assign':
        return generateAssignExpression();
      default:
        return '';
    }
  };

  // 生成加法表达式
  const generateAdditionExpression = () => {
    let parts = [];
    if (additionConfig.constant !== 0) {
      parts.push(String(additionConfig.constant));
    }
    additionConfig.terms.forEach(term => {
      if (term.varId) {
        const varName = getVarName(term.varId);
        if (term.coefficient === 1) {
          parts.push(`[${varName}]`);
        } else if (term.coefficient === -1) {
          parts.push(`-[${varName}]`);
        } else {
          parts.push(`${term.coefficient} × [${varName}]`);
        }
      }
    });
    return parts.join(' + ').replace(/\+ -/g, '- ') || '0';
  };

  // 生成减法表达式
  const generateSubtractionExpression = () => {
    if (!subtractionConfig.minuend || !subtractionConfig.subtrahend) return '';
    return `[${getVarName(subtractionConfig.minuend)}] - [${getVarName(subtractionConfig.subtrahend)}]`;
  };

  // 生成乘法表达式
  const generateMultiplicationExpression = () => {
    const validFactors = multiplicationConfig.factors.filter(f => f);
    if (validFactors.length < 2) return '';
    return validFactors.map(f => `[${getVarName(f)}]`).join(' × ');
  };

  // 生成除法表达式
  const generateDivisionExpression = () => {
    if (!divisionConfig.dividend || !divisionConfig.divisor) return '';
    return `[${getVarName(divisionConfig.dividend)}] ÷ [${getVarName(divisionConfig.divisor)}]`;
  };

  // 生成拼接表达式
  const generateConcatExpression = () => {
    const parts = concatConfig.items.map(item => {
      if (item.type === 'constant') {
        return `"${item.value}"`;
      } else {
        let text = `[${getVarName(item.varId)}]`;
        if (item.path) {
          const pathName = getVarPaths(item.varId).find(p => p.id === item.path)?.name || item.path;
          text = `[${getVarName(item.varId)}.${pathName}]`;
        }
        return text;
      }
    });
    return `CONCAT(${parts.join(', ')})`;
  };

  // 生成赋值表达式
  const generateAssignExpression = () => {
    if (!assignConfig.varId) return '';
    let text = `[${getVarName(assignConfig.varId)}]`;
    if (assignConfig.path) {
      const pathName = getVarPaths(assignConfig.varId).find(p => p.id === assignConfig.path)?.name || assignConfig.path;
      text = `[${getVarName(assignConfig.varId)}.${pathName}]`;
    }
    return text;
  };

  // ========== 变量选择下拉组件 ==========
  const renderVarSelect = (value, onChange, placeholder = '选择变量') => {
    const allVars = getAllVariables();
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
      >
        <option value="">{placeholder}</option>
        <optgroup label="🔄 循环变量">
          {allVars.filter(v => v.isLoopVar).map(v => (
            <option key={v.id} value={v.id}>{v.id} ({v.name})</option>
          ))}
        </optgroup>
        {allVars.filter(v => !v.isLoopVar).length > 0 && (
          <optgroup label="📊 流程变量">
            {allVars.filter(v => !v.isLoopVar).map(v => (
              <option key={v.id} value={v.id}>{v.id} ({v.name || '未命名'})</option>
            ))}
          </optgroup>
        )}
      </select>
    );
  };

  // ========== 数据类型文本 ==========
  const getDataTypeText = (type) => {
    switch (type) {
      case 'array': return '数组';
      case 'object': return '对象';
      case 'number': return '数字';
      case 'string': return '文本';
      case 'boolean': return '布尔';
      case 'value': return '单值';
      default: return '未知';
    }
  };

  // ========== 渲染 ==========
  return (
    <div className="space-y-4">
      {/* ========== 输出变量 ========== */}
      <div className="bg-gray-700 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-300">输出变量</label>
        </div>
        
        {currentVariable ? (
          // 已有变量
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-gray-600 rounded px-3 py-2">
              <div>
                <span className="text-xs text-gray-400">变量ID: </span>
                <span className="font-mono text-blue-400">{currentVariable.id}</span>
              </div>
              <span className="text-xs px-2 py-0.5 bg-blue-600 rounded text-white">
                {getDataTypeText(currentVariable.dataType)}
              </span>
            </div>
            
            <div>
              <label className="block text-xs text-gray-400 mb-1">描述名称（可选，方便识别）</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={variableName}
                  onChange={(e) => setVariableName(e.target.value)}
                  placeholder="例如：发货单号、计算结果"
                  className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={handleUpdateVariableName}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        ) : (
          // 创建新变量
          <div className="space-y-3">
            {/* 变量类型选择 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">变量类型 <span className="text-red-400">*</span></label>
              <select
                value={variableType}
                onChange={(e) => setVariableType(e.target.value)}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
              >
                <option value="value">单值（通用）</option>
                <option value="number">数字</option>
                <option value="string">文本</option>
                <option value="boolean">布尔</option>
                <option value="object">对象</option>
                <option value="array">数组</option>
              </select>
            </div>
            
            {/* 变量描述 */}
            <div>
              <label className="block text-xs text-gray-400 mb-1">描述名称（可选，方便识别）</label>
              <input
                type="text"
                value={variableName}
                onChange={(e) => setVariableName(e.target.value)}
                placeholder="例如：发货单号、计算结果"
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            
            <button
              onClick={handleCreateVariable}
              disabled={isCreatingVar}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isCreatingVar ? (
                <span>创建中...</span>
              ) : (
                <>
                  <span>➕</span>
                  <span>创建输出变量</span>
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-500">
              系统将自动分配变量ID，用于后续节点引用
            </p>
          </div>
        )}
      </div>

      {/* ========== 表达式类型选择 ========== */}
      <div className="bg-gray-700 rounded-lg p-4 space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          选择函数类型 <span className="text-red-400">*</span>
        </label>
        
        <div className="grid grid-cols-3 gap-2">
          {[
            { type: 'assign', label: '赋值', desc: '取变量值' },
            { type: 'addition', label: '加法', desc: 'A + B + ...' },
            { type: 'subtraction', label: '减法', desc: 'A - B' },
            { type: 'multiplication', label: '乘法', desc: 'A × B × ...' },
            { type: 'division', label: '除法', desc: 'A ÷ B' },
            { type: 'concat', label: '文本拼接', desc: '连接多个值' }
          ].map(item => (
            <button
              key={item.type}
              onClick={() => setExpressionType(item.type)}
              className={`p-2 text-left rounded-lg transition-all border ${
                expressionType === item.type
                  ? 'border-indigo-500 bg-indigo-900/50'
                  : 'border-gray-600 hover:border-indigo-400 bg-gray-600/50'
              }`}
            >
              <div className="font-medium text-sm text-gray-200">{item.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ========== 表达式参数配置 ========== */}
      {expressionType && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-300">参数配置</label>
          
          {/* 赋值配置 */}
          {expressionType === 'assign' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">选择变量</label>
                {renderVarSelect(assignConfig.varId, (v) => setAssignConfig({ ...assignConfig, varId: v, path: '' }))}
              </div>
              
              {assignConfig.varId && getVarPaths(assignConfig.varId).length > 0 && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">属性路径（可选）</label>
                  <select
                    value={assignConfig.path}
                    onChange={(e) => setAssignConfig({ ...assignConfig, path: e.target.value })}
                    className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- 整个对象 --</option>
                    {getVarPaths(assignConfig.varId).map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* 加法配置 */}
          {expressionType === 'addition' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">常数项</label>
                <input
                  type="number"
                  value={additionConfig.constant}
                  onChange={(e) => setAdditionConfig({ ...additionConfig, constant: Number(e.target.value) || 0 })}
                  className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-xs text-gray-400 mb-1">变量项</label>
                {additionConfig.terms.map((term, idx) => (
                  <div key={idx} className="flex items-center gap-2 mb-2">
                    <input
                      type="number"
                      value={term.coefficient}
                      onChange={(e) => {
                        const newTerms = [...additionConfig.terms];
                        newTerms[idx].coefficient = Number(e.target.value) || 0;
                        setAdditionConfig({ ...additionConfig, terms: newTerms });
                      }}
                      className="w-20 bg-gray-600 text-gray-200 rounded px-2 py-2 text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
                      placeholder="系数"
                    />
                    <span className="text-gray-400">×</span>
                    {renderVarSelect(term.varId, (v) => {
                      const newTerms = [...additionConfig.terms];
                      newTerms[idx].varId = v;
                      setAdditionConfig({ ...additionConfig, terms: newTerms });
                    })}
                    {additionConfig.terms.length > 1 && (
                      <button
                        onClick={() => {
                          const newTerms = additionConfig.terms.filter((_, i) => i !== idx);
                          setAdditionConfig({ ...additionConfig, terms: newTerms });
                        }}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => setAdditionConfig({
                    ...additionConfig,
                    terms: [...additionConfig.terms, { coefficient: 1, varId: '' }]
                  })}
                  className="text-xs text-indigo-400 hover:text-indigo-300"
                >
                  + 添加变量项
                </button>
              </div>
            </div>
          )}

          {/* 减法配置 */}
          {expressionType === 'subtraction' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">被减数</label>
                {renderVarSelect(subtractionConfig.minuend, (v) => setSubtractionConfig({ ...subtractionConfig, minuend: v }))}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">减数</label>
                {renderVarSelect(subtractionConfig.subtrahend, (v) => setSubtractionConfig({ ...subtractionConfig, subtrahend: v }))}
              </div>
            </div>
          )}

          {/* 乘法配置 */}
          {expressionType === 'multiplication' && (
            <div className="space-y-3">
              <label className="block text-xs text-gray-400 mb-1">乘数</label>
              {multiplicationConfig.factors.map((factor, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  {renderVarSelect(factor, (v) => {
                    const newFactors = [...multiplicationConfig.factors];
                    newFactors[idx] = v;
                    setMultiplicationConfig({ factors: newFactors });
                  })}
                  {multiplicationConfig.factors.length > 2 && (
                    <button
                      onClick={() => {
                        const newFactors = multiplicationConfig.factors.filter((_, i) => i !== idx);
                        setMultiplicationConfig({ factors: newFactors });
                      }}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setMultiplicationConfig({
                  factors: [...multiplicationConfig.factors, '']
                })}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                + 添加乘数
              </button>
            </div>
          )}

          {/* 除法配置 */}
          {expressionType === 'division' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">被除数</label>
                {renderVarSelect(divisionConfig.dividend, (v) => setDivisionConfig({ ...divisionConfig, dividend: v }))}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">除数</label>
                {renderVarSelect(divisionConfig.divisor, (v) => setDivisionConfig({ ...divisionConfig, divisor: v }))}
              </div>
            </div>
          )}

          {/* 文本拼接配置 */}
          {expressionType === 'concat' && (
            <div className="space-y-3">
              <label className="block text-xs text-gray-400 mb-1">拼接项（按顺序拼接）</label>
              {concatConfig.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2 bg-gray-600/50 rounded p-2">
                  <select
                    value={item.type}
                    onChange={(e) => {
                      const newItems = [...concatConfig.items];
                      newItems[idx] = { type: e.target.value, value: '', varId: '', path: '' };
                      setConcatConfig({ items: newItems });
                    }}
                    className="w-24 bg-gray-600 text-gray-200 rounded px-2 py-1 text-xs border border-gray-500"
                  >
                    <option value="constant">常量</option>
                    <option value="variable">变量</option>
                  </select>
                  
                  {item.type === 'constant' ? (
                    <input
                      type="text"
                      value={item.value}
                      onChange={(e) => {
                        const newItems = [...concatConfig.items];
                        newItems[idx].value = e.target.value;
                        setConcatConfig({ items: newItems });
                      }}
                      placeholder="输入文本"
                      className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-1 text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
                    />
                  ) : (
                    <div className="flex-1 flex gap-2">
                      {renderVarSelect(item.varId, (v) => {
                        const newItems = [...concatConfig.items];
                        newItems[idx].varId = v;
                        newItems[idx].path = '';
                        setConcatConfig({ items: newItems });
                      })}
                      
                      {item.varId && getVarPaths(item.varId).length > 0 && (
                        <select
                          value={item.path || ''}
                          onChange={(e) => {
                            const newItems = [...concatConfig.items];
                            newItems[idx].path = e.target.value;
                            setConcatConfig({ items: newItems });
                          }}
                          className="w-32 bg-gray-600 text-gray-200 rounded px-2 py-1 text-xs border border-gray-500"
                        >
                          <option value="">整体</option>
                          {getVarPaths(item.varId).map(p => (
                            <option key={p.id} value={p.id}>.{p.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                  
                  {concatConfig.items.length > 1 && (
                    <button
                      onClick={() => {
                        const newItems = concatConfig.items.filter((_, i) => i !== idx);
                        setConcatConfig({ items: newItems });
                      }}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setConcatConfig({
                  items: [...concatConfig.items, { type: 'constant', value: '' }]
                })}
                className="text-xs text-indigo-400 hover:text-indigo-300"
              >
                + 添加拼接项
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========== 预览 ========== */}
      <div className="bg-gray-900 rounded-lg p-4">
        <div className="text-xs text-gray-500 mb-2">计算预览</div>
        <code className="text-sm text-indigo-400 font-mono break-all">
          {currentVariable ? `$${currentVariable.id}` : '$???'} 
          {currentVariable?.name && <span className="text-gray-500"> ({currentVariable.name})</span>}
          <span className="text-gray-400"> = </span>
          {generateExpression() || '???'}
        </code>
      </div>

      {/* ========== 配置状态提示 ========== */}
      {currentVariable && expressionType && generateExpression() && (
        <div className="text-xs text-green-400 bg-green-900/30 rounded p-2">
          ✓ 计算 [{generateExpression()}] 
          → 变量 <span className="font-mono">{currentVariable.id}</span>
          {currentVariable.name && <span className="text-gray-400">（{currentVariable.name}）</span>}
          <span className="text-gray-400 ml-1">[{getDataTypeText(currentVariable.dataType)}]</span>
        </div>
      )}
    </div>
  );
}

window.CalculateConfigForm = CalculateConfigForm;

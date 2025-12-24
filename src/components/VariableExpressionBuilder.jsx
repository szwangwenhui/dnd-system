// 变量表达式构建器 - 用于流程节点中的表达式构建
// 可被计算节点、写入节点、分支节点等复用

function VariableExpressionBuilder({
  variables = [],        // 流程变量列表
  loopVariables = [],    // 循环变量（$item, $index等）
  forms = [],            // 表单列表（用于获取字段结构）
  fields = [],           // 字段列表
  value = null,          // 当前表达式值 { left, operator, right }
  onChange,              // 值变化回调
  mode = 'full',         // 模式：full(完整表达式) / simple(简单赋值)
  showPreview = true     // 是否显示预览
}) {
  // 默认表达式结构
  const defaultExpression = {
    left: { type: 'variable', variableId: '', path: '', constantValue: '', constantType: 'string' },
    operator: '+',
    right: { type: 'constant', variableId: '', path: '', constantValue: '', constantType: 'string' }
  };

  const [expression, setExpression] = React.useState(value || defaultExpression);

  // 同步外部值变化
  React.useEffect(() => {
    if (value) {
      setExpression({
        ...defaultExpression,
        ...value,
        left: { ...defaultExpression.left, ...(value.left || {}) },
        right: { ...defaultExpression.right, ...(value.right || {}) }
      });
    }
  }, [value]);

  // 更新表达式并通知父组件
  const updateExpression = (newExpr) => {
    setExpression(newExpr);
    onChange && onChange(newExpr);
  };

  // 更新左值
  const updateLeft = (updates) => {
    const newExpr = {
      ...expression,
      left: { ...expression.left, ...updates }
    };
    updateExpression(newExpr);
  };

  // 更新右值
  const updateRight = (updates) => {
    const newExpr = {
      ...expression,
      right: { ...expression.right, ...updates }
    };
    updateExpression(newExpr);
  };

  // 更新运算符
  const updateOperator = (op) => {
    updateExpression({ ...expression, operator: op });
  };

  // 获取所有可用变量（流程变量 + 循环变量）
  const getAllVariables = () => {
    const allVars = [...variables];
    
    // 添加循环变量
    if (loopVariables.length > 0) {
      allVars.push(...loopVariables);
    } else {
      // 默认循环变量
      allVars.push(
        { id: '$item', name: '当前项', dataType: 'object', isLoopVar: true, description: '循环中的当前数据项' },
        { id: '$index', name: '循环索引', dataType: 'number', isLoopVar: true, description: '当前循环的索引（从0开始）' }
      );
    }
    
    return allVars;
  };

  // 获取变量的属性路径选项（用于对象类型变量）
  const getVariablePaths = (variableId) => {
    if (!variableId) return [];
    
    const variable = getAllVariables().find(v => v.id === variableId);
    if (!variable) return [];
    
    // 如果是循环变量$item，从源表单获取字段
    if (variableId === '$item') {
      // 尝试从循环上下文获取源表单
      const sourceVar = variables.find(v => v.dataType === 'array');
      if (sourceVar && sourceVar.sourceFormId) {
        const form = forms.find(f => f.id === sourceVar.sourceFormId);
        if (form && form.structure && form.structure.fields) {
          return form.structure.fields.map(f => {
            const fieldDef = fields.find(fd => fd.id === f.fieldId);
            return {
              id: f.fieldId,
              name: fieldDef?.name || f.fieldId
            };
          });
        }
      }
      // 如果找不到，返回通用提示
      return [{ id: '*', name: '(输入属性名)' }];
    }
    
    // 如果是普通对象变量，从源表单获取字段
    if (variable.dataType === 'object' && variable.sourceFormId) {
      const form = forms.find(f => f.id === variable.sourceFormId);
      if (form && form.structure && form.structure.fields) {
        return form.structure.fields.map(f => {
          const fieldDef = fields.find(fd => fd.id === f.fieldId);
          return {
            id: f.fieldId,
            name: fieldDef?.name || f.fieldId
          };
        });
      }
    }
    
    return [];
  };

  // 运算符列表
  const operators = [
    { value: '+', label: '+', desc: '加 / 拼接' },
    { value: '-', label: '-', desc: '减' },
    { value: '*', label: '×', desc: '乘' },
    { value: '/', label: '÷', desc: '除' },
    { value: '%', label: '%', desc: '取余' },
    { value: '==', label: '==', desc: '等于' },
    { value: '!=', label: '!=', desc: '不等于' },
    { value: '>', label: '>', desc: '大于' },
    { value: '>=', label: '>=', desc: '大于等于' },
    { value: '<', label: '<', desc: '小于' },
    { value: '<=', label: '<=', desc: '小于等于' },
    { value: '&&', label: '&&', desc: '并且' },
    { value: '||', label: '||', desc: '或者' }
  ];

  // 常量类型
  const constantTypes = [
    { value: 'string', label: '文本' },
    { value: 'number', label: '数字' },
    { value: 'boolean', label: '布尔' }
  ];

  // 生成表达式文本（用于预览）
  const generateExpressionText = () => {
    const leftText = generateOperandText(expression.left);
    const rightText = generateOperandText(expression.right);
    
    if (mode === 'simple') {
      return leftText;
    }
    
    return `${leftText} ${expression.operator} ${rightText}`;
  };

  // 生成操作数文本
  const generateOperandText = (operand) => {
    if (!operand) return '?';
    
    if (operand.type === 'variable') {
      if (!operand.variableId) return '?';
      const varName = operand.variableId.startsWith('$') 
        ? operand.variableId 
        : `$${operand.variableId}`;
      if (operand.path) {
        return `${varName}.${operand.path}`;
      }
      return varName;
    } else {
      // 常量
      if (operand.constantType === 'string') {
        return `"${operand.constantValue || ''}"`;
      }
      return operand.constantValue || '0';
    }
  };

  // 渲染操作数配置（左值或右值）
  const renderOperandConfig = (operand, updateFn, label) => {
    const allVars = getAllVariables();
    const paths = operand.type === 'variable' ? getVariablePaths(operand.variableId) : [];
    
    return (
      <div className="bg-gray-700/50 rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 font-medium">{label}</span>
          <div className="flex space-x-2">
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="radio"
                checked={operand.type === 'variable'}
                onChange={() => updateFn({ type: 'variable' })}
                className="text-indigo-500"
              />
              <span className="text-xs text-gray-300">变量</span>
            </label>
            <label className="flex items-center space-x-1 cursor-pointer">
              <input
                type="radio"
                checked={operand.type === 'constant'}
                onChange={() => updateFn({ type: 'constant' })}
                className="text-indigo-500"
              />
              <span className="text-xs text-gray-300">常量</span>
            </label>
          </div>
        </div>

        {operand.type === 'variable' ? (
          <div className="space-y-2">
            {/* 变量选择 */}
            <select
              value={operand.variableId}
              onChange={(e) => updateFn({ variableId: e.target.value, path: '' })}
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">-- 选择变量 --</option>
              
              {/* 循环变量分组 */}
              <optgroup label="🔄 循环变量">
                {allVars.filter(v => v.isLoopVar).map(v => (
                  <option key={v.id} value={v.id}>
                    {v.id} ({v.name})
                  </option>
                ))}
              </optgroup>
              
              {/* 流程变量分组 */}
              {allVars.filter(v => !v.isLoopVar).length > 0 && (
                <optgroup label="📊 流程变量">
                  {allVars.filter(v => !v.isLoopVar).map(v => (
                    <option key={v.id} value={v.id}>
                      {v.id} ({v.name || v.sourceFormName || '未命名'})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>

            {/* 属性路径选择（对象类型变量） */}
            {operand.variableId && paths.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-400 text-sm">.</span>
                {paths[0]?.id === '*' ? (
                  <input
                    type="text"
                    value={operand.path || ''}
                    onChange={(e) => updateFn({ path: e.target.value })}
                    placeholder="输入属性名"
                    className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
                  />
                ) : (
                  <select
                    value={operand.path || ''}
                    onChange={(e) => updateFn({ path: e.target.value })}
                    className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- 选择属性 --</option>
                    {paths.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* 变量信息提示 */}
            {operand.variableId && (
              <div className="text-xs text-gray-500">
                {(() => {
                  const v = allVars.find(x => x.id === operand.variableId);
                  if (!v) return null;
                  if (v.isLoopVar) return v.description;
                  return `类型: ${v.dataType || '未知'}${v.sourceFormName ? ` | 来源: ${v.sourceFormName}` : ''}`;
                })()}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {/* 常量类型选择 */}
            <div className="flex space-x-2">
              {constantTypes.map(ct => (
                <label key={ct.value} className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="radio"
                    checked={operand.constantType === ct.value}
                    onChange={() => updateFn({ constantType: ct.value, constantValue: ct.value === 'boolean' ? 'true' : '' })}
                    className="text-indigo-500"
                  />
                  <span className="text-xs text-gray-300">{ct.label}</span>
                </label>
              ))}
            </div>

            {/* 常量值输入 */}
            {operand.constantType === 'boolean' ? (
              <select
                value={operand.constantValue || 'true'}
                onChange={(e) => updateFn({ constantValue: e.target.value })}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
              >
                <option value="true">true (真)</option>
                <option value="false">false (假)</option>
              </select>
            ) : (
              <input
                type={operand.constantType === 'number' ? 'number' : 'text'}
                value={operand.constantValue || ''}
                onChange={(e) => updateFn({ constantValue: e.target.value })}
                placeholder={operand.constantType === 'number' ? '输入数字' : '输入文本'}
                className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
              />
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* 左值配置 */}
      {renderOperandConfig(expression.left, updateLeft, mode === 'simple' ? '取值' : '左值')}

      {/* 运算符（完整模式） */}
      {mode === 'full' && (
        <div className="flex items-center space-x-3">
          <span className="text-xs text-gray-400">运算符</span>
          <select
            value={expression.operator}
            onChange={(e) => updateOperator(e.target.value)}
            className="flex-1 bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-indigo-500 focus:outline-none"
          >
            {operators.map(op => (
              <option key={op.value} value={op.value}>
                {op.label} ({op.desc})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 右值配置（完整模式） */}
      {mode === 'full' && renderOperandConfig(expression.right, updateRight, '右值')}

      {/* 表达式预览 */}
      {showPreview && (
        <div className="bg-gray-900 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">表达式预览</div>
          <code className="text-sm text-indigo-400 font-mono">
            {generateExpressionText()}
          </code>
        </div>
      )}

      {/* 快捷模板 */}
      <div className="border-t border-gray-600 pt-3">
        <div className="text-xs text-gray-400 mb-2">快捷模板</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              updateExpression({
                left: { type: 'constant', constantValue: 'FH', constantType: 'string' },
                operator: '+',
                right: { type: 'variable', variableId: '$index', path: '' }
              });
            }}
            className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          >
            字符串+索引
          </button>
          <button
            onClick={() => {
              updateExpression({
                left: { type: 'variable', variableId: '$item', path: '' },
                operator: '*',
                right: { type: 'constant', constantValue: '0.9', constantType: 'number' }
              });
            }}
            className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          >
            当前项×折扣
          </button>
          <button
            onClick={() => {
              updateExpression({
                left: { type: 'variable', variableId: '$index', path: '' },
                operator: '+',
                right: { type: 'constant', constantValue: '1', constantType: 'number' }
              });
            }}
            className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
          >
            索引+1
          </button>
        </div>
      </div>
    </div>
  );
}

window.VariableExpressionBuilder = VariableExpressionBuilder;

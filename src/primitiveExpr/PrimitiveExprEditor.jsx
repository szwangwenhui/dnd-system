/**
 * DND原语表达式编辑器
 * 
 * 架构说明：
 * 1. TokenEditor - 基础Token编辑器，负责Token显示、选中、删除、键盘操作
 * 2. PrimitivePanel - 原语面板，根据配置显示不同的原语按钮
 * 3. ArithmeticEditor - 四则运算编辑器（括号 + 运算符 + 变量 + 常量）
 * 4. MathFormulaEditor - 数学公式编辑器（括号 + 运算符 + 函数 + 变量 + 常量）
 * 5. AggregationEditor - 聚合函数编辑器（函数下拉 + 列选择）
 * 
 * 新增函数类型时，只需创建新的编辑器组件，不影响其他编辑器
 */

// ============================================================
// 基础Token编辑器 - 只负责Token的显示和操作，不关心原语类型
// ============================================================
const TokenEditor = ({
  tokens = [],
  onTokensChange,
  validation = { valid: true, errors: [] },
  selectedToken,
  setSelectedToken,
  selectedPlaceholder,
  setSelectedPlaceholder,
  style = {}
}) => {
  
  // 删除Token
  const deleteToken = (index) => {
    const token = tokens[index];
    
    // 如果是函数开始，需要删除整个函数
    if (token.type === 'function') {
      let depth = 1;
      let endIndex = index + 1;
      while (endIndex < tokens.length && depth > 0) {
        if (tokens[endIndex].type === 'function') depth++;
        if (tokens[endIndex].type === 'function_end') depth--;
        endIndex++;
      }
      const newTokens = [...tokens];
      newTokens.splice(index, endIndex - index);
      onTokensChange(newTokens);
    } else if (token.type === 'function_end') {
      alert('请删除整个函数');
    } else {
      const newTokens = tokens.filter((_, i) => i !== index);
      onTokensChange(newTokens);
    }
    setSelectedToken(-1);
  };

  // 点击Token
  const handleTokenClick = (index) => {
    const token = tokens[index];
    if (token.type === 'placeholder') {
      setSelectedPlaceholder(index);
      setSelectedToken(-1);
    } else {
      setSelectedPlaceholder(-1);
      setSelectedToken(index);
    }
  };

  // 键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextPlaceholder = tokens.findIndex((t, i) => 
        i > selectedPlaceholder && t.type === 'placeholder'
      );
      if (nextPlaceholder >= 0) {
        setSelectedPlaceholder(nextPlaceholder);
        setSelectedToken(-1);
      } else {
        const firstPlaceholder = tokens.findIndex(t => t.type === 'placeholder');
        setSelectedPlaceholder(firstPlaceholder);
        setSelectedToken(-1);
      }
    }
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (selectedToken >= 0) {
        deleteToken(selectedToken);
      } else if (e.key === 'Backspace' && tokens.length > 0) {
        deleteToken(tokens.length - 1);
      }
    }
    
    if (e.key === 'ArrowLeft' && tokens.length > 0) {
      e.preventDefault();
      const newIndex = selectedToken > 0 ? selectedToken - 1 : tokens.length - 1;
      setSelectedToken(newIndex);
      setSelectedPlaceholder(-1);
    }
    if (e.key === 'ArrowRight' && tokens.length > 0) {
      e.preventDefault();
      const newIndex = selectedToken < tokens.length - 1 ? selectedToken + 1 : 0;
      setSelectedToken(newIndex);
      setSelectedPlaceholder(-1);
    }
  };

  const deleteLast = () => {
    if (tokens.length > 0) deleteToken(tokens.length - 1);
  };

  const clearAll = () => {
    if (tokens.length > 0 && confirm('确定要清空所有内容吗？')) {
      onTokensChange([]);
      setSelectedPlaceholder(-1);
      setSelectedToken(-1);
    }
  };

  // Token样式
  const getTokenStyle = (token, index) => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 8px',
      margin: '2px',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '14px',
      fontFamily: 'monospace'
    };

    const typeStyles = {
      variable: { backgroundColor: '#e6f7ff', border: '1px solid #91d5ff', color: '#1890ff' },
      constant: { backgroundColor: '#fff7e6', border: '1px solid #ffd591', color: '#fa8c16' },
      operator: { backgroundColor: '#f5f5f5', border: '1px solid #d9d9d9', color: '#595959', fontWeight: 'bold' },
      bracket: { backgroundColor: '#f5f5f5', border: '1px solid #d9d9d9', color: '#595959', fontWeight: 'bold' },
      function: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', color: '#52c41a' },
      function_end: { backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', color: '#52c41a' },
      placeholder: index === selectedPlaceholder 
        ? { backgroundColor: '#fff1f0', border: '2px dashed #ff4d4f', color: '#ff4d4f' }
        : { backgroundColor: '#fafafa', border: '2px dashed #d9d9d9', color: '#bfbfbf' },
      separator: { backgroundColor: 'transparent', border: 'none', color: '#595959' }
    };

    const isSelected = index === selectedToken;
    const selectedStyle = isSelected ? { boxShadow: '0 0 0 2px #1890ff', transform: 'scale(1.05)' } : {};

    return { ...baseStyle, ...(typeStyles[token.type] || {}), ...selectedStyle };
  };

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', backgroundColor: '#fff', ...style }} onKeyDown={handleKeyDown} tabIndex={0}>
      {/* Token显示区域 */}
      <div style={{
        minHeight: '60px',
        padding: '12px',
        borderBottom: '1px solid #e8e8e8',
        backgroundColor: '#fafafa',
        fontFamily: 'monospace',
        fontSize: '16px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px'
      }}>
        {tokens.length === 0 ? (
          <span style={{ color: '#bfbfbf' }}>点击下方按钮添加公式元素...</span>
        ) : (
          tokens.map((token, index) => (
            <span
              key={index}
              style={getTokenStyle(token, index)}
              onClick={() => handleTokenClick(index)}
              title={token.type === 'placeholder' ? '点击选中，然后插入变量或常量' : '点击选中，按Delete删除'}
            >
              {token.display}
            </span>
          ))
        )}
        <span style={{ display: 'inline-block', width: '2px', height: '20px', backgroundColor: '#1890ff', animation: 'blink 1s infinite' }} />
      </div>

      {/* 操作栏 */}
      <div style={{ padding: '8px 12px', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e8e8e8' }}>
        <span style={{ fontSize: '12px', color: validation.valid ? '#52c41a' : '#ff4d4f' }}>
          {validation.valid 
            ? (selectedPlaceholder >= 0 ? '已选中参数位置，请插入变量或常量' : selectedToken >= 0 ? '按 Delete/Backspace 删除，← → 移动选择' : `✓ 语法正确`)
            : `✗ ${validation.errors.join('; ')}`}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#999' }}>共{tokens.length}个元素</span>
          <button onClick={deleteLast} style={{ padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px' }}>⌫ 退格</button>
          <button onClick={clearAll} style={{ padding: '4px 8px', border: '1px solid #ff4d4f', borderRadius: '4px', backgroundColor: '#fff', color: '#ff4d4f', cursor: 'pointer', fontSize: '12px' }}>🗑️ 清空</button>
        </div>
      </div>

      <style>{`@keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }`}</style>
    </div>
  );
};

// ============================================================
// 原语面板 - 根据配置显示原语按钮
// ============================================================
const PrimitivePanel = ({
  groups = [],
  availableVariables = [],
  onInsertToken,
  selectedPlaceholder
}) => {
  const primitives = window.DND_PRIMITIVES;
  const [constantInput, setConstantInput] = React.useState('');

  const insertBracket = (bracketId) => {
    const token = window.TokenFactory.bracket(bracketId);
    if (token) onInsertToken(token);
  };

  const insertOperator = (operatorId) => {
    const token = window.TokenFactory.operator(operatorId);
    if (token) onInsertToken(token);
  };

  const insertFunction = (functionId) => {
    const tokens = window.TokenFactory.functionStart(functionId);
    if (tokens) onInsertToken(tokens);
  };

  const insertVariable = (varId) => {
    const variable = availableVariables.find(v => v.id === varId);
    if (!variable) return;
    const token = window.TokenFactory.variable(variable.id, variable.name, variable.type);
    onInsertToken(token);
  };

  const insertConstant = () => {
    const value = parseFloat(constantInput);
    if (isNaN(value)) { alert('请输入有效的数字'); return; }
    const token = window.TokenFactory.constant(value);
    onInsertToken(token);
    setConstantInput('');
  };

  const sectionStyle = { fontSize: '12px', color: '#999', marginBottom: '8px', marginTop: '12px' };
  const buttonGroupStyle = { display: 'flex', flexWrap: 'wrap', gap: '8px' };
  const btnStyle = { padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px' };
  const funcBtnStyle = { ...btnStyle, backgroundColor: '#f6ffed', borderColor: '#b7eb8f', color: '#52c41a' };

  return (
    <div style={{ padding: '12px' }}>
      {groups.includes('brackets') && (
        <>
          <div style={sectionStyle}>括号</div>
          <div style={buttonGroupStyle}>
            {primitives.brackets.map(bracket => (
              <button key={bracket.id} style={btnStyle} onClick={() => insertBracket(bracket.id)} title={bracket.description}>{bracket.display}</button>
            ))}
          </div>
        </>
      )}

      {groups.includes('operators') && (
        <>
          <div style={sectionStyle}>运算符</div>
          <div style={buttonGroupStyle}>
            {primitives.operators.map(op => (
              <button key={op.id} style={btnStyle} onClick={() => insertOperator(op.id)} title={op.description}>{op.display}</button>
            ))}
          </div>
        </>
      )}

      {groups.includes('functions') && (
        <>
          <div style={sectionStyle}>函数</div>
          <div style={buttonGroupStyle}>
            {primitives.functions.map(func => (
              <button key={func.id} style={funcBtnStyle} onClick={() => insertFunction(func.id)} title={`${func.description}\n${func.example}`}>{func.display}</button>
            ))}
          </div>
        </>
      )}

      {groups.includes('variables') && (
        <>
          <div style={sectionStyle}>变量与常量</div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>变量：</span>
              <select style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', minWidth: '150px' }} onChange={(e) => e.target.value && insertVariable(e.target.value)} value="">
                <option value="">选择变量...</option>
                {availableVariables.map(v => (<option key={v.id} value={v.id}>[{v.name}]</option>))}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13px', color: '#666' }}>常量：</span>
              <input type="number" value={constantInput} onChange={(e) => setConstantInput(e.target.value)} placeholder="输入数字" style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', width: '100px' }} onKeyDown={(e) => e.key === 'Enter' && insertConstant()} />
              <button onClick={insertConstant} style={{ padding: '6px 16px', backgroundColor: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>插入</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================
// 四则运算编辑器
// ============================================================
const ArithmeticEditor = ({ availableVariables = [], tokens = [], onTokensChange, style = {} }) => {
  const [selectedToken, setSelectedToken] = React.useState(-1);
  const [selectedPlaceholder, setSelectedPlaceholder] = React.useState(-1);
  const [validation, setValidation] = React.useState({ valid: true, errors: [] });
  const engine = window.primitiveEngine;

  React.useEffect(() => {
    if (engine && tokens.length > 0) {
      setValidation(engine.validate(tokens));
    } else {
      setValidation({ valid: true, errors: [] });
    }
  }, [tokens]);

  const handleInsertToken = (newToken) => {
    const newTokens = [...tokens];
    if (selectedPlaceholder >= 0 && tokens[selectedPlaceholder]?.type === 'placeholder') {
      if (Array.isArray(newToken)) {
        newTokens.splice(selectedPlaceholder, 1, ...newToken);
      } else {
        newTokens[selectedPlaceholder] = newToken;
      }
      onTokensChange(newTokens);
      setSelectedPlaceholder(-1);
      return;
    }
    onTokensChange(Array.isArray(newToken) ? [...tokens, ...newToken] : [...tokens, newToken]);
  };

  return (
    <div style={style}>
      <TokenEditor tokens={tokens} onTokensChange={onTokensChange} validation={validation} selectedToken={selectedToken} setSelectedToken={setSelectedToken} selectedPlaceholder={selectedPlaceholder} setSelectedPlaceholder={setSelectedPlaceholder} />
      <PrimitivePanel groups={['brackets', 'operators', 'variables']} availableVariables={availableVariables} onInsertToken={handleInsertToken} selectedPlaceholder={selectedPlaceholder} />
    </div>
  );
};

// ============================================================
// 数学公式编辑器
// ============================================================
const MathFormulaEditor = ({ availableVariables = [], tokens = [], onTokensChange, style = {} }) => {
  const [selectedToken, setSelectedToken] = React.useState(-1);
  const [selectedPlaceholder, setSelectedPlaceholder] = React.useState(-1);
  const [validation, setValidation] = React.useState({ valid: true, errors: [] });
  const engine = window.primitiveEngine;

  React.useEffect(() => {
    if (engine && tokens.length > 0) {
      setValidation(engine.validate(tokens));
    } else {
      setValidation({ valid: true, errors: [] });
    }
  }, [tokens]);

  const handleInsertToken = (newToken) => {
    const newTokens = [...tokens];
    if (selectedPlaceholder >= 0 && tokens[selectedPlaceholder]?.type === 'placeholder') {
      if (Array.isArray(newToken)) {
        newTokens.splice(selectedPlaceholder, 1, ...newToken);
      } else {
        newTokens[selectedPlaceholder] = newToken;
      }
      onTokensChange(newTokens);
      setSelectedPlaceholder(-1);
      return;
    }
    onTokensChange(Array.isArray(newToken) ? [...tokens, ...newToken] : [...tokens, newToken]);
  };

  return (
    <div style={style}>
      <TokenEditor tokens={tokens} onTokensChange={onTokensChange} validation={validation} selectedToken={selectedToken} setSelectedToken={setSelectedToken} selectedPlaceholder={selectedPlaceholder} setSelectedPlaceholder={setSelectedPlaceholder} />
      <PrimitivePanel groups={['brackets', 'operators', 'functions', 'variables']} availableVariables={availableVariables} onInsertToken={handleInsertToken} selectedPlaceholder={selectedPlaceholder} />
    </div>
  );
};

// ============================================================
// 聚合函数编辑器（独立UI）
// ============================================================
const AggregationEditor = ({ availableColumns = [], selectedFunction, onFunctionChange, selectedColumn, onColumnChange, style = {} }) => {
  const aggregations = window.DND_PRIMITIVES?.aggregations || [];

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px', backgroundColor: '#fff', ...style }}>
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px' }}>聚合函数</label>
          <select value={selectedFunction} onChange={(e) => onFunctionChange(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', minWidth: '150px', fontSize: '14px' }}>
            <option value="">请选择函数...</option>
            {aggregations.map(f => (<option key={f.id} value={f.id}>{f.symbol}() - {f.description}</option>))}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px' }}>选择列</label>
          <select value={selectedColumn} onChange={(e) => onColumnChange(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', minWidth: '150px', fontSize: '14px' }}>
            <option value="">请选择列...</option>
            {availableColumns.map(col => (<option key={col.id} value={col.id}>{col.name}</option>))}
          </select>
        </div>
      </div>
      {selectedFunction && selectedColumn && (
        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f6ffed', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>表达式：</span>
          <code style={{ marginLeft: '8px', fontSize: '16px', fontWeight: 'bold', color: '#52c41a' }}>
            {selectedFunction}([{availableColumns.find(c => c.id === selectedColumn)?.name || selectedColumn}])
          </code>
        </div>
      )}
    </div>
  );
};

// ============================================================
// 字符串函数编辑器（独立UI，参数动态配置）
// ============================================================
const StringFunctionEditor = ({
  availableVariables = [],  // 可用变量 [{ id, name, type }, ...]
  config = {},              // 当前配置 { functionId, params, outputVar }
  onConfigChange,           // 配置变更回调
  style = {}
}) => {
  const stringFunctions = window.DND_PRIMITIVES?.stringFunctions || [];
  const engine = window.primitiveEngine;

  // 获取当前选中的函数定义
  const selectedFunc = stringFunctions.find(f => f.id === config.functionId);

  // 更新配置
  const updateConfig = (updates) => {
    onConfigChange({ ...config, ...updates });
  };

  // 更新参数
  const updateParam = (paramName, value) => {
    const newParams = { ...config.params, [paramName]: value };
    updateConfig({ params: newParams });
  };

  // 添加多值参数项
  const addMultiItem = (paramName) => {
    const currentItems = config.params?.[paramName] || [];
    updateParam(paramName, [...currentItems, { type: 'constant', value: '' }]);
  };

  // 更新多值参数项
  const updateMultiItem = (paramName, index, value) => {
    const currentItems = [...(config.params?.[paramName] || [])];
    currentItems[index] = value;
    updateParam(paramName, currentItems);
  };

  // 删除多值参数项
  const removeMultiItem = (paramName, index) => {
    const currentItems = [...(config.params?.[paramName] || [])];
    currentItems.splice(index, 1);
    updateParam(paramName, currentItems);
  };

  // 执行预览
  const executePreview = () => {
    if (!selectedFunc || !engine) return null;
    
    // 构建变量上下文
    const varContext = {};
    availableVariables.forEach(v => {
      varContext[v.id] = v.value !== undefined ? v.value : `[${v.name}]`;
    });
    
    const funcName = selectedFunc.symbol;
    const result = engine.executeStringFunction(funcName, config.params || {}, varContext);
    return result;
  };

  // 生成预览表达式
  const getPreviewExpression = () => {
    if (!selectedFunc) return '';
    
    const funcName = selectedFunc.symbol;
    const params = config.params || {};
    const paramStrs = [];

    selectedFunc.params.forEach(paramDef => {
      const value = params[paramDef.name];
      if (paramDef.inputType === 'multiVarOrConst') {
        // 多值参数
        const items = value || [];
        const itemStrs = items.map(item => {
          if (item.type === 'variable') {
            const v = availableVariables.find(av => av.id === item.varId);
            return `[${v?.name || item.varId}]`;
          }
          return `"${item.value}"`;
        });
        paramStrs.push(itemStrs.join(', '));
      } else if (paramDef.inputType === 'varOrConst') {
        if (value?.type === 'variable') {
          const v = availableVariables.find(av => av.id === value.varId);
          paramStrs.push(`[${v?.name || value.varId}]`);
        } else if (value?.type === 'constant') {
          paramStrs.push(`"${value.value}"`);
        } else {
          paramStrs.push('?');
        }
      } else if (paramDef.inputType === 'const') {
        paramStrs.push(`"${value || ''}"`);
      } else if (paramDef.inputType === 'number' || paramDef.inputType === 'numberOrEnd') {
        if (value === null && paramDef.allowEnd) {
          paramStrs.push('末尾');
        } else {
          paramStrs.push(value ?? paramDef.default ?? '?');
        }
      } else if (paramDef.inputType === 'checkbox' || paramDef.inputType === 'radio') {
        // 不显示布尔/选项参数
      }
    });

    return `${funcName}(${paramStrs.join(', ')})`;
  };

  // 渲染参数输入
  const renderParamInput = (paramDef) => {
    const value = config.params?.[paramDef.name];

    switch (paramDef.inputType) {
      case 'varOrConst':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={value?.type || 'constant'}
                onChange={(e) => updateParam(paramDef.name, { type: e.target.value, ...(e.target.value === 'variable' ? { varId: '' } : { value: '' }) })}
                style={{ padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              >
                <option value="variable">变量</option>
                <option value="constant">常量</option>
              </select>
              {value?.type === 'variable' ? (
                <select
                  value={value.varId || ''}
                  onChange={(e) => updateParam(paramDef.name, { type: 'variable', varId: e.target.value })}
                  style={{ flex: 1, padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="">选择变量...</option>
                  {availableVariables.map(v => (
                    <option key={v.id} value={v.id}>[{v.name}]</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={value?.value || ''}
                  onChange={(e) => updateParam(paramDef.name, { type: 'constant', value: e.target.value })}
                  placeholder={paramDef.placeholder || '输入值...'}
                  style={{ flex: 1, padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                />
              )}
            </div>
          </div>
        );

      case 'multiVarOrConst':
        const items = value || [];
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label}
            </label>
            <div style={{ border: '1px solid #e8e8e8', borderRadius: '4px', padding: '8px', backgroundColor: '#fafafa' }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#999', width: '24px' }}>#{idx + 1}</span>
                  <select
                    value={item.type || 'constant'}
                    onChange={(e) => updateMultiItem(paramDef.name, idx, { type: e.target.value, ...(e.target.value === 'variable' ? { varId: '' } : { value: '' }) })}
                    style={{ padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
                  >
                    <option value="variable">变量</option>
                    <option value="constant">常量</option>
                  </select>
                  {item.type === 'variable' ? (
                    <select
                      value={item.varId || ''}
                      onChange={(e) => updateMultiItem(paramDef.name, idx, { type: 'variable', varId: e.target.value })}
                      style={{ flex: 1, padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
                    >
                      <option value="">选择...</option>
                      {availableVariables.map(v => (<option key={v.id} value={v.id}>[{v.name}]</option>))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={item.value || ''}
                      onChange={(e) => updateMultiItem(paramDef.name, idx, { type: 'constant', value: e.target.value })}
                      style={{ flex: 1, padding: '4px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '12px' }}
                    />
                  )}
                  <button onClick={() => removeMultiItem(paramDef.name, idx)} style={{ padding: '4px 8px', border: 'none', background: 'none', color: '#ff4d4f', cursor: 'pointer' }}>×</button>
                </div>
              ))}
              <button
                onClick={() => addMultiItem(paramDef.name)}
                style={{ padding: '4px 12px', border: '1px dashed #d9d9d9', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer', fontSize: '12px' }}
              >
                + 添加
              </button>
            </div>
          </div>
        );

      case 'const':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label}
            </label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => updateParam(paramDef.name, e.target.value)}
              placeholder={paramDef.placeholder || ''}
              style={{ width: '100%', padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
            />
          </div>
        );

      case 'number':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label} {paramDef.optional && <span style={{ color: '#999' }}>(可选)</span>}
            </label>
            <input
              type="number"
              value={value ?? (paramDef.default ?? '')}
              onChange={(e) => updateParam(paramDef.name, e.target.value === '' ? null : Number(e.target.value))}
              style={{ width: '120px', padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
            />
          </div>
        );

      case 'numberOrEnd':
        const isEnd = value === null;
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                value={isEnd ? '' : (value ?? '')}
                onChange={(e) => updateParam(paramDef.name, e.target.value === '' ? null : Number(e.target.value))}
                disabled={isEnd}
                style={{ width: '100px', padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px', opacity: isEnd ? 0.5 : 1 }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isEnd}
                  onChange={(e) => updateParam(paramDef.name, e.target.checked ? null : 0)}
                />
                到末尾
              </label>
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={value ?? paramDef.default ?? false}
                onChange={(e) => updateParam(paramDef.name, e.target.checked)}
              />
              {paramDef.label}
            </label>
          </div>
        );

      case 'radio':
        const options = paramDef.options || [];
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label}
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {options.map((opt, idx) => (
                <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={paramDef.name}
                    checked={(value ?? paramDef.default) === (typeof paramDef.default === 'boolean' ? (idx === 0) : opt)}
                    onChange={() => updateParam(paramDef.name, typeof paramDef.default === 'boolean' ? (idx === 0) : opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const previewResult = executePreview();

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', backgroundColor: '#fff', ...style }}>
      {/* 函数选择 */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e8e8e8' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          选择函数
        </label>
        <select
          value={config.functionId || ''}
          onChange={(e) => updateConfig({ functionId: e.target.value, params: {} })}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }}
        >
          <option value="">请选择字符串函数...</option>
          {stringFunctions.map(f => (
            <option key={f.id} value={f.id}>{f.name} - {f.symbol}()</option>
          ))}
        </select>
        {selectedFunc && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            {selectedFunc.description} | 示例: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{selectedFunc.example}</code>
          </div>
        )}
      </div>

      {/* 参数配置 */}
      {selectedFunc && (
        <div style={{ padding: '16px', borderBottom: '1px solid #e8e8e8' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>参数配置</div>
          {selectedFunc.params.map(renderParamInput)}
        </div>
      )}

      {/* 输出变量 */}
      {selectedFunc && (
        <div style={{ padding: '16px', borderBottom: '1px solid #e8e8e8' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            输出变量
          </label>
          <input
            type="text"
            value={config.outputVar || ''}
            onChange={(e) => updateConfig({ outputVar: e.target.value })}
            placeholder="$result"
            style={{ width: '150px', padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px', fontFamily: 'monospace' }}
          />
          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>
            返回类型: {selectedFunc.returnType}
          </span>
        </div>
      )}

      {/* 预览 */}
      {selectedFunc && (
        <div style={{ padding: '16px', backgroundColor: '#f6ffed' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>预览</div>
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            <span style={{ color: '#1890ff' }}>{config.outputVar || '$result'}</span>
            <span style={{ color: '#666' }}> = </span>
            <span style={{ color: '#52c41a' }}>{getPreviewExpression()}</span>
          </div>
          {previewResult && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #b7eb8f' }}>
              {previewResult.success ? (
                <span>
                  <span style={{ color: '#666' }}>→ </span>
                  <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
                    {typeof previewResult.result === 'string' ? `"${previewResult.result}"` : 
                     Array.isArray(previewResult.result) ? JSON.stringify(previewResult.result) :
                     String(previewResult.result)}
                  </span>
                </span>
              ) : (
                <span style={{ color: '#ff4d4f' }}>错误: {previewResult.error}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// 时间函数编辑器
// ============================================================
const TimeFunctionEditor = ({
  availableVariables = [],
  config = {},
  onConfigChange,
  style = {}
}) => {
  const timeFunctions = window.DND_PRIMITIVES?.timeFunctions || [];
  const engine = window.primitiveEngine;

  const selectedFunc = timeFunctions.find(f => f.id === config.functionId);

  const updateConfig = (updates) => {
    onConfigChange({ ...config, ...updates });
  };

  const updateParam = (paramName, value) => {
    const newParams = { ...config.params, [paramName]: value };
    updateConfig({ params: newParams });
  };

  // 常用格式模板
  const formatPatterns = [
    { label: 'yyyy-MM-dd', value: 'yyyy-MM-dd' },
    { label: 'yyyy-MM-dd HH:mm:ss', value: 'yyyy-MM-dd HH:mm:ss' },
    { label: 'yyyy年MM月dd日', value: 'yyyy年MM月dd日' },
    { label: 'MM/dd/yyyy', value: 'MM/dd/yyyy' },
    { label: 'HH:mm:ss', value: 'HH:mm:ss' },
    { label: 'HH:mm', value: 'HH:mm' },
    { label: 'yyyy-MM-dd E', value: 'yyyy-MM-dd E' }
  ];

  // 执行预览
  const executePreview = () => {
    if (!selectedFunc || !engine) return null;
    
    const varContext = {};
    availableVariables.forEach(v => {
      varContext[v.id] = v.value;
    });
    
    const funcName = selectedFunc.symbol;
    return engine.executeTimeFunction(funcName, config.params || {}, varContext);
  };

  // 生成预览表达式
  const getPreviewExpression = () => {
    if (!selectedFunc) return '';
    
    const funcName = selectedFunc.symbol;
    const params = config.params || {};
    const paramStrs = [];

    selectedFunc.params.forEach(paramDef => {
      // 检查是否应该显示此参数
      if (paramDef.showWhen) {
        if (params[paramDef.showWhen.field] !== paramDef.showWhen.value) {
          return;
        }
      }

      const value = params[paramDef.name];
      
      if (paramDef.inputType === 'timeVarOrNow') {
        if (value?.type === 'variable') {
          const v = availableVariables.find(av => av.id === value.varId);
          paramStrs.push(`[${v?.name || value.varId}]`);
        } else {
          paramStrs.push('now()');
        }
      } else if (paramDef.inputType === 'timeVarOrConst') {
        if (value?.type === 'variable') {
          const v = availableVariables.find(av => av.id === value.varId);
          paramStrs.push(`[${v?.name || value.varId}]`);
        } else if (value?.type === 'now') {
          paramStrs.push('now()');
        } else if (value?.type === 'constant') {
          paramStrs.push(`"${value.value}"`);
        } else {
          paramStrs.push('?');
        }
      } else if (paramDef.inputType === 'varOrConst') {
        if (value?.type === 'variable') {
          const v = availableVariables.find(av => av.id === value.varId);
          paramStrs.push(`[${v?.name || value.varId}]`);
        } else if (value?.type === 'constant') {
          paramStrs.push(`"${value.value}"`);
        } else {
          paramStrs.push('?');
        }
      } else if (paramDef.inputType === 'formatPattern') {
        paramStrs.push(`"${value || paramDef.default || ''}"`);
      } else if (paramDef.inputType === 'number') {
        paramStrs.push(value ?? paramDef.default ?? '?');
      } else if (paramDef.inputType === 'select' || paramDef.inputType === 'radio') {
        paramStrs.push(`"${value || paramDef.default}"`);
      } else if (paramDef.inputType === 'checkbox') {
        // 不显示布尔参数
      }
    });

    return `${funcName}(${paramStrs.join(', ')})`;
  };

  // 渲染参数输入
  const renderParamInput = (paramDef) => {
    // 条件显示
    if (paramDef.showWhen) {
      if ((config.params || {})[paramDef.showWhen.field] !== paramDef.showWhen.value) {
        return null;
      }
    }

    const value = config.params?.[paramDef.name];

    switch (paramDef.inputType) {
      case 'timeVarOrNow':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={value?.type || 'now'}
                onChange={(e) => updateParam(paramDef.name, { type: e.target.value, ...(e.target.value === 'variable' ? { varId: '' } : {}) })}
                style={{ padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              >
                <option value="now">当前时间</option>
                <option value="variable">变量</option>
              </select>
              {value?.type === 'variable' && (
                <select
                  value={value.varId || ''}
                  onChange={(e) => updateParam(paramDef.name, { type: 'variable', varId: e.target.value })}
                  style={{ flex: 1, padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="">选择变量...</option>
                  {availableVariables.map(v => (
                    <option key={v.id} value={v.id}>[{v.name}]</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        );

      case 'timeVarOrConst':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={value?.type || 'now'}
                onChange={(e) => updateParam(paramDef.name, { type: e.target.value, ...(e.target.value === 'variable' ? { varId: '' } : e.target.value === 'constant' ? { value: '' } : {}) })}
                style={{ padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              >
                <option value="now">当前时间</option>
                <option value="variable">变量</option>
                <option value="constant">常量</option>
              </select>
              {value?.type === 'variable' && (
                <select
                  value={value.varId || ''}
                  onChange={(e) => updateParam(paramDef.name, { type: 'variable', varId: e.target.value })}
                  style={{ flex: 1, padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="">选择变量...</option>
                  {availableVariables.map(v => (
                    <option key={v.id} value={v.id}>[{v.name}]</option>
                  ))}
                </select>
              )}
              {value?.type === 'constant' && (
                <input
                  type="text"
                  value={value.value || ''}
                  onChange={(e) => updateParam(paramDef.name, { type: 'constant', value: e.target.value })}
                  placeholder="yyyy-MM-dd"
                  style={{ flex: 1, padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                />
              )}
            </div>
          </div>
        );

      case 'varOrConst':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <select
                value={value?.type || 'constant'}
                onChange={(e) => updateParam(paramDef.name, { type: e.target.value, ...(e.target.value === 'variable' ? { varId: '' } : { value: '' }) })}
                style={{ padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
              >
                <option value="variable">变量</option>
                <option value="constant">常量</option>
              </select>
              {value?.type === 'variable' ? (
                <select
                  value={value.varId || ''}
                  onChange={(e) => updateParam(paramDef.name, { type: 'variable', varId: e.target.value })}
                  style={{ flex: 1, padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                >
                  <option value="">选择变量...</option>
                  {availableVariables.map(v => (
                    <option key={v.id} value={v.id}>[{v.name}]</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={value?.value || ''}
                  onChange={(e) => updateParam(paramDef.name, { type: 'constant', value: e.target.value })}
                  placeholder={paramDef.placeholder || ''}
                  style={{ flex: 1, padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                />
              )}
            </div>
          </div>
        );

      case 'formatPattern':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label} {paramDef.optional && <span style={{ color: '#999' }}>(可选)</span>}
            </label>
            <input
              type="text"
              value={value || paramDef.default || ''}
              onChange={(e) => updateParam(paramDef.name, e.target.value)}
              placeholder={paramDef.placeholder || 'yyyy-MM-dd HH:mm:ss'}
              style={{ width: '100%', padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px', marginBottom: '4px' }}
            />
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {formatPatterns.map(p => (
                <button
                  key={p.value}
                  onClick={() => updateParam(paramDef.name, p.value)}
                  style={{ 
                    padding: '2px 6px', 
                    fontSize: '11px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '3px', 
                    backgroundColor: value === p.value ? '#e6f7ff' : '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label}
            </label>
            <input
              type="number"
              value={value ?? paramDef.default ?? ''}
              onChange={(e) => updateParam(paramDef.name, e.target.value === '' ? null : Number(e.target.value))}
              style={{ width: '120px', padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
            />
          </div>
        );

      case 'select':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label}
            </label>
            <select
              value={value || paramDef.default || ''}
              onChange={(e) => updateParam(paramDef.name, e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', minWidth: '120px' }}
            >
              {(paramDef.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        );

      case 'radio':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {paramDef.label}
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {(paramDef.options || []).map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name={paramDef.name}
                    checked={(value || paramDef.default) === opt}
                    onChange={() => updateParam(paramDef.name, opt)}
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        );

      case 'checkbox':
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={value ?? paramDef.default ?? false}
                onChange={(e) => updateParam(paramDef.name, e.target.checked)}
              />
              {paramDef.label}
            </label>
          </div>
        );

      case 'fieldFormat':
        const currentField = config.params?.field;
        if (currentField !== '周度日' && currentField !== '旬度') return null;
        return (
          <div key={paramDef.name} style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              {currentField === '周度日' ? '周度日格式' : '旬度格式'}
            </label>
            <div style={{ display: 'flex', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="radio" name="fieldFormat" checked={(value || '数字') === '数字'} onChange={() => updateParam(paramDef.name, '数字')} />
                数字{currentField === '周度日' ? '(1-7)' : '(1-3)'}
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', cursor: 'pointer' }}>
                <input type="radio" name="fieldFormat" checked={value === '中文'} onChange={() => updateParam(paramDef.name, '中文')} />
                中文{currentField === '周度日' ? '(周一-周日)' : '(上旬/中旬/下旬)'}
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const previewResult = executePreview();

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', backgroundColor: '#fff', ...style }}>
      {/* 函数选择 */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e8e8e8' }}>
        <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px' }}>
          选择函数
        </label>
        <select
          value={config.functionId || ''}
          onChange={(e) => updateConfig({ functionId: e.target.value, params: {} })}
          style={{ width: '100%', padding: '8px 12px', border: '1px solid #d9d9d9', borderRadius: '4px', fontSize: '14px' }}
        >
          <option value="">请选择时间函数...</option>
          {timeFunctions.map(f => (
            <option key={f.id} value={f.id}>{f.name} - {f.symbol}()</option>
          ))}
        </select>
        {selectedFunc && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            {selectedFunc.description} | 示例: <code style={{ backgroundColor: '#f5f5f5', padding: '2px 4px', borderRadius: '2px' }}>{selectedFunc.example}</code>
          </div>
        )}
      </div>

      {/* 参数配置 */}
      {selectedFunc && (
        <div style={{ padding: '16px', borderBottom: '1px solid #e8e8e8' }}>
          <div style={{ fontSize: '12px', color: '#999', marginBottom: '12px' }}>参数配置</div>
          {selectedFunc.params.map(renderParamInput)}
        </div>
      )}

      {/* 输出变量 */}
      {selectedFunc && (
        <div style={{ padding: '16px', borderBottom: '1px solid #e8e8e8' }}>
          <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>
            输出变量
          </label>
          <input
            type="text"
            value={config.outputVar || ''}
            onChange={(e) => updateConfig({ outputVar: e.target.value })}
            placeholder="$result"
            style={{ width: '150px', padding: '6px', border: '1px solid #d9d9d9', borderRadius: '4px', fontFamily: 'monospace' }}
          />
          <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>
            返回类型: {selectedFunc.returnType}
          </span>
        </div>
      )}

      {/* 预览 */}
      {selectedFunc && (
        <div style={{ padding: '16px', backgroundColor: '#fffbe6' }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>预览</div>
          <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>
            <span style={{ color: '#1890ff' }}>{config.outputVar || '$result'}</span>
            <span style={{ color: '#666' }}> = </span>
            <span style={{ color: '#fa8c16' }}>{getPreviewExpression()}</span>
          </div>
          {previewResult && (
            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#fff', borderRadius: '4px', border: '1px solid #ffe58f' }}>
              {previewResult.success ? (
                <span>
                  <span style={{ color: '#666' }}>→ </span>
                  <span style={{ fontWeight: 'bold', color: '#fa8c16' }}>
                    {previewResult.result?._isDate 
                      ? previewResult.result.display
                      : typeof previewResult.result === 'boolean' 
                        ? (previewResult.result ? 'true' : 'false')
                        : String(previewResult.result)}
                  </span>
                </span>
              ) : (
                <span style={{ color: '#ff4d4f' }}>错误: {previewResult.error}</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================
// 兼容旧接口
// ============================================================
const PrimitiveExprEditor = ({ availableVariables = [], tokens = [], onTokensChange, showMathFunctions = true, style = {} }) => {
  if (showMathFunctions) {
    return <MathFormulaEditor availableVariables={availableVariables} tokens={tokens} onTokensChange={onTokensChange} style={style} />;
  } else {
    return <ArithmeticEditor availableVariables={availableVariables} tokens={tokens} onTokensChange={onTokensChange} style={style} />;
  }
};

// ============================================================
// 导出
// ============================================================
window.TokenEditor = TokenEditor;
window.PrimitivePanel = PrimitivePanel;
window.ArithmeticEditor = ArithmeticEditor;
window.MathFormulaEditor = MathFormulaEditor;
window.AggregationEditor = AggregationEditor;
window.StringFunctionEditor = StringFunctionEditor;
window.TimeFunctionEditor = TimeFunctionEditor;
window.PrimitiveExprEditor = PrimitiveExprEditor;

console.log('原语编辑器已加载: TokenEditor, ArithmeticEditor, MathFormulaEditor, AggregationEditor, StringFunctionEditor, TimeFunctionEditor');

// DND2 表达式构建器 - 分段函数锚点构建子组件
// 原文件: src/components/ExpressionBuilder.jsx 第1003-1385行
// Phase 8 拆分

// 分段函数锚点构建子组件
function PiecewiseAnchorBuilder({ config, setConfig, getAttributeFieldValues, getSourceFieldName, onBack }) {
  const [currentAnchor, setCurrentAnchor] = React.useState({
    value: '',
    belong: 'left', // 'left' | 'independent' | 'right'
    leftValue: '',
    equalValue: ''
  });
  const [isSettingRightmost, setIsSettingRightmost] = React.useState(false);

  // 获取上一个锚点
  const getLastAnchor = () => {
    if (config.anchors.length === 0) return null;
    return config.anchors[config.anchors.length - 1];
  };

  // 获取区间描述
  const getIntervalDescription = () => {
    const lastAnchor = getLastAnchor();
    const anchorValue = currentAnchor.value;
    
    if (!lastAnchor) {
      // 第一个锚点
      if (currentAnchor.belong === 'left') {
        return `≤ ${anchorValue || '?'}`;
      } else if (currentAnchor.belong === 'independent') {
        return `< ${anchorValue || '?'}`;
      } else {
        return `< ${anchorValue || '?'}`;
      }
    } else {
      // 后续锚点
      const prevBelongRight = lastAnchor.belong === 'right';
      const leftOp = prevBelongRight ? '≥' : '>';
      
      if (currentAnchor.belong === 'left') {
        return `${lastAnchor.value} ${leftOp} X ≤ ${anchorValue || '?'}`;
      } else if (currentAnchor.belong === 'independent') {
        return `${lastAnchor.value} ${leftOp} X < ${anchorValue || '?'}`;
      } else {
        return `${lastAnchor.value} ${leftOp} X < ${anchorValue || '?'}`;
      }
    }
  };

  // 获取最右侧区间描述
  const getRightmostDescription = () => {
    const lastAnchor = getLastAnchor();
    if (!lastAnchor) return '';
    const rightOp = lastAnchor.belong === 'right' ? '≥' : '>';
    return `X ${rightOp} ${lastAnchor.value}`;
  };

  // 渲染取值输入
  const renderValueInput = (value, onChange, label) => {
    if (config.valueType === 'number') {
      return (
        <div>
          <label className="block text-xs text-gray-600 mb-1">{label}</label>
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
            placeholder="输入数值"
          />
        </div>
      );
    } else {
      const attrValues = getAttributeFieldValues(config.attributeFormId, config.attributeFieldId);
      return (
        <div>
          <label className="block text-xs text-gray-600 mb-1">{label}</label>
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-pink-500"
          >
            <option value="">请选择</option>
            {attrValues.map((v, i) => (
              <option key={i} value={v}>{v}</option>
            ))}
          </select>
        </div>
      );
    }
  };

  // 添加锚点
  const handleAddAnchor = () => {
    if (!currentAnchor.value) {
      alert('请输入锚点值');
      return;
    }

    const anchorNum = parseFloat(currentAnchor.value);
    const lastAnchor = getLastAnchor();
    
    if (lastAnchor && anchorNum <= parseFloat(lastAnchor.value)) {
      alert('新锚点必须大于上一个锚点');
      return;
    }

    if (!currentAnchor.leftValue && currentAnchor.leftValue !== 0) {
      alert('请设置左侧区间的取值');
      return;
    }

    if (currentAnchor.belong === 'independent' && !currentAnchor.equalValue && currentAnchor.equalValue !== 0) {
      alert('请设置等于锚点的取值');
      return;
    }

    const newAnchor = {
      value: anchorNum,
      belong: currentAnchor.belong,
      leftValue: currentAnchor.leftValue,
      equalValue: currentAnchor.belong === 'independent' ? currentAnchor.equalValue : null
    };

    setConfig({
      ...config,
      anchors: [...config.anchors, newAnchor]
    });

    // 重置当前锚点
    setCurrentAnchor({
      value: '',
      belong: 'left',
      leftValue: '',
      equalValue: ''
    });
  };

  // 移除最后一个锚点
  const handleRemoveLastAnchor = () => {
    if (config.anchors.length > 0) {
      setConfig({
        ...config,
        anchors: config.anchors.slice(0, -1),
        rightmostValue: ''
      });
      setIsSettingRightmost(false);
    }
  };

  // 完成锚点设置
  const handleFinishAnchors = () => {
    if (config.anchors.length === 0) {
      alert('请至少添加一个锚点');
      return;
    }
    setIsSettingRightmost(true);
  };

  return (
    <div className="space-y-4">
      {/* 已添加的锚点列表 */}
      <div>
        <label className="block text-xs text-gray-600 mb-2">
          已设置的锚点 ({config.anchors.length} 个)
        </label>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {config.anchors.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-sm text-center">
              尚未添加锚点
            </div>
          ) : (
            config.anchors.map((anchor, idx) => {
              const prevAnchor = idx > 0 ? config.anchors[idx - 1] : null;
              const prevBelongRight = prevAnchor?.belong === 'right';
              const leftOp = prevBelongRight ? '≥' : '>';
              
              return (
                <div key={idx} className="px-4 py-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-pink-600">锚点 {idx + 1}: {anchor.value}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100">
                      {anchor.belong === 'left' ? '左侧区间' : 
                       anchor.belong === 'independent' ? '独立' : '右侧区间'}
                    </span>
                  </div>
                  <div className="text-gray-600 text-xs mt-1">
                    {idx === 0 ? (
                      anchor.belong === 'left' ? 
                        `X ≤ ${anchor.value} → ${anchor.leftValue}` :
                      anchor.belong === 'independent' ?
                        `X < ${anchor.value} → ${anchor.leftValue}; X = ${anchor.value} → ${anchor.equalValue}` :
                        `X < ${anchor.value} → ${anchor.leftValue}`
                    ) : (
                      anchor.belong === 'left' ?
                        `${prevAnchor.value} ${leftOp} X ≤ ${anchor.value} → ${anchor.leftValue}` :
                      anchor.belong === 'independent' ?
                        `${prevAnchor.value} ${leftOp} X < ${anchor.value} → ${anchor.leftValue}; X = ${anchor.value} → ${anchor.equalValue}` :
                        `${prevAnchor.value} ${leftOp} X < ${anchor.value} → ${anchor.leftValue}`
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {config.anchors.length > 0 && !isSettingRightmost && (
          <button
            onClick={handleRemoveLastAnchor}
            className="mt-2 text-xs text-red-600 hover:text-red-800"
          >
            移除最后一个锚点
          </button>
        )}
      </div>

      {/* 添加新锚点 / 设置最右侧区间 */}
      {!isSettingRightmost ? (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h5 className="text-sm font-medium text-blue-700 mb-3">
            添加锚点 {config.anchors.length + 1}
          </h5>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">锚点值</label>
              <input
                type="number"
                value={currentAnchor.value}
                onChange={(e) => setCurrentAnchor({ ...currentAnchor, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder={getLastAnchor() ? `必须大于 ${getLastAnchor().value}` : '输入数值'}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">锚点归属</label>
              <div className="flex space-x-2">
                {['left', 'independent', 'right'].map(belong => (
                  <button
                    key={belong}
                    onClick={() => setCurrentAnchor({ ...currentAnchor, belong })}
                    className={`flex-1 px-3 py-2 text-sm rounded border ${
                      currentAnchor.belong === belong
                        ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {belong === 'left' ? '左侧区间' : belong === 'independent' ? '独立' : '右侧区间'}
                  </button>
                ))}
              </div>
            </div>

            {currentAnchor.value && (
              <div className="bg-white rounded p-2 text-xs text-gray-600">
                区间：<span className="font-mono text-blue-600">{getIntervalDescription()}</span>
              </div>
            )}

            {renderValueInput(
              currentAnchor.leftValue,
              (v) => setCurrentAnchor({ ...currentAnchor, leftValue: v }),
              currentAnchor.belong === 'left' 
                ? `小于等于 ${currentAnchor.value || '锚点'} 的取值` 
                : `小于 ${currentAnchor.value || '锚点'} 的取值`
            )}

            {currentAnchor.belong === 'independent' && (
              renderValueInput(
                currentAnchor.equalValue,
                (v) => setCurrentAnchor({ ...currentAnchor, equalValue: v }),
                `等于 ${currentAnchor.value || '锚点'} 的取值`
              )
            )}

            <div className="flex space-x-2">
              <button
                onClick={handleAddAnchor}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                确认添加锚点
              </button>
              {config.anchors.length > 0 && (
                <button
                  onClick={handleFinishAnchors}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  锚点设置完成
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <h5 className="text-sm font-medium text-green-700 mb-3">
            设置最右侧区间
          </h5>

          <div className="bg-white rounded p-2 text-xs text-gray-600 mb-3">
            区间：<span className="font-mono text-green-600">{getRightmostDescription()}</span>
          </div>

          {renderValueInput(
            config.rightmostValue,
            (v) => setConfig({ ...config, rightmostValue: v }),
            `${getRightmostDescription()} 的取值`
          )}

          <div className="flex space-x-2 mt-3">
            <button
              onClick={() => setIsSettingRightmost(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              ← 继续添加锚点
            </button>
          </div>
        </div>
      )}

      {/* 表达式预览 */}
      {config.anchors.length > 0 && config.rightmostValue && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">分段函数预览</h4>
          <div className="text-xs text-gray-600 space-y-1 font-mono">
            {config.anchors.map((anchor, idx) => {
              const prevAnchor = idx > 0 ? config.anchors[idx - 1] : null;
              const prevBelongRight = prevAnchor?.belong === 'right';
              const leftOp = prevBelongRight ? '≥' : '>';
              const fieldName = getSourceFieldName(config.segmentField);
              
              return (
                <div key={idx}>
                  {idx === 0 ? (
                    anchor.belong === 'left' ?
                      <span>{fieldName} ≤ {anchor.value} → <span className="text-pink-600">{anchor.leftValue}</span></span> :
                    anchor.belong === 'independent' ?
                      <><span>{fieldName} {'<'} {anchor.value} → <span className="text-pink-600">{anchor.leftValue}</span></span><br/>
                      <span>{fieldName} = {anchor.value} → <span className="text-pink-600">{anchor.equalValue}</span></span></> :
                      <span>{fieldName} {'<'} {anchor.value} → <span className="text-pink-600">{anchor.leftValue}</span></span>
                  ) : (
                    anchor.belong === 'left' ?
                      <span>{prevAnchor.value} {leftOp} {fieldName} ≤ {anchor.value} → <span className="text-pink-600">{anchor.leftValue}</span></span> :
                    anchor.belong === 'independent' ?
                      <><span>{prevAnchor.value} {leftOp} {fieldName} {'<'} {anchor.value} → <span className="text-pink-600">{anchor.leftValue}</span></span><br/>
                      <span>{fieldName} = {anchor.value} → <span className="text-pink-600">{anchor.equalValue}</span></span></> :
                      <span>{prevAnchor.value} {leftOp} {fieldName} {'<'} {anchor.value} → <span className="text-pink-600">{anchor.leftValue}</span></span>
                  )}
                </div>
              );
            })}
            <div>
              {(() => {
                const lastAnchor = config.anchors[config.anchors.length - 1];
                const rightOp = lastAnchor.belong === 'right' ? '≥' : '>';
                const fieldName = getSourceFieldName(config.segmentField);
                return <span>{fieldName} {rightOp} {lastAnchor.value} → <span className="text-pink-600">{config.rightmostValue}</span></span>;
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 底部按钮 */}
      <div className="flex space-x-3">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          ← 返回上一步
        </button>
        {config.anchors.length > 0 && config.rightmostValue && (
          <button
            onClick={() => {
              // 触发父组件的保存
              window.dispatchEvent(new CustomEvent('piecewiseSave'));
            }}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            ✓ 确认保存分段函数
          </button>
        )}
      </div>
    </div>
  );
}
window.PiecewiseAnchorBuilder = PiecewiseAnchorBuilder;

console.log('[DND2] expressionBuilder/PiecewiseAnchorBuilder.jsx 加载完成');

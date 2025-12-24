// DND2 表达式构建器 - 离散分段构建子组件
// 原文件: src/components/ExpressionBuilder.jsx 第1387-1667行
// Phase 8 拆分

// 离散分段构建子组件
function PiecewiseDiscreteBuilder({ config, setConfig, getAttributeFieldValues, getSourceFieldName, getSourceFieldUniqueValues, onBack }) {
  const [currentGroup, setCurrentGroup] = React.useState({
    values: [],
    mappedValue: ''
  });

  // 获取字段的所有唯一值
  const allUniqueValues = React.useMemo(() => {
    return getSourceFieldUniqueValues(config.segmentField);
  }, [config.segmentField]);

  // 获取已被使用的值
  const usedValues = React.useMemo(() => {
    const used = new Set();
    const groups = config.discreteGroups || [];
    groups.forEach(group => {
      (group.values || []).forEach(v => used.add(v));
    });
    return used;
  }, [config.discreteGroups]);

  // 获取可用的值（未被分配到任何分组）
  const availableValues = React.useMemo(() => {
    return allUniqueValues.filter(v => !usedValues.has(v));
  }, [allUniqueValues, usedValues]);

  // 切换值选择
  const toggleValue = (value) => {
    if (currentGroup.values.includes(value)) {
      setCurrentGroup({
        ...currentGroup,
        values: currentGroup.values.filter(v => v !== value)
      });
    } else {
      setCurrentGroup({
        ...currentGroup,
        values: [...currentGroup.values, value]
      });
    }
  };

  // 渲染取值输入
  const renderValueInput = (value, onChange, label) => {
    if (config.valueType === 'text') {
      return (
        <div>
          <label className="block text-xs text-gray-600 mb-1">{label}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
            placeholder="输入文本"
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
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
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

  // 添加分组
  const handleAddGroup = () => {
    if (currentGroup.values.length === 0) {
      alert('请至少选择一个值');
      return;
    }
    if (!currentGroup.mappedValue && currentGroup.mappedValue !== 0) {
      alert('请设置映射取值');
      return;
    }

    setConfig({
      ...config,
      discreteGroups: [...config.discreteGroups, { ...currentGroup }]
    });

    setCurrentGroup({ values: [], mappedValue: '' });
  };

  // 移除分组
  const handleRemoveGroup = (index) => {
    setConfig({
      ...config,
      discreteGroups: config.discreteGroups.filter((_, i) => i !== index)
    });
  };

  // 检查是否可以保存
  const canSave = config.discreteGroups.length > 0 && 
    (config.defaultValue || config.defaultValue === 0 || availableValues.length === 0);

  return (
    <div className="space-y-4">
      {/* 已添加的分组列表 */}
      <div>
        <label className="block text-xs text-gray-600 mb-2">
          已设置的分组 ({config.discreteGroups.length} 个)
        </label>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {config.discreteGroups.length === 0 ? (
            <div className="px-4 py-3 text-gray-500 text-sm text-center">
              尚未添加分组
            </div>
          ) : (
            config.discreteGroups.map((group, idx) => (
              <div key={idx} className="px-4 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {group.values.map((v, i) => (
                        <span key={i} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          {v}
                        </span>
                      ))}
                    </div>
                    <div className="text-gray-500">
                      → <span className="text-purple-600 font-medium">{group.mappedValue}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveGroup(idx)}
                    className="ml-2 text-red-500 hover:text-red-700 text-xs"
                  >
                    移除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 添加新分组 */}
      {availableValues.length > 0 ? (
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <h5 className="text-sm font-medium text-purple-700 mb-3">
            添加分组 {config.discreteGroups.length + 1}
          </h5>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-2">
                选择要归入此分组的值（点击选择）
              </label>
              <div className="flex flex-wrap gap-2 p-3 bg-white rounded border border-gray-200 min-h-[60px]">
                {availableValues.map((value, idx) => (
                  <button
                    key={idx}
                    onClick={() => toggleValue(value)}
                    className={`px-3 py-1 text-sm rounded border transition-colors ${
                      currentGroup.values.includes(value)
                        ? 'border-purple-500 bg-purple-100 text-purple-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
              {currentGroup.values.length > 0 && (
                <div className="mt-2 text-xs text-purple-600">
                  已选择 {currentGroup.values.length} 个值：{currentGroup.values.join(', ')}
                </div>
              )}
            </div>

            {renderValueInput(
              currentGroup.mappedValue,
              (v) => setCurrentGroup({ ...currentGroup, mappedValue: v }),
              '映射取值'
            )}

            <button
              onClick={handleAddGroup}
              disabled={currentGroup.values.length === 0}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              确认添加分组
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-700">
            {allUniqueValues.length === 0 ? (
              <>
                <span className="font-medium">⚠️ 未找到可用的值</span>
                <br />
                <span className="text-xs">请确保源表中该字段有数据</span>
              </>
            ) : (
              <>
                <span className="font-medium">✓ 所有值已分配完毕</span>
                <br />
                <span className="text-xs">可以设置默认值后保存，或继续修改分组</span>
              </>
            )}
          </p>
        </div>
      )}

      {/* 设置默认值（当有未分配的值或作为fallback） */}
      {config.discreteGroups.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h5 className="text-sm font-medium text-gray-700 mb-3">
            默认值设置
            {availableValues.length > 0 && (
              <span className="ml-2 text-xs font-normal text-orange-600">
                （还有 {availableValues.length} 个值未分配：{availableValues.join(', ')}）
              </span>
            )}
          </h5>

          {renderValueInput(
            config.defaultValue,
            (v) => setConfig({ ...config, defaultValue: v }),
            '未匹配到分组时的默认值'
          )}
        </div>
      )}

      {/* 预览 */}
      {config.discreteGroups.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">分段函数预览</h4>
          <div className="text-xs text-gray-600 space-y-1 font-mono">
            {config.discreteGroups.map((group, idx) => (
              <div key={idx}>
                <span className="text-purple-600">{`{${group.values.join(', ')}}`}</span>
                <span className="mx-2">→</span>
                <span className="text-pink-600 font-medium">{group.mappedValue}</span>
              </div>
            ))}
            {config.defaultValue && (
              <div className="text-gray-500">
                其他 → <span className="text-pink-600 font-medium">{config.defaultValue}</span>
              </div>
            )}
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
        {canSave && (
          <button
            onClick={() => {
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
window.PiecewiseDiscreteBuilder = PiecewiseDiscreteBuilder;

console.log('[DND2] expressionBuilder/PiecewiseDiscreteBuilder.jsx 加载完成');

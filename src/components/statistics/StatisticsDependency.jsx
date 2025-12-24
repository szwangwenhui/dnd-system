/**
 * 统计模块 - 依赖关系管理组件
 * 显示和管理统计表之间的依赖关系
 */

function StatisticsDependency({ statistic, statistics, onCascadeUpdate }) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [cascadeUpdating, setCascadeUpdating] = React.useState(false);

  // 获取依赖关系树
  const dependencyTree = React.useMemo(() => {
    if (!window.StatisticsValidator) return null;
    return window.StatisticsValidator.getDependencyTree(statistic.id, statistics);
  }, [statistic.id, statistics]);

  // 获取级联更新列表
  const cascadeList = React.useMemo(() => {
    if (!window.StatisticsValidator) return [];
    return window.StatisticsValidator.getCascadeUpdateList(statistic.id, statistics);
  }, [statistic.id, statistics]);

  // 执行级联更新
  const handleCascadeUpdate = async () => {
    if (cascadeList.length <= 1) {
      // 只有自己，直接更新
      if (onCascadeUpdate) onCascadeUpdate([statistic.id]);
      return;
    }

    const confirmMsg = `将按顺序更新以下 ${cascadeList.length} 个统计表：\n\n${
      cascadeList.map((id, i) => {
        const stat = statistics.find(s => s.id === id);
        return `${i + 1}. ${stat?.name || id}`;
      }).join('\n')
    }\n\n是否继续？`;

    if (!confirm(confirmMsg)) return;

    setCascadeUpdating(true);
    try {
      if (onCascadeUpdate) {
        await onCascadeUpdate(cascadeList);
      }
    } finally {
      setCascadeUpdating(false);
    }
  };

  // 格式化时间
  const formatTime = (isoString) => {
    if (!isoString) return '未更新';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 检查是否需要更新（上游比当前更新）
  const needsUpdate = React.useMemo(() => {
    if (!dependencyTree?.upstream) return false;
    if (!statistic.lastUpdated) return true;
    if (!dependencyTree.upstream.lastUpdated) return false;
    return new Date(dependencyTree.upstream.lastUpdated) > new Date(statistic.lastUpdated);
  }, [dependencyTree, statistic.lastUpdated]);

  if (!dependencyTree) return null;

  const hasUpstream = !!dependencyTree.upstream;
  const hasDownstream = dependencyTree.downstream.length > 0;

  // 如果没有任何依赖关系，显示简单信息
  if (!hasUpstream && !hasDownstream) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
        <span className="text-gray-400">🔗</span> 该统计表没有依赖关系
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* 头部 */}
      <div 
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center space-x-3">
          <span className="text-lg">🔗</span>
          <span className="font-medium text-gray-700">依赖关系</span>
          <div className="flex items-center space-x-2 text-sm">
            {hasUpstream && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                上游 1
              </span>
            )}
            {hasDownstream && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                下游 {dependencyTree.downstream.length}
              </span>
            )}
            {needsUpdate && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded animate-pulse">
                需要更新
              </span>
            )}
          </div>
        </div>
        <span className="text-gray-400">{showDetails ? '▼' : '▶'}</span>
      </div>

      {/* 详情 */}
      {showDetails && (
        <div className="p-4 space-y-4">
          {/* 依赖图示 */}
          <div className="flex items-center justify-center space-x-4 py-4">
            {/* 上游 */}
            {hasUpstream ? (
              <div className="text-center">
                <div className={`px-3 py-2 rounded-lg border-2 ${
                  needsUpdate 
                    ? 'border-yellow-400 bg-yellow-50' 
                    : 'border-blue-300 bg-blue-50'
                }`}>
                  <div className="text-sm font-medium text-gray-700">
                    {dependencyTree.upstream.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {dependencyTree.upstream.storageType}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {formatTime(dependencyTree.upstream.lastUpdated)}
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-1">上游数据源</div>
              </div>
            ) : (
              <div className="text-center text-gray-300">
                <div className="px-3 py-2 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="text-sm">原始表单</div>
                </div>
                <div className="text-xs mt-1">非统计表来源</div>
              </div>
            )}

            {/* 箭头 */}
            <div className="text-2xl text-gray-300">→</div>

            {/* 当前 */}
            <div className="text-center">
              <div className="px-4 py-2 rounded-lg border-2 border-purple-400 bg-purple-50 ring-2 ring-purple-200">
                <div className="text-sm font-bold text-purple-700">
                  {dependencyTree.current.name}
                </div>
                <div className="text-xs text-purple-600">
                  {dependencyTree.current.storageType} · 当前
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatTime(dependencyTree.current.lastUpdated)}
                </div>
              </div>
            </div>

            {/* 箭头 */}
            {hasDownstream && (
              <>
                <div className="text-2xl text-gray-300">→</div>
                
                {/* 下游 */}
                <div className="text-center">
                  {dependencyTree.downstream.length === 1 ? (
                    <div className="px-3 py-2 rounded-lg border-2 border-green-300 bg-green-50">
                      <div className="text-sm font-medium text-gray-700">
                        {dependencyTree.downstream[0].name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {dependencyTree.downstream[0].storageType}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {formatTime(dependencyTree.downstream[0].lastUpdated)}
                      </div>
                    </div>
                  ) : (
                    <div className="px-3 py-2 rounded-lg border-2 border-green-300 bg-green-50">
                      <div className="text-sm font-medium text-gray-700">
                        {dependencyTree.downstream.length} 个统计表
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {dependencyTree.downstream.map(d => d.name).join(', ')}
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-1">下游依赖</div>
                </div>
              </>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              {needsUpdate && (
                <span className="text-yellow-600">
                  ⚠️ 上游数据已更新，建议重新计算
                </span>
              )}
            </div>
            
            {hasDownstream && (
              <button
                onClick={handleCascadeUpdate}
                disabled={cascadeUpdating}
                className={`px-3 py-1.5 text-sm rounded-lg flex items-center ${
                  cascadeUpdating
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {cascadeUpdating ? (
                  <>
                    <span className="inline-block animate-spin mr-1">⏳</span>
                    级联更新中...
                  </>
                ) : (
                  <>
                    🔄 级联更新 ({cascadeList.length})
                  </>
                )}
              </button>
            )}
          </div>

          {/* 下游列表详情 */}
          {hasDownstream && dependencyTree.downstream.length > 1 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-sm font-medium text-gray-600 mb-2">下游统计表：</div>
              <div className="space-y-1">
                {dependencyTree.downstream.map((dep, index) => (
                  <div key={dep.id} className="flex items-center justify-between text-sm py-1 px-2 bg-gray-50 rounded">
                    <span className="text-gray-600">
                      {index + 1}. {dep.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {dep.storageType} · {formatTime(dep.lastUpdated)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 导出到全局
window.StatisticsDependency = StatisticsDependency;

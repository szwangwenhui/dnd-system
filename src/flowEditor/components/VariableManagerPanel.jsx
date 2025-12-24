// 中间变量管理面板
// 用途：查看项目的所有中间变量，显示使用情况，支持删除未使用的变量

function VariableManagerPanel({ projectId, onClose }) {
  const [variables, setVariables] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState('all'); // all, read, calculate, aggregate

  // 加载变量列表
  React.useEffect(() => {
    if (projectId) {
      loadVariables();
    }
  }, [projectId]);

  const loadVariables = async () => {
    setLoading(true);
    try {
      const vars = await window.dndDB.getVariables(projectId);
      setVariables(vars);
    } catch (error) {
      console.error('加载变量列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 删除变量
  const handleDeleteVariable = async (variableId) => {
    const variable = variables.find(v => v.id === variableId);
    if (!variable) return;

    if (variable.usedBy && variable.usedBy.length > 0) {
      alert(`变量 ${variableId} 正在被 ${variable.usedBy.length} 个节点使用，无法删除`);
      return;
    }

    if (!confirm(`确定删除变量 ${variableId}${variable.name ? ` (${variable.name})` : ''} 吗？`)) {
      return;
    }

    try {
      await window.dndDB.deleteVariable(projectId, variableId);
      await loadVariables();
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };

  // 获取数据类型显示文本
  const getDataTypeText = (type) => {
    switch (type) {
      case 'array': return '多条';
      case 'object': return '单条';
      case 'value': return '单值';
      default: return '未知';
    }
  };

  // 获取来源类型显示文本和颜色
  const getSourceTypeInfo = (type) => {
    switch (type) {
      case 'read': return { text: '读取', color: 'bg-blue-500' };
      case 'calculate': return { text: '计算', color: 'bg-purple-500' };
      case 'aggregate': return { text: '聚合', color: 'bg-green-500' };
      default: return { text: type || '未知', color: 'bg-gray-500' };
    }
  };

  // 过滤变量
  const filteredVariables = variables.filter(v => {
    if (filter === 'all') return true;
    return v.sourceNodeType === filter;
  });

  // 统计信息
  const stats = {
    total: variables.length,
    read: variables.filter(v => v.sourceNodeType === 'read').length,
    calculate: variables.filter(v => v.sourceNodeType === 'calculate').length,
    aggregate: variables.filter(v => v.sourceNodeType === 'aggregate').length,
    unused: variables.filter(v => !v.usedBy || v.usedBy.length === 0).length
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-[800px] max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">中间变量管理</h2>
            <p className="text-sm text-gray-400 mt-1">
              共 {stats.total} 个变量，{stats.unused} 个未使用
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* 筛选栏 */}
        <div className="px-6 py-3 border-b border-gray-700 flex items-center gap-2">
          <span className="text-sm text-gray-400">筛选：</span>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded text-sm ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            全部 ({stats.total})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-3 py-1 rounded text-sm ${filter === 'read' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            读取 ({stats.read})
          </button>
          <button
            onClick={() => setFilter('calculate')}
            className={`px-3 py-1 rounded text-sm ${filter === 'calculate' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            计算 ({stats.calculate})
          </button>
          <button
            onClick={() => setFilter('aggregate')}
            className={`px-3 py-1 rounded text-sm ${filter === 'aggregate' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            聚合 ({stats.aggregate})
          </button>
        </div>

        {/* 变量列表 */}
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center text-gray-400 py-8">加载中...</div>
          ) : filteredVariables.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              {filter === 'all' ? '暂无变量' : '没有符合条件的变量'}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="pb-2 px-2">变量ID</th>
                  <th className="pb-2 px-2">描述名称</th>
                  <th className="pb-2 px-2">来源</th>
                  <th className="pb-2 px-2">数据类型</th>
                  <th className="pb-2 px-2">使用情况</th>
                  <th className="pb-2 px-2">流程</th>
                  <th className="pb-2 px-2">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredVariables.map(variable => {
                  const sourceInfo = getSourceTypeInfo(variable.sourceNodeType);
                  const usageCount = variable.usedBy?.length || 0;
                  
                  return (
                    <tr key={variable.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-2">
                        <span className="font-mono text-blue-400">{variable.id}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-white">{variable.name || '-'}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-xs text-white ${sourceInfo.color}`}>
                          {sourceInfo.text}
                        </span>
                        {variable.sourceFormName && (
                          <span className="text-gray-400 text-xs ml-2">
                            ({variable.sourceFormName})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-gray-300 text-sm">{getDataTypeText(variable.dataType)}</span>
                      </td>
                      <td className="py-3 px-2">
                        {usageCount > 0 ? (
                          <span className="text-green-400 text-sm" title={variable.usedBy.map(u => `节点:${u.nodeId}`).join(', ')}>
                            ✓ {usageCount} 处使用
                          </span>
                        ) : (
                          <span className="text-yellow-400 text-sm">未使用</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className="text-gray-400 text-sm">{variable.flowName || '-'}</span>
                      </td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleDeleteVariable(variable.id)}
                          disabled={usageCount > 0}
                          className={`px-2 py-1 rounded text-xs ${
                            usageCount > 0 
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                              : 'bg-red-600 hover:bg-red-700 text-white'
                          }`}
                          title={usageCount > 0 ? '变量正在使用中，无法删除' : '删除变量'}
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 底部说明 */}
        <div className="px-6 py-3 border-t border-gray-700 text-xs text-gray-500">
          <div>💡 变量ID由系统自动分配（aaaaa → aaaab → ...），项目级别唯一</div>
          <div className="mt-1">⚠️ 正在使用中的变量无法删除，请先删除使用该变量的节点</div>
        </div>
      </div>
    </div>
  );
}

// 导出到全局
window.VariableManagerPanel = VariableManagerPanel;

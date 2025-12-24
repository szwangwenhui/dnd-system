/**
 * 统计模块 - 主组件
 * 统计表列表管理界面
 */

function StatisticsModule({ projectId }) {
  const [statistics, setStatistics] = React.useState([]);
  const [forms, setForms] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [filterType, setFilterType] = React.useState('all');
  const [searchText, setSearchText] = React.useState('');
  const [showWizard, setShowWizard] = React.useState(false);
  const [editingStatistic, setEditingStatistic] = React.useState(null);
  const [viewingStatistic, setViewingStatistic] = React.useState(null);

  // 加载数据
  React.useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const statList = await window.dndDB.getStatisticsByProjectId(projectId);
      setStatistics(statList || []);
      
      const formList = await window.dndDB.getFormsByProjectId(projectId);
      setForms(formList || []);
      
      const fieldList = await window.dndDB.getFieldsByProjectId(projectId);
      setFields(fieldList || []);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  // 过滤统计表
  const filteredStatistics = statistics.filter(stat => {
    if (filterType === 'permanent' && stat.storageType !== '实表') return false;
    if (filterType === 'temporary' && stat.storageType !== '临时表') return false;
    if (searchText && !stat.name.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  // 删除统计表
  const handleDelete = async (stat) => {
    if (!confirm(`确定要删除统计表"${stat.name}"吗？`)) return;
    
    try {
      await window.dndDB.deleteStatistic(projectId, stat.id);
      loadData();
    } catch (error) {
      alert('删除失败: ' + error.message);
    }
  };

  // 更新统计表
  const handleUpdate = async (stat) => {
    try {
      let sourceData = [];
      if (stat.source.type === '统计表') {
        const sourceStat = statistics.find(s => s.id === stat.source.formId);
        sourceData = sourceStat?.data || [];
      } else {
        sourceData = await window.dndDB.getFormDataList(projectId, stat.source.formId);
      }
      
      if (sourceData.length === 0) {
        alert('数据源为空，无法计算统计结果');
        return;
      }
      
      const result = window.StatisticsEngine.execute(sourceData, stat);
      await window.dndDB.updateStatisticData(projectId, stat.id, result.data, result.dataRange);
      
      alert(`统计完成！共生成 ${result.data.length} 条统计记录`);
      loadData();
    } catch (error) {
      console.error('统计计算失败:', error);
      alert('统计计算失败: ' + error.message);
    }
  };

  // 导出统计表
  const handleExport = (stat) => {
    alert('导出功能开发中...');
  };

  // 查看统计表
  const handleView = (stat) => {
    setViewingStatistic(stat);
  };

  // 编辑统计表配置
  const handleEdit = (stat) => {
    setEditingStatistic(stat);
    setShowWizard(true);
  };

  // 向导完成
  const handleWizardComplete = () => {
    setShowWizard(false);
    setEditingStatistic(null);
    loadData();
  };

  // 向导取消
  const handleWizardCancel = () => {
    setShowWizard(false);
    setEditingStatistic(null);
  };

  // 格式化更新时间
  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    
    return date.toLocaleDateString('zh-CN');
  };

  // 获取数据来源名称
  const getSourceName = (stat) => {
    if (!stat.source) return '-';
    
    if (stat.source.type === '统计表') {
      const sourceStat = statistics.find(s => s.id === stat.source.formId);
      return sourceStat ? `[统计] ${sourceStat.name}` : stat.source.formName || '-';
    }
    
    return stat.source.formName || '-';
  };

  // 如果显示向导
  if (showWizard) {
    return (
      <StatisticsWizard
        projectId={projectId}
        forms={forms}
        fields={fields}
        statistics={statistics}
        editingStatistic={editingStatistic}
        onComplete={handleWizardComplete}
        onCancel={handleWizardCancel}
      />
    );
  }

  // 如果查看统计表
  if (viewingStatistic) {
    return (
      <StatisticsViewer
        statistic={viewingStatistic}
        fields={fields}
        projectId={projectId}
        statistics={statistics}
        onBack={() => setViewingStatistic(null)}
        onRefresh={async () => {
          await loadData();
          const updated = await window.dndDB.getStatisticById(projectId, viewingStatistic.id);
          if (updated) setViewingStatistic(updated);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 顶部标题栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">统计分析</h2>
          <p className="mt-1 text-sm text-gray-500">
            对数据进行检索、统计和可视化分析
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <span className="mr-2">+</span>
          新建统计
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">存储类型：</span>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="filterType"
                checked={filterType === 'all'}
                onChange={() => setFilterType('all')}
                className="mr-1"
              />
              <span className="text-sm">全部</span>
            </label>
            <label className="flex items-center cursor-pointer ml-3">
              <input
                type="radio"
                name="filterType"
                checked={filterType === 'permanent'}
                onChange={() => setFilterType('permanent')}
                className="mr-1"
              />
              <span className="text-sm">实表</span>
            </label>
            <label className="flex items-center cursor-pointer ml-3">
              <input
                type="radio"
                name="filterType"
                checked={filterType === 'temporary'}
                onChange={() => setFilterType('temporary')}
                className="mr-1"
              />
              <span className="text-sm">临时表</span>
            </label>
          </div>
          <div className="flex-1"></div>
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">搜索：</span>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="输入表名..."
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-48"
            />
          </div>
        </div>
      </div>

      {/* 统计表列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">表名</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">数据来源</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">统计方向</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最后更新</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStatistics.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                  {statistics.length === 0 
                    ? '暂无统计表，点击右上角"新建统计"开始创建'
                    : '没有符合筛选条件的统计表'
                  }
                </td>
              </tr>
            ) : (
              filteredStatistics.map(stat => (
                <tr key={stat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{stat.name}</div>
                    {stat.dependents && stat.dependents.length > 0 && (
                      <div className="text-xs text-orange-600">被 {stat.dependents.length} 个统计表依赖</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      stat.storageType === '实表' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {stat.storageType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getSourceName(stat)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      stat.config?.direction === '纵向' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {stat.config?.direction || '-'}统计
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatTime(stat.lastUpdated)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button onClick={() => handleView(stat)} className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded" title="查看">👁</button>
                      <button onClick={() => handleUpdate(stat)} className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded" title="更新">🔄</button>
                      <button onClick={() => handleExport(stat)} className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded" title="导出">📥</button>
                      {stat.storageType === '实表' && (
                        <button onClick={() => handleEdit(stat)} className="p-1.5 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded" title="编辑配置">✏️</button>
                      )}
                      <button onClick={() => handleDelete(stat)} className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded" title="删除">🗑</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 图例说明 */}
      <div className="text-xs text-gray-500 flex items-center space-x-4">
        <span>图例：</span>
        <span>👁 查看</span>
        <span>🔄 更新</span>
        <span>📥 导出</span>
        <span>✏️ 编辑配置</span>
        <span>🗑 删除</span>
      </div>
    </div>
  );
}

// 导出到全局
window.StatisticsModule = StatisticsModule;

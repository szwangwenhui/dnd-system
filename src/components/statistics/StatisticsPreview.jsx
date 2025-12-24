/**
 * 统计模块 - 虚表预览组件
 * 提供统计结果的预览、导出和保存功能
 */

function StatisticsPreview({ 
  previewData, 
  config, 
  onClose, 
  onSave,
  statistics = []
}) {
  const [activeTab, setActiveTab] = React.useState('table'); // table | chart | config
  const [pageSize, setPageSize] = React.useState(20);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortColumn, setSortColumn] = React.useState(null);
  const [sortOrder, setSortOrder] = React.useState('asc');
  const [hiddenColumns, setHiddenColumns] = React.useState(new Set());
  const [showColumnSelector, setShowColumnSelector] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  // 内部隐藏字段
  const internalFields = ['id', 'period', 'isComplete', '_groupKey', '_rowKey', '_recordCount', '_rank', '_isTotal', '_isSubtotal', '_isOthers'];

  // 获取可显示的列
  const allColumns = React.useMemo(() => {
    if (!previewData?.data?.length) return [];
    return Object.keys(previewData.data[0]).filter(k => 
      !internalFields.includes(k) && !k.startsWith('_')
    );
  }, [previewData?.data]);

  // 获取实际显示的列
  const visibleColumns = React.useMemo(() => {
    return allColumns.filter(col => !hiddenColumns.has(col));
  }, [allColumns, hiddenColumns]);

  // 获取列显示名称
  const getColumnDisplayName = (key) => {
    if (key === 'periodName') return '期间';
    if (key === '记录数') return '记录数';
    if (key === '行合计') return '行合计';
    if (key.endsWith('_环比')) return key.replace('_环比', ' 环比');
    if (key.endsWith('_环比增量')) return key.replace('_环比增量', ' 环比增量');
    if (key.endsWith('_累计')) return key.replace('_累计', ' 累计');
    if (key.endsWith('_累计占比')) return key.replace('_累计占比', ' 累计占比');
    if (key.endsWith('_占比')) return key.replace('_占比', ' 占比');
    if (key.includes('同比增量')) return key.replace('增量', ' 增量');
    if (key.includes('同比')) return key.replace('_', ' ');
    if (key.endsWith('_行合计')) return key.replace('_行合计', ' 行合计');
    return key;
  };

  // 数据排序
  const sortedData = React.useMemo(() => {
    if (!previewData?.data || !sortColumn) return previewData?.data || [];
    
    return [...previewData.data].sort((a, b) => {
      // 汇总行始终在最后
      if (a.period === 'SUMMARY' || a._isTotal) return 1;
      if (b.period === 'SUMMARY' || b._isTotal) return -1;
      
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortOrder === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [previewData?.data, sortColumn, sortOrder]);

  // 分页数据
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  // 总页数
  const totalPages = Math.ceil((sortedData?.length || 0) / pageSize);

  // 统计信息
  const stats = React.useMemo(() => {
    if (!previewData?.data) return { total: 0, normal: 0, summary: 0 };
    const data = previewData.data;
    const summary = data.filter(r => r.period === 'SUMMARY' || r._isTotal || r._isSubtotal || r._isOthers).length;
    return {
      total: data.length,
      normal: data.length - summary,
      summary
    };
  }, [previewData?.data]);

  // 处理排序
  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // 切换列可见性
  const toggleColumn = (column) => {
    const newHidden = new Set(hiddenColumns);
    if (newHidden.has(column)) {
      newHidden.delete(column);
    } else {
      // 至少保留一列
      if (visibleColumns.length > 1) {
        newHidden.add(column);
      }
    }
    setHiddenColumns(newHidden);
  };

  // 导出预览数据
  const handleExport = (format) => {
    if (!previewData?.data) return;
    
    const exportData = {
      ...previewData,
      name: config.name || `预览_${Date.now()}`
    };

    if (format === 'excel' && window.StatisticsExporter) {
      window.StatisticsExporter.exportToExcel(exportData);
    } else if (format === 'csv' && window.StatisticsExporter) {
      window.StatisticsExporter.exportToCSV(exportData);
    }
  };

  // 格式化数值
  const formatValue = (value, key) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>;
    }
    
    if (typeof value === 'number') {
      if (key.includes('比') && !key.includes('增量')) {
        const percent = (value * 100).toFixed(2);
        const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
        return <span className={color}>{value > 0 ? '+' : ''}{percent}%</span>;
      }
      
      if (key.includes('增量')) {
        const color = value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
        return <span className={color}>{value > 0 ? '+' : ''}{value.toLocaleString()}</span>;
      }
      
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    
    return value;
  };

  // 行样式
  const getRowClassName = (row) => {
    if (row.period === 'SUMMARY' || row._isTotal) return 'bg-gray-100 font-medium';
    if (row._isSubtotal) return 'bg-purple-50 font-medium';
    if (row._isOthers) return 'bg-orange-50 italic';
    if (row.isComplete === false) return 'bg-yellow-50';
    return 'hover:bg-gray-50';
  };

  // 数据校验
  const validationResult = React.useMemo(() => {
    if (!window.StatisticsValidator || !previewData?.data?.length) return null;
    return window.StatisticsValidator.validateResultData(previewData);
  }, [previewData]);

  const containerClass = isFullscreen 
    ? 'fixed inset-0 z-50 bg-white flex flex-col' 
    : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';

  const modalClass = isFullscreen
    ? 'flex-1 flex flex-col overflow-hidden'
    : 'bg-white rounded-lg shadow-2xl w-[95vw] max-w-7xl max-h-[95vh] overflow-hidden flex flex-col';

  return (
    <div className={containerClass}>
      <div className={modalClass}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center space-x-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">📊 统计预览（虚表）</h3>
              <p className="text-sm text-gray-500 mt-1">
                {config.direction}统计 · {config.source?.formName} · 
                共 {stats.normal} 条数据 {stats.summary > 0 && `+ ${stats.summary} 条汇总`}
              </p>
            </div>
            
            {/* 校验状态 */}
            {validationResult && validationResult.issues.length > 0 && (
              <div className="flex items-center space-x-2">
                {validationResult.issues.filter(i => i.type === 'warning').length > 0 && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded">
                    ⚠️ {validationResult.issues.filter(i => i.type === 'warning').length}
                  </span>
                )}
                {validationResult.issues.filter(i => i.type === 'info').length > 0 && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                    ℹ️ {validationResult.issues.filter(i => i.type === 'info').length}
                  </span>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              title={isFullscreen ? '退出全屏' : '全屏'}
            >
              {isFullscreen ? '⊙' : '⛶'}
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 工具栏 */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          {/* 标签切换 */}
          <div className="flex items-center space-x-1 bg-gray-200 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('table')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === 'table' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 数据表
            </button>
            {config.output?.showChart && (
              <button
                onClick={() => setActiveTab('chart')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeTab === 'chart' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                📈 图表
              </button>
            )}
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                activeTab === 'config' ? 'bg-white text-gray-900 shadow' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ⚙️ 配置
            </button>
          </div>

          {/* 工具按钮 */}
          <div className="flex items-center space-x-3">
            {/* 列选择器 */}
            {activeTab === 'table' && (
              <div className="relative">
                <button
                  onClick={() => setShowColumnSelector(!showColumnSelector)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center"
                >
                  👁 列 ({visibleColumns.length}/{allColumns.length})
                </button>
                {showColumnSelector && (
                  <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-64 overflow-y-auto">
                    <div className="p-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500">选择要显示的列</span>
                    </div>
                    {allColumns.map(col => (
                      <label key={col} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!hiddenColumns.has(col)}
                          onChange={() => toggleColumn(col)}
                          className="mr-2"
                        />
                        <span className="text-sm">{getColumnDisplayName(col)}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 分页大小 */}
            {activeTab === 'table' && (
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
              >
                <option value={10}>10条/页</option>
                <option value={20}>20条/页</option>
                <option value={50}>50条/页</option>
                <option value={100}>100条/页</option>
              </select>
            )}

            {/* 导出按钮 */}
            <div className="flex items-center border-l border-gray-300 pl-3 space-x-2">
              <button
                onClick={() => handleExport('excel')}
                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                📗 Excel
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                📄 CSV
              </button>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto p-6">
          {/* 数据表格标签页 */}
          {activeTab === 'table' && (
            <div className="space-y-4">
              {paginatedData.length > 0 ? (
                <>
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-3 text-center text-xs font-medium text-gray-500">#</th>
                          {visibleColumns.map(key => (
                            <th 
                              key={key} 
                              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-100"
                              onClick={() => handleSort(key)}
                            >
                              <div className="flex items-center space-x-1">
                                <span>{getColumnDisplayName(key)}</span>
                                {sortColumn === key && (
                                  <span className="text-blue-600">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paginatedData.map((row, index) => (
                          <tr key={index} className={getRowClassName(row)}>
                            <td className="px-2 py-2 text-sm text-center text-gray-400">
                              {row.period === 'SUMMARY' || row._isTotal || row._isSubtotal || row._isOthers 
                                ? '' 
                                : (currentPage - 1) * pageSize + index + 1}
                            </td>
                            {visibleColumns.map(key => (
                              <td key={key} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                {formatValue(row[key], key)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 分页控制 */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sortedData.length)} / 共 {sortedData.length} 条
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                        >
                          ⏮
                        </button>
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                        >
                          ◀
                        </button>
                        <span className="px-3 py-1 text-sm">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                        >
                          ▶
                        </button>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                          className="px-2 py-1 text-sm border border-gray-300 rounded disabled:opacity-50"
                        >
                          ⏭
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-2">📭</div>
                  <div>数据源为空，无法生成统计结果</div>
                </div>
              )}
            </div>
          )}

          {/* 图表标签页 */}
          {activeTab === 'chart' && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-4">📈 {config.output?.chartType || '折线图'}</h4>
              {window.StatisticsChart ? (
                <StatisticsChart statistic={previewData} data={previewData?.data} />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg text-gray-500">
                  图表组件未加载
                </div>
              )}
            </div>
          )}

          {/* 配置标签页 */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* 数据范围 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-3">📊 数据范围</h4>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">起始期间：</span>
                    <span className="font-medium">{previewData?.dataRange?.from || '-'}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">截止期间：</span>
                    <span className="font-medium">{previewData?.dataRange?.to || '-'}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">期间数：</span>
                    <span className="font-medium">{previewData?.dataRange?.periodCount || stats.normal}</span>
                  </div>
                  <div>
                    <span className="text-blue-600">进行中：</span>
                    <span className="font-medium">{previewData?.dataRange?.incompleteCount || 0}</span>
                  </div>
                </div>
              </div>

              {/* 统计配置 */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800 mb-3">⚙️ 统计配置</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">数据来源：</span><span>{config.source?.formName}</span></div>
                  <div><span className="text-gray-500">统计方向：</span><span>{config.direction}</span></div>
                  <div><span className="text-gray-500">聚合方式：</span><span>{config.aggregation?.toUpperCase()}</span></div>
                  <div><span className="text-gray-500">统计字段：</span><span>{config.statisticFields?.map(f => f.fieldName).join(', ')}</span></div>
                  
                  {config.direction === '纵向' && (
                    <>
                      <div><span className="text-gray-500">时间字段：</span><span>{config.timeFieldId}</span></div>
                      <div><span className="text-gray-500">时间粒度：</span><span>{config.timeGranularity}</span></div>
                      <div><span className="text-gray-500">统计方式：</span><span>{config.valueTypes?.join(', ')}</span></div>
                      <div><span className="text-gray-500">同比类型：</span><span>{config.compareTypes?.join(', ') || '-'}</span></div>
                    </>
                  )}
                  
                  {config.direction === '横向' && (
                    <>
                      <div><span className="text-gray-500">划分字段：</span><span>{config.groupFields?.map(f => f.fieldName).join(' → ')}</span></div>
                      <div><span className="text-gray-500">统计目的：</span><span>{config.purpose}</span></div>
                      <div><span className="text-gray-500">Top N：</span><span>{config.topN || '全部'}</span></div>
                      <div><span className="text-gray-500">显示小计：</span><span>{config.showSubtotal ? '是' : '否'}</span></div>
                    </>
                  )}
                </div>
              </div>

              {/* 检索条件 */}
              {config.filters?.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-3">🔍 检索条件</h4>
                  <div className="flex flex-wrap gap-2">
                    {config.filters.map((filter, index) => (
                      <span key={index} className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                        {filter.fieldName || filter.fieldId}: 
                        {filter.type === '指定' 
                          ? ` [${filter.values?.slice(0, 3).join(', ')}${filter.values?.length > 3 ? '...' : ''}]` 
                          : ` ${filter.operator} ${filter.value}`
                        }
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 校验结果 */}
              {validationResult && validationResult.issues.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-3">🔍 数据校验</h4>
                  <div className="space-y-2">
                    {validationResult.issues.map((issue, index) => (
                      <div key={index} className={`flex items-start space-x-2 text-sm p-2 rounded ${
                        issue.type === 'error' ? 'bg-red-50 text-red-700' :
                        issue.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        <span>{issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                        <span>{issue.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              💡 虚表仅用于预览，关闭后数据不会保存。如需保存，请选择右侧按钮。
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={onClose} 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                关闭预览
              </button>
              <button 
                onClick={() => onSave && onSave('临时表')} 
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
              >
                💾 保存为临时表
              </button>
              <button 
                onClick={() => onSave && onSave('实表')} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                💾 保存为实表
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 点击遮罩关闭列选择器 */}
      {showColumnSelector && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowColumnSelector(false)}
        />
      )}
    </div>
  );
}

// 导出到全局
window.StatisticsPreview = StatisticsPreview;

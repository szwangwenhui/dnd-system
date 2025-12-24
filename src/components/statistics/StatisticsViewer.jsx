/**
 * 统计模块 - 统计表查看器组件
 * 显示统计结果、支持更新、导出、校验和依赖管理
 */

function StatisticsViewer({ statistic, fields, projectId, statistics, forms, onBack, onRefresh }) {
  const [updating, setUpdating] = React.useState(false);
  const [showExportMenu, setShowExportMenu] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState(null);
  const [showValidation, setShowValidation] = React.useState(false);

  // 数据校验
  React.useEffect(() => {
    if (window.StatisticsValidator && statistic.data?.length > 0) {
      const result = window.StatisticsValidator.validateResultData(statistic);
      setValidationResult(result);
    }
  }, [statistic.data]);

  // 更新统计表
  const handleUpdate = async () => {
    setUpdating(true);
    try {
      let sourceData = [];
      if (statistic.source.type === '统计表') {
        const sourceStat = statistics?.find(s => s.id === statistic.source.formId);
        sourceData = sourceStat?.data || [];
      } else {
        sourceData = await window.dndDB.getFormDataList(projectId, statistic.source.formId);
      }
      
      if (sourceData.length === 0) {
        alert('数据源为空，无法计算统计结果');
        setUpdating(false);
        return;
      }
      
      const result = window.StatisticsEngine.execute(sourceData, statistic);
      await window.dndDB.updateStatisticData(projectId, statistic.id, result.data, result.dataRange);
      
      alert(`统计完成！共生成 ${result.data.length} 条统计记录`);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('统计计算失败:', error);
      alert('统计计算失败: ' + error.message);
    }
    setUpdating(false);
  };

  // 级联更新
  const handleCascadeUpdate = async (updateList) => {
    setUpdating(true);
    let successCount = 0;
    let failedItems = [];

    for (const statId of updateList) {
      try {
        const stat = statistics.find(s => s.id === statId);
        if (!stat) continue;

        let sourceData = [];
        if (stat.source.type === '统计表') {
          const sourceStat = statistics.find(s => s.id === stat.source.formId);
          sourceData = sourceStat?.data || [];
        } else {
          sourceData = await window.dndDB.getFormDataList(projectId, stat.source.formId);
        }

        if (sourceData.length > 0) {
          const result = window.StatisticsEngine.execute(sourceData, stat);
          await window.dndDB.updateStatisticData(projectId, stat.id, result.data, result.dataRange);
          successCount++;
        }
      } catch (error) {
        failedItems.push(statId);
        console.error(`更新统计表 ${statId} 失败:`, error);
      }
    }

    setUpdating(false);
    
    if (failedItems.length > 0) {
      alert(`级联更新完成：成功 ${successCount} 个，失败 ${failedItems.length} 个`);
    } else {
      alert(`级联更新完成：成功更新 ${successCount} 个统计表`);
    }
    
    if (onRefresh) onRefresh();
  };

  // 导出Excel
  const handleExportExcel = () => {
    setShowExportMenu(false);
    if (window.StatisticsExporter) {
      window.StatisticsExporter.exportToExcel(statistic);
    } else {
      exportToExcelFallback();
    }
  };

  // 导出CSV
  const handleExportCSV = () => {
    setShowExportMenu(false);
    if (window.StatisticsExporter) {
      window.StatisticsExporter.exportToCSV(statistic);
    } else {
      alert('导出功能未加载');
    }
  };

  // 内置Excel导出（回退方案）
  const exportToExcelFallback = () => {
    if (!statistic.data || statistic.data.length === 0) {
      alert('暂无数据可导出');
      return;
    }

    if (!window.XLSX) {
      alert('Excel导出库未加载，请刷新页面重试');
      return;
    }
    
    const exportHiddenFields = ['id', 'period', 'isComplete', '_groupKey', '_rowKey', '_recordCount', '_rank', '_isTotal', '_isSubtotal', '_isOthers'];
    const headers = Object.keys(statistic.data[0]).filter(k => !exportHiddenFields.includes(k) && !k.startsWith('_'));
    const headerNames = headers.map(getColumnDisplayName);

    const rows = statistic.data.map(row => {
      return headers.map(h => {
        const value = row[h];
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? '是' : '否';
        return value;
      });
    });

    const wsData = [headerNames, ...rows];
    const ws = window.XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = headers.map((_, i) => ({ wch: Math.max(...wsData.map(r => String(r[i] || '').length), 10) }));

    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, '统计数据');

    const fileName = `${statistic.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
    window.XLSX.writeFile(wb, fileName);
  };

  // 隐藏字段
  const hiddenFields = ['id', 'period', 'isComplete', '_groupKey', '_rowKey', '_recordCount', '_rank', '_isTotal', '_isSubtotal', '_isOthers'];
  
  const getDisplayColumns = () => {
    if (!statistic.data || statistic.data.length === 0) return [];
    return Object.keys(statistic.data[0]).filter(k => !hiddenFields.includes(k) && !k.startsWith('_'));
  };

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

  const formatValue = (value, key, row) => {
    if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
    if (typeof value === 'boolean') return value ? '✓' : '';
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

  const isSummaryRow = (row) => row.period === 'SUMMARY' || row.periodName === '合计/平均' || row._isTotal === true;
  const isSubtotalRow = (row) => row._isSubtotal === true;
  const isOthersRow = (row) => row._isOthers === true;
  const isIncompletePeriod = (row) => row.isComplete === false;

  const getRowClassName = (row) => {
    if (isSummaryRow(row)) return 'bg-gray-100 font-medium border-t-2 border-gray-300';
    if (isSubtotalRow(row)) return 'bg-purple-50 font-medium';
    if (isOthersRow(row)) return 'bg-orange-50 italic';
    if (isIncompletePeriod(row)) return 'bg-yellow-50';
    return 'hover:bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg">← 返回</button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{statistic.name}</h2>
            <p className="text-sm text-gray-500">
              {statistic.storageType} · {statistic.config?.direction}统计 · 
              最后更新：{new Date(statistic.lastUpdated).toLocaleString('zh-CN')}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleUpdate} 
            disabled={updating}
            className={`px-3 py-1.5 rounded text-sm flex items-center ${updating ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white`}
          >
            {updating ? (<><span className="inline-block animate-spin mr-1">⏳</span>计算中...</>) : (<>🔄 更新</>)}
          </button>
          
          {/* 导出下拉菜单 */}
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm flex items-center"
            >
              📥 导出 ▾
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <button 
                  onClick={handleExportExcel}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center"
                >
                  <span className="mr-2">📗</span> Excel (.xlsx)
                </button>
                <button 
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center border-t border-gray-100"
                >
                  <span className="mr-2">📄</span> CSV (.csv)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 数据摘要 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="grid grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-700">
              {statistic.dataRange?.periodCount || (statistic.data ? statistic.data.filter(r => r.period !== 'SUMMARY' && !r._isTotal).length : 0)}
            </div>
            <div className="text-sm text-blue-600">{statistic.config?.direction === '纵向' ? '统计期间数' : '分组数'}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-700">{statistic.config?.statisticFields?.length || 0}</div>
            <div className="text-sm text-blue-600">统计字段数</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-700">{statistic.dataRange?.from || '-'}</div>
            <div className="text-sm text-blue-600">起始期间</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-700">{statistic.dataRange?.to || '-'}</div>
            <div className="text-sm text-blue-600">截止期间</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-700">
              {statistic.dataRange?.incompleteCount > 0 ? (
                <span className="text-yellow-600">{statistic.dataRange.incompleteCount}</span>
              ) : '0'}
            </div>
            <div className="text-sm text-blue-600">进行中期间</div>
          </div>
        </div>
      </div>

      {/* 数据校验结果 */}
      {validationResult && validationResult.issues.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div 
            className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
            onClick={() => setShowValidation(!showValidation)}
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg">🔍</span>
              <span className="font-medium text-gray-700">数据校验</span>
              <div className="flex items-center space-x-2 text-sm">
                {validationResult.issues.filter(i => i.type === 'error').length > 0 && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded">
                    {validationResult.issues.filter(i => i.type === 'error').length} 错误
                  </span>
                )}
                {validationResult.issues.filter(i => i.type === 'warning').length > 0 && (
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                    {validationResult.issues.filter(i => i.type === 'warning').length} 警告
                  </span>
                )}
                {validationResult.issues.filter(i => i.type === 'info').length > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                    {validationResult.issues.filter(i => i.type === 'info').length} 提示
                  </span>
                )}
              </div>
            </div>
            <span className="text-gray-400">{showValidation ? '▼' : '▶'}</span>
          </div>
          {showValidation && (
            <div className="p-4 space-y-2">
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
          )}
        </div>
      )}

      {/* 依赖关系管理 */}
      {window.StatisticsDependency && (
        <StatisticsDependency 
          statistic={statistic} 
          statistics={statistics}
          onCascadeUpdate={handleCascadeUpdate}
        />
      )}

      {/* 检索条件显示 */}
      {statistic.filters && statistic.filters.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm font-medium text-yellow-800 mb-2">🔍 检索条件</div>
          <div className="flex flex-wrap gap-2">
            {statistic.filters.map((filter, index) => (
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

      {/* 横向统计配置显示 */}
      {statistic.config?.direction === '横向' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-medium text-purple-800 mb-2">📊 横向统计配置</div>
          <div className="flex flex-wrap gap-4 text-sm text-purple-700">
            <span>划分字段: {statistic.config?.groupFields?.map(f => f.fieldName).join(' → ') || '-'}</span>
            {statistic.config?.crossTableField && (
              <span className="px-2 py-0.5 bg-purple-200 rounded">交叉表模式</span>
            )}
            {statistic.config?.topN && <span>Top {statistic.config.topN}</span>}
            {statistic.config?.showSubtotal && (
              <span className="px-2 py-0.5 bg-purple-200 rounded">显示小计</span>
            )}
          </div>
        </div>
      )}

      {/* 统计表 */}
      {statistic.output?.showTable && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="font-medium text-gray-900">📊 统计表</h3>
            {statistic.data && statistic.data.length > 0 && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  共 {statistic.data.filter(r => !isSummaryRow(r) && !isSubtotalRow(r) && !isOthersRow(r)).length} 条记录
                </span>
                <div className="flex items-center space-x-2 text-xs">
                  {statistic.config?.direction === '纵向' && (
                    <span className="flex items-center"><span className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded mr-1"></span>进行中</span>
                  )}
                  {statistic.config?.showSubtotal && (
                    <span className="flex items-center"><span className="w-3 h-3 bg-purple-50 border border-purple-300 rounded mr-1"></span>小计</span>
                  )}
                  {statistic.config?.topN && (
                    <span className="flex items-center"><span className="w-3 h-3 bg-orange-50 border border-orange-300 rounded mr-1"></span>其他</span>
                  )}
                  <span className="flex items-center"><span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded mr-1"></span>合计</span>
                </div>
              </div>
            )}
          </div>
          <div className="p-4">
            {!statistic.data || statistic.data.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">📭</div>
                <div>暂无数据</div>
                <div className="text-sm mt-1">请点击"更新"按钮计算统计结果</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {statistic.config?.direction === '横向' && !statistic.config?.crossTableField && (
                        <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">#</th>
                      )}
                      {getDisplayColumns().map(key => (
                        <th key={key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                          {getColumnDisplayName(key)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {statistic.data.map((row, index) => (
                      <tr key={index} className={getRowClassName(row)}>
                        {statistic.config?.direction === '横向' && !statistic.config?.crossTableField && (
                          <td className="px-2 py-2 text-sm text-center text-gray-500">
                            {isSummaryRow(row) || isSubtotalRow(row) || isOthersRow(row) ? '' : row._rank || index + 1}
                          </td>
                        )}
                        {getDisplayColumns().map(key => (
                          <td key={key} className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                            {key === 'periodName' && isIncompletePeriod(row) ? (
                              <span className="flex items-center">
                                {row[key]}
                                <span className="ml-1 px-1 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded">进行中</span>
                              </span>
                            ) : formatValue(row[key], key, row)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 统计图 */}
      {statistic.output?.showChart && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">📈 统计图 - {statistic.output.chartType}</h3>
          </div>
          <div className="p-4">
            {window.StatisticsChart ? (
              <StatisticsChart statistic={statistic} data={statistic.data} />
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg text-gray-500">
                图表组件未加载
              </div>
            )}
          </div>
        </div>
      )}

      {/* 配置信息 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">⚙️ 配置信息</h3>
        </div>
        <div className="p-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-gray-500">数据来源：</span><span className="text-gray-900">{statistic.source?.formName}</span></div>
            <div><span className="text-gray-500">统计方向：</span><span className="text-gray-900">{statistic.config?.direction}</span></div>
            {statistic.config?.direction === '纵向' && (
              <>
                <div><span className="text-gray-500">时间字段：</span><span className="text-gray-900">{statistic.config?.timeFieldId}</span></div>
                <div><span className="text-gray-500">时间粒度：</span><span className="text-gray-900">{statistic.config?.timeGranularity}</span></div>
                <div><span className="text-gray-500">统计方式：</span><span className="text-gray-900">{[...(statistic.config?.valueTypes || []), ...(statistic.config?.compareTypes || [])].join(', ')}</span></div>
              </>
            )}
            {statistic.config?.direction === '横向' && (
              <>
                <div><span className="text-gray-500">统计目的：</span><span className="text-gray-900">{statistic.config?.purpose}</span></div>
                <div><span className="text-gray-500">划分字段：</span><span className="text-gray-900">{statistic.config?.groupFields?.map(f => f.fieldName).join(' → ')}</span></div>
                {statistic.config?.crossTableField && (
                  <div><span className="text-gray-500">交叉表列：</span><span className="text-gray-900">{statistic.config?.groupFields?.find(f => f.fieldId === statistic.config.crossTableField)?.fieldName}</span></div>
                )}
                {statistic.config?.topN && (
                  <div><span className="text-gray-500">Top N：</span><span className="text-gray-900">前 {statistic.config.topN} 项</span></div>
                )}
                {statistic.config?.showSubtotal && (
                  <div><span className="text-gray-500">显示小计：</span><span className="text-gray-900">是</span></div>
                )}
                <div><span className="text-gray-500">排序方式：</span><span className="text-gray-900">{statistic.config?.sortOrder === 'asc' ? '升序' : '降序'}</span></div>
              </>
            )}
            <div><span className="text-gray-500">聚合方式：</span><span className="text-gray-900">{statistic.config?.aggregation?.toUpperCase()}</span></div>
            <div><span className="text-gray-500">统计字段：</span><span className="text-gray-900">{statistic.config?.statisticFields?.map(f => f.fieldName).join(', ')}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 导出到全局
window.StatisticsViewer = StatisticsViewer;

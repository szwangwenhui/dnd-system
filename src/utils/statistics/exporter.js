/**
 * 统计模块 - 导出工具类
 * 支持Excel和CSV格式导出
 */

const StatisticsExporter = {
  /**
   * 导出为Excel格式
   * @param {Object} statistic - 统计表对象
   * @param {Object} options - 导出选项
   */
  exportToExcel(statistic, options = {}) {
    if (!statistic.data || statistic.data.length === 0) {
      alert('暂无数据可导出');
      return;
    }

    if (!window.XLSX) {
      alert('Excel导出库未加载，请刷新页面重试');
      return;
    }

    const { 
      includeConfig = true,    // 是否包含配置信息sheet
      includeSummary = true,   // 是否包含汇总信息sheet
      filename = null 
    } = options;

    // 准备数据
    const workbook = window.XLSX.utils.book_new();
    
    // 1. 主数据Sheet
    const mainData = this._prepareMainData(statistic);
    const mainSheet = window.XLSX.utils.aoa_to_sheet(mainData);
    
    // 设置列宽
    const colWidths = mainData[0].map((_, i) => ({
      wch: Math.max(
        ...mainData.map(row => String(row[i] || '').length),
        10
      )
    }));
    mainSheet['!cols'] = colWidths;
    
    window.XLSX.utils.book_append_sheet(workbook, mainSheet, '统计数据');

    // 2. 汇总信息Sheet（可选）
    if (includeSummary) {
      const summaryData = this._prepareSummaryData(statistic);
      const summarySheet = window.XLSX.utils.aoa_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 15 }, { wch: 30 }];
      window.XLSX.utils.book_append_sheet(workbook, summarySheet, '汇总信息');
    }

    // 3. 配置信息Sheet（可选）
    if (includeConfig) {
      const configData = this._prepareConfigData(statistic);
      const configSheet = window.XLSX.utils.aoa_to_sheet(configData);
      configSheet['!cols'] = [{ wch: 15 }, { wch: 40 }];
      window.XLSX.utils.book_append_sheet(workbook, configSheet, '配置信息');
    }

    // 生成文件名
    const exportFilename = filename || 
      `${statistic.name}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // 导出
    window.XLSX.writeFile(workbook, exportFilename);
  },

  /**
   * 导出为CSV格式
   * @param {Object} statistic - 统计表对象
   * @param {Object} options - 导出选项
   */
  exportToCSV(statistic, options = {}) {
    if (!statistic.data || statistic.data.length === 0) {
      alert('暂无数据可导出');
      return;
    }

    const { filename = null } = options;
    const mainData = this._prepareMainData(statistic);
    
    // 转换为CSV
    const csvContent = mainData.map(row => 
      row.map(cell => {
        if (cell === null || cell === undefined) return '';
        const str = String(cell);
        // 如果包含逗号、换行或引号，需要用引号包裹
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    ).join('\n');

    // 添加BOM以支持中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const exportFilename = filename || 
      `${statistic.name}_${new Date().toISOString().split('T')[0]}.csv`;
    
    this._downloadBlob(blob, exportFilename);
  },

  /**
   * 准备主数据
   */
  _prepareMainData(statistic) {
    const data = statistic.data;
    const direction = statistic.config?.direction;
    
    // 需要隐藏的内部字段
    const hiddenFields = ['id', 'period', 'isComplete', '_groupKey', '_rowKey', 
      '_recordCount', '_rank', '_isTotal', '_isSubtotal', '_isOthers'];
    
    // 获取表头
    const allKeys = Object.keys(data[0]).filter(k => 
      !hiddenFields.includes(k) && !k.startsWith('_')
    );
    
    // 生成友好的表头名称
    const headers = allKeys.map(key => this._getColumnDisplayName(key));
    
    // 如果是横向统计且非交叉表，添加排名列
    const showRank = direction === '横向' && !statistic.config?.crossTableField;
    if (showRank) {
      headers.unshift('排名');
    }
    
    // 准备数据行
    const rows = data.map((row, index) => {
      const isSpecialRow = row.period === 'SUMMARY' || row._isTotal || 
        row._isSubtotal || row._isOthers;
      
      const rowData = allKeys.map(key => {
        let value = row[key];
        
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? '是' : '否';
        
        if (typeof value === 'number') {
          // 百分比格式化
          if ((key.includes('比') || key.includes('占比')) && !key.includes('增量')) {
            return `${(value * 100).toFixed(2)}%`;
          }
          // 保留2位小数
          return Number.isInteger(value) ? value : value.toFixed(2);
        }
        
        return value;
      });
      
      if (showRank) {
        rowData.unshift(isSpecialRow ? '' : (row._rank || index + 1));
      }
      
      return rowData;
    });
    
    return [headers, ...rows];
  },

  /**
   * 准备汇总数据
   */
  _prepareSummaryData(statistic) {
    const data = statistic.data || [];
    const dataRange = statistic.dataRange || {};
    const direction = statistic.config?.direction;
    
    // 过滤掉特殊行
    const normalRows = data.filter(row => 
      row.period !== 'SUMMARY' && !row._isTotal && 
      !row._isSubtotal && !row._isOthers
    );
    
    const summaryData = [
      ['汇总项', '值'],
      ['统计表名称', statistic.name],
      ['存储类型', statistic.storageType],
      ['统计方向', direction],
      ['数据来源', statistic.source?.formName || '-'],
      ['记录总数', normalRows.length],
      ['统计字段数', statistic.config?.statisticFields?.length || 0],
      ['最后更新', statistic.lastUpdated ? new Date(statistic.lastUpdated).toLocaleString('zh-CN') : '-'],
    ];

    if (direction === '纵向') {
      summaryData.push(
        ['起始期间', dataRange.from || '-'],
        ['截止期间', dataRange.to || '-'],
        ['时间粒度', statistic.config?.timeGranularity || '-'],
        ['进行中期间', dataRange.incompleteCount || 0]
      );
    } else {
      summaryData.push(
        ['划分字段', statistic.config?.groupFields?.map(f => f.fieldName).join(' → ') || '-'],
        ['Top N', statistic.config?.topN || '全部'],
        ['显示小计', statistic.config?.showSubtotal ? '是' : '否']
      );
    }

    // 添加统计字段的汇总值
    const statisticFields = statistic.config?.statisticFields || [];
    const summaryRow = data.find(row => row.period === 'SUMMARY' || row._isTotal);
    
    if (summaryRow && statisticFields.length > 0) {
      summaryData.push(['', '']);
      summaryData.push(['字段汇总', '']);
      
      statisticFields.forEach(field => {
        const value = summaryRow[field.fieldName] || summaryRow[field.fieldId];
        if (value !== undefined) {
          summaryData.push([field.fieldName, typeof value === 'number' ? value.toLocaleString() : value]);
        }
      });
    }

    return summaryData;
  },

  /**
   * 准备配置数据
   */
  _prepareConfigData(statistic) {
    const config = statistic.config || {};
    
    const configData = [
      ['配置项', '值'],
      ['统计表ID', statistic.id || '-'],
      ['统计表名称', statistic.name],
      ['存储类型', statistic.storageType],
      ['创建时间', statistic.createdAt ? new Date(statistic.createdAt).toLocaleString('zh-CN') : '-'],
      ['最后更新', statistic.lastUpdated ? new Date(statistic.lastUpdated).toLocaleString('zh-CN') : '-'],
      ['', ''],
      ['数据来源类型', statistic.source?.type || '-'],
      ['数据来源名称', statistic.source?.formName || '-'],
      ['数据来源ID', statistic.source?.formId || '-'],
      ['', ''],
      ['统计方向', config.direction || '-'],
      ['聚合方式', (config.aggregation || '-').toUpperCase()],
      ['统计字段', config.statisticFields?.map(f => f.fieldName).join(', ') || '-'],
    ];

    if (config.direction === '纵向') {
      configData.push(
        ['时间字段', config.timeFieldId || '-'],
        ['时间粒度', config.timeGranularity || '-'],
        ['统计方式', config.valueTypes?.join(', ') || '-'],
        ['同比类型', config.compareTypes?.join(', ') || '-']
      );
    } else {
      configData.push(
        ['划分字段', config.groupFields?.map(f => f.fieldName).join(' → ') || '-'],
        ['统计目的', config.purpose || '-'],
        ['排序字段', config.sortBy || '默认'],
        ['排序方向', config.sortOrder === 'asc' ? '升序' : '降序'],
        ['Top N', config.topN || '全部'],
        ['显示小计', config.showSubtotal ? '是' : '否'],
        ['交叉表字段', config.crossTableField || '-']
      );
    }

    // 检索条件
    if (statistic.filters && statistic.filters.length > 0) {
      configData.push(['', '']);
      configData.push(['检索条件', '']);
      statistic.filters.forEach((filter, index) => {
        let filterDesc = filter.fieldName || filter.fieldId;
        if (filter.type === '指定') {
          filterDesc += ` = [${filter.values?.slice(0, 5).join(', ')}${filter.values?.length > 5 ? '...' : ''}]`;
        } else {
          filterDesc += ` ${filter.operator} ${filter.value}`;
        }
        configData.push([`条件${index + 1}`, filterDesc]);
      });
    }

    return configData;
  },

  /**
   * 获取列显示名称
   */
  _getColumnDisplayName(key) {
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
  },

  /**
   * 下载Blob文件
   */
  _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

// 导出到全局
window.StatisticsExporter = StatisticsExporter;

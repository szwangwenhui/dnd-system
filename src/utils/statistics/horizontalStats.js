/**
 * 统计模块 - 横向统计（分组维度）
 * 提供按维度分组的统计功能，支持多级分组、交叉表等
 */

const HorizontalStatistics = {
  /**
   * 执行横向统计
   * @param {Array} data - 数据
   * @param {Object} config - 统计配置
   * @returns {Array} 统计结果
   */
  execute(data, config) {
    const {
      purpose,
      groupFields,
      statisticFields,
      aggregation,
      sortBy,
      sortOrder,
      topN,
      showSubtotal,
      crossTableField
    } = config;

    const Core = window.StatisticsCore;

    // 如果配置了交叉表字段，执行交叉表统计
    if (crossTableField) {
      return this.executeCrossTable(data, config);
    }

    // 按分组字段分组
    const groups = {};
    data.forEach(record => {
      const groupKey = groupFields.map(gf => record[gf.fieldId] ?? '(空)').join('|');
      
      if (!groups[groupKey]) {
        groups[groupKey] = {
          groupValues: groupFields.map(gf => ({
            fieldId: gf.fieldId,
            fieldName: gf.fieldName,
            value: record[gf.fieldId] ?? '(空)'
          })),
          records: []
        };
      }
      groups[groupKey].records.push(record);
    });

    // 计算每个分组的统计值
    const rawResults = [];
    let totals = {};
    let totalCount = 0;
    statisticFields.forEach(sf => {
      totals[sf.fieldId] = 0;
    });

    Object.keys(groups).forEach(groupKey => {
      const group = groups[groupKey];
      const row = {
        _groupKey: groupKey,
        _recordCount: group.records.length
      };
      
      // 添加分组字段值
      group.groupValues.forEach(gv => {
        row[gv.fieldName] = gv.value;
        row[`_${gv.fieldId}`] = gv.value;
      });
      
      // 计算统计值
      statisticFields.forEach(sf => {
        const values = group.records
          .map(r => r[sf.fieldId])
          .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
          .map(v => Number(v));
        const aggValue = Core.aggregate(values, aggregation);
        row[sf.fieldName] = aggValue;
        row[`_${sf.fieldId}`] = aggValue;
        totals[sf.fieldId] += aggValue;
      });
      
      totalCount += group.records.length;
      rawResults.push(row);
    });

    // 排序
    let sortedResults = [...rawResults];
    if (sortBy) {
      const sortField = statisticFields.find(sf => sf.fieldId === sortBy);
      if (sortField) {
        sortedResults.sort((a, b) => {
          const aVal = a[sortField.fieldName] || 0;
          const bVal = b[sortField.fieldName] || 0;
          return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
        });
      }
    } else {
      // 默认按第一个统计字段降序
      if (statisticFields.length > 0) {
        const firstField = statisticFields[0];
        sortedResults.sort((a, b) => {
          const aVal = a[firstField.fieldName] || 0;
          const bVal = b[firstField.fieldName] || 0;
          return bVal - aVal;
        });
      }
    }

    // Top N 筛选
    let filteredResults = sortedResults;
    let othersRow = null;
    if (topN && topN > 0 && sortedResults.length > topN) {
      filteredResults = sortedResults.slice(0, topN);
      
      // 计算"其他"行
      const othersData = sortedResults.slice(topN);
      othersRow = {
        _groupKey: '_OTHERS',
        _recordCount: othersData.reduce((sum, r) => sum + r._recordCount, 0),
        _isOthers: true
      };
      
      groupFields.forEach(gf => {
        othersRow[gf.fieldName] = `其他 (${othersData.length}项)`;
      });
      
      statisticFields.forEach(sf => {
        othersRow[sf.fieldName] = othersData.reduce((sum, r) => sum + (r[sf.fieldName] || 0), 0);
      });
    }

    // 构建最终结果
    let results = [];
    let cumulativeRatio = {};
    statisticFields.forEach(sf => {
      cumulativeRatio[sf.fieldId] = 0;
    });

    // 添加排名和占比
    filteredResults.forEach((row, index) => {
      const newRow = { 
        ...row,
        _rank: index + 1,
        记录数: row._recordCount
      };
      
      // 计算占比和累计占比
      if (purpose === '占比分析') {
        statisticFields.forEach(sf => {
          const value = row[sf.fieldName] || 0;
          const total = totals[sf.fieldId] || 1;
          const ratio = value / total;
          newRow[`${sf.fieldName}_占比`] = ratio;
          
          cumulativeRatio[sf.fieldId] += ratio;
          newRow[`${sf.fieldName}_累计占比`] = cumulativeRatio[sf.fieldId];
        });
      }
      
      results.push(newRow);
    });

    // 添加"其他"行
    if (othersRow) {
      if (purpose === '占比分析') {
        statisticFields.forEach(sf => {
          const value = othersRow[sf.fieldName] || 0;
          const total = totals[sf.fieldId] || 1;
          othersRow[`${sf.fieldName}_占比`] = value / total;
          othersRow[`${sf.fieldName}_累计占比`] = 1;
        });
      }
      othersRow.记录数 = othersRow._recordCount;
      results.push(othersRow);
    }

    // 多级分组时添加小计行
    if (showSubtotal && groupFields.length > 1) {
      results = this.addSubtotalRows(results, groupFields, statisticFields, purpose, totals);
    }

    // 添加合计行
    const totalRow = {
      _groupKey: '_TOTAL',
      _isTotal: true,
      记录数: totalCount
    };
    groupFields.forEach((gf, index) => {
      totalRow[gf.fieldName] = index === 0 ? '合计' : '';
    });
    statisticFields.forEach(sf => {
      totalRow[sf.fieldName] = totals[sf.fieldId];
      if (purpose === '占比分析') {
        totalRow[`${sf.fieldName}_占比`] = 1;
        totalRow[`${sf.fieldName}_累计占比`] = 1;
      }
    });
    results.push(totalRow);

    return results;
  },

  /**
   * 添加小计行（多级分组）
   */
  addSubtotalRows(results, groupFields, statisticFields, purpose, totals) {
    if (groupFields.length < 2) return results;
    
    const newResults = [];
    const firstField = groupFields[0];
    let currentFirstValue = null;
    let subtotalData = [];
    
    results.forEach((row, index) => {
      if (row._isTotal || row._isOthers) {
        // 先添加上一组的小计
        if (subtotalData.length > 0 && currentFirstValue !== null) {
          newResults.push(this.createSubtotalRow(
            subtotalData, firstField, groupFields, statisticFields, purpose, totals, currentFirstValue
          ));
        }
        newResults.push(row);
        return;
      }
      
      const firstValue = row[firstField.fieldName];
      
      if (currentFirstValue !== null && firstValue !== currentFirstValue) {
        // 添加小计行
        newResults.push(this.createSubtotalRow(
          subtotalData, firstField, groupFields, statisticFields, purpose, totals, currentFirstValue
        ));
        subtotalData = [];
      }
      
      currentFirstValue = firstValue;
      subtotalData.push(row);
      newResults.push(row);
    });
    
    return newResults;
  },

  /**
   * 创建小计行
   */
  createSubtotalRow(dataRows, firstField, groupFields, statisticFields, purpose, totals, groupValue) {
    const subtotalRow = {
      _groupKey: `_SUBTOTAL_${groupValue}`,
      _isSubtotal: true,
      记录数: dataRows.reduce((sum, r) => sum + (r.记录数 || r._recordCount || 0), 0)
    };
    
    groupFields.forEach((gf, index) => {
      if (index === 0) {
        subtotalRow[gf.fieldName] = `${groupValue} 小计`;
      } else {
        subtotalRow[gf.fieldName] = '';
      }
    });
    
    statisticFields.forEach(sf => {
      const subtotal = dataRows.reduce((sum, r) => sum + (r[sf.fieldName] || 0), 0);
      subtotalRow[sf.fieldName] = subtotal;
      
      if (purpose === '占比分析') {
        const total = totals[sf.fieldId] || 1;
        subtotalRow[`${sf.fieldName}_占比`] = subtotal / total;
      }
    });
    
    return subtotalRow;
  },

  /**
   * 执行交叉表统计（透视表）
   */
  executeCrossTable(data, config) {
    const {
      purpose,
      groupFields,
      statisticFields,
      aggregation,
      crossTableField
    } = config;

    const Core = window.StatisticsCore;

    // 找到交叉表列字段
    const colField = groupFields.find(gf => gf.fieldId === crossTableField);
    const rowFields = groupFields.filter(gf => gf.fieldId !== crossTableField);
    
    if (!colField || rowFields.length === 0) {
      // 回退到普通横向统计
      return this.execute(data, { ...config, crossTableField: null });
    }

    // 获取所有列值
    const colValues = [...new Set(data.map(r => r[colField.fieldId] ?? '(空)'))].sort();
    
    // 按行字段分组
    const rowGroups = {};
    data.forEach(record => {
      const rowKey = rowFields.map(rf => record[rf.fieldId] ?? '(空)').join('|');
      const colValue = record[colField.fieldId] ?? '(空)';
      
      if (!rowGroups[rowKey]) {
        rowGroups[rowKey] = {
          rowValues: rowFields.map(rf => ({
            fieldId: rf.fieldId,
            fieldName: rf.fieldName,
            value: record[rf.fieldId] ?? '(空)'
          })),
          columns: {}
        };
      }
      
      if (!rowGroups[rowKey].columns[colValue]) {
        rowGroups[rowKey].columns[colValue] = [];
      }
      rowGroups[rowKey].columns[colValue].push(record);
    });

    // 计算统计值
    const results = [];
    const colTotals = {};
    colValues.forEach(cv => {
      colTotals[cv] = {};
      statisticFields.forEach(sf => {
        colTotals[cv][sf.fieldId] = 0;
      });
    });
    const rowTotals = {};
    let grandTotal = {};
    statisticFields.forEach(sf => {
      grandTotal[sf.fieldId] = 0;
    });

    Object.keys(rowGroups).sort().forEach(rowKey => {
      const group = rowGroups[rowKey];
      const row = {
        _rowKey: rowKey
      };
      
      // 添加行字段值
      group.rowValues.forEach(rv => {
        row[rv.fieldName] = rv.value;
      });
      
      // 初始化行合计
      rowTotals[rowKey] = {};
      statisticFields.forEach(sf => {
        rowTotals[rowKey][sf.fieldId] = 0;
      });
      
      // 计算每列的统计值
      statisticFields.forEach(sf => {
        colValues.forEach(cv => {
          const records = group.columns[cv] || [];
          const values = records
            .map(r => r[sf.fieldId])
            .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
            .map(v => Number(v));
          const aggValue = Core.aggregate(values, aggregation);
          
          // 列名格式
          const colName = statisticFields.length === 1 
            ? cv 
            : `${sf.fieldName}_${cv}`;
          row[colName] = aggValue;
          
          // 累加到列合计
          colTotals[cv][sf.fieldId] += aggValue;
          // 累加到行合计
          rowTotals[rowKey][sf.fieldId] += aggValue;
          // 累加到总计
          grandTotal[sf.fieldId] += aggValue;
        });
        
        // 添加行合计列
        const rowTotalColName = statisticFields.length === 1 
          ? '行合计' 
          : `${sf.fieldName}_行合计`;
        row[rowTotalColName] = rowTotals[rowKey][sf.fieldId];
      });
      
      results.push(row);
    });

    // 添加列合计行
    const totalRow = {
      _rowKey: '_TOTAL',
      _isTotal: true
    };
    rowFields.forEach((rf, index) => {
      totalRow[rf.fieldName] = index === 0 ? '列合计' : '';
    });
    
    statisticFields.forEach(sf => {
      colValues.forEach(cv => {
        const colName = statisticFields.length === 1 ? cv : `${sf.fieldName}_${cv}`;
        totalRow[colName] = colTotals[cv][sf.fieldId];
      });
      
      const rowTotalColName = statisticFields.length === 1 ? '行合计' : `${sf.fieldName}_行合计`;
      totalRow[rowTotalColName] = grandTotal[sf.fieldId];
    });
    
    results.push(totalRow);

    // 如果是占比分析，计算占比
    if (purpose === '占比分析') {
      results.forEach(row => {
        if (row._isTotal) return;
        
        statisticFields.forEach(sf => {
          colValues.forEach(cv => {
            const colName = statisticFields.length === 1 ? cv : `${sf.fieldName}_${cv}`;
            const value = row[colName] || 0;
            const total = grandTotal[sf.fieldId] || 1;
            row[`${colName}_占比`] = value / total;
          });
        });
      });
    }

    return results;
  }
};

// 导出到全局
window.HorizontalStatistics = HorizontalStatistics;

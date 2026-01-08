// 表单区块渲染器
// 负责渲染表单区块以及处理表单相关的操作

export const createFormRenderer = (props) => {
  const {
    formDataCache,
    setFormDataCache,
    projectId,
    forms,
    blocks,
    loadAllFormData
  } = props;

  // 编辑记录
  const handleEditRecord = async (cfg, record) => {
    alert('编辑功能 - 预览模式下暂不支持');
  };

  // 删除记录
  const handleDeleteRecord = async (cfg, record) => {
    if (!confirm('确定要删除这条记录吗？')) return;

    try {
      const targetFormId = cfg.sourceFormId || cfg.formId;
      const form = forms.find(f => f.id === cfg.formId);
      const primaryKey = form?.structure?.primaryKey;
      const pkValue = record[primaryKey];

      await window.dndDB.deleteFormData(projectId, targetFormId, pkValue);
      alert('删除成功！');

      // 重新加载数据
      await loadAllFormData(blocks, forms);
    } catch (error) {
      alert('删除失败：' + error.message);
    }
  };

  // 置顶记录
  const handleTopRecord = async (cfg, record) => {
    try {
      const targetFormId = cfg.sourceFormId || cfg.formId;
      const form = forms.find(f => f.id === cfg.formId);
      const primaryKey = form?.structure?.primaryKey;
      const pkValue = record[primaryKey];

      const isCurrentlyTop = record._isTop === true;
      const updates = {
        _isTop: !isCurrentlyTop,
        _topTime: isCurrentlyTop ? null : new Date().toISOString()
      };

      await window.dndDB.updateFormData(projectId, targetFormId, pkValue, { ...record, ...updates });

      // 重新加载数据
      await loadAllFormData(blocks, forms);
    } catch (error) {
      alert('操作失败：' + error.message);
    }
  };

  // 刷新表单数据
  const refreshFormData = async (formId) => {
    try {
      const formData = await window.dndDB.getFormDataList(projectId, formId);
      setFormDataCache(prev => ({
        ...prev,
        [formId]: formData || []
      }));
    } catch (error) {
      console.error('刷新表单数据失败:', error);
    }
  };

  // 渲染表单区块
  const renderFormBlock = (block, blockStyle, contentStyle, PopupCloseButton) => {
    const cfg = block.formConfig;
    const style = block.style || {};

    // 从内容样式获取字体设置
    const fontSize = contentStyle.fontSize || 14;
    const fontFamily = contentStyle.fontFamily || 'inherit';
    const tableFontSize = fontSize * 0.85; // 表格字体稍小

    if (!cfg || !cfg.formId) {
      return (
        <div key={block.id} style={blockStyle}>
          {PopupCloseButton && <PopupCloseButton />}
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: fontSize,
            fontFamily: fontFamily,
          }}>
            未配置表单
          </div>
        </div>
      );
    }

    const headers = cfg.fieldInfos?.map(f => f.fieldName) || [];
    const realData = formDataCache[cfg.formId] || [];

    // 排序（置顶优先，然后按显示顺序）
    let sortedData = [...realData];

    // 先分离置顶和普通数据
    const topData = sortedData.filter(d => d._isTop);
    const normalData = sortedData.filter(d => !d._isTop);

    // 置顶数据按置顶时间排序（最新置顶在前）
    topData.sort((a, b) => new Date(b._topTime || 0) - new Date(a._topTime || 0));

    // 普通数据根据sortOrder配置排序
    if (cfg.sortOrder === 'asc') {
      // 顺序：最早在前（按createdAt升序）
      normalData.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      // 倒序：最新在前（按createdAt降序，默认）
      normalData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    // 合并：置顶在前，普通数据在后
    sortedData = [...topData, ...normalData];

    // 限制数据量
    let displayData = sortedData;
    if (cfg.totalRecords && parseInt(cfg.totalRecords) > 0) {
      displayData = displayData.slice(0, parseInt(cfg.totalRecords));
    }

    // 构建表格行
    const tableRows = displayData.map(record => {
      return cfg.fieldInfos?.map(f => {
        const value = record[f.fieldId];
        return value !== undefined && value !== null ? String(value) : '-';
      }) || [];
    });

    // 操作栏配置
    const actionColumn = cfg.actionColumn;

    // 计算边框样式
    const showOuterBorder = cfg.showOuterBorder !== false;
    const showInnerBorder = cfg.showInnerBorder !== false;
    const borderColor = cfg.borderColor || '#e5e7eb';
    const borderWidth = cfg.borderWidth || 1;
    const innerHorizontalBorderColor = cfg.innerHorizontalBorderColor || borderColor;
    const innerHorizontalBorderWidth = cfg.innerHorizontalBorderWidth || borderWidth;
    const innerVerticalBorderColor = cfg.innerVerticalBorderColor || borderColor;
    const innerVerticalBorderWidth = cfg.innerVerticalBorderWidth || borderWidth;

    return (
      <div key={block.id} style={{ ...blockStyle, overflow: 'auto' }}>
        {PopupCloseButton && <PopupCloseButton />}

        {/* 表单名称 */}
        {cfg.formName && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '4px',
          }}>
            <span style={{
              fontSize: '11px',
              color: '#6b7280',
            }}>
              表单: {cfg.formName}
            </span>
            <button
              onClick={() => refreshFormData(cfg.formId)}
              style={{
                padding: '2px 8px',
                fontSize: '11px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
              title="刷新表单数据"
            >
              🔄 刷新
            </button>
          </div>
        )}

        <div style={{
          border: showOuterBorder ? `${borderWidth}px solid ${borderColor}` : 'none',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: cfg.cellFontSize || tableFontSize,
            fontFamily: cfg.cellFontFamily || fontFamily,
            tableLayout: Object.keys(cfg.columnWidths || {}).length > 0 || actionColumn?.enabled ? 'fixed' : 'auto',
          }}>
            <thead>
              <tr>
                {headers.map((header, i) => {
                  const fieldId = cfg.fieldInfos?.[i]?.fieldId || cfg.displayFields?.[i];
                  const colWidth = cfg.columnWidths?.[fieldId];
                  const hasActionCol = actionColumn?.enabled;
                  const isLastDataCol = !hasActionCol && i === headers.length - 1;
                  return (
                    <th key={i} style={{
                      backgroundColor: cfg.headerBgColor || '#f3f4f6',
                      color: cfg.headerTextColor || '#374151',
                      padding: `${cfg.cellPaddingTop || 4}px ${cfg.cellPaddingRight || 8}px ${cfg.cellPaddingBottom || 4}px ${cfg.cellPaddingLeft || 8}px`,
                      textAlign: 'left',
                      fontWeight: 'bold',
                      height: `${cfg.headerHeight || 40}px`,
                      fontSize: `${cfg.headerFontSize || 13}px`,
                      fontFamily: cfg.headerFontFamily || 'Arial',
                      width: colWidth ? `${colWidth}px` : 'auto',
                      borderBottom: showInnerBorder ? `${innerHorizontalBorderWidth}px solid ${innerHorizontalBorderColor}` : 'none',
                      borderRight: showInnerBorder && !isLastDataCol ? `${innerVerticalBorderWidth}px solid ${innerVerticalBorderColor}` : 'none',
                    }}>
                      {header}
                    </th>
                  );
                })}
                {actionColumn?.enabled && (
                  <th style={{
                    backgroundColor: cfg.headerBgColor || '#f3f4f6',
                    color: cfg.headerTextColor || '#374151',
                    padding: `${cfg.cellPaddingTop || 4}px ${cfg.cellPaddingRight || 8}px ${cfg.cellPaddingBottom || 4}px ${cfg.cellPaddingLeft || 8}px`,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    height: `${cfg.headerHeight || 40}px`,
                    fontSize: `${cfg.headerFontSize || 13}px`,
                    fontFamily: cfg.headerFontFamily || 'Arial',
                    borderBottom: showInnerBorder ? `${innerHorizontalBorderWidth}px solid ${innerHorizontalBorderColor}` : 'none',
                    width: `${actionColumn.width || 150}px`,
                  }}>
                    {actionColumn.title || '操作'}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + (actionColumn?.enabled ? 1 : 0)} style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#9ca3af',
                  }}>
                    暂无数据
                  </td>
                </tr>
              ) : (
                tableRows.map((row, rowIndex) => {
                  const record = displayData[rowIndex];
                  const isLastRow = rowIndex === tableRows.length - 1;
                  return (
                    <tr key={rowIndex} style={{
                      height: `${cfg.rowHeight || 36}px`,
                      backgroundColor: record._isTop ? '#fef3c7' : (rowIndex % 2 === 0 ? (cfg.rowBgColor || '#fff') : (cfg.rowAltBgColor || '#f9fafb')),
                    }}>
                      {row.map((cell, colIndex) => {
                        const fieldId = cfg.fieldInfos?.[colIndex]?.fieldId || cfg.displayFields?.[colIndex];
                        const colWidth = cfg.columnWidths?.[fieldId];
                        const hasActionCol = actionColumn?.enabled;
                        const isLastDataCol = !hasActionCol && colIndex === row.length - 1;
                        return (
                          <td key={colIndex} style={{
                            padding: `${cfg.cellPaddingTop || 4}px ${cfg.cellPaddingRight || 8}px ${cfg.cellPaddingBottom || 4}px ${cfg.cellPaddingLeft || 8}px`,
                            color: cfg.cellColor || '#374151',
                            textAlign: cfg.cellTextAlign || 'left',
                            verticalAlign: cfg.cellVerticalAlign || 'middle',
                            whiteSpace: cfg.cellWordWrap === 'nowrap' ? 'nowrap' : (cfg.cellWordWrap === 'break-word' ? 'break-word' : 'normal'),
                            borderBottom: showInnerBorder ? `${innerHorizontalBorderWidth}px solid ${innerHorizontalBorderColor}` : 'none',
                            borderRight: showInnerBorder && !isLastDataCol ? `${innerVerticalBorderWidth}px solid ${innerVerticalBorderColor}` : 'none',
                            width: colWidth ? `${colWidth}px` : 'auto',
                          }}>
                            {record._isTop && colIndex === 0 && <span style={{ marginRight: '4px' }}>📌</span>}
                            {cell}
                          </td>
                        );
                      })}
                      {actionColumn?.enabled && (
                        <td style={{
                          padding: `${cfg.cellPaddingTop || 4}px ${cfg.cellPaddingRight || 8}px ${cfg.cellPaddingBottom || 4}px ${cfg.cellPaddingLeft || 8}px`,
                          textAlign: 'center',
                          verticalAlign: cfg.cellVerticalAlign || 'middle',
                          borderBottom: showInnerBorder ? `${innerHorizontalBorderWidth}px solid ${innerHorizontalBorderColor}` : 'none',
                          width: `${actionColumn.width || 150}px`,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                            {actionColumn.buttons?.edit?.enabled && (
                              <button
                                onClick={() => handleEditRecord(cfg, record)}
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  color: '#fff',
                                  backgroundColor: actionColumn.buttons.edit.color || '#3b82f6',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                }}
                              >
                                {actionColumn.buttons.edit.text || '修改'}
                              </button>
                            )}
                            {actionColumn.buttons?.delete?.enabled && (
                              <button
                                onClick={() => handleDeleteRecord(cfg, record)}
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  color: '#fff',
                                  backgroundColor: actionColumn.buttons.delete.color || '#ef4444',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                }}
                              >
                                {actionColumn.buttons.delete.text || '删除'}
                              </button>
                            )}
                            {actionColumn.buttons?.top?.enabled && (
                              <button
                                onClick={() => handleTopRecord(cfg, record)}
                                style={{
                                  padding: '2px 8px',
                                  fontSize: '11px',
                                  color: '#fff',
                                  backgroundColor: actionColumn.buttons.top.color || '#f59e0b',
                                  border: 'none',
                                  borderRadius: '3px',
                                  cursor: 'pointer',
                                }}
                              >
                                {record._isTop
                                  ? (actionColumn.buttons.top.textOn || '取消置顶')
                                  : (actionColumn.buttons.top.textOff || '置顶')
                                }
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* 表尾 - 显示汇总数据 */}
            {cfg.footerEnabled && tableRows.length > 0 && (
              <tfoot>
                <tr>
                  {headers.map((_, colIndex) => {
                    const fieldId = cfg.fieldInfos?.[colIndex]?.fieldId || cfg.displayFields?.[colIndex];
                    const colWidth = cfg.columnWidths?.[fieldId];
                    const hasActionCol = actionColumn?.enabled;
                    const isLastDataCol = !hasActionCol && colIndex === headers.length - 1;

                    // 汇总该列的所有数据
                    const values = displayData.map(row => {
                      const val = row[fieldId];
                      return parseFloat(val);
                    }).filter(v => !isNaN(v));

                    let summaryText = 'NA';
                    if (values.length > 0) {
                      const sum = values.reduce((a, b) => a + b, 0);
                      const avg = sum / values.length;
                      const max = Math.max(...values);
                      const min = Math.min(...values);
                      const count = values.length;
                      summaryText = `Σ${sum.toFixed(2)}  ̄x${avg.toFixed(2)}  Max${max.toFixed(2)}  Min${min.toFixed(2)}  N${count}`;
                    }

                    return (
                      <td key={colIndex} style={{
                        backgroundColor: cfg.footerBgColor || '#f3f4f6',
                        color: cfg.footerTextColor || '#374151',
                        height: `${cfg.footerHeight || 36}px`,
                        width: colWidth ? `${colWidth}px` : 'auto',
                        padding: `${cfg.cellPaddingTop || 4}px ${cfg.cellPaddingRight || 8}px ${cfg.cellPaddingBottom || 4}px ${cfg.cellPaddingLeft || 8}px`,
                        textAlign: 'right',
                        fontWeight: 'bold',
                        fontSize: `${cfg.footerFontSize || 12}px`,
                        fontFamily: cfg.footerFontFamily || 'Arial',
                        borderTop: showInnerBorder ? `${innerHorizontalBorderWidth}px solid ${innerHorizontalBorderColor}` : 'none',
                        borderRight: showInnerBorder && !isLastDataCol ? `${innerVerticalBorderWidth}px solid ${innerVerticalBorderColor}` : 'none',
                      }}>
                        {summaryText}
                      </td>
                    );
                  })}
                  {/* 操作列表尾 */}
                  {actionColumn?.enabled && (
                    <td style={{
                      backgroundColor: cfg.footerBgColor || '#f3f4f6',
                      color: cfg.footerTextColor || '#374151',
                      height: `${cfg.footerHeight || 36}px`,
                      padding: `${cfg.cellPaddingTop || 4}px ${cfg.cellPaddingRight || 8}px ${cfg.cellPaddingBottom || 4}px ${cfg.cellPaddingLeft || 8}px`,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: `${cfg.footerFontSize || 12}px`,
                      fontFamily: cfg.footerFontFamily || 'Arial',
                      borderTop: showInnerBorder ? `${innerHorizontalBorderWidth}px solid ${innerHorizontalBorderColor}` : 'none',
                    }}>
                      汇总
                    </td>
                  )}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  return {
    renderFormBlock,
    handleEditRecord,
    handleDeleteRecord,
    handleTopRecord,
    refreshFormData
  };
};

// 表单设计渲染器
// 负责在设计页渲染表单区块，包括列宽调整功能

export const createFormDesignRenderer = (props) => {
  const {
    formDataCache,
    setFormDataCache,
    projectId,
    setColumnResizeState,
    refreshFormData
  } = props;

  // 渲染表单内容（设计页版本）
  const renderFormContent = (block, contentStyle) => {
    const formConfig = block.formConfig;

    if (!formConfig || !formConfig.formId) {
      return (
        <div style={{
          ...contentStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
          cursor: 'move',
        }}>
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>📋</span>
          <span style={{ fontSize: '12px' }}>在左侧面板配置表单</span>
        </div>
      );
    }

    // 有配置时显示表格
    const cfg = formConfig;
    const fieldCount = cfg.displayFields?.length || 0;

    // 使用真实字段名称
    const headers = cfg.fieldInfos
      ? cfg.fieldInfos.map(f => f.fieldName)
      : cfg.displayFields?.map((_, i) => `列${i+1}`) || ['列1', '列2', '列3'];

    // 获取真实数据
    const realData = formDataCache[cfg.formId] || [];

    // 根据显示顺序排序（置顶优先）
    let sortedData = [...realData];

    // 先按置顶排序
    sortedData.sort((a, b) => {
      const aTop = a._isTop ? 1 : 0;
      const bTop = b._isTop ? 1 : 0;
      return bTop - aTop;  // 置顶的排前面
    });

    // 再按录入顺序排序（非置顶的数据）
    const topData = sortedData.filter(d => d._isTop);
    const normalData = sortedData.filter(d => !d._isTop);

    // 根据sortOrder配置决定顺序
    if (cfg.sortOrder === 'asc') {
      // 顺序：最早在前（按createdAt升序）
      normalData.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else {
      // 倒序：最新在前（按createdAt降序，默认）
      normalData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    sortedData = [...topData, ...normalData];

    // 根据配置限制数据量
    let displayData = sortedData;
    if (cfg.totalRecords && parseInt(cfg.totalRecords) > 0) {
      displayData = displayData.slice(0, parseInt(cfg.totalRecords));
    }

    // 构建表格行数据
    const tableRows = displayData.length > 0
      ? displayData.map(record => {
          // 获取每个字段的值
          return cfg.fieldInfos
            ? cfg.fieldInfos.map(f => {
                const value = record[f.fieldId];
                return value !== undefined && value !== null ? String(value) : '-';
              })
            : cfg.displayFields.map(fieldId => {
                const value = record[fieldId];
                return value !== undefined && value !== null ? String(value) : '-';
              });
        })
      : [
          // 没有数据时显示占位行
          headers.map(() => '暂无数据')
        ];

    // 计算表尾汇总数据（所有列）
    let footerValues = [];
    if (cfg.footerEnabled && displayData.length > 0) {
      footerValues = headers.map((_, colIndex) => {
        const fieldId = cfg.fieldInfos?.[colIndex]?.fieldId || cfg.displayFields?.[colIndex];
        if (!fieldId) return 'NA';

        // 汇总该列的所有数据
        const values = displayData.map(row => {
          const val = row[fieldId];
          return parseFloat(val);
        }).filter(v => !isNaN(v));

        if (values.length === 0) return 'NA';

        // 默认使用求和
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const count = values.length;

        // 格式化显示（显示多种汇总值）
        return `Σ${sum.toFixed(2)}  ̄x${avg.toFixed(2)}  Max${max.toFixed(2)}  Min${min.toFixed(2)}  N${count}`;
      });
    }

    // 列宽拖拽开始
    const handleColumnResizeStart = (e, colIndex, fieldId) => {
      e.stopPropagation();
      const th = e.currentTarget.parentElement;
      const width = th.getBoundingClientRect().width;

      setColumnResizeState({
        isResizing: true,
        colIndex,
        startX: e.clientX,
        startWidth: width,
        fieldId
      });
    };

    return (
      <div style={{
        ...contentStyle,
        width: '100%',
        height: '100%',
        overflow: 'auto',
      }}>
        {/* 顶部说明 */}
        {cfg.topDescriptionEnabled && cfg.topDescriptionText && (
          <div style={{
            fontSize: `${cfg.topDescriptionFontSize}px`,
            color: cfg.topDescriptionColor,
            textAlign: cfg.topDescriptionAlign,
            padding: `${cfg.topDescriptionPadding}px`,
            marginBottom: '4px',
          }}>
            {cfg.topDescriptionText}
          </div>
        )}

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
              onClick={refreshFormData}
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
          border: cfg.showOuterBorder ? `${cfg.borderWidth}px solid ${cfg.borderColor}` : 'none',
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '12px',
            tableLayout: Object.keys(cfg.columnWidths || {}).length > 0 || cfg.actionColumn?.enabled ? 'fixed' : 'auto',
          }}>
            <thead>
              <tr>
                {headers.map((header, i) => {
                  // 获取对应字段的列宽
                  const fieldId = cfg.fieldInfos?.[i]?.fieldId || cfg.displayFields?.[i];
                  const colWidth = cfg.columnWidths?.[fieldId];
                  const hasActionCol = cfg.actionColumn?.enabled;
                  const isLastDataCol = !hasActionCol && i === headers.length - 1;

                  return (
                    <th key={i} style={{
                      backgroundColor: cfg.headerBgColor,
                      color: cfg.headerTextColor,
                      height: `${cfg.headerHeight}px`,
                      padding: '4px 8px',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      fontSize: `${cfg.headerFontSize || 13}px`,
                      fontFamily: cfg.headerFontFamily || 'Arial',
                      width: colWidth ? `${colWidth}px` : 'auto',
                      borderBottom: cfg.showInnerBorder ? `${cfg.innerHorizontalBorderWidth || cfg.borderWidth}px solid ${cfg.innerHorizontalBorderColor || cfg.borderColor}` : 'none',
                      borderRight: cfg.showInnerBorder && !isLastDataCol ? `${cfg.innerVerticalBorderWidth || cfg.borderWidth}px solid ${cfg.innerVerticalBorderColor || cfg.borderColor}` : 'none',
                      position: 'relative',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span>{header}</span>
                        {/* 列宽拖拽手柄 */}
                        <div
                          onMouseDown={(e) => handleColumnResizeStart(e, i, fieldId)}
                          style={{
                            position: 'absolute',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '4px',
                            cursor: 'col-resize',
                            backgroundColor: 'transparent',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        />
                      </div>
                    </th>
                  );
                })}
                {/* 操作列表头 - 使用衍生表的actionColumn配置 */}
                {cfg.actionColumn?.enabled && (
                  <th style={{
                    backgroundColor: cfg.headerBgColor,
                    color: cfg.headerTextColor,
                    height: `${cfg.headerHeight}px`,
                    padding: '4px 8px',
                    textAlign: 'center',
                    fontWeight: 'bold',
                    fontSize: `${cfg.headerFontSize || 13}px`,
                    fontFamily: cfg.headerFontFamily || 'Arial',
                    borderBottom: cfg.showInnerBorder ? `${cfg.innerHorizontalBorderWidth || cfg.borderWidth}px solid ${cfg.innerHorizontalBorderColor || cfg.borderColor}` : 'none',
                    width: `${cfg.actionColumn.width || 150}px`,
                  }}>
                    {cfg.actionColumn.title || '操作'}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rowIndex) => {
                const record = displayData[rowIndex] || {};
                const isTop = record._isTop;
                const isLastRow = rowIndex === tableRows.length - 1;
                const rowBg = isTop ? '#fef3c7' : (rowIndex % 2 === 0 ? (cfg.rowBgColor || '#fff') : (cfg.rowAltBgColor || '#f9fafb'));

                return (
                  <tr key={rowIndex} style={{
                    height: `${cfg.rowHeight || 36}px`,
                    backgroundColor: rowBg,
                  }}>
                    {row.map((cell, colIndex) => {
                      const fieldId = cfg.fieldInfos?.[colIndex]?.fieldId || cfg.displayFields?.[colIndex];
                      const colWidth = cfg.columnWidths?.[fieldId];
                      const hasActionCol = cfg.actionColumn?.enabled;
                      const isLastDataCol = !hasActionCol && colIndex === row.length - 1;

                      return (
                        <td key={colIndex} style={{
                          padding: `${cfg.cellPaddingTop || 4}px ${cfg.cellPaddingRight || 8}px ${cfg.cellPaddingBottom || 4}px ${cfg.cellPaddingLeft || 8}px`,
                          color: cfg.cellColor || '#374151',
                          textAlign: cfg.cellTextAlign || 'left',
                          verticalAlign: cfg.cellVerticalAlign || 'middle',
                          whiteSpace: cfg.cellWordWrap === 'nowrap' ? 'nowrap' : (cfg.cellWordWrap === 'break-word' ? 'break-word' : 'normal'),
                          borderBottom: cfg.showInnerBorder ? `${cfg.innerHorizontalBorderWidth || cfg.borderWidth}px solid ${cfg.innerHorizontalBorderColor || cfg.borderColor}` : 'none',
                          borderRight: cfg.showInnerBorder && !isLastDataCol ? `${cfg.innerVerticalBorderWidth || cfg.borderWidth}px solid ${cfg.innerVerticalBorderColor || cfg.borderColor}` : 'none',
                          width: colWidth ? `${colWidth}px` : 'auto',
                        }}>
                          {isTop && colIndex === 0 && <span style={{ marginRight: '4px' }}>📌</span>}
                          {cell}
                        </td>
                      );
                    })}
                    {/* 操作列 */}
                    {cfg.actionColumn?.enabled && (
                      <td style={{
                        padding: `${cfg.cellPaddingTop || 4}px ${cfg.cellPaddingRight || 8}px ${cfg.cellPaddingBottom || 4}px ${cfg.cellPaddingLeft || 8}px`,
                        textAlign: 'center',
                        verticalAlign: cfg.cellVerticalAlign || 'middle',
                        borderBottom: cfg.showInnerBorder ? `${cfg.innerHorizontalBorderWidth || cfg.borderWidth}px solid ${cfg.innerHorizontalBorderColor || cfg.borderColor}` : 'none',
                        width: `${cfg.actionColumn.width || 150}px`,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          {cfg.actionColumn.buttons?.edit?.enabled && (
                            <button style={{
                              padding: '2px 8px',
                              fontSize: '11px',
                              color: '#fff',
                              backgroundColor: cfg.actionColumn.buttons.edit.color || '#3b82f6',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                            }}>
                              {cfg.actionColumn.buttons.edit.text || '修改'}
                            </button>
                          )}
                          {cfg.actionColumn.buttons?.delete?.enabled && (
                            <button style={{
                              padding: '2px 8px',
                              fontSize: '11px',
                              color: '#fff',
                              backgroundColor: cfg.actionColumn.buttons.delete.color || '#ef4444',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                            }}>
                              {cfg.actionColumn.buttons.delete.text || '删除'}
                            </button>
                          )}
                          {cfg.actionColumn.buttons?.top?.enabled && (
                            <button style={{
                              padding: '2px 8px',
                              fontSize: '11px',
                              color: '#fff',
                              backgroundColor: cfg.actionColumn.buttons.top.color || '#f59e0b',
                              border: 'none',
                              borderRadius: '3px',
                              cursor: 'pointer',
                            }}>
                              {isTop
                                ? (cfg.actionColumn.buttons.top.textOn || '取消置顶')
                                : (cfg.actionColumn.buttons.top.textOff || '置顶')
                              }
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>

            {/* 表尾 */}
            {cfg.footerEnabled && tableRows.length > 0 && (
              <tfoot>
                <tr>
                  {footerValues.map((value, colIndex) => {
                    const fieldId = cfg.fieldInfos?.[colIndex]?.fieldId || cfg.displayFields?.[colIndex];
                    const colWidth = cfg.columnWidths?.[fieldId];
                    const hasActionCol = cfg.actionColumn?.enabled;
                    const isLastDataCol = !hasActionCol && colIndex === footerValues.length - 1;

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
                        borderTop: cfg.showInnerBorder ? `${cfg.innerHorizontalBorderWidth || cfg.borderWidth}px solid ${cfg.innerHorizontalBorderColor || cfg.borderColor}` : 'none',
                        borderRight: cfg.showInnerBorder && !isLastDataCol ? `${cfg.innerVerticalBorderWidth || cfg.borderWidth}px solid ${cfg.innerVerticalBorderColor || cfg.borderColor}` : 'none',
                      }}>
                        {value}
                      </td>
                    );
                  })}
                  {/* 操作列表尾 */}
                  {cfg.actionColumn?.enabled && (
                    <td style={{
                      backgroundColor: cfg.footerBgColor || '#f3f4f6',
                      color: cfg.footerTextColor || '#374151',
                      height: `${cfg.footerHeight || 36}px`,
                      padding: `${cfg.cellPaddingTop || 4}px ${cfg.cellPaddingRight || 8}px ${cfg.cellPaddingBottom || 4}px ${cfg.cellPaddingLeft || 8}px`,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: `${cfg.footerFontSize || 12}px`,
                      fontFamily: cfg.footerFontFamily || 'Arial',
                      borderTop: cfg.showInnerBorder ? `${cfg.innerHorizontalBorderWidth || cfg.borderWidth}px solid ${cfg.innerHorizontalBorderColor || cfg.borderColor}` : 'none',
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
    renderFormContent
  };
};

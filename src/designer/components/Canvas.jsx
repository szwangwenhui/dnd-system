// 画布组件
function DesignerCanvas({
  blocks,
  selectedBlockId,
  canvasType,
  scale,
  onSelectBlock,
  onBlockDragStart,
  onBlockResizeStart,
  onCanvasClick,
  onBlockContentChange,
  onBlockStyleChange,
  projectId,
  forms = [],
  fields = [],
  canvasDecorations = [],  // 画布装饰层（图形编辑器绘制的内容）
  areas = [],
  showAreas = false,
  hideContentInAreas = false,
  currentAreaId = null,
  onAreaDragStart = null,
  onAreaResizeStart = null,
  viewportAnchorX = 0,
  viewportAnchorY = 0
}) {
  // 使用共享的画布配置
  const config = window.StyleUtils?.getCanvasConfig(canvasType) || {
    width: canvasType === 'Mobile' ? 360 : 1200,
    minHeight: canvasType === 'Mobile' ? 640 : 800,
    label: canvasType === 'Mobile' ? '手机端 (宽度360)' : 'PC端 (宽度1200)'
  };
  
  // 当前正在编辑的区块ID
  const [editingBlockId, setEditingBlockId] = React.useState(null);

  // 列宽拖拽状态
  const [columnResizeState, setColumnResizeState] = React.useState({
    isResizing: false,
    colIndex: -1,
    startX: 0,
    startWidth: 0,
    fieldId: null
  });
  
  // 表单数据缓存 - 用于显示真实数据
  const [formDataCache, setFormDataCache] = React.useState({});

  // 加载表单数据
  React.useEffect(() => {
    const loadFormData = async () => {
      // 找出所有配置了表单的区块
      const formBlocks = blocks.filter(b =>
        b.contentType === '表单' && b.formConfig && b.formConfig.formId
      );

      if (formBlocks.length === 0) return;

      const newCache = { ...formDataCache };

      for (const block of formBlocks) {
        const formId = block.formConfig.formId;
        // 如果已经缓存了，跳过
        if (newCache[formId]) continue;

        try {
          // 加载表单数据
          const formData = await window.dndDB.getFormDataList(projectId, formId);
          newCache[formId] = formData || [];
        } catch (error) {
          console.error('加载表单数据失败:', formId, error);
          newCache[formId] = [];
        }
      }

      setFormDataCache(newCache);
    };

    if (projectId) {
      loadFormData();
    }
  }, [blocks, projectId]);

  // 刷新表单数据
  const refreshFormData = async () => {
    const formBlocks = blocks.filter(b =>
      b.contentType === '表单' && b.formConfig && b.formConfig.formId
    );

    if (formBlocks.length === 0) return;

    const newCache = { ...formDataCache };

    for (const block of formBlocks) {
      const formId = block.formConfig.formId;
      try {
        // 强制重新加载表单数据
        const formData = await window.dndDB.getFormDataList(projectId, formId);
        newCache[formId] = formData || [];
      } catch (error) {
        console.error('刷新表单数据失败:', formId, error);
        newCache[formId] = [];
      }
    }

    setFormDataCache(newCache);
  };

  // 全局列宽拖拽处理
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      if (columnResizeState.isResizing) {
        const deltaX = e.clientX - columnResizeState.startX;
        const newWidth = Math.max(50, Math.min(500, columnResizeState.startWidth + deltaX));

        // 找到当前拖拽的表单区块并更新列宽
        const resizingBlock = blocks.find(b => b.id === selectedBlockId);
        if (resizingBlock && onBlockStyleChange && resizingBlock.formConfig) {
          const updatedColumnWidths = { ...resizingBlock.formConfig.columnWidths, [columnResizeState.fieldId]: Math.round(newWidth) };
          const updatedFormConfig = { ...resizingBlock.formConfig, columnWidths: updatedColumnWidths };
          onBlockStyleChange(resizingBlock.id, 'formConfig', updatedFormConfig);
        }
      }
    };

    const handleMouseUp = () => {
      if (columnResizeState.isResizing) {
        setColumnResizeState({
          isResizing: false,
          colIndex: -1,
          startX: 0,
          startWidth: 0,
          fieldId: null
        });
      }
    };

    if (columnResizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [columnResizeState, blocks, selectedBlockId, onBlockStyleChange]);

  // 使用共享的样式工具
  const { buildBlockContainerStyle, buildBlockContentStyle, calculateCanvasHeight, getCanvasConfig } = window.StyleUtils || {};

  // 处理显示区块的内容变化
  const handleContentChange = (blockId, element) => {
    if (onBlockContentChange && element) {
      onBlockContentChange(blockId, {
        type: 'richtext',
        html: element.innerHTML,
        text: element.innerText
      });
    }
  };

  // 处理回车键 - 插入换行而不是新段落
  const handleKeyDown = (e, blockId) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // 插入换行符
      document.execCommand('insertLineBreak');
    }
  };

  // 渲染单个区块
  const renderBlock = (block) => {
    const isSelected = selectedBlockId === block.id;
    const isEditing = editingBlockId === block.id;
    const style = block.style || {};
    const s = scale / 100;
    const isDisplayBlock = block.type === '显示';
    const isButtonBlock = block.type === '按钮';
    const isPopupBlock = block.isPopup || false;
    const layer = style.zIndex ?? 0;

    // 弹窗区块在设计页面：层级为-1时完全隐藏
    if (isPopupBlock && layer === -1) {
      return null;
    }

    // 使用共享的样式工具构建容器样式
    const scaledStyle = buildBlockContainerStyle ? buildBlockContainerStyle(block, {
      scale: scale,
      isButtonBlock: isButtonBlock,
      forDesigner: true
    }) : {
      // 回退：如果共享工具未加载，使用基础样式
      position: 'absolute',
      left: block.x * s,
      top: block.y * s,
      width: block.width * s,
      height: block.height * s,
      cursor: 'move',
      zIndex: style.zIndex || 0,
      backgroundColor: isButtonBlock ? 'transparent' : (style.backgroundColor || '#ffffff'),
      borderStyle: style.borderStyle || 'solid',
      borderWidth: style.borderWidth || 1,
      borderColor: style.borderColor || '#cccccc',
      borderRadius: style.borderRadius || 0,
    };

    // 使用共享的样式工具构建内容样式
    const contentStyle = buildBlockContentStyle ? buildBlockContentStyle(block, { scale: scale }) : {
      // 回退：如果共享工具未加载，使用基础样式
      width: '100%',
      height: '100%',
      paddingTop: 8 * s,
      paddingRight: 8 * s,
      paddingBottom: 8 * s,
      paddingLeft: 8 * s,
      fontSize: (style.fontSize || 14) * s,
      fontWeight: style.fontWeight || 'normal',
      textAlign: style.textAlign || 'left',
      color: style.color || '#333333',
      overflow: 'auto',
      wordBreak: 'break-word',
      whiteSpace: 'pre-wrap',
      outline: 'none',
    };

    // 获取区块内容
    const getBlockContent = () => {
      if (!block.content) return '';
      // 如果是对象格式 { html: ..., text: ... }
      if (typeof block.content === 'object') {
        return block.content.html || block.content.text || '';
      }
      // 如果是字符串格式
      if (typeof block.content === 'string') {
        return block.content;
      }
      return '';
    };

    // 渲染显示区块
    const renderDisplayBlock = () => {
      const contentType = block.contentType || '文字';
      const sourceType = block.sourceType || '静态';
      
      // 根据内容类型渲染不同内容
      switch (contentType) {
        case '图片':
          return renderImageContent();
        case '视频':
          return renderVideoContent();
        case '表单':
          return renderFormContent();
        case '文字':
        default:
          return renderTextContent();
      }
    };

    // 渲染文字内容
    const renderTextContent = () => {
      const content = getBlockContent();
      const isEmpty = !content || content.trim() === '' || content === '<br>';
      
      return (
        <div
          contentEditable={isEditing}
          suppressContentEditableWarning={true}
          style={{
            ...contentStyle,
            cursor: isEditing ? 'text' : 'move',
            color: isEmpty && !isEditing ? '#9ca3af' : contentStyle.color,
            fontStyle: isEmpty && !isEditing ? 'italic' : contentStyle.fontStyle,
          }}
          onBlur={(e) => {
            handleContentChange(block.id, e.currentTarget);
            setEditingBlockId(null);
          }}
          onKeyDown={(e) => handleKeyDown(e, block.id)}
          dangerouslySetInnerHTML={{ __html: isEmpty && !isEditing ? '双击编辑文字...' : content }}
        />
      );
    };

    // 渲染图片内容
    const renderImageContent = () => {
      // 支持两种格式：block.imageUrl 或 block.content.imageUrl
      const imageUrl = block.imageUrl || (block.content?.imageUrl) || '';
      const hasImage = !!imageUrl;

      if (!hasImage) {
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
            <span style={{ fontSize: '24px', marginBottom: '4px' }}>🖼️</span>
            <span style={{ fontSize: '12px' }}>在左侧面板上传图片</span>
          </div>
        );
      }

      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img
            src={imageUrl}
            alt={block.imageName || '图片'}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              // 触发图片预览
              window.dispatchEvent(new CustomEvent('previewImage', {
                detail: { url: imageUrl, name: block.imageName }
              }));
            }}
          />
        </div>
      );
    };

    // 渲染视频内容
    const renderVideoContent = () => {
      const hasVideo = block.videoUrl;
      
      if (!hasVideo) {
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
            <span style={{ fontSize: '24px', marginBottom: '4px' }}>🎬</span>
            <span style={{ fontSize: '12px' }}>在左侧面板上传视频</span>
          </div>
        );
      }
      
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <video
            src={block.videoUrl}
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              // 触发视频预览
              window.dispatchEvent(new CustomEvent('previewVideo', {
                detail: { url: block.videoUrl, name: block.videoName }
              }));
            }}
          >
            您的浏览器不支持视频播放
          </video>
        </div>
      );
    };

    // 渲染表单/表格内容
    const renderFormContent = () => {
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
                    width: `${cfg.actionColumn.width || 150}px`,
                    borderBottom: cfg.showInnerBorder ? `${cfg.borderWidth}px solid ${cfg.borderColor}` : 'none',
                  }}>
                    {cfg.actionColumn.title || '操作'}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, rowIndex) => {
                // 获取该行对应的原始数据记录
                const recordData = displayData[rowIndex] || {};
                const hasActionCol = cfg.actionColumn?.enabled;
                const actionButtons = cfg.actionColumn?.buttons || {};

                // 收集该行所有被合并的单元格位置
                const mergedCellsInRow = cfg.specialCells?.filter(sc =>
                  rowIndex >= sc.startRow && rowIndex <= sc.endRow
                ) || [];

                return (
                  <tr key={rowIndex}>
                    {row.map((cell, colIndex) => {
                      // 检查该单元格是否已被合并
                      const isMerged = mergedCellsInRow.some(sc =>
                        rowIndex > sc.startRow && colIndex >= sc.startCol && colIndex <= sc.endCol
                      );
                      if (isMerged) return null;

                      // 检查是否为特殊单元格（合并区域）
                      const specialCell = cfg.specialCells?.find(sc =>
                        rowIndex === sc.startRow && colIndex === sc.startCol
                      );

                      // 计算colspan和rowspan
                      const colspan = specialCell ? (specialCell.endCol - specialCell.startCol + 1) : 1;
                      const rowspan = specialCell ? (specialCell.endRow - specialCell.startRow + 1) : 1;

                      // 获取对应字段的列宽
                      const fieldId = cfg.fieldInfos?.[colIndex]?.fieldId || cfg.displayFields?.[colIndex];
                      const colWidth = cfg.columnWidths?.[fieldId];
                      const isLastDataCol = !hasActionCol && colIndex === row.length - 1;

                      // 特殊单元格样式优先
                      const cellStyle = specialCell ? {
                        fontFamily: specialCell.fontFamily || cfg.cellFontFamily,
                        fontSize: `${specialCell.fontSize || cfg.cellFontSize}px`,
                        color: specialCell.color || cfg.cellColor,
                        backgroundColor: specialCell.bgColor,
                        paddingTop: `${specialCell.paddingTop || cfg.cellPaddingTop}px`,
                        paddingRight: `${specialCell.paddingRight || cfg.cellPaddingRight}px`,
                        paddingBottom: `${specialCell.paddingBottom || cfg.cellPaddingBottom}px`,
                        paddingLeft: `${specialCell.paddingLeft || cfg.cellPaddingLeft}px`,
                        textAlign: specialCell.textAlign || cfg.cellTextAlign,
                        verticalAlign: specialCell.verticalAlign || cfg.cellVerticalAlign,
                        whiteSpace: specialCell.wordWrap || cfg.cellWordWrap === 'nowrap' ? 'nowrap' : (cfg.cellWordWrap === 'wrap' ? 'normal' : 'break-word'),
                      } : {
                        fontFamily: cfg.cellFontFamily,
                        fontSize: `${cfg.cellFontSize}px`,
                        color: cfg.cellColor,
                        paddingTop: `${cfg.cellPaddingTop}px`,
                        paddingRight: `${cfg.cellPaddingRight}px`,
                        paddingBottom: `${cfg.cellPaddingBottom}px`,
                        paddingLeft: `${cfg.cellPaddingLeft}px`,
                        textAlign: cfg.cellTextAlign,
                        verticalAlign: cfg.cellVerticalAlign,
                        whiteSpace: cfg.cellWordWrap === 'nowrap' ? 'nowrap' : (cfg.cellWordWrap === 'wrap' ? 'normal' : 'break-word'),
                      };

                      return (
                        <td
                          key={colIndex}
                          colSpan={colspan}
                          rowSpan={rowspan}
                          style={{
                            backgroundColor: rowIndex % 2 === 0 ? cfg.rowBgColor : cfg.rowAltBgColor,
                            height: `${cfg.rowHeight * rowspan}px`,
                            width: colWidth ? `${colWidth}px` : 'auto',
                            borderBottom: cfg.showInnerBorder && rowIndex < tableRows.length - 1 ? `${cfg.innerHorizontalBorderWidth || cfg.borderWidth}px solid ${cfg.innerHorizontalBorderColor || cfg.borderColor}` : 'none',
                            borderRight: cfg.showInnerBorder && !isLastDataCol ? `${cfg.innerVerticalBorderWidth || cfg.borderWidth}px solid ${cfg.innerVerticalBorderColor || cfg.borderColor}` : 'none',
                            overflow: cfg.cellWordWrap === 'nowrap' ? 'hidden' : 'auto',
                            textOverflow: 'ellipsis',
                            ...cellStyle,
                          }}
                        >
                          {cell}
                        </td>
                      );
                    })}
                    {/* 操作列单元格 - 使用衍生表的actionColumn配置 */}
                    {hasActionCol && (
                      <td style={{
                        backgroundColor: rowIndex % 2 === 0 ? cfg.rowBgColor : cfg.rowAltBgColor,
                        height: `${cfg.rowHeight}px`,
                        padding: `${cfg.cellPaddingTop || 4}px ${cfg.cellPaddingRight || 8}px ${cfg.cellPaddingBottom || 4}px ${cfg.cellPaddingLeft || 8}px`,
                        textAlign: 'center',
                        width: `${cfg.actionColumn.width || 150}px`,
                        borderBottom: cfg.showInnerBorder && rowIndex < tableRows.length - 1 ? `${cfg.innerHorizontalBorderWidth || cfg.borderWidth}px solid ${cfg.innerHorizontalBorderColor || cfg.borderColor}` : 'none',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          {/* 修改按钮 */}
                          {actionButtons.edit?.enabled && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.dispatchEvent(new CustomEvent('editFormRecord', {
                                  detail: { 
                                    formId: cfg.sourceFormId || cfg.formId, 
                                    formName: cfg.formName,
                                    record: recordData, 
                                    projectId 
                                  }
                                }));
                              }}
                              style={{
                                padding: '2px 8px',
                                fontSize: '11px',
                                color: '#fff',
                                backgroundColor: actionButtons.edit.color || '#3b82f6',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                              }}
                            >
                              {actionButtons.edit.text || '修改'}
                            </button>
                          )}
                          {/* 删除按钮 */}
                          {actionButtons.delete?.enabled && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('确定要删除这条记录吗？')) {
                                  window.dispatchEvent(new CustomEvent('deleteFormRecord', {
                                    detail: { 
                                      formId: cfg.sourceFormId || cfg.formId, 
                                      record: recordData, 
                                      projectId 
                                    }
                                  }));
                                }
                              }}
                              style={{
                                padding: '2px 8px',
                                fontSize: '11px',
                                color: '#fff',
                                backgroundColor: actionButtons.delete.color || '#ef4444',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                              }}
                            >
                              {actionButtons.delete.text || '删除'}
                            </button>
                          )}
                          {/* 置顶按钮 */}
                          {actionButtons.top?.enabled && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const isCurrentlyTop = recordData._isTop === true;
                                window.dispatchEvent(new CustomEvent('updateFormRecord', {
                                  detail: { 
                                    formId: cfg.sourceFormId || cfg.formId, 
                                    record: recordData,
                                    updates: { 
                                      _isTop: !isCurrentlyTop,
                                      _topTime: isCurrentlyTop ? null : new Date().toISOString()
                                    },
                                    projectId 
                                  }
                                }));
                              }}
                              style={{
                                padding: '2px 8px',
                                fontSize: '11px',
                                color: '#fff',
                                backgroundColor: actionButtons.top.color || '#f59e0b',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                              }}
                            >
                              {recordData._isTop 
                                ? (actionButtons.top.textOn || '取消置顶')
                                : (actionButtons.top.textOff || '置顶')
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

            {/* 表尾 - 显示汇总数据 */}
            {cfg.footerEnabled && (
              <tfoot>
                <tr>
                  {footerValues.map((value, colIndex) => {
                    const fieldId = cfg.fieldInfos?.[colIndex]?.fieldId || cfg.displayFields?.[colIndex];
                    const colWidth = cfg.columnWidths?.[fieldId];
                    const hasActionCol = cfg.actionColumn?.enabled;
                    const isLastDataCol = !hasActionCol && colIndex === footerValues.length - 1;

                    return (
                      <td key={colIndex} style={{
                        backgroundColor: cfg.footerBgColor,
                        color: cfg.footerTextColor,
                        height: `${cfg.footerHeight}px`,
                        width: colWidth ? `${colWidth}px` : 'auto',
                        padding: '4px 8px',
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
                      backgroundColor: cfg.footerBgColor,
                      height: `${cfg.footerHeight}px`,
                      width: `${cfg.actionColumn.width || 150}px`,
                      padding: '4px 8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: `${cfg.footerFontSize || 12}px`,
                      fontFamily: cfg.footerFontFamily || 'Arial',
                    }}>
                      汇总
                    </td>
                  )}
                </tr>
              </tfoot>
            )}
          </table>
          </div>

          {/* 底部总结 */}
          {cfg.bottomSummaryEnabled && cfg.bottomSummaryText && (
            <div style={{
              fontSize: `${cfg.bottomSummaryFontSize}px`,
              color: cfg.bottomSummaryColor,
              textAlign: cfg.bottomSummaryAlign,
              marginTop: '4px',
            }}>
              {cfg.bottomSummaryText}
            </div>
          )}

          <div style={{
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: '10px',
            marginTop: '4px',
          }}>
            {realData.length > 0 ? `共 ${realData.length} 条数据` : '暂无数据'} · {fieldCount}个字段
          </div>
        </div>
      );
    };

    // 渲染交互区块 - 根据样式模式渲染
    const renderInteractionBlock = () => {
      const hasConfig = block.targetFormId;
      const styleMode = block.styleMode || 'default';
      
      if (!hasConfig) {
        // 未配置时显示占位提示
        return (
          <div style={{
            ...contentStyle,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f3f4f6',
            border: '2px dashed #d1d5db',
            borderRadius: '4px',
          }}>
            <span style={{ fontSize: '20px', marginBottom: '4px' }}>⚡</span>
            <span style={{ color: '#9ca3af', fontSize: '12px' }}>点击左侧配置交互</span>
          </div>
        );
      }
      
      // 自行设计样式 - 显示为容器，子区块在外部渲染
      if (styleMode === 'custom') {
        return (
          <div style={{
            ...contentStyle,
            backgroundColor: style.backgroundColor || '#f9fafb',
            border: `1px solid ${style.borderColor || '#e5e7eb'}`,
            borderRadius: style.borderRadius || '4px',
            position: 'relative',
          }}>
            {!block.childBlocksGenerated && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: '#9ca3af',
              }}>
                <span style={{ fontSize: '14px', marginBottom: '4px' }}>📝 自行设计样式</span>
                <span style={{ fontSize: '11px' }}>请在左侧点击"生成子区块"</span>
              </div>
            )}
          </div>
        );
      }
      
      // 默认样式 - 显示简单的表单输入界面
      // 获取表单信息以获取主键字段
      const form = forms?.find(f => f.id === block.targetFormId);
      const primaryKeyId = form?.structure?.primaryKey;
      // 构建显示的字段列表（主键 + 选中的字段）
      const displayFieldIds = primaryKeyId && !(block.selectedFields || []).includes(primaryKeyId)
        ? [primaryKeyId, ...(block.selectedFields || [])]
        : (block.selectedFields || []);

      console.log('[Canvas-DEBUG] 默认样式 - 渲染交互区块:', {
        blockId: block.id,
        displayFieldIds,
        formFields: form?.structure?.fields
      });

      return (
        <div style={{
          ...contentStyle,
          backgroundColor: style.backgroundColor || '#ffffff',
          border: `1px solid ${style.borderColor || '#e5e7eb'}`,
          borderRadius: style.borderRadius || '4px',
          padding: '8px',
          overflow: 'auto',
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            {block.targetFormName || block.targetFormId} · 默认样式
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}>
            {/* 显示字段输入 */}
            {displayFieldIds.slice(0, 3).map((fieldId, index) => {
              const field = fields?.find(f => f.id === fieldId);
              const isPrimaryKey = fieldId === primaryKeyId;
              const formField = form?.structure?.fields?.find(ff => ff.fieldId === fieldId);
              const isAttributeField = formField?.isAttributeField === true;

              console.log('[Canvas-DEBUG] 渲染字段:', {
                fieldId,
                fieldName: field?.name,
                isPrimaryKey,
                isAttributeField,
                formField,
                formFieldIsAttributeField: formField?.isAttributeField
              });

              // 如果是属性字段，渲染下拉菜单
              if (isAttributeField) {
                // 查找属性表
                const attributeFormId = formField?.attributeFormId;
                const attributeForm = forms?.find(f => f.id === attributeFormId);
                const levelFields = attributeForm?.structure?.levelFields || [];
                const currentLevelField = levelFields.find(lf => lf.level === formField?.level);
                console.log('[Canvas-DEBUG] 属性字段信息:', { attributeFormId, attributeForm, levelFields, currentLevelField, level: formField?.level });

                if (attributeForm && attributeForm.data && attributeForm.data.length > 0 && currentLevelField) {
                  // 从属性表数据中提取该级别的所有不重复值
                  const fieldValues = [...new Set(
                    attributeForm.data.map(d => d[currentLevelField.fieldId]).filter(v => v !== undefined && v !== '')
                  )].sort();

                  console.log('[Canvas-DEBUG] 属性字段值:', {
                    fieldName: field?.name,
                    level: currentLevelField.level,
                    currentLevelField,
                    fieldValues
                  });

                    return (
                      <div key={fieldId} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}>
                        <span style={{
                          fontSize: '11px',
                          color: '#6b7280',
                        }}>
                          {field?.name || `字段${index + 1}`} {isPrimaryKey && '*'}
                        </span>
                        <select
                          style={{
                            width: '100%',
                            height: '28px',
                            padding: '0 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '12px',
                            outline: 'none',
                            color: '#374151',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="">-- 请选择{field?.name} --</option>
                          {fieldValues.map((value, idx) => (
                            <option key={`${fieldId}-${idx}`} value={value}>{value}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                }
              }

              // 普通字段：显示输入框占位
              return (
                <div key={fieldId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span style={{
                    fontSize: '11px',
                    color: isPrimaryKey ? '#3b82f6' : '#9ca3af',
                    width: '80px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {field?.name || `字段${index + 1}`}{isPrimaryKey ? '*' : ''}
                  </span>
                  <div style={{
                    flex: 1,
                    height: '24px',
                    backgroundColor: isPrimaryKey ? '#eff6ff' : '#f3f4f6',
                    borderRadius: '4px',
                    border: isPrimaryKey ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
                  }}></div>
                </div>
              );
            })}
            {displayFieldIds.length > 3 && (
              <div style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
                ... 共 {displayFieldIds.length} 个字段
              </div>
            )}
          </div>
          {/* 提交按钮 */}
          <button style={{
            marginTop: '8px',
            width: '100%',
            padding: '6px',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
          }}>
            确认提交
          </button>
        </div>
      );
    };

    // 渲染子区块内容（提示/输入/级联/提交）
    const renderChildBlock = () => {
      const subType = block.subType;
      
      if (subType === 'prompt') {
        // 提示区块 - 显示字段名
        return (
          <div style={{
            ...contentStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: style.textAlign === 'right' ? 'flex-end' : 'flex-start',
            padding: style.padding || 4,
            fontSize: style.fontSize || 12,
            color: style.color || '#374151',
          }}>
            {block.content}
          </div>
        );
      }
      
      if (subType === 'input') {
        // 填写区块 - 显示输入框
        return (
          <div style={{
            ...contentStyle,
            display: 'flex',
            alignItems: 'center',
          }}>
            <input
              type="text"
              placeholder={block.placeholder || '请输入'}
              disabled
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: 'transparent',
                padding: style.padding || 4,
                fontSize: style.fontSize || 12,
                outline: 'none',
              }}
            />
          </div>
        );
      }
      
      if (subType === 'cascader' || subType === 'attribute-container') {
        // 属性字段容器区块（下拉菜单、按钮式、勾选框）
        const fieldDisplayMode = block.fieldDisplayMode || 'dropdown';
        console.log('[Canvas-DEBUG] 渲染属性字段容器区块:', {
          blockId: block.id,
          subType,
          fieldDisplayMode,
          hasAttributeFieldValues: !!block.attributeFieldValues,
          attributeFieldValues: block.attributeFieldValues
        });

        if (fieldDisplayMode === 'dropdown') {
          // 下拉菜单样式 - 为每个属性字段渲染独立的select（支持级联）
          const attributeFieldValues = block.attributeFieldValues || [];
          console.log('[Canvas-DEBUG] 渲染下拉菜单，attributeFieldValues数量:', attributeFieldValues.length);
          if (attributeFieldValues.length === 0) {
            console.warn('[Canvas-DEBUG] attributeFieldValues为空，无法渲染下拉菜单');
          }
          return (
            <div style={{
              ...contentStyle,
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              padding: style.padding || 4,
              fontSize: style.fontSize || 12,
            }}>
              {attributeFieldValues.map((af) => {
                console.log('[Canvas-DEBUG] 渲染字段下拉框:', { fieldIdName: af.fieldIdName, fieldName: af.fieldName, valuesCount: af.values?.length });
                return (
                <div key={af.fieldIdName} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', minWidth: '80px', whiteSpace: 'nowrap' }}>
                    {af.fieldName}
                  </label>
                  <select
                    style={{
                      flex: 1,
                      height: '28px',
                      border: '1px solid #d1d5db',
                      borderRadius: '4px',
                      padding: '0 8px',
                      fontSize: style.fontSize || 12,
                      outline: 'none',
                      color: '#374151',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">-- 请选择{af.fieldName} --</option>
                    {af.values.map((value, idx) => (
                      <option key={`${af.fieldIdName}-${idx}`} value={value}>{value}</option>
                    ))}
                  </select>
                </div>
              )})}
            </div>
          );
        }

        // 渲染按钮或勾选框
        const attributeFieldValues = block.attributeFieldValues || [];
        const buttonWidth = 80;
        const buttonHeight = 28;
        const gap = 8;

        // 简单的状态管理，支持预览交互
        const [selectedValues, setSelectedValues] = React.useState({});
        const handleValueChange = (fieldIdName, value) => {
          if (block.fieldSelectionMode === 'multiple') {
            setSelectedValues(prev => {
              const currentValues = prev[fieldIdName] || [];
              const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
              return { ...prev, [fieldIdName]: newValues };
            });
          } else {
            setSelectedValues(prev => ({ ...prev, [fieldIdName]: value }));
          }
        };

        return (
          <div style={{
            ...contentStyle,
            padding: style.padding || 8,
            position: 'relative',
            display: 'flex',
            flexWrap: 'wrap',
            gap: `${gap}px`,
            alignItems: 'flex-start',
          }}>
            {attributeFieldValues.map(({ fieldIdName, fieldName, values }, fieldIdx) => (
              <div key={fieldIdx} style={{ width: '100%' }}>
                <div style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '4px',
                  fontWeight: '500'
                }}>{fieldName}</div>
                {values.map((value, valueIdx) => {
                  const isMultiple = block.fieldSelectionMode === 'multiple';
                  const isSelected = isMultiple
                    ? (selectedValues[fieldIdName] || []).includes(value)
                    : selectedValues[fieldIdName] === value;

                  if (fieldDisplayMode === 'button') {
                    // 按钮式 - 支持点击选择
                    return (
                      <div
                        key={`${fieldIdx}-${valueIdx}`}
                        onClick={() => handleValueChange(fieldIdName, value)}
                        style={{
                          display: 'inline-block',
                          minWidth: buttonWidth,
                          maxWidth: '120px',
                          height: buttonHeight,
                          lineHeight: `${buttonHeight}px`,
                          padding: '0 12px',
                          backgroundColor: isSelected ? '#3b82f6' : '#ffffff',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          color: isSelected ? '#ffffff' : '#374151',
                          textAlign: 'center',
                          cursor: 'pointer',
                          marginRight: gap,
                          marginBottom: gap,
                          userSelect: 'none',
                          transition: 'all 0.2s',
                        }}
                      >
                        {value}
                      </div>
                    );
                  } else if (fieldDisplayMode === 'checkbox') {
                    // 勾选框 - 支持实际选择
                    return (
                      <label
                        key={`${fieldIdx}-${valueIdx}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          cursor: 'pointer',
                          marginRight: '16px',
                          marginBottom: '8px',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type={isMultiple ? 'checkbox' : 'radio'}
                          checked={isSelected}
                          onChange={() => handleValueChange(fieldIdName, value)}
                          style={{
                            marginRight: '6px',
                            cursor: 'pointer',
                          }}
                        />
                        <span style={{ fontSize: '12px', color: '#374151' }}>{value}</span>
                      </label>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
          </div>
        );
      }
      
      if (subType === 'submit') {
        // 提交按钮区块
        return (
          <div style={{
            ...contentStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: style.backgroundColor || '#3b82f6',
            color: style.color || '#ffffff',
            fontSize: style.fontSize || 14,
            fontWeight: style.fontWeight || 'bold',
            borderRadius: style.borderRadius || 4,
            cursor: 'pointer',
          }}>
            {block.content || '确认提交'}
          </div>
        );
      }
      
      // ===== 流程按钮子区块类型 =====
      if (subType === 'flowPrompt') {
        // 流程对话框 - 提示区块
        return (
          <div style={{
            ...contentStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: style.textAlign === 'right' ? 'flex-end' : 'flex-start',
            padding: style.padding || 4,
            fontSize: style.fontSize || 12,
            color: style.color || '#374151',
          }}>
            {block.content}
          </div>
        );
      }
      
      if (subType === 'flowInput') {
        // 流程对话框 - 输入区块
        return (
          <div style={{
            ...contentStyle,
            display: 'flex',
            alignItems: 'center',
          }}>
            <input
              type="text"
              placeholder={block.placeholder || '请输入'}
              disabled
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: 'transparent',
                padding: style.padding || 4,
                fontSize: style.fontSize || 12,
                outline: 'none',
              }}
            />
          </div>
        );
      }
      
      if (subType === 'flowSubmit') {
        // 流程提交按钮
        return (
          <div style={{
            ...contentStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: style.backgroundColor || '#3b82f6',
            color: style.color || '#ffffff',
            fontSize: style.fontSize || 14,
            fontWeight: style.fontWeight || 'bold',
            borderRadius: style.borderRadius || 4,
            cursor: 'pointer',
          }}>
            {block.content || '确认提交'}
          </div>
        );
      }
      
      if (subType === 'flowCheckbox') {
        // 流程多选 - 勾选框
        return (
          <div style={{
            ...contentStyle,
            display: 'flex',
            alignItems: 'center',
            padding: style.padding || 4,
            fontSize: style.fontSize || 12,
            color: style.color || '#374151',
          }}>
            <input type="checkbox" disabled style={{ marginRight: 8 }} />
            <span>{block.content}</span>
          </div>
        );
      }
      
      if (subType === 'flowOptionButton') {
        // 流程多选 - 按钮选项
        return (
          <div style={{
            ...contentStyle,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: style.backgroundColor || '#6366f1',
            color: style.color || '#ffffff',
            fontSize: style.fontSize || 12,
            fontWeight: style.fontWeight || 'medium',
            borderRadius: style.borderRadius || 4,
            cursor: 'pointer',
          }}>
            {block.content}
          </div>
        );
      }
      
      if (subType === 'flowCascade') {
        // 流程多选 - 级联下拉
        return (
          <div style={{
            ...contentStyle,
            display: 'flex',
            alignItems: 'center',
            padding: style.padding || 4,
            fontSize: style.fontSize || 12,
            color: '#9ca3af',
          }}>
            <span>请选择 ▼</span>
          </div>
        );
      }
      
      return null;
    };

    // 渲染按钮区块 - 使用ButtonRenderer
    const renderButtonBlock = () => {
      // 如果ButtonRenderer可用，使用它渲染
      if (window.ButtonRenderer) {
        return (
          <ButtonRenderer
            block={block}
            style={style}
            projectId={projectId}
            context={{}}
            isPreview={false}
          />
        );
      }
      
      // 回退：简单渲染 - 允许空文字
      const buttonText = block.buttonText ?? '';
      return (
        <div style={{...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <span>{buttonText}</span>
        </div>
      );
    };

    // 根据类型选择渲染方式
    const renderContent = () => {
      // 如果是子区块（有subType），使用子区块渲染
      if (block.subType) {
        return renderChildBlock();
      }
      
      switch (block.type) {
        case '显示':
          return renderDisplayBlock();
        case '交互':
          return renderInteractionBlock();
        case '按钮':
          return renderButtonBlock();
        case '用户账号':
          return renderAuthBlockContent();
        default:
          return renderDisplayBlock();
      }
    };
    
    // 渲染用户账号区块（设计器预览 + 运行模式）
    const renderAuthBlockContent = () => {
      // 获取用户账号区块的样式配置（子区块样式）
      const authConfig = block.authConfig || {};
      const loginBtnStyle = authConfig.loginButton || {};
      const registerBtnStyle = authConfig.registerButton || {};
      const userInfoStyle = authConfig.userInfo || {};
      const logoutBtnStyle = authConfig.logoutButton || {};
      
      // 检查是否已登录（通过全局状态）
      const isLoggedIn = window.currentUser && window.currentUser.email;
      
      // 默认按钮样式
      const defaultLoginStyle = {
        padding: '6px 16px',
        backgroundColor: loginBtnStyle.backgroundColor || '#3b82f6',
        color: loginBtnStyle.color || '#ffffff',
        border: loginBtnStyle.border || 'none',
        borderRadius: loginBtnStyle.borderRadius || '4px',
        fontSize: loginBtnStyle.fontSize || '13px',
        fontWeight: loginBtnStyle.fontWeight || '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
      };
      
      const defaultRegisterStyle = {
        padding: '6px 16px',
        backgroundColor: registerBtnStyle.backgroundColor || 'transparent',
        color: registerBtnStyle.color || '#3b82f6',
        border: registerBtnStyle.border || '1px solid #3b82f6',
        borderRadius: registerBtnStyle.borderRadius || '4px',
        fontSize: registerBtnStyle.fontSize || '13px',
        fontWeight: registerBtnStyle.fontWeight || '500',
        cursor: 'pointer',
        transition: 'all 0.2s',
      };
      
      const defaultUserInfoStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: userInfoStyle.padding || '4px 12px',
        backgroundColor: userInfoStyle.backgroundColor || '#f3f4f6',
        borderRadius: userInfoStyle.borderRadius || '20px',
        fontSize: userInfoStyle.fontSize || '13px',
        color: userInfoStyle.color || '#374151',
      };
      
      const defaultLogoutStyle = {
        padding: '6px 12px',
        backgroundColor: logoutBtnStyle.backgroundColor || '#fee2e2',
        color: logoutBtnStyle.color || '#ef4444',
        border: logoutBtnStyle.border || 'none',
        borderRadius: logoutBtnStyle.borderRadius || '4px',
        fontSize: logoutBtnStyle.fontSize || '13px',
        cursor: 'pointer',
        transition: 'all 0.2s',
      };

      // 处理登录点击
      const handleLoginClick = (e) => {
        e.stopPropagation();
        // 触发登录弹窗事件
        window.dispatchEvent(new CustomEvent('showAuthDialog', { detail: { type: 'login' } }));
      };
      
      // 处理注册点击
      const handleRegisterClick = (e) => {
        e.stopPropagation();
        // 触发注册弹窗事件
        window.dispatchEvent(new CustomEvent('showAuthDialog', { detail: { type: 'register' } }));
      };
      
      // 处理退出点击
      const handleLogoutClick = async (e) => {
        e.stopPropagation();
        if (window.supabaseAuth) {
          try {
            await window.supabaseAuth.signOut();
            window.currentUser = null;
            window.dispatchEvent(new CustomEvent('authStateChanged'));
          } catch (err) {
            console.error('退出登录失败:', err);
          }
        }
      };
      
      return (
        <div style={{
          ...contentStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: block.style?.justifyContent || 'flex-end',
          gap: '10px',
          padding: '8px',
        }}>
          {isLoggedIn ? (
            // 已登录状态：显示用户信息和退出按钮
            <>
              <div style={defaultUserInfoStyle}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: '600',
                }}>
                  {window.currentUser.email?.charAt(0).toUpperCase()}
                </div>
                <span>{window.currentUser.email}</span>
              </div>
              <button
                style={defaultLogoutStyle}
                onClick={handleLogoutClick}
                onMouseOver={(e) => e.target.style.backgroundColor = '#fecaca'}
                onMouseOut={(e) => e.target.style.backgroundColor = defaultLogoutStyle.backgroundColor}
              >
                退出
              </button>
            </>
          ) : (
            // 未登录状态：显示登录和注册按钮
            <>
              <button
                style={defaultLoginStyle}
                onClick={handleLoginClick}
                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                登录
              </button>
              <button
                style={defaultRegisterStyle}
                onClick={handleRegisterClick}
                onMouseOver={(e) => e.target.style.backgroundColor = '#eff6ff'}
                onMouseOut={(e) => e.target.style.backgroundColor = defaultRegisterStyle.backgroundColor}
              >
                注册
              </button>
            </>
          )}
        </div>
      );
    };

    // 执行区块功能（通用机制）
    const executeBlockFunction = () => {
      // 按钮区块：执行按钮功能
      if (block.type === '按钮' && block.buttonType) {
        console.log('执行按钮功能:', block.buttonType, block.buttonConfig);
        if (block.buttonType === 'openPopup' && block.buttonConfig?.targetBlockId) {
          // 打开弹窗
          if (onBlockStyleChange) {
            onBlockStyleChange(block.buttonConfig.targetBlockId, 'zIndex', 0);
            console.log('已打开弹窗:', block.buttonConfig.targetBlockId);
          }
        }
        // 其他按钮类型可以在这里扩展
      }
      
      // 交互区块：可以在这里添加交互区块的功能
      // if (block.type === '交互') { ... }
      
      // 未来新增的功能性区块都在这里统一处理
    };

    return (
      <div
        key={block.id}
        className={`block-item ${isSelected ? 'ring-2 ring-blue-500' : ''} ${isPopupBlock ? 'popup-block' : ''}`}
        style={scaledStyle}
        onMouseDown={(e) => {
          // 如果正在编辑，不触发拖拽
          if (isEditing) return;
          if (!e.target.classList.contains('resize-handle')) {
            onBlockDragStart(e, block.id);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          console.log('点击区块:', block.id, block.type, block.buttonType ? `(${block.buttonType})` : '');
          // 1. 选中区块
          onSelectBlock(block.id);
          // 2. 执行区块功能（通用机制）
          executeBlockFunction();
        }}
        onDoubleClick={(e) => {
          // 双击显示区块进入编辑模式（仅文字类型）
          if (isDisplayBlock && (block.contentType === '文字' || !block.contentType)) {
            e.stopPropagation();
            setEditingBlockId(block.id);
            // 延迟聚焦 - 保存currentTarget的引用
            const targetEl = e.currentTarget;
            setTimeout(() => {
              if (targetEl) {
                const contentEl = targetEl.querySelector('[contenteditable]');
                if (contentEl) {
                  contentEl.focus();
                  // 将光标移到末尾
                  const range = document.createRange();
                  const sel = window.getSelection();
                  range.selectNodeContents(contentEl);
                  range.collapse(false);
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
              }
            }, 10);
          }
        }}
      >
        {/* 区块标签 */}
        <div
          className="absolute -top-5 left-0 text-xs bg-blue-500 text-white px-1 rounded whitespace-nowrap"
          style={{ fontSize: Math.max(10, 12 * s), zIndex: 10 }}
        >
          {block.id} · {block.type} · {block.level || 1}级{isPopupBlock ? ' · 弹窗' : ''}{block.parentId ? ` · 父:${block.parentId}` : ''}{block.isDetailFieldBlock ? ` · 字段:${block.detailFieldName}` : ''}
        </div>
        
        {/* 弹窗关闭按钮❌ - 仅弹窗区块且层级≥0时显示，默认隐藏，hover时显示 */}
        {isPopupBlock && layer >= 0 && (
          <div
            className="popup-close-btn absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center cursor-pointer opacity-0 transition-opacity duration-200"
            style={{ zIndex: 999, fontSize: '14px', lineHeight: 1 }}
            onClick={(e) => {
              e.stopPropagation();
              console.log('关闭弹窗:', block.id);
              if (onBlockStyleChange) {
                onBlockStyleChange(block.id, 'zIndex', -1);
              }
            }}
            title="关闭弹窗"
          >
            ✕
          </div>
        )}
        
        {/* 区块内容 */}
        {renderContent()}

        {/* 区块内的图形元素 */}
        {block.graphicElements && block.graphicElements.length > 0 && (
          <svg 
            className="absolute inset-0 pointer-events-none" 
            style={{ width: '100%', height: '100%', zIndex: 10 }}
          >
            {renderGraphicElements(block.graphicElements, 0, 0, scale / 100)}
          </svg>
        )}

        {/* 缩放手柄 - 仅选中且非编辑时显示 */}
        {isSelected && !isEditing && (
          <>
            <div className="resize-handle absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize" 
                 onMouseDown={(e) => onBlockResizeStart(e, block.id, 'nw')} />
            <div className="resize-handle absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize"
                 onMouseDown={(e) => onBlockResizeStart(e, block.id, 'ne')} />
            <div className="resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize"
                 onMouseDown={(e) => onBlockResizeStart(e, block.id, 'sw')} />
            <div className="resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize"
                 onMouseDown={(e) => onBlockResizeStart(e, block.id, 'se')} />
            <div className="resize-handle absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 cursor-n-resize"
                 onMouseDown={(e) => onBlockResizeStart(e, block.id, 'n')} />
            <div className="resize-handle absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 cursor-s-resize"
                 onMouseDown={(e) => onBlockResizeStart(e, block.id, 's')} />
            <div className="resize-handle absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 bg-blue-500 cursor-w-resize"
                 onMouseDown={(e) => onBlockResizeStart(e, block.id, 'w')} />
            <div className="resize-handle absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-blue-500 cursor-e-resize"
                 onMouseDown={(e) => onBlockResizeStart(e, block.id, 'e')} />
          </>
        )}
      </div>
    );
  };

  // 使用共享的画布高度计算函数（如果可用）
  const canvasHeight = (window.StyleUtils?.calculateCanvasHeight) 
    ? window.StyleUtils.calculateCanvasHeight(blocks, config.minHeight)
    : (() => {
        // 回退：本地计算
        if (blocks.length === 0) return config.minHeight;
        const maxBottom = blocks.reduce((max, block) => {
          const bottom = block.y + block.height + 50;
          return bottom > max ? bottom : max;
        }, config.minHeight);
        return maxBottom;
      })();

  // 渲染图形元素的SVG
  const renderGraphicElements = (elements, offsetX = 0, offsetY = 0, scaleRatio = 1) => {
    if (!elements || elements.length === 0) return null;
    
    return elements.map((el, index) => {
      const s = scaleRatio;
      switch (el.type) {
        case 'path':
          if (!el.points || el.points.length < 2) return null;
          const pathD = el.points.map((p, i) => 
            `${i === 0 ? 'M' : 'L'} ${(p.x + offsetX) * s} ${(p.y + offsetY) * s}`
          ).join(' ');
          return <path key={el.id || index} d={pathD} stroke={el.color} strokeWidth={el.brushSize * s} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
        
        case 'line':
          return <line key={el.id || index} x1={(el.startX + offsetX) * s} y1={(el.startY + offsetY) * s} x2={(el.endX + offsetX) * s} y2={(el.endY + offsetY) * s} stroke={el.color} strokeWidth={el.brushSize * s} strokeLinecap="round" />;
        
        case 'arrow':
          const angle = Math.atan2(el.endY - el.startY, el.endX - el.startX);
          const headLength = Math.max(10, el.brushSize * 3) * s;
          const arrowPoints = [
            `${(el.endX + offsetX) * s},${(el.endY + offsetY) * s}`,
            `${(el.endX + offsetX) * s - headLength * Math.cos(angle - Math.PI / 6)},${(el.endY + offsetY) * s - headLength * Math.sin(angle - Math.PI / 6)}`,
            `${(el.endX + offsetX) * s - headLength * Math.cos(angle + Math.PI / 6)},${(el.endY + offsetY) * s - headLength * Math.sin(angle + Math.PI / 6)}`
          ].join(' ');
          return (
            <g key={el.id || index}>
              <line x1={(el.startX + offsetX) * s} y1={(el.startY + offsetY) * s} x2={(el.endX + offsetX) * s} y2={(el.endY + offsetY) * s} stroke={el.color} strokeWidth={el.brushSize * s} strokeLinecap="round" />
              <polygon points={arrowPoints} fill={el.color} />
            </g>
          );
        
        case 'rect':
          return el.fill 
            ? <rect key={el.id || index} x={(el.x + offsetX) * s} y={(el.y + offsetY) * s} width={el.w * s} height={el.h * s} fill={el.color} />
            : <rect key={el.id || index} x={(el.x + offsetX) * s} y={(el.y + offsetY) * s} width={el.w * s} height={el.h * s} stroke={el.color} strokeWidth={el.brushSize * s} fill="none" />;
        
        case 'circle':
          return el.fill
            ? <ellipse key={el.id || index} cx={(el.cx + offsetX) * s} cy={(el.cy + offsetY) * s} rx={el.rx * s} ry={el.ry * s} fill={el.color} />
            : <ellipse key={el.id || index} cx={(el.cx + offsetX) * s} cy={(el.cy + offsetY) * s} rx={el.rx * s} ry={el.ry * s} stroke={el.color} strokeWidth={el.brushSize * s} fill="none" />;
        
        case 'spray':
          return (
            <g key={el.id || index}>
              {el.dots?.map((dot, i) => (
                <circle key={i} cx={(dot.x + offsetX) * s} cy={(dot.y + offsetY) * s} r={dot.r * s} fill={el.color} />
              ))}
            </g>
          );
        
        case 'splash':
          // 泼墨效果用多个圆形模拟
          const splashCircles = [];
          const seed = el.id || index;
          for (let i = 0; i < 30; i++) {
            const pseudoRandom = (seed * 9301 + 49297 + i * 233) % 233280 / 233280;
            const angle = pseudoRandom * Math.PI * 2;
            const distance = Math.sqrt(pseudoRandom) * el.size * s;
            const dotSize = (pseudoRandom * 5 + 2) * s;
            splashCircles.push(
              <circle key={i} cx={(el.x + offsetX) * s + Math.cos(angle) * distance} cy={(el.y + offsetY) * s + Math.sin(angle) * distance} r={dotSize} fill={el.color} opacity={el.style === 'ink' ? 0.6 : 1} />
            );
          }
          return <g key={el.id || index}>{splashCircles}</g>;
        
        default:
          return null;
      }
    });
  };

  return (
    <div className="flex-1 bg-gray-200 p-4 designer-canvas-container" style={{ overflow: 'hidden' }} onClick={onCanvasClick}>
      {/* 画布尺寸提示 */}
      <div className="text-center text-sm text-gray-500 mb-2">
        {config.label} · 缩放 {scale}%
      </div>

      {/* 画布主体 - 高度自动扩展，支持平移 */}
      <div
        className="canvas-grid canvas-content relative bg-white shadow-lg mx-auto"
        style={{
          width: config.width * (scale / 100),
          minHeight: canvasHeight * (scale / 100),
          backgroundImage: 'linear-gradient(#eee 1px, transparent 1px), linear-gradient(90deg, #eee 1px, transparent 1px)',
          backgroundSize: `${10 * (scale / 100)}px ${10 * (scale / 100)}px`,
          transform: `translate(${-viewportAnchorX}px, ${-viewportAnchorY}px)`,
          transformOrigin: 'top left',
          cursor: 'grab'
        }}
        onClick={onCanvasClick}
      >
        {/* 画布装饰层（最底层） */}
        {canvasDecorations && canvasDecorations.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%', zIndex: 0 }}
          >
            {renderGraphicElements(canvasDecorations, 0, 0, scale / 100)}
          </svg>
        )}

        {/* 区域渲染（仅在显示区域模式下） */}
        {showAreas && !currentAreaId && areas.map(area => (
          <div
            key={area.id}
            className="absolute border-2 border-dashed bg-gray-200 area-container"
            style={{
              left: area.x * (scale / 100),
              top: area.y * (scale / 100),
              width: area.width * (scale / 100),
              height: area.height * (scale / 100),
              opacity: 0.3,
              zIndex: 0,
              borderColor: '#9ca3af'
            }}
            onMouseDown={(e) => {
              if (onAreaDragStart && !e.target.classList.contains('area-resize-handle')) {
                onAreaDragStart(e, area.id);
              }
            }}
          >
            {/* 区域标签 */}
            <div className="absolute -top-4 left-0 text-xs bg-gray-700 text-white px-1 rounded whitespace-nowrap">
              {area.name} ({area.id})
            </div>

            {/* 区域缩放手柄 */}
            {onAreaResizeStart && (
              <>
                <div className="area-resize-handle absolute -top-1 -left-1 w-3 h-3 bg-purple-500 cursor-nw-resize"
                     onMouseDown={(e) => onAreaResizeStart(e, area.id, 'nw')} />
                <div className="area-resize-handle absolute -top-1 -right-1 w-3 h-3 bg-purple-500 cursor-ne-resize"
                     onMouseDown={(e) => onAreaResizeStart(e, area.id, 'ne')} />
                <div className="area-resize-handle absolute -bottom-1 -left-1 w-3 h-3 bg-purple-500 cursor-sw-resize"
                     onMouseDown={(e) => onAreaResizeStart(e, area.id, 'sw')} />
                <div className="area-resize-handle absolute -bottom-1 -right-1 w-3 h-3 bg-purple-500 cursor-se-resize"
                     onMouseDown={(e) => onAreaResizeStart(e, area.id, 'se')} />
                <div className="area-resize-handle absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 cursor-n-resize"
                     onMouseDown={(e) => onAreaResizeStart(e, area.id, 'n')} />
                <div className="area-resize-handle absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-purple-500 cursor-s-resize"
                     onMouseDown={(e) => onAreaResizeStart(e, area.id, 's')} />
                <div className="area-resize-handle absolute top-1/2 -left-1 -translate-y-1/2 w-3 h-3 bg-purple-500 cursor-w-resize"
                     onMouseDown={(e) => onAreaResizeStart(e, area.id, 'w')} />
                <div className="area-resize-handle absolute top-1/2 -right-1 -translate-y-1/2 w-3 h-3 bg-purple-500 cursor-e-resize"
                     onMouseDown={(e) => onAreaResizeStart(e, area.id, 'e')} />
              </>
            )}
          </div>
        ))}

        {/* 区块渲染 - 包括顶层区块和子区块 */}
        {!hideContentInAreas && blocks.filter(block => !block.parentId).map(block => renderBlock(block))}
        {/* 渲染子区块（有parentId的区块） */}
        {!hideContentInAreas && blocks.filter(block => block.parentId).map(block => renderBlock(block))}
      </div>
    </div>
  );
}

window.DesignerCanvas = DesignerCanvas;

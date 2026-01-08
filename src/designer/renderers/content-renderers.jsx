// 内容渲染器
// 负责渲染文字、图片、视频等基础内容

export const createContentRenderers = (props) => {
  const {
    blocks,
    onBlockContentChange,
    setEditingBlockId
  } = props;

  // 渲染文字内容
  const renderTextContent = (block, contentStyle, isEditing) => {
    const getBlockContent = () => {
      if (block.content && block.content.html) {
        return block.content.html;
      }
      return '';
    };

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
          onBlockContentChange(block.id, e.currentTarget);
          setEditingBlockId(null);
        }}
        onKeyDown={(e) => handleKeyDown(e, block.id)}
        dangerouslySetInnerHTML={{ __html: isEmpty && !isEditing ? '双击编辑文字...' : content }}
      />
    );
  };

  // 渲染图片内容
  const renderImageContent = (block, contentStyle) => {
    const imageUrl = block.content?.imageUrl || '';
    const isEmpty = !imageUrl;

    return (
      <div
        style={{
          ...contentStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {isEmpty ? (
          <div style={{
            color: '#9ca3af',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }}>🖼️</span>
            <span style={{ fontSize: '12px' }}>拖入图片或输入URL</span>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="图片"
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'block';
            }}
          />
        )}
        <div style={{
          display: isEmpty ? 'block' : 'none',
          color: '#ef4444',
          fontSize: '12px',
          marginTop: '8px',
        }}>
          图片加载失败
        </div>
      </div>
    );
  };

  // 渲染视频内容
  const renderVideoContent = (block, contentStyle) => {
    const videoUrl = block.content?.videoUrl || '';
    const isEmpty = !videoUrl;

    return (
      <div
        style={{
          ...contentStyle,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {isEmpty ? (
          <div style={{
            color: '#9ca3af',
            textAlign: 'center',
          }}>
            <span style={{ fontSize: '32px', marginBottom: '8px', display: 'block' }}>🎬</span>
            <span style={{ fontSize: '12px' }}>拖入视频或输入URL</span>
          </div>
        ) : (
          <video
            src={videoUrl}
            controls
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextSibling.style.display = 'block';
            }}
          />
        )}
        <div style={{
          display: isEmpty ? 'block' : 'none',
          color: '#ef4444',
          fontSize: '12px',
          marginTop: '8px',
        }}>
          视频加载失败
        </div>
      </div>
    );
  };

  // 处理键盘事件
  const handleKeyDown = (e, blockId) => {
    if (e.key === 'Escape') {
      setEditingBlockId(null);
      e.currentTarget.blur();
    }
  };

  return {
    renderTextContent,
    renderImageContent,
    renderVideoContent,
  };
};

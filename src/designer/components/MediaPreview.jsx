// 媒体预览弹窗组件（图片和视频的双击放大预览）
function MediaPreview({ type, url, name, onClose }) {
  if (!url) return null;

  // ESC键关闭
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[200]"
      onClick={onClose}
    >
      {/* 关闭按钮 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-10"
      >
        ×
      </button>
      
      {/* 文件名 */}
      {name && (
        <div className="absolute top-4 left-4 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
          {name}
        </div>
      )}
      
      {/* 内容区域 */}
      <div 
        className="max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {type === 'image' ? (
          <img
            src={url}
            alt={name || '图片预览'}
            className="max-w-full max-h-[90vh] object-contain"
          />
        ) : (
          <video
            src={url}
            controls
            autoPlay
            className="max-w-full max-h-[90vh]"
          >
            您的浏览器不支持视频播放
          </video>
        )}
      </div>
      
      {/* 提示 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded">
        按 ESC 或点击空白处关闭
      </div>
    </div>
  );
}

window.MediaPreview = MediaPreview;

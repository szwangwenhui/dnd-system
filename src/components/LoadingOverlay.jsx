// 通用的加载遮罩组件
function LoadingOverlay({ isOpen, message = '处理中...' }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 flex flex-col items-center shadow-2xl max-w-sm mx-4">
        {/* 旋转的加载图标 */}
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>

        {/* 加载文本 */}
        <div className="text-gray-700 font-medium text-lg text-center">
          {message}
        </div>

        {/* 提示信息 */}
        <div className="text-gray-500 text-sm mt-2 text-center">
          请稍候，这可能需要几秒钟
        </div>
      </div>
    </div>
  );
}

window.LoadingOverlay = LoadingOverlay;

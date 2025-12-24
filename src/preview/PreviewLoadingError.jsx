// DND2 预览模块 - 加载和错误状态组件
// 原文件: src/preview/Preview.jsx 第2218-2262行
// 
// 预览页面的加载中和错误状态显示

// 加载中状态
function PreviewLoading() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px 60px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        textAlign: 'center',
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px',
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ color: '#374151', fontSize: '16px' }}>正在加载预览...</div>
      </div>
    </div>
  );
}

// 错误状态
function PreviewError({ error, onClose }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f0f0',
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '400px',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>😕</div>
        <div style={{ 
          color: '#ef4444', 
          fontSize: '18px', 
          fontWeight: 'bold',
          marginBottom: '8px' 
        }}>
          加载失败
        </div>
        <div style={{ color: '#6b7280', marginBottom: '24px' }}>
          {error}
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '8px 24px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          关闭
        </button>
      </div>
    </div>
  );
}

window.PreviewLoading = PreviewLoading;
window.PreviewError = PreviewError;

console.log('[DND2] preview/PreviewLoadingError.jsx 加载完成');

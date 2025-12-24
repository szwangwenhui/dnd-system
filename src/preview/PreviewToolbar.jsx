// DND2 预览模块 - 工具栏组件
// 原文件: src/preview/Preview.jsx 第2291-2344行
// 
// 预览页面顶部工具栏

function PreviewToolbar({ pageName, canvasType, onNavigateHome, onClose }) {
  return (
    <div style={{
      backgroundColor: '#1f2937',
      color: '#fff',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontWeight: 'bold' }}>🔍 预览模式</span>
        <span style={{ color: '#9ca3af' }}>|</span>
        <span>{pageName}</span>
        <span style={{ 
          padding: '2px 8px', 
          backgroundColor: canvasType === 'PC' ? '#3b82f6' : '#10b981',
          borderRadius: '4px',
          fontSize: '12px',
        }}>
          {canvasType === 'PC' ? '💻 PC端' : '📱 手机端'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onNavigateHome}
          style={{
            padding: '4px 12px',
            backgroundColor: '#374151',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          🏠 首页
        </button>
        <button
          onClick={onClose}
          style={{
            padding: '4px 12px',
            backgroundColor: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
          }}
        >
          ✕ 关闭预览
        </button>
      </div>
    </div>
  );
}

window.PreviewToolbar = PreviewToolbar;

console.log('[DND2] preview/PreviewToolbar.jsx 加载完成');

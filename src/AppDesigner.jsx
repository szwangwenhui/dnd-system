/**
 * DND 页面设计器主应用
 * 独立入口，只加载页面设计器相关资源
 */

function AppDesigner() {
  const [loading, setLoading] = React.useState(true);
  const [projectId, setProjectId] = React.useState(null);
  const [roleId, setRoleId] = React.useState(null);
  const [pageId, setPageId] = React.useState(null);
  const [pageName, setPageName] = React.useState('');

  // 从 URL 参数获取信息
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('projectId');
    const rid = params.get('roleId');
    const pgId = params.get('pageId');
    const pgName = params.get('pageName') || '未知页面';

    if (pid && rid) {
      setProjectId(pid);
      setRoleId(rid);
      setPageId(pgId);
      setPageName(decodeURIComponent(pgName));
      setLoading(false);
    } else {
      alert('缺少必要参数，请从主页进入设计器');
      window.location.href = './index.html';
    }
  }, []);

  // 返回主页
  const goHome = () => {
    window.location.href = './index.html';
  };

  // 加载中
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f3f4f6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTopColor: '#667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#6b7280', margin: 0 }}>加载中...</p>
        </div>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {/* 顶部导航栏 */}
      <nav style={{
        background: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* 左侧：导航按钮 + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* 返回主页按钮 */}
            <button
              onClick={goHome}
              title="返回主页"
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '18px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#5a67d8'}
              onMouseOut={(e) => e.target.style.background = '#667eea'}
            >
              ←
            </button>

            {/* 分隔线 */}
            <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }}></div>

            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                DND
              </div>
              <div>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1f2937'
                }}>
                  页面设计器
                </span>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginTop: '2px'
                }}>
                  {pageName}
                </div>
              </div>
            </div>
          </div>

          {/* 右侧信息 */}
          <div style={{
            fontSize: '14px',
            color: '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>项目ID: {projectId}</span>
            <span>|</span>
            <span>角色ID: {roleId}</span>
          </div>
        </div>
      </nav>

      {/* 主内容区 - 直接使用 PageDesigner 组件 */}
      <main style={{ height: 'calc(100vh - 60px)' }}>
        {window.PageDesigner ? (
          <window.PageDesigner
            projectId={projectId}
            roleId={roleId}
            pageId={pageId}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6b7280'
          }}>
            设计器组件加载中...
          </div>
        )}
      </main>
    </div>
  );
}

// 渲染应用
const initApp = () => {
  if (!document.getElementById('root')) {
    setTimeout(initApp, 100);
    return;
  }
  
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<AppDesigner />);
  console.log('[DND2] 设计器 App 已渲染');
};

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

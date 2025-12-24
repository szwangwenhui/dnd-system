/**
 * DND 公测版主应用入口
 * 增加登录判断和用户信息显示
 */

function App() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [authChecked, setAuthChecked] = React.useState(false);
  
  // 视图状态：'projects' | 'roles' | 'pages' | 'dataLayer' | 'testExpr'
  const [currentView, setCurrentView] = React.useState('projects');
  // 当前选中的项目
  const [selectedProject, setSelectedProject] = React.useState(null);
  // 当前选中的角色
  const [selectedRole, setSelectedRole] = React.useState(null);
  // 测试表达式弹窗
  const [showExprTest, setShowExprTest] = React.useState(false);

  // 检查登录状态
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        // 等待 Supabase 客户端初始化
        if (!window.supabaseClient) {
          console.log('[App] 等待 Supabase 初始化...');
          setTimeout(checkAuth, 100);
          return;
        }

        const currentUser = await window.supabaseAuth.getCurrentUser();
        console.log('[App] 当前用户:', currentUser?.email || '未登录');
        setUser(currentUser);
      } catch (err) {
        console.error('[App] 检查登录状态失败:', err);
      } finally {
        setLoading(false);
        setAuthChecked(true);
      }
    };

    checkAuth();

    // 监听认证状态变化
    const setupAuthListener = () => {
      if (!window.supabaseClient) {
        setTimeout(setupAuthListener, 100);
        return;
      }

      const { data: { subscription } } = window.supabaseAuth.onAuthStateChange(
        (event, session) => {
          console.log('[App] 认证状态变化:', event);
          setUser(session?.user || null);
        }
      );

      return () => subscription?.unsubscribe();
    };

    const cleanup = setupAuthListener();
    return () => cleanup && cleanup();
  }, []);

  // 登出
  const handleLogout = async () => {
    try {
      await window.supabaseAuth.signOut();
      setUser(null);
    } catch (err) {
      console.error('[App] 登出失败:', err);
    }
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

  // 未登录，显示登录页
  if (!user) {
    return <LoginPage onLoginSuccess={() => window.location.reload()} />;
  }

  // 已登录，显示主应用
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
            <span style={{
              fontSize: '18px',
              fontWeight: '600',
              color: '#1f2937'
            }}>
              无代码设计系统
            </span>
            <span style={{
              fontSize: '12px',
              padding: '2px 8px',
              background: '#fef3c7',
              color: '#d97706',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
              公测版
            </span>
          </div>

          {/* 用户信息 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: '#f3f4f6',
              borderRadius: '20px'
            }}>
              <div style={{
                width: '28px',
                height: '28px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {user.email?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '14px', color: '#4b5563' }}>
                {user.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                color: '#ef4444',
                background: '#fee2e2',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#fecaca'}
              onMouseOut={(e) => e.target.style.background = '#fee2e2'}
            >
              退出登录
            </button>
          </div>
        </div>
      </nav>

      {/* 主内容区 */}
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '24px'
      }}>
        {/* 根据当前视图显示不同内容 */}
        {currentView === 'projects' && (
          // 项目列表页面
          <ProjectManagement 
            onSelectProject={(project) => {
              console.log('[App] 选择项目:', project.name);
              setSelectedProject(project);
              setCurrentView('roles');
            }}
            onTestExpr={() => setShowExprTest(true)}
          />
        )}

        {currentView === 'roles' && selectedProject && (
          // 角色管理页面
          <RoleManagement 
            projectId={selectedProject.id}
            onBack={() => {
              setSelectedProject(null);
              setCurrentView('projects');
            }}
            onDataLayerClick={(role) => {
              setSelectedRole(role);
              setCurrentView('dataLayer');
            }}
            onPageDesignClick={(role) => {
              setSelectedRole(role);
              setCurrentView('pages');
            }}
          />
        )}

        {currentView === 'pages' && selectedProject && selectedRole && (
          // 页面规划页面
          <PageDefinition 
            projectId={selectedProject.id}
            roleId={selectedRole.id}
            onBack={() => {
              setSelectedRole(null);
              setCurrentView('roles');
            }}
          />
        )}

        {currentView === 'dataLayer' && selectedProject && selectedRole && (
          // 数据层构建页面
          <DataLayerBuilder 
            projectId={selectedProject.id}
            roleId={selectedRole.id}
            onBack={() => {
              setSelectedRole(null);
              setCurrentView('roles');
            }}
          />
        )}
      </main>

      {/* 表达式测试弹窗 */}
      {showExprTest && window.PrimitiveExprTest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{
              padding: '16px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0 }}>表达式测试</h3>
              <button
                onClick={() => setShowExprTest(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9ca3af'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <PrimitiveExprTest />
            </div>
          </div>
        </div>
      )}

      {/* 反馈按钮 */}
      <FeedbackButton />

      {/* 页脚 */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        color: '#9ca3af',
        fontSize: '13px'
      }}>
        © 2024 DND System · 公测版 · 
        <a 
          href="javascript:void(0)" 
          onClick={() => document.querySelector('[title="反馈问题"]')?.click()}
          style={{ color: '#667eea', textDecoration: 'none', marginLeft: '4px' }}
        >
          遇到问题？点击反馈
        </a>
      </footer>
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
  root.render(<App />);
  console.log('[DND2] App 已渲染');
};

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

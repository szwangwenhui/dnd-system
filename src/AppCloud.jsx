/**
 * DND 公测版主应用入口
 * 增加登录判断和用户信息显示
 * 增加导航按钮（主页、返回）
 * 增加懒加载优化
 */

// 注意：loadComponentScript 函数已在 lazy-loader.js 中定义，并通过 window.loadComponentScript 导出
// 确保命名空间存在
window.DNDComponents = window.DNDComponents || {};

// 懒加载组件的 Hook
function useLazyComponent(src, componentGlobalName) {
  const [Component, setComponent] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    console.log('[LazyLoader] 开始懒加载:', { src, componentGlobalName });

    // 如果已经加载过，直接返回
    if (window.DNDComponents[componentGlobalName]) {
      console.log('[LazyLoader] 组件已存在:', componentGlobalName);
      setComponent(window.DNDComponents[componentGlobalName]);
      return;
    }

    // 检查缓存
    if (lazyComponentsCache[src]) {
      console.log('[LazyLoader] 组件已缓存:', src);
      const component = window.DNDComponents[componentGlobalName];
      if (component) {
        setComponent(component);
        return;
      }
    }

    // 开始加载
    console.log('[LazyLoader] 开始加载脚本...');
    setLoading(true);
    setError(null);

    loadComponentScript(src, componentGlobalName)
      .then((component) => {
        console.log('[LazyLoader] 脚本加载成功:', componentGlobalName, '组件:', typeof component);
        setComponent(component);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[LazyLoader] 脚本加载失败:', err);
        setError(err);
        setLoading(false);
      });
  }, [src, componentGlobalName]);

  return { Component, loading, error };
}

// 懒加载包装组件
function LazyComponentWrapper({ src, componentGlobalName, fallback, ...props }) {
  console.log('[LazyComponentWrapper] === 函数开始执行 ===');
  console.log('[LazyComponentWrapper] src:', src);
  console.log('[LazyComponentWrapper] componentGlobalName:', componentGlobalName);
  console.log('[LazyComponentWrapper] fallback:', fallback);
  console.log('[LazyComponentWrapper] props (rest参数):', props);
  console.log('[LazyComponentWrapper] props 类型:', typeof props);
  
  const { Component, loading, error } = useLazyComponent(src, componentGlobalName);

  console.log('[LazyComponentWrapper] 开始渲染, 收到的参数:', { src, componentGlobalName, fallback, props });
  console.log('[LazyComponentWrapper] useLazyComponent 返回:', { Component: !!Component, loading, error });
  console.log('[LazyComponentWrapper] 渲染状态:', {
    src,
    componentGlobalName,
    Component: !!Component,
    loading,
    error: error?.message,
    props
  });

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>组件加载失败: {error.message}</div>;
  }

  if (loading || !Component) {
    return fallback || (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: '14px'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
        <div>正在加载组件...</div>
      </div>
    );
  }

  console.log('[LazyComponentWrapper] ===== 准备渲染组件 =====');
  console.log('[LazyComponentWrapper] props:', props);
  console.log('[LazyComponentWrapper] props 类型:', typeof props);
  console.log('[LazyComponentWrapper] props 键名:', Object.keys(props || {}));
  console.log('[LazyComponentWrapper] props 详细内容:', JSON.stringify(props));
  console.log('[LazyComponentWrapper] Component:', Component);
  console.log('[LazyComponentWrapper] Component 类型:', typeof Component);
  console.log('[LazyComponentWrapper] Component.prototype:', Component.prototype);
  console.log('[LazyComponentWrapper] Component.name:', Component.name);
  console.log('[LazyComponentWrapper] Component === window.DNDComponents.DataLayerBuilder:', Component === window.DNDComponents?.DataLayerBuilder);
  console.log('[LazyComponentWrapper] window.DNDComponents.DataLayerBuilder:', window.DNDComponents?.DataLayerBuilder);

  // 即将展开并传递 props
  console.log('[LazyComponentWrapper] ===== 即将调用包装组件 =====');
  console.log('[LazyComponentWrapper] componentGlobalName:', componentGlobalName);
  console.log('[LazyComponentWrapper] props:', props);

  // 检查包装组件是否可用
  console.log('[LazyComponentWrapper] window.LazyLoadedComponentWrapper 存在:', typeof window.LazyLoadedComponentWrapper);

  if (typeof window.LazyLoadedComponentWrapper !== 'function') {
    console.error('[LazyComponentWrapper] window.LazyLoadedComponentWrapper 未定义！');
    return <div style={{ color: 'red' }}>错误：LazyLoadedComponentWrapper 未定义</div>;
  }

  // 使用包装组件渲染（包装组件不在 Babel 编译范围内）
  console.log('[LazyComponentWrapper] 调用包装组件');
  const result = <window.LazyLoadedComponentWrapper componentGlobalName={componentGlobalName} {...props} />;
  console.log('[LazyComponentWrapper] ===== 组件渲染完成 =====');

  return result;
}

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
  
  // 视图历史栈，用于返回上一页
  const [viewHistory, setViewHistory] = React.useState([]);

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
        // 设置全局用户状态，供用户账号区块使用
        window.currentUser = currentUser;
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
          // 更新全局用户状态
          window.currentUser = session?.user || null;
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

  // 导航到新视图（保存历史）
  const navigateTo = (view, project = selectedProject, role = selectedRole) => {
    setViewHistory(prev => [...prev, { view: currentView, project: selectedProject, role: selectedRole }]);
    setCurrentView(view);
    setSelectedProject(project);
    setSelectedRole(role);
  };

  // 返回上一页
  const goBack = () => {
    if (viewHistory.length > 0) {
      const lastState = viewHistory[viewHistory.length - 1];
      setViewHistory(prev => prev.slice(0, -1));
      setCurrentView(lastState.view);
      setSelectedProject(lastState.project);
      setSelectedRole(lastState.role);
    }
  };

  // 返回主页
  const goHome = () => {
    setViewHistory([]);
    setCurrentView('projects');
    setSelectedProject(null);
    setSelectedRole(null);
  };

  // 获取当前页面标题
  const getPageTitle = () => {
    switch (currentView) {
      case 'projects': return '项目管理';
      case 'roles': return `角色管理 - ${selectedProject?.name || ''}`;
      case 'pages': return `页面规划 - ${selectedRole?.name || ''}`;
      case 'dataLayer': return `数据层构建 - ${selectedRole?.name || ''}`;
      default: return '';
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
          {/* 左侧：导航按钮 + Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* 导航按钮组 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {/* 主页按钮 */}
              <button
                onClick={goHome}
                disabled={currentView === 'projects'}
                title="返回主页"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: currentView === 'projects' ? '#f3f4f6' : '#667eea',
                  color: currentView === 'projects' ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: currentView === 'projects' ? 'default' : 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (currentView !== 'projects') {
                    e.target.style.background = '#5a67d8';
                  }
                }}
                onMouseOut={(e) => {
                  if (currentView !== 'projects') {
                    e.target.style.background = '#667eea';
                  }
                }}
              >
                🏠
              </button>
              
              {/* 返回按钮 */}
              <button
                onClick={goBack}
                disabled={viewHistory.length === 0}
                title="返回上一页"
                style={{
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: viewHistory.length === 0 ? '#f3f4f6' : '#667eea',
                  color: viewHistory.length === 0 ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: viewHistory.length === 0 ? 'default' : 'pointer',
                  fontSize: '18px',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  if (viewHistory.length > 0) {
                    e.target.style.background = '#5a67d8';
                  }
                }}
                onMouseOut={(e) => {
                  if (viewHistory.length > 0) {
                    e.target.style.background = '#667eea';
                  }
                }}
              >
                ←
              </button>
            </div>

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
              <span style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1f2937'
              }}>
                无代码网站构建系统
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

            {/* 当前位置面包屑 */}
            {currentView !== 'projects' && (
              <>
                <div style={{ width: '1px', height: '24px', background: '#e5e7eb' }}></div>
                <div style={{ 
                  fontSize: '14px', 
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span 
                    onClick={goHome}
                    style={{ 
                      cursor: 'pointer', 
                      color: '#667eea',
                      textDecoration: 'underline'
                    }}
                  >
                    项目管理
                  </span>
                  {selectedProject && (
                    <>
                      <span style={{ color: '#d1d5db' }}>/</span>
                      <span 
                        onClick={() => {
                          if (currentView !== 'roles') {
                            setViewHistory(prev => [...prev, { view: currentView, project: selectedProject, role: selectedRole }]);
                            setCurrentView('roles');
                            setSelectedRole(null);
                          }
                        }}
                        style={{ 
                          cursor: currentView !== 'roles' ? 'pointer' : 'default', 
                          color: currentView !== 'roles' ? '#667eea' : '#374151',
                          textDecoration: currentView !== 'roles' ? 'underline' : 'none',
                          fontWeight: currentView === 'roles' ? '500' : 'normal'
                        }}
                      >
                        {selectedProject.name}
                      </span>
                    </>
                  )}
                  {selectedRole && (currentView === 'pages' || currentView === 'dataLayer') && (
                    <>
                      <span style={{ color: '#d1d5db' }}>/</span>
                      <span style={{ color: '#374151', fontWeight: '500' }}>
                        {selectedRole.name} - {currentView === 'pages' ? '页面规划' : '数据层'}
                      </span>
                    </>
                  )}
                </div>
              </>
            )}
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
              navigateTo('roles', project, null);
            }}
            onTestExpr={() => setShowExprTest(true)}
          />
        )}

        {currentView === 'roles' && selectedProject && (
          // 角色管理页面
          <RoleManagement 
            projectId={selectedProject.id}
            onBack={goBack}
            onDataLayerClick={(role) => {
              navigateTo('dataLayer', selectedProject, role);
            }}
            onPageDesignClick={(role) => {
              navigateTo('pages', selectedProject, role);
            }}
          />
        )}

        {currentView === 'pages' && selectedProject && selectedRole && (
          // 页面规划页面（懒加载）
          <LazyComponentWrapper
            src="./src/components/PageDefinition.jsx"
            componentGlobalName="PageDefinition"
            projectId={selectedProject.id}
            roleId={selectedRole.id}
            onBack={goBack}
          />
        )}

        {currentView === 'dataLayer' && selectedProject && selectedRole && (
          // 数据层构建页面（懒加载）
          <LazyComponentWrapper
            src="./src/components/DataLayerBuilder.jsx"
            componentGlobalName="DataLayerBuilder"
            projectId={selectedProject.id}
            roleId={selectedRole.id}
            onBack={goBack}
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

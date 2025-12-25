/**
 * DND用户账号区块组件
 * 
 * 功能：
 * - 未登录：显示"登录/注册"按钮
 * - 已登录：显示用户头像+昵称，点击展开下拉菜单
 * 
 * 配置项：
 * - showRegister: 是否显示注册按钮
 * - showAvatar: 是否显示头像
 * - menuItems: 下拉菜单项配置
 * - loginPageId: 登录页ID（不设置则使用内置弹窗）
 * - registerPageId: 注册页ID
 * - profilePageId: 个人中心页ID
 */

function AuthBlock({ block, style = {}, config = {}, onNavigate }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [showDropdown, setShowDropdown] = React.useState(false);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);
  const dropdownRef = React.useRef(null);

  // 默认配置
  const defaultConfig = {
    showRegister: true,
    showAvatar: true,
    loginText: '登录',
    registerText: '注册',
    menuItems: {
      profile: { enabled: true, text: '个人中心' },
      changePassword: { enabled: true, text: '修改密码' },
      adminCenter: { enabled: true, text: '管理中心' },
      logout: { enabled: true, text: '退出登录' }
    },
    loginPageId: null,
    registerPageId: null,
    profilePageId: null,
    adminPageId: null
  };

  const cfg = { ...defaultConfig, ...config };

  // 检查登录状态
  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        if (window.supabaseAuth) {
          const currentUser = await window.supabaseAuth.getCurrentUser();
          setUser(currentUser);
          window.currentUser = currentUser;
        }
      } catch (err) {
        console.error('检查登录状态失败:', err);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    // 监听认证状态变化
    const handleAuthChange = () => {
      checkAuth();
    };
    window.addEventListener('authStateChanged', handleAuthChange);

    // 监听 supabase 认证状态变化
    let unsubscribe = null;
    if (window.supabaseAuth) {
      const { data } = window.supabaseAuth.onAuthStateChange((event, session) => {
        setUser(session?.user || null);
        window.currentUser = session?.user || null;
      });
      unsubscribe = data?.subscription?.unsubscribe;
    }

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      unsubscribe && unsubscribe();
    };
  }, []);

  // 点击外部关闭下拉菜单
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 处理登出
  const handleLogout = async () => {
    try {
      if (window.supabaseAuth) {
        await window.supabaseAuth.signOut();
      }
      setUser(null);
      window.currentUser = null;
      setShowDropdown(false);
    } catch (err) {
      alert('登出失败: ' + err.message);
    }
  };

  // 处理菜单项点击
  const handleMenuClick = (action) => {
    setShowDropdown(false);
    switch (action) {
      case 'profile':
        if (cfg.profilePageId && onNavigate) {
          onNavigate(cfg.profilePageId);
        } else {
          alert('个人中心功能开发中');
        }
        break;
      case 'changePassword':
        alert('修改密码功能开发中');
        break;
      case 'adminCenter':
        if (cfg.adminPageId && onNavigate) {
          onNavigate(cfg.adminPageId);
        } else {
          alert('管理中心功能开发中');
        }
        break;
      case 'logout':
        handleLogout();
        break;
    }
  };

  // 处理登录按钮点击
  const handleLoginClick = () => {
    if (cfg.loginPageId && onNavigate) {
      onNavigate(cfg.loginPageId);
    } else {
      setShowLoginModal(true);
    }
  };

  // 处理注册按钮点击
  const handleRegisterClick = () => {
    if (cfg.registerPageId && onNavigate) {
      onNavigate(cfg.registerPageId);
    } else {
      setShowRegisterModal(true);
    }
  };

  // 样式
  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 8px',
    fontFamily: style.fontFamily || 'inherit',
    fontSize: style.fontSize || 14,
    // 不要展开整个style，只取需要的属性
  };

  const buttonStyle = {
    padding: '6px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: 'inherit',
    fontFamily: 'inherit'
  };

  const loginButtonStyle = {
    ...buttonStyle,
    backgroundColor: style.loginBgColor || '#3b82f6',
    color: style.loginTextColor || '#ffffff'
  };

  const registerButtonStyle = {
    ...buttonStyle,
    backgroundColor: style.registerBgColor || 'transparent',
    color: style.registerTextColor || '#3b82f6',
    border: `1px solid ${style.registerBorderColor || '#3b82f6'}`
  };

  const userInfoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'background-color 0.2s'
  };

  const avatarStyle = {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: style.avatarBgColor || '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    color: style.avatarTextColor || '#6b7280',
    overflow: 'hidden'
  };

  const dropdownStyle = {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '4px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    minWidth: '150px',
    zIndex: 1000,
    overflow: 'hidden'
  };

  const menuItemStyle = {
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    fontSize: 14,
    color: '#374151',
    borderBottom: '1px solid #f3f4f6'
  };

  const menuItemHoverStyle = {
    backgroundColor: '#f3f4f6'
  };

  const logoutItemStyle = {
    ...menuItemStyle,
    color: '#ef4444',
    borderBottom: 'none'
  };

  // 加载中
  if (loading) {
    return (
      <div style={containerStyle}>
        <span style={{ color: '#9ca3af' }}>...</span>
      </div>
    );
  }

  // 已登录状态
  if (user) {
    return (
      <div style={{ ...containerStyle, position: 'relative' }} ref={dropdownRef}>
        <div 
          style={userInfoStyle}
          onClick={() => setShowDropdown(!showDropdown)}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {cfg.showAvatar && (
            <div style={avatarStyle}>
              {user.avatar ? (
                <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>👤</span>
              )}
            </div>
          )}
          <span style={{ color: style.nicknameColor || '#374151' }}>
            {user.nickname || user.email?.split('@')[0] || '用户'}
          </span>
          <span style={{ fontSize: 10, color: '#9ca3af' }}>▼</span>
        </div>

        {/* 下拉菜单 */}
        {showDropdown && (
          <div style={dropdownStyle}>
            {cfg.menuItems.profile?.enabled && (
              <div 
                style={menuItemStyle}
                onClick={() => handleMenuClick('profile')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {cfg.menuItems.profile.text || '个人中心'}
              </div>
            )}
            {cfg.menuItems.changePassword?.enabled && (
              <div 
                style={menuItemStyle}
                onClick={() => handleMenuClick('changePassword')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {cfg.menuItems.changePassword.text || '修改密码'}
              </div>
            )}
            {cfg.menuItems.adminCenter?.enabled && user.role === 'admin' && (
              <div 
                style={menuItemStyle}
                onClick={() => handleMenuClick('adminCenter')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {cfg.menuItems.adminCenter.text || '管理中心'}
              </div>
            )}
            {cfg.menuItems.logout?.enabled && (
              <div 
                style={logoutItemStyle}
                onClick={() => handleMenuClick('logout')}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {cfg.menuItems.logout.text || '退出登录'}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // 未登录状态
  return (
    <div style={containerStyle}>
      <button 
        style={loginButtonStyle}
        onClick={handleLoginClick}
        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
      >
        {cfg.loginText}
      </button>
      {cfg.showRegister && (
        <button 
          style={registerButtonStyle}
          onClick={handleRegisterClick}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {cfg.registerText}
        </button>
      )}

      {/* 登录弹窗 */}
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
          onSuccess={(userData) => {
            setUser(userData);
            setShowLoginModal(false);
          }}
          onSwitchToRegister={() => {
            setShowLoginModal(false);
            setShowRegisterModal(true);
          }}
        />
      )}

      {/* 注册弹窗 */}
      {showRegisterModal && (
        <RegisterModal 
          onClose={() => setShowRegisterModal(false)}
          onSuccess={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
          onSwitchToLogin={() => {
            setShowRegisterModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </div>
  );
}

// ==================== 登录弹窗组件 ====================

function LoginModal({ onClose, onSuccess, onSwitchToRegister }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (window.supabaseAuth) {
        const result = await window.supabaseAuth.signIn(email, password);
        window.currentUser = result.user;
        onSuccess && onSuccess(result.user);
      } else {
        throw new Error('认证服务未初始化');
      }
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  };

  const modalStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    textAlign: 'center',
    color: '#1f2937'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '16px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1
  };

  const errorStyle = {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  };

  const linkStyle = {
    color: '#3b82f6',
    cursor: 'pointer',
    textDecoration: 'none'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>登录</h2>
        
        {error && <div style={errorStyle}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          还没有账号？
          <span style={linkStyle} onClick={onSwitchToRegister}> 立即注册</span>
        </div>
      </div>
    </div>
  );
}

// ==================== 注册弹窗组件 ====================

function RegisterModal({ onClose, onSuccess, onSwitchToLogin }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [nickname, setNickname] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      setLoading(false);
      return;
    }

    try {
      if (window.supabaseAuth) {
        await window.supabaseAuth.signUp(email, password, { nickname });
        alert('注册成功！请登录');
        onSuccess && onSuccess();
      } else {
        throw new Error('认证服务未初始化');
      }
    } catch (err) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  };

  const modalStyle = {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
  };

  const titleStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    textAlign: 'center',
    color: '#1f2937'
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    marginBottom: '16px',
    boxSizing: 'border-box',
    outline: 'none'
  };

  const buttonStyle = {
    width: '100%',
    padding: '12px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1
  };

  const errorStyle = {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  };

  const linkStyle = {
    color: '#3b82f6',
    cursor: 'pointer',
    textDecoration: 'none'
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>注册</h2>
        
        {error && <div style={errorStyle}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="昵称（选填）"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={inputStyle}
          />
          <input
            type="email"
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <input
            type="password"
            placeholder="密码（至少6位）"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="确认密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
            required
          />
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: '#6b7280' }}>
          已有账号？
          <span style={linkStyle} onClick={onSwitchToLogin}> 立即登录</span>
        </div>
      </div>
    </div>
  );
}

// 导出到全局
window.AuthBlock = AuthBlock;
window.LoginModal = LoginModal;
window.RegisterModal = RegisterModal;

console.log('[DND2] auth/AuthBlock.jsx 加载完成');

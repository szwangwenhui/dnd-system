/**
 * DND 公测版登录页
 * 只有登录功能，无注册（使用预置账号）
 */

function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await window.supabaseAuth.signIn(email, password);
      console.log('[LoginPage] 登录成功');
      onLoginSuccess && onLoginSuccess();
    } catch (err) {
      console.error('[LoginPage] 登录失败:', err);
      setError(err.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '32px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            DND
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1a1a2e',
            margin: '0 0 8px 0'
          }}>
            DND 无代码设计系统
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: 0
          }}>
            公测版 - 欢迎体验
          </p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* 登录表单 */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              邮箱账号
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="请输入邮箱"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '6px'
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="请输入密码"
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: '600',
              color: 'white',
              background: loading 
                ? '#9ca3af' 
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)')}
            onMouseOut={(e) => (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = 'none')}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        {/* 提示信息 */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f0f9ff',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#0369a1'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>📌 公测说明</div>
          <ul style={{ margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>请使用分配给您的测试账号登录</li>
            <li>如遇问题请使用页面右下角的反馈按钮</li>
            <li>感谢您参与测试！</li>
          </ul>
        </div>

        {/* AI说明 */}
        <div style={{
          marginTop: '16px',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#92400e',
          textAlign: 'center',
          border: '1px solid #fcd34d'
        }}>
          <span style={{ marginRight: '6px' }}>🤖</span>
          <strong>本网站代码全部由AI编写、调试和修改，无1行人工代码</strong>
        </div>

        {/* 版权信息 */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          © 2024 DND System. 公测版本
        </div>
      </div>
    </div>
  );
}

// 导出
window.LoginPage = LoginPage;
console.log('[DND2] components/LoginPage.jsx 加载完成');

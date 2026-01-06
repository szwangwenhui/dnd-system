/**
 * DND 流程编辑器主应用
 * 独立入口，只加载流程编辑器相关资源
 */

function AppFlowEditor() {
  const [loading, setLoading] = React.useState(true);
  const [projectId, setProjectId] = React.useState(null);
  const [flowId, setFlowId] = React.useState(null);
  const [flowName, setFlowName] = React.useState('');
  const [mode, setMode] = React.useState('design'); // 'design' | 'view'

  // 从 URL 参数获取信息
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('projectId');
    const fid = params.get('flowId');
    const fName = params.get('flowName') || '未知流程';
    const md = params.get('mode') || 'design';

    if (pid) {
      setProjectId(pid);
      setFlowId(fid);
      setFlowName(decodeURIComponent(fName));
      setMode(md);
      setLoading(false);
    } else {
      alert('缺少必要参数，请从主页进入流程编辑器');
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
      {/* 如果没有 flowId，显示流程列表 */}
      {!flowId ? (
        <DataFlowDefinition
          projectId={projectId}
          onDesignFlow={(flow) => {
            // 打开流程编辑器
            const flowEditorUrl = `floweditor.html?projectId=${projectId}&flowId=${flow.id}&flowName=${encodeURIComponent(flow.name)}&mode=design`;
            window.location.href = flowEditorUrl;
          }}
        />
      ) : (
        <FlowEditor
          projectId={projectId}
          flowId={flowId}
          flowName={flowName}
          onBack={() => {
            // 返回流程列表
            window.location.href = `floweditor.html?projectId=${projectId}`;
          }}
        />
      )}
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
  root.render(<AppFlowEditor />);
  console.log('[DND2] 流程编辑器 App 已渲染');
};

// DOM 加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

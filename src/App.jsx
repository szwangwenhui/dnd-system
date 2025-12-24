// 主应用组件
function App() {
  const [isDBReady, setIsDBReady] = React.useState(false);
  const [currentView, setCurrentView] = React.useState('projects'); // 'projects', 'roles', 'dataLayer', 'testExpr'
  const [selectedProject, setSelectedProject] = React.useState(null);
  const [selectedRole, setSelectedRole] = React.useState(null);

  React.useEffect(() => {
    // 初始化数据库
    window.dndDB.init()
      .then(() => {
        console.log('数据库初始化成功');
        setIsDBReady(true);
      })
      .catch((error) => {
        console.error('数据库初始化失败：', error);
        alert('数据库初始化失败，请刷新页面重试');
      });
  }, []);

  // 选择项目，进入角色管理
  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setCurrentView('roles');
  };

  // 选择角色，进入数据层构建
  const handleDataLayerClick = (role) => {
    setSelectedRole(role);
    setCurrentView('dataLayer');
  };

  // 返回项目列表
  const handleBackToProjects = () => {
    setSelectedProject(null);
    setSelectedRole(null);
    setCurrentView('projects');
  };

  // 返回角色管理
  const handleBackToRoles = () => {
    setSelectedRole(null);
    setCurrentView('roles');
  };

  // 进入测试表达式页面
  const handleTestExpr = () => {
    setCurrentView('testExpr');
  };

  if (!isDBReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">正在初始化数据库...</p>
        </div>
      </div>
    );
  }

  // 测试表达式视图
  if (currentView === 'testExpr') {
    return (
      <PrimitiveExprTest 
        onBack={handleBackToProjects}
      />
    );
  }

  // 数据层构建视图
  if (currentView === 'dataLayer' && selectedProject && selectedRole) {
    return (
      <DataLayerBuilder 
        projectId={selectedProject.id}
        roleId={selectedRole.id}
        onBack={handleBackToRoles}
      />
    );
  }

  // 角色管理视图
  if (currentView === 'roles' && selectedProject) {
    return (
      <RoleManagement 
        projectId={selectedProject.id}
        onBack={handleBackToProjects}
        onDataLayerClick={handleDataLayerClick}
      />
    );
  }

  // 项目列表视图
  return (
    <ProjectManagement 
      onSelectProject={handleSelectProject}
      onTestExpr={handleTestExpr}
    />
  );
}

// 渲染应用
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

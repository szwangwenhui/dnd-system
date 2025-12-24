// 数据层构建组件
function DataLayerBuilder({ projectId, roleId, onBack }) {
  const [project, setProject] = React.useState(null);
  const [role, setRole] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('fields'); // fields, forms, dataflows, pages
  
  // 流程编辑器状态
  const [editingFlow, setEditingFlow] = React.useState(null);

  // 加载项目和角色信息
  React.useEffect(() => {
    loadData();
  }, [projectId, roleId]);

  const loadData = async () => {
    try {
      const proj = await window.dndDB.getProjectById(projectId);
      setProject(proj);
      
      const foundRole = proj.roles.find(r => r.id === roleId);
      setRole(foundRole);
    } catch (error) {
      alert('加载数据失败：' + error);
    }
  };

  // 进入流程编辑器
  const handleDesignFlow = (flow) => {
    setEditingFlow(flow);
  };

  // 从流程编辑器返回
  const handleBackFromFlowEditor = () => {
    setEditingFlow(null);
  };

  if (!project || !role) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  // 如果正在编辑流程，显示流程编辑器
  if (editingFlow) {
    return (
      <FlowEditor
        projectId={projectId}
        flowId={editingFlow.id}
        flowName={editingFlow.name}
        onBack={handleBackFromFlowEditor}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">DND - 项目管理系统</h1>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <button
                  onClick={onBack}
                  className="hover:text-blue-600 transition-colors"
                >
                  项目列表
                </button>
                <span className="mx-2">›</span>
                <button
                  onClick={onBack}
                  className="hover:text-blue-600 transition-colors"
                >
                  {project.name}
                </button>
                <span className="mx-2">›</span>
                <button
                  onClick={onBack}
                  className="hover:text-blue-600 transition-colors"
                >
                  角色管理
                </button>
                <span className="mx-2">›</span>
                <span className="font-medium text-gray-700">{role.name}</span>
                <span className="mx-2">›</span>
                <span>数据层构建</span>
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              ← 返回角色管理
            </button>
          </div>
        </div>
      </div>

      {/* 二级导航栏 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('fields')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'fields'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              定义字段
            </button>
            <button
              onClick={() => setActiveTab('forms')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'forms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              定义表单
            </button>
            <button
              onClick={() => setActiveTab('dataflows')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'dataflows'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              定义数据流程
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'statistics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              统计分析
            </button>
            <button
              onClick={() => setActiveTab('pages')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'pages'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              定义页面
            </button>
          </nav>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'fields' && <FieldDefinition projectId={projectId} />}
        {activeTab === 'forms' && <FormDefinition projectId={projectId} />}
        {activeTab === 'dataflows' && <DataFlowDefinition projectId={projectId} onDesignFlow={handleDesignFlow} />}
        {activeTab === 'statistics' && <StatisticsModule projectId={projectId} />}
        {activeTab === "pages" && <PageDefinition key={roleId} projectId={projectId} roleId={roleId} />}
      </div>
    </div>
  );
}

window.DataLayerBuilder = DataLayerBuilder;
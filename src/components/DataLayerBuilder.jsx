// 数据层构建组件
// 确保命名空间存在
window.DNDComponents = window.DNDComponents || {};

function DataLayerBuilder(props) {
  // 如果 props 为 null，先返回一个错误提示（在所有 Hooks 之前是允许的）
  if (!props) {
    console.error('[DataLayerBuilder] props 为 null!');
    return React.createElement('div', { className: 'p-8 text-center text-red-600' }, '错误：组件参数异常');
  }

  // 提取参数
  const { projectId, roleId, onBack } = props;

  const [project, setProject] = React.useState(null);
  const [role, setRole] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('fields'); // fields, forms, dataflows, pages
  const [error, setError] = React.useState(null); // 错误状态

  // 懒加载依赖组件
  const [FormDefinition, setFormDefinition] = React.useState(null);
  const [DataFlowDefinition, setDataFlowDefinition] = React.useState(null);
  const [PageDefinition, setPageDefinition] = React.useState(null);

  // 加载项目和角色信息
  React.useEffect(() => {
    loadData();
  }, [projectId, roleId]);

  // 懒加载依赖组件
  React.useEffect(() => {
    console.log('[DataLayerBuilder] useEffect 触发:', {
      activeTab,
      FormDefinition: !!FormDefinition,
      DataFlowDefinition: !!DataFlowDefinition,
      PageDefinition: !!PageDefinition
    });

    // 根据当前 tab 加载对应组件
    if (activeTab === 'forms' && !FormDefinition) {
      console.log('[DataLayerBuilder] 开始加载 FormDefinition...');
      setError(null);
      window.loadComponentScript('./src/components/FormDefinition.jsx', 'FormDefinition')
        .then(component => {
          console.log('[DataLayerBuilder] FormDefinition 加载成功, 组件类型:', typeof component);
          console.log('[DataLayerBuilder] FormDefinition 是否为函数:', typeof component === 'function');
          console.log('[DataLayerBuilder] FormDefinition 本身:', component);
          console.log('[DataLayerBuilder] window.DNDComponents.FormDefinition:', window.DNDComponents.FormDefinition);
          setFormDefinition(component);
        })
        .catch(err => {
          console.error('[DataLayerBuilder] 加载 FormDefinition 失败:', err);
          setError('加载表单定义组件失败: ' + err.message);
        });
    } else if (activeTab === 'dataflows' && !DataFlowDefinition) {
      console.log('[DataLayerBuilder] 开始加载 DataFlowDefinition...');
      setError(null);
      window.loadComponentScript('./src/components/DataFlowDefinition.jsx', 'DataFlowDefinition')
        .then(setDataFlowDefinition)
        .catch(err => {
          console.error('[DataLayerBuilder] 加载 DataFlowDefinition 失败:', err);
          setError('加载数据流程组件失败: ' + err.message);
        });
    } else if (activeTab === 'pages' && !PageDefinition) {
      console.log('[DataLayerBuilder] 开始加载 PageDefinition...');
      setError(null);
      window.loadComponentScript('./src/components/PageDefinition.jsx', 'PageDefinition')
        .then(setPageDefinition)
        .catch(err => {
          console.error('[DataLayerBuilder] 加载 PageDefinition 失败:', err);
          setError('加载页面定义组件失败: ' + err.message);
        });
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      const proj = await window.dndDB.getProjectById(projectId);
      if (!proj) {
        alert('项目不存在');
        return;
      }
      setProject(proj);

      const foundRole = proj.roles?.find(r => r.id === roleId);
      setRole(foundRole);
    } catch (error) {
      alert('加载数据失败：' + error);
    }
  };

  // 进入流程编辑器
  const handleDesignFlow = (flow) => {
    // 跳转到独立的流程编辑器页面
    const flowEditorUrl = `floweditor.html?projectId=${projectId}&flowId=${flow.id}&flowName=${encodeURIComponent(flow.name)}&mode=design`;
    window.location.href = flowEditorUrl;
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
              onClick={() => {
                // 跳转到独立的统计页面
                const statisticsUrl = `statistics.html?projectId=${projectId}`;
                window.location.href = statisticsUrl;
              }}
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
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">加载错误</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'fields' && <FieldDefinition projectId={projectId} />}
        {activeTab === 'forms' && FormDefinition && (
          <FormDefinition key="form-def" projectId={projectId} />
        )}
        {activeTab === 'forms' && !FormDefinition && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">正在加载表单定义组件...</p>
          </div>
        )}
        {activeTab === 'dataflows' && DataFlowDefinition && (
          <DataFlowDefinition key="flow-def" projectId={projectId} onDesignFlow={handleDesignFlow} />
        )}
        {activeTab === 'dataflows' && !DataFlowDefinition && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">正在加载数据流程组件...</p>
          </div>
        )}
        {activeTab === 'statistics' && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">正在跳转到统计分析页面...</p>
          </div>
        )}
        {activeTab === "pages" && PageDefinition && (
          <PageDefinition key={`page-def-${roleId}`} projectId={projectId} roleId={roleId} />
        )}
        {activeTab === "pages" && !PageDefinition && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">正在加载页面定义组件...</p>
          </div>
        )}
      </div>
    </div>
  );
}

window.DNDComponents.DataLayerBuilder = DataLayerBuilder;
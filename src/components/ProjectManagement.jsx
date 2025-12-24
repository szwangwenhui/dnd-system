// 项目管理组件
function ProjectManagement({ onSelectProject, onTestExpr }) {  
  const [projects, setProjects] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [editingProject, setEditingProject] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: '',
    status: '规划阶段'
  });
  const [isBuilding, setIsBuilding] = React.useState(false);  // 搭建测试环境状态

  // 加载项目列表
  React.useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const allProjects = await window.dndDB.getAllProjects();
      setProjects(allProjects);
    } catch (error) {
      alert('加载项目列表失败：' + error);
    }
  };

  // 搭建测试环境
  const handleBuildTestEnv = async () => {
    // 检查是否已存在测试项目
    const hasTest = await window.TestEnvBuilder.hasTestProject();
    if (hasTest) {
      if (!confirm('已存在测试项目，是否继续创建新的测试环境？')) {
        return;
      }
    }

    setIsBuilding(true);
    try {
      await window.TestEnvBuilder.buildTestEnvironment();
      alert('测试环境搭建成功！\n\n已创建：\n- 1个测试项目\n- 3个测试角色\n- 30个字段（10主键+10整数+10字符）\n- 10个表单\n- 表1的5条测试数据');
      loadProjects();
    } catch (error) {
      alert('搭建测试环境失败：' + error.message);
    } finally {
      setIsBuilding(false);
    }
  };

  // 生成项目ID
  const generateProjectId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PRJ-${timestamp}-${random}`;
  };

  // 打开新建模态框
  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      status: '规划阶段'
    });
    setShowModal(true);
  };

  // 打开编辑模态框
  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      status: project.status
    });
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setEditingProject(null);
    setFormData({
      name: '',
      status: '规划阶段'
    });
  };

  // 处理表单输入
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('请输入项目名称');
      return;
    }

    if (formData.name.length > 20) {
      alert('项目名称不能超过20个字符');
      return;
    }

    try {
      const now = new Date().toISOString();

      if (editingProject) {
        // 更新项目
        const updatedProject = {
          ...editingProject,
          name: formData.name,
          status: formData.status,
          updatedAt: now
        };
        await window.dndDB.updateProject(updatedProject);
        alert('项目更新成功！');
      } else {
        // 创建新项目
        const newProject = {
          id: generateProjectId(),
          name: formData.name,
          status: '规划阶段',
          createdAt: now,
          updatedAt: now
        };
        await window.dndDB.addProject(newProject);
        alert('项目创建成功！');
      }

      closeModal();
      loadProjects();
    } catch (error) {
      alert('操作失败：' + error);
    }
  };

  // 删除项目
  const handleDelete = async (project) => {
    if (!confirm(`确定要删除项目"${project.name}"吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await window.dndDB.deleteProject(project.id);
      alert('项目删除成功！');
      loadProjects();
    } catch (error) {
      alert('删除失败：' + error);
    }
  };

  // 格式化时间
  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 状态标签样式
  const getStatusBadge = (status) => {
    const styles = {
      '规划阶段': 'bg-blue-100 text-blue-800',
      '开发阶段': 'bg-yellow-100 text-yellow-800',
      '已上线': 'bg-green-100 text-green-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部标题栏 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">DND - 项目管理系统</h1>
            <p className="mt-1 text-sm text-gray-500">Design and Develop - 模块1：项目管理</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onTestExpr}
              className="px-4 py-2 rounded-lg transition-colors border-2 border-purple-500 text-purple-600 hover:bg-purple-50"
            >
              🧪 测试表达式
            </button>
            <button
              onClick={handleBuildTestEnv}
              disabled={isBuilding}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isBuilding 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {isBuilding ? '搭建中...' : '🔧 搭建测试环境'}
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 操作栏 */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">项目列表</h2>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 添加新项目
          </button>
        </div>

        {/* 项目表格 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  项目编号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  项目名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  项目状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  最后修改时间
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  项目操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    暂无项目，点击右上角"添加新项目"开始创建
                  </td>
                </tr>
              ) : (
                projects.map(project => (
                  <tr key={project.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {project.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {project.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTime(project.updatedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditModal(project)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        修改
                      </button>
                      <button
                        onClick={() => handleDelete(project)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                      <button
                          onClick={() => onSelectProject(project)}
                          className="text-green-600 hover:text-green-900"
                      >
                        规划
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 新建/编辑项目模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProject ? '修改项目' : '添加新项目'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    maxLength="20"
                    placeholder="请输入项目名称（不超过20个字符）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    已输入 {formData.name.length}/20 个字符
                  </p>
                </div>

                {editingProject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      项目状态
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="规划阶段">规划阶段</option>
                      <option value="开发阶段">开发阶段</option>
                      <option value="已上线">已上线</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      新建项目默认为"规划阶段"
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProject ? '保存修改' : '确认提交'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

window.ProjectManagement = ProjectManagement;
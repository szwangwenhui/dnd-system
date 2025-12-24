// 角色管理组件
function RoleManagement({ projectId, onBack, onDataLayerClick, onPageDesignClick }) {
  const [project, setProject] = React.useState(null);
  const [roles, setRoles] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [editingRole, setEditingRole] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: ''
  });

  // 加载项目和角色列表
  React.useEffect(() => {
    loadProjectAndRoles();
  }, [projectId]);

  const loadProjectAndRoles = async () => {
    try {
      const proj = await window.dndDB.getProjectById(projectId);
      setProject(proj);
      
      const roleList = await window.dndDB.getRolesByProjectId(projectId);
      setRoles(roleList);
    } catch (error) {
      alert('加载数据失败：' + error);
    }
  };

  // 打开新建模态框
  const openCreateModal = () => {
    setEditingRole(null);
    setFormData({ name: '' });
    setShowModal(true);
  };

  // 打开编辑模态框
  const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({ name: role.name });
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setEditingRole(null);
    setFormData({ name: '' });
  };

  // 处理表单输入
  const handleInputChange = (e) => {
    const { value } = e.target;
    setFormData({ name: value });
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('请输入角色名称');
      return;
    }

    if (formData.name.length > 10) {
      alert('角色名称不能超过10个字符');
      return;
    }

    try {
      if (editingRole) {
        // 更新角色
        await window.dndDB.updateRole(projectId, editingRole.id, {
          name: formData.name
        });
        alert('角色更新成功！');
      } else {
        // 创建新角色
        await window.dndDB.addRole(projectId, {
          name: formData.name
        });
        alert('角色创建成功！');
      }

      closeModal();
      loadProjectAndRoles();
    } catch (error) {
      alert('操作失败：' + error);
    }
  };

  // 删除角色
  const handleDelete = async (role) => {
    if (!confirm(`确定要删除角色"${role.name}"吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await window.dndDB.deleteRole(projectId, role.id);
      alert('角色删除成功！');
      loadProjectAndRoles();
    } catch (error) {
      alert('删除失败：' + error);
    }
  };

  if (!project) {
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
                <span className="font-medium text-gray-700">{project.name}</span>
                <span className="mx-2">›</span>
                <span>角色管理</span>
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              ← 返回项目列表
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 操作栏 */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">角色列表</h2>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 添加新角色
          </button>
        </div>

        {/* 角色表格 */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色编号
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色名称
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                    暂无角色，点击右上角"添加新角色"开始创建
                  </td>
                </tr>
              ) : (
                roles.map(role => (
                  <tr key={role.id} className={`hover:bg-gray-50 ${role.isSystemRole ? 'bg-amber-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {role.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className="flex items-center">
                        {role.name}
                        {role.isSystemRole && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                            系统角色
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {role.isSystemRole ? (
                        <>
                          <span className="text-gray-400 text-xs">系统角色不可修改/删除</span>
                          <button
                            onClick={() => onDataLayerClick(role)}
                            className="text-green-600 hover:text-green-900 ml-2"
                          >
                            数据层规划
                          </button>
                          <button
                            onClick={() => onPageDesignClick && onPageDesignClick(role)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            页面规划
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => openEditModal(role)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            修改名称
                          </button>
                          <button
                            onClick={() => handleDelete(role)}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                          <button
                            onClick={() => onDataLayerClick(role)}
                            className="text-green-600 hover:text-green-900"
                          >
                            数据层规划
                          </button>
                          <button
                            onClick={() => onPageDesignClick && onPageDesignClick(role)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            页面规划
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>提示：</strong>角色编号自动生成（01-99），最多可创建99个角色。
                系统管理员（编号00）是系统默认角色，不可删除和修改。
                "数据层规划"和"页面规划"按钮将在下一模块启用。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 新建/编辑角色模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingRole ? '修改角色名称' : '添加新角色'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    角色名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    maxLength="10"
                    placeholder="请输入角色名称（不超过10个字符）"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    已输入 {formData.name.length}/10 个字符
                  </p>
                </div>

                {editingRole && (
                  <div className="mt-3 text-sm text-gray-500">
                    角色编号：<span className="font-mono font-semibold text-gray-700">{editingRole.id}</span>
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
                  {editingRole ? '保存修改' : '确认提交'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

window.RoleManagement = RoleManagement;
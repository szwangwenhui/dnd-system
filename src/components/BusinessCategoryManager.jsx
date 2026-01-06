/**
 * 业务分类管理组件
 * 用于管理项目的业务分类
 */

function BusinessCategoryManager({ projectId }) {
  const [categories, setCategories] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showModal, setShowModal] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: '',
    description: ''
  });

  // 加载业务分类列表
  React.useEffect(() => {
    loadCategories();
  }, [projectId]);

  const loadCategories = async () => {
    try {
      const categoryList = await window.dndDB.getBusinessCategoriesByProjectId(projectId);
      setCategories(categoryList);
    } catch (error) {
      alert('加载业务分类失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 打开新建模态框
  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  // 打开编辑模态框
  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '' });
  };

  // 处理表单输入
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('请输入分类名称');
      return;
    }

    if (formData.name.length > 10) {
      alert('分类名称不能超过10个字符');
      return;
    }

    if (formData.description && formData.description.length > 200) {
      alert('分类说明不能超过200个字符');
      return;
    }

    try {
      if (editingCategory) {
        // 更新分类
        await window.dndDB.updateBusinessCategory(
          projectId,
          editingCategory.id,
          formData
        );
        alert('分类更新成功！');
      } else {
        // 添加新分类
        await window.dndDB.addBusinessCategory(projectId, formData);
        alert('分类添加成功！');
      }

      closeModal();
      loadCategories();
    } catch (error) {
      alert('操作失败：' + error.message);
    }
  };

  // 删除分类
  const handleDelete = async (category) => {
    if (category.id === 'BCAT-001') {
      alert('系统字段分类是系统默认分类，不能删除');
      return;
    }

    if (!confirm(`确定要删除分类"${category.name}"吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await window.dndDB.deleteBusinessCategory(projectId, category.id);
      alert('分类删除成功！');
      loadCategories();
    } catch (error) {
      alert('删除失败：' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">正在加载...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      {/* 头部 */}
      <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">业务分类管理</h2>
        <button
          onClick={openCreateModal}
          className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          <span>添加分类</span>
        </button>
      </div>

      {/* 分类列表 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                分类编号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                分类名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                分类说明
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>暂无业务分类</p>
                    <p className="text-sm mt-2">点击右上角"添加分类"按钮创建第一个分类</p>
                  </div>
                </td>
              </tr>
            ) : (
              categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {category.id}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {category.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                    <div className="truncate" title={category.description || '-'}>
                      {category.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(category)}
                      className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors"
                    >
                      修改
                    </button>
                    {category.id !== 'BCAT-001' && (
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors"
                      >
                        删除
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 统计信息 */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>共 {categories.length} 个业务分类</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 bg-gray-200 rounded text-xs">
              提示：系统字段分类为默认分类，不可删除
            </span>
          </div>
        </div>
      </div>

      {/* 添加/编辑分类模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 transform transition-all">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? '修改分类' : '添加新分类'}
              </h3>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                {/* 分类名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类名称 <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">（10汉字以内）</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    maxLength={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入分类名称"
                    autoFocus
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    已输入：{formData.name.length}/10
                  </div>
                </div>

                {/* 分类说明 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类说明 <span className="text-xs text-gray-500 ml-2">（200汉字以内）</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    maxLength={200}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="请输入分类说明（可选）"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    已输入：{formData.description.length}/200
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end space-x-3">
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
                  确认提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

window.BusinessCategoryManager = BusinessCategoryManager;

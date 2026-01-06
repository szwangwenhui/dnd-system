// 字段定义组件
function FieldDefinition({ projectId }) {
  const [fields, setFields] = React.useState([]);
  const [forms, setForms] = React.useState([]);
  const [businessCategories, setBusinessCategories] = React.useState([]);
  const [showCategoryModal, setShowCategoryModal] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [editingField, setEditingField] = React.useState(null);
  const [filterRole, setFilterRole] = React.useState('');
  const [filterType, setFilterType] = React.useState('');
  const [filterNature, setFilterNature] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('');
  const [formData, setFormData] = React.useState({
    name: '',
    role: '非主键',
    type: '字符串',
    length: '',
    unique: false,
    nature: '基础字段',
    businessCategoryId: ''
  });

  // 加载字段列表
  React.useEffect(() => {
    loadFields();
    loadBusinessCategories();
  }, [projectId]);

  const loadFields = async () => {
    try {
      const fieldList = await window.dndDB.getFieldsByProjectId(projectId);
      setFields(fieldList);

      // 同时加载表单列表（用于显示关联表单名称）
      const formList = await window.dndDB.getFormsByProjectId(projectId);
      setForms(formList);
    } catch (error) {
      alert('加载字段失败：' + error);
    }
  };

  const loadBusinessCategories = async () => {
    try {
      const categoryList = await window.dndDB.getBusinessCategoriesByProjectId(projectId);
      setBusinessCategories(categoryList);
    } catch (error) {
      console.error('加载业务分类失败:', error);
    }
  };

  // 过滤字段
  const filteredFields = fields.filter(field => {
    if (filterRole && field.role !== filterRole) return false;
    if (filterType && field.type !== filterType) return false;
    if (filterNature && field.nature !== filterNature) return false;
    if (filterCategory && field.businessCategoryId !== filterCategory) return false;
    return true;
  });


  // 打开新建模态框
  const openCreateModal = () => {
    setEditingField(null);
    setFormData({
      name: '',
      role: '非主键',
      type: '字符串',
      length: '',
      unique: false,
      nature: '基础字段',
      businessCategoryId: ''
    });
    setShowModal(true);
  };

  // 打开编辑模态框
  const openEditModal = (field) => {
    setEditingField(field);
    setFormData({
      name: field.name,
      role: field.role,
      type: field.type,
      length: field.length || '',
      unique: field.unique,
      nature: field.nature || '基础字段',
      businessCategoryId: field.businessCategoryId || ''
    });
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setEditingField(null);
  };

  // 处理表单输入
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // 主键字段自动设为整数类型且唯一
    if (name === 'role' && value === '主键') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        type: '整数',
        unique: true  // 主键自动唯一
      }));
    } else if (name === 'role' && value === '非主键') {
      // 切换为非主键时，取消唯一性（如果之前是主键）
      setFormData(prev => ({
        ...prev,
        [name]: value,
        unique: prev.role === '主键' ? false : prev.unique
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 验证字段名称
    if (!formData.name.trim()) {
      alert('请输入字段名称');
      return;
    }

    if (formData.name.length > 6) {
      alert('字段名称不能超过6个字符');
      return;
    }

    // 验证长度限制
    if (formData.type === '字符串' && formData.length) {
      const len = parseInt(formData.length);
      if (isNaN(len) || len <= 0) {
        alert('长度限制必须是正整数');
        return;
      }
    }

    try {
      const fieldData = {
        name: formData.name.trim(),
        role: formData.role,
        type: formData.type,
        length: formData.type === '字符串' && formData.length ? parseInt(formData.length) : null,
        unique: formData.unique,
        nature: formData.nature,
        businessCategoryId: formData.businessCategoryId || null
      };

      if (editingField) {
        // 更新字段
        await window.dndDB.updateField(projectId, editingField.id, fieldData);
        alert('字段更新成功！');
      } else {
        // 创建新字段
        await window.dndDB.addField(projectId, fieldData);
        alert('字段创建成功！');
      }

      closeModal();
      loadFields();
    } catch (error) {
      alert('操作失败：' + error.message);
    }
  };

  // 删除字段
  const handleDelete = async (field) => {
    if (!confirm(`确定要删除字段"${field.name}"吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await window.dndDB.deleteField(projectId, field.id);
      alert('字段删除成功！');
      loadFields();
    } catch (error) {
      alert('删除失败：' + error);
    }
  };

  return (
    <div>
      {/* 操作栏 */}
      <div className="mb-6 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-800">字段库（全局共享）</h3>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            业务分类
          </button>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 添加新字段
        </button>
      </div>

      {/* 检索区 */}
      <div className="mb-4 bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-700 mb-1">字段角色</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              <option value="主键">主键</option>
              <option value="非主键">非主键</option>
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-700 mb-1">字段类型</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              <option value="字符串">字符串</option>
              <option value="整数">整数</option>
              <option value="浮点数">浮点数</option>
              <option value="逻辑">逻辑</option>
              <option value="日期/时间">日期/时间</option>
              <option value="文件">文件</option>
              <option value="富文本">富文本</option>
              <option value="JSON">JSON</option>
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-700 mb-1">字段性质</label>
            <select
              value={filterNature}
              onChange={(e) => setFilterNature(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              <option value="基础字段">基础字段</option>
              <option value="衍生字段">衍生字段</option>
              <option value="属性字段">属性字段</option>
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-700 mb-1">业务分类</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部</option>
              {businessCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterRole('');
                setFilterType('');
                setFilterNature('');
                setFilterCategory('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm"
            >
              重置筛选
            </button>
          </div>
        </div>
      </div>

      {/* 字段表格 */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                字段编号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                字段名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                字段角色
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                字段类型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                字段性质
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                业务分类
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                约束
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                 关联表单
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredFields.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                  暂无字段，点击右上角"添加新字段"开始创建
                </td>
              </tr>
            ) : (
              filteredFields.map(field => (
                <tr key={field.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {field.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {field.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      field.role === '主键'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {field.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {field.type}
                    {field.type === '字符串' && field.length && (
                      <span className="text-xs text-gray-500"> ({field.length})</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      field.nature === '衍生字段'
                        ? 'bg-pink-100 text-pink-800'
                        : field.nature === '属性字段'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {field.nature || '基础字段'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {field.businessCategoryId ? (
                      (() => {
                        const category = businessCategories.find(c => c.id === field.businessCategoryId);
                        return category ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            {category.name}
                          </span>
                        ) : null;
                      })()
                    ) : (
                      <span className="text-gray-400 text-xs">未分类</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {field.unique && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                        唯一
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {Array.isArray(field.relatedForms) && field.relatedForms.length > 0 ? (
                     <div className="flex flex-wrap gap-1">
                            {field.relatedForms.map((formId, index) => {
                              // 查找表单名称
                              const formName = forms.find(f => f.id === formId)?.name || formId;
                              return (
                               <span
                                 key={index}
                                 className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                                 title={`表单ID: ${formId}`}
                                >
                                 {formName}
                               </span>
                             );
                           })}
                         </div>
                     ) : (
                       <span className="text-gray-400 text-xs">未使用</span>
                     )}
                   </td>

                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => openEditModal(field)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      修改
                    </button>
                    <button
                      onClick={() => handleDelete(field)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
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
              <strong>提示：</strong>字段库是全局的，所有角色共享。基础字段的数据来自外部输入，衍生字段的数据通过计算得出（表达式在表单中定义）。主键字段只能是整数类型且自动具有唯一性。
            </p>
          </div>
        </div>
      </div>

      {/* 业务分类管理模态框 */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">业务分类管理</h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  loadBusinessCategories();
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              <BusinessCategoryManager projectId={projectId} />
            </div>
          </div>
        </div>
      )}

      {/* 新建/编辑字段模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingField ? '修改字段' : '添加新字段'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4 max-h-96 overflow-y-auto">
                {/* 字段名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    字段名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    maxLength="6"
                    placeholder="不超过6个字符，全局唯一"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    已输入 {formData.name.length}/6 个字符
                  </p>
                </div>

                {/* 字段角色 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    字段角色 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="主键"
                        checked={formData.role === '主键'}
                        onChange={handleInputChange}
                        className="form-radio text-blue-600"
                      />
                      <span className="ml-2">主键</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="role"
                        value="非主键"
                        checked={formData.role === '非主键'}
                        onChange={handleInputChange}
                        className="form-radio text-blue-600"
                      />
                      <span className="ml-2">非主键</span>
                    </label>
                  </div>
                </div>

                {/* 字段类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    字段类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    disabled={formData.role === '主键'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  >
                    <option value="字符串">字符串</option>
                    <option value="整数">整数</option>
                    <option value="浮点数">浮点数</option>
                    <option value="逻辑">逻辑</option>
                    <option value="日期/时间">日期/时间</option>
                    <option value="文件">文件</option>
                    <option value="富文本">富文本</option>
                    <option value="JSON">JSON</option>
                  </select>
                  {formData.role === '主键' && (
                    <p className="mt-1 text-xs text-gray-500">
                      主键字段只能是整数类型
                    </p>
                  )}
                </div>

                {/* 长度限制（仅字符串） */}
                {formData.type === '字符串' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      长度限制
                    </label>
                    <input
                      type="number"
                      name="length"
                      value={formData.length}
                      onChange={handleInputChange}
                      min="1"
                      placeholder="不填表示不限制"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {/* 唯一性约束 */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="unique"
                      checked={formData.unique}
                      onChange={handleInputChange}
                      disabled={formData.role === '主键'}
                      className="form-checkbox text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="ml-2 text-sm text-gray-700">唯一性约束</span>
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.role === '主键' 
                      ? '主键字段自动具有唯一性' 
                      : '该字段的值在数据表中必须唯一'}
                  </p>
                </div>

                {/* 字段性质 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    字段性质 <span className="text-red-500">*</span>
                  </label>
                  <div className="space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="nature"
                        value="基础字段"
                        checked={formData.nature === '基础字段'}
                        onChange={handleInputChange}
                        className="form-radio text-blue-600"
                      />
                      <span className="ml-2">基础字段</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="nature"
                        value="衍生字段"
                        checked={formData.nature === '衍生字段'}
                        onChange={handleInputChange}
                        className="form-radio text-blue-600"
                      />
                      <span className="ml-2">衍生字段</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="nature"
                        value="属性字段"
                        checked={formData.nature === '属性字段'}
                        onChange={handleInputChange}
                        className="form-radio text-purple-600"
                      />
                      <span className="ml-2">属性字段</span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    基础字段：数据来自外部输入；衍生字段：通过计算得出；属性字段：组成属性表的字段（如地区、类别）
                  </p>
                </div>

                {/* 业务分类 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    业务分类
                  </label>
                  <select
                    name="businessCategoryId"
                    value={formData.businessCategoryId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">请选择业务分类</option>
                    {businessCategories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    根据业务属性对字段进行分类，方便查找和管理
                  </p>
                </div>




                {editingField && (
                  <div className="text-sm text-gray-500">
                    字段编号：<span className="font-mono font-semibold text-gray-700">{editingField.id}</span>
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
                  {editingField ? '保存修改' : '确认提交'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

window.FieldDefinition = FieldDefinition;
// 页面定义组件（简化版 - 第一阶段）
function PageDefinition({ projectId, roleId }) {
  const [pages, setPages] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [editingPage, setEditingPage] = React.useState(null);
  const [formData, setFormData] = React.useState({
    name: '',
    category: '固定页',
    level: 1,
    parentId: '',
    designProgress: 0
  });
  
  // 设计页面相关状态
  const [showDesigner, setShowDesigner] = React.useState(false);
  const [designingPage, setDesigningPage] = React.useState(null);
  
  // 模板相关状态
  const [showTemplateSelector, setShowTemplateSelector] = React.useState(false);
  const [pendingDesignPage, setPendingDesignPage] = React.useState(null);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = React.useState(false);
  const [templateSourcePage, setTemplateSourcePage] = React.useState(null);

  // 参数配置相关状态
  const [showParamsConfig, setShowParamsConfig] = React.useState(false);
  const [paramsConfigPage, setParamsConfigPage] = React.useState(null);

  // 加载页面列表
  React.useEffect(() => {
    loadPages();
  }, [projectId, roleId]);

  const loadPages = async () => {
    try {
      const pageList = await window.dndDB.getPagesByRoleId(projectId, roleId);
      setPages(pageList);
    } catch (error) {
      alert('加载页面列表失败：' + error);
    }
  };

  // 打开新建模态框
  const openCreateModal = () => {
    setEditingPage(null);
    // 如果没有首页，默认级别0，否则默认级别1
    const hasHomePage = pages.some(p => p.level === 0);
    setFormData({
      name: '',
      category: '固定页',
      level: hasHomePage ? 1 : 0,
      parentId: hasHomePage ? getHomePage()?.id || '' : '',
      designProgress: 0
    });
    setShowModal(true);
  };

  // 打开编辑模态框
  const openEditModal = (page) => {
    setEditingPage(page);
    setFormData({
      name: page.name,
      category: page.category || '固定页',
      level: page.level,
      parentId: page.parentId || '',
      designProgress: page.designProgress || 0
    });
    setShowModal(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setShowModal(false);
    setEditingPage(null);
  };

  // 处理表单输入
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 如果修改了级别，重置父页面
    if (name === 'level') {
      const newLevel = parseInt(value);
      setFormData(prev => ({
        ...prev,
        [name]: newLevel,
        parentId: newLevel === 0 ? '' : (newLevel === 1 ? getHomePage()?.id || '' : '')
      }));
    } else if (name === 'designProgress') {
      // 设计进度限制在0-100
      const progress = Math.min(100, Math.max(0, parseInt(value) || 0));
      setFormData(prev => ({
        ...prev,
        [name]: progress
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 提交表单
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('请输入页面名称');
      return;
    }

    if (formData.name.length > 20) {
      alert('页面名称不能超过20个字符');
      return;
    }

    const level = parseInt(formData.level);
    if (isNaN(level) || level < 0 || level > 10) {
      alert('页面级别必须在0-10之间');
      return;
    }

    // 级别大于0时必须选择父页面
    if (level > 0 && !formData.parentId) {
      alert('请选择上级页面');
      return;
    }

    try {
      const pageData = {
        name: formData.name.trim(),
        category: formData.category,
        level: level,
        parentId: level === 0 ? null : formData.parentId,
        designProgress: formData.designProgress
      };

      if (editingPage) {
        // 更新页面
        await window.dndDB.updatePage(projectId, roleId, editingPage.id, pageData);
        alert('页面更新成功！');
      } else {
        // 创建新页面
        await window.dndDB.addPage(projectId, roleId, pageData);
        alert('页面创建成功！');
      }

      closeModal();
      loadPages();
    } catch (error) {
      alert('操作失败：' + error.message);
    }
  };

  // 删除页面
  const handleDelete = async (page) => {
    // 首页不能删除
    if (page.level === 0) {
      alert('首页不能删除');
      return;
    }

    // 检查是否有子页面
    const hasChildren = pages.some(p => p.parentId === page.id);
    if (hasChildren) {
      alert('该页面有子页面，请先删除子页面');
      return;
    }

    if (!confirm(`确定要删除页面"${page.name}"吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await window.dndDB.deletePage(projectId, roleId, page.id);
      alert('页面删除成功！');
      loadPages();
    } catch (error) {
      alert('删除失败：' + error);
    }
  };

  // 预览页面
  const handlePreviewPage = (page) => {
    // 在新标签页打开预览
    const previewUrl = `preview.html?projectId=${projectId}&roleId=${roleId}&pageId=${page.id}`;
    window.open(previewUrl, '_blank');
  };

  // 保存设计页面
  const handleSaveDesign = async (updatedPage) => {
    await window.dndDB.updatePage(projectId, roleId, updatedPage.id, updatedPage);
    await loadPages();
  };

  // 关闭设计页面
  const handleCloseDesigner = () => {
    setShowDesigner(false);
    setDesigningPage(null);
    loadPages(); // 刷新页面列表以更新进度
  };

  // ==================== 模板相关函数 ====================

  // 点击"设计页面"按钮 - 显示模板选择弹窗
  const handleDesignPageClick = (page) => {
    setPendingDesignPage(page);
    setShowTemplateSelector(true);
  };

  // 处理模板选择结果
  const handleTemplateSelect = async (result) => {
    setShowTemplateSelector(false);
    
    if (result.mode === 'self') {
      // 自行设计，直接打开设计器
      await openDesigner(pendingDesignPage);
    } else if (result.mode === 'template') {
      // 采用模板
      try {
        const pageData = await window.dndDB.createPageFromTemplate(
          projectId, 
          result.templateId, 
          {
            copyStyle: result.copyStyle,
            copyFunctions: result.copyFunctions
          }
        );
        
        // 将模板数据合并到当前页面
        const updatedPage = {
          ...pendingDesignPage,
          design: {
            ...(pendingDesignPage.design || {}),
            blocks: pageData.blocks || []
          }
        };
        
        // 如果复制了样式，合并页面级样式
        if (result.copyStyle && pageData.style) {
          updatedPage.design.style = pageData.style;
        }
        
        // 如果复制了功能，合并页面级功能
        if (result.copyFunctions && pageData.functions) {
          updatedPage.design.functions = pageData.functions;
        }
        
        // 保存更新后的页面
        await window.dndDB.updatePage(projectId, roleId, updatedPage.id, updatedPage);
        
        // 打开设计器
        await openDesigner(updatedPage);
      } catch (error) {
        alert('应用模板失败：' + error.message);
      }
    }
    
    setPendingDesignPage(null);
  };

  // 打开设计器（从数据库加载最新数据）
  const openDesigner = async (page) => {
    try {
      const freshPages = await window.dndDB.getPagesByRoleId(projectId, roleId);
      const freshPage = freshPages.find(p => p.id === page.id);
      if (freshPage) {
        console.log('设计页面：加载最新数据', freshPage.design?.blocks?.map(b => ({ id: b.id, zIndex: b.style?.zIndex })));
        setDesigningPage(freshPage);
        setPages(freshPages);
      } else {
        setDesigningPage(page);
      }
    } catch (error) {
      console.error('加载最新页面数据失败:', error);
      setDesigningPage(page);
    }
    setShowDesigner(true);
  };

  // 点击"设为模板"按钮
  const handleSaveAsTemplate = (page) => {
    setTemplateSourcePage(page);
    setShowSaveAsTemplate(true);
  };

  // 确认保存为模板
  const handleConfirmSaveAsTemplate = async (name, description) => {
    try {
      const page = templateSourcePage;
      
      // 提取页面的样式和功能信息
      const template = {
        name,
        description,
        sourcePageId: page.id,
        style: page.design?.style || {},
        blocks: (page.design?.blocks || []).map(block => ({
          ...block,
          // 保留样式信息
          type: block.type,
          x: block.x,
          y: block.y,
          width: block.width,
          height: block.height,
          style: block.style,
          children: block.children,
          // 保留功能信息
          dataBinding: block.dataBinding,
          interaction: block.interaction,
          buttonConfig: block.buttonConfig,
          formConfig: block.formConfig
        })),
        functions: page.design?.functions || {}
      };
      
      await window.dndDB.addPageTemplate(projectId, template);
      alert('页面模板保存成功！');
      setShowSaveAsTemplate(false);
      setTemplateSourcePage(null);
    } catch (error) {
      alert('保存模板失败：' + error.message);
    }
  };

  // ==================== 参数配置相关函数 ====================

  // 打开参数配置弹窗
  const handleOpenParamsConfig = (page) => {
    setParamsConfigPage(page);
    setShowParamsConfig(true);
  };

  // 保存参数配置
  const handleSaveParamsConfig = async (paramConfig) => {
    try {
      await window.dndDB.updatePageParams(projectId, roleId, paramsConfigPage.id, paramConfig);
      alert('参数配置保存成功！');
      setShowParamsConfig(false);
      setParamsConfigPage(null);
      loadPages(); // 刷新页面列表
    } catch (error) {
      alert('保存参数配置失败：' + error.message);
    }
  };

  // 获取首页
  const getHomePage = () => {
    return pages.find(p => p.level === 0);
  };

  // 获取可选的上级页面列表（级别=当前级别-1的页面）
  const getAvailableParentPages = () => {
    const currentLevel = parseInt(formData.level);
    if (currentLevel <= 0) return [];
    
    const targetLevel = currentLevel - 1;
    return pages.filter(p => 
      p.level === targetLevel && 
      p.id !== editingPage?.id
    );
  };

  // 获取页面名称
  const getPageName = (pageId) => {
    if (!pageId) return '-';
    const page = pages.find(p => p.id === pageId);
    return page ? page.name : '未知页面';
  };

  // 按层级排序并构建树状显示
  const getSortedPages = () => {
    // 先按级别排序，同级别按创建时间排序
    return [...pages].sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  };

  // 获取缩进样式
  const getIndentStyle = (level) => {
    return { paddingLeft: `${level * 24}px` };
  };

  return (
    <div>
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          页面列表 ({pages.length} 个页面)
        </h3>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 添加页面
        </button>
      </div>

      {/* 页面列表表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                页面编号
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                页面名称
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                页面级别
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                上级页面
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                页面类别
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                设计进度
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pages.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                  暂无页面，请先添加页面
                </td>
              </tr>
            ) : (
              getSortedPages().map(page => (
                <tr key={page.id} className={page.level === 0 ? 'bg-blue-50' : ''}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono text-sm text-gray-600">{page.id}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div style={getIndentStyle(page.level)} className="flex items-center">
                      {page.level > 0 && (
                        <span className="text-gray-400 mr-2">└─</span>
                      )}
                      <span className={`font-medium ${page.level === 0 ? 'text-blue-700' : 'text-gray-900'}`}>
                        {page.name}
                      </span>
                      {page.level === 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                          根
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      page.level === 0 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {page.level}级
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                    {getPageName(page.parentId)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      page.category === '独立页' 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {page.category || '固定页'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className={`h-2 rounded-full ${
                            (page.designProgress || 0) === 100 
                              ? 'bg-green-500' 
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${page.designProgress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{page.designProgress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm space-x-2">
                    {page.level === 0 ? (
                      <>
                        <button
                          onClick={() => handleDesignPageClick(page)}
                          className="text-green-600 hover:text-green-900"
                        >
                          设计页面
                        </button>
                        <button
                          onClick={() => handleOpenParamsConfig(page)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          配置参数
                        </button>
                        <button
                          onClick={() => handlePreviewPage(page)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          预览
                        </button>
                        <button
                          onClick={() => handleSaveAsTemplate(page)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          设为模板
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditModal(page)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          修改
                        </button>
                        <button
                          onClick={() => handleDesignPageClick(page)}
                          className="text-green-600 hover:text-green-900"
                        >
                          设计页面
                        </button>
                        <button
                          onClick={() => handleOpenParamsConfig(page)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          配置参数
                        </button>
                        <button
                          onClick={() => handlePreviewPage(page)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          预览
                        </button>
                        <button
                          onClick={() => handleSaveAsTemplate(page)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          设为模板
                        </button>
                        <button
                          onClick={() => handleDelete(page)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
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
              <strong>提示：</strong>
              系统自动创建0级首页（不可删除）。
              页面名称全局唯一。
              每个页面的上级页面必须是级别-1的页面。
              点击"设计页面"可进入可视化设计器，点击"预览"可在新标签页查看页面效果。
            </p>
          </div>
        </div>
      </div>

      {/* 新建/编辑页面模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 my-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPage ? '修改页面' : '添加新页面'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                {/* 页面名称 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    页面名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    maxLength="20"
                    placeholder="不超过20个字符，全局唯一"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    已输入 {formData.name.length}/20 个字符
                  </p>
                </div>

                {/* 页面类别 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    页面类别
                  </label>
                  <div className="space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value="固定页"
                        checked={formData.category === '固定页'}
                        onChange={handleInputChange}
                        className="form-radio text-blue-600"
                      />
                      <span className="ml-2">固定页</span>
                    </label>
                    <label className="inline-flex items-center opacity-50">
                      <input
                        type="radio"
                        name="category"
                        value="独立页"
                        checked={formData.category === '独立页'}
                        onChange={handleInputChange}
                        disabled
                        className="form-radio text-blue-600"
                      />
                      <span className="ml-2">独立页（暂不支持）</span>
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    固定页：在页面树状结构中的页面；独立页：临时页面（如营销活动页）
                  </p>
                </div>

                {/* 页面级别 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    页面级别 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    min="1"
                    max="10"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    1-10，级别1的上级是首页（0级）
                  </p>
                </div>

                {/* 上级页面 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    上级页面 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="parentId"
                    value={formData.parentId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">请选择上级页面</option>
                    {getAvailableParentPages().map(page => (
                      <option key={page.id} value={page.id}>
                        {page.name} ({page.level}级)
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    只能选择级别={parseInt(formData.level) - 1}的页面
                  </p>
                </div>

                {/* 设计进度 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    设计进度
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      name="designProgress"
                      value={formData.designProgress}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-500">%</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          formData.designProgress === 100 
                            ? 'bg-green-500' 
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${formData.designProgress}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    手动输入页面设计完成度（0-100%）
                  </p>
                </div>

                {editingPage && (
                  <div className="text-sm text-gray-500 pt-2 border-t">
                    页面编号：<span className="font-mono font-semibold text-gray-700">{editingPage.id}</span>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
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
                  {editingPage ? '保存修改' : '确认提交'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* 页面设计器 */}
      {showDesigner && designingPage && (
        <PageDesigner
          projectId={projectId}
          roleId={roleId}
          page={designingPage}
          onClose={handleCloseDesigner}
          onSave={handleSaveDesign}
        />
      )}

      {/* 模板选择弹窗 */}
      {showTemplateSelector && (
        <PageTemplateSelector
          projectId={projectId}
          onSelect={handleTemplateSelect}
          onCancel={() => {
            setShowTemplateSelector(false);
            setPendingDesignPage(null);
          }}
        />
      )}

      {/* 设为模板弹窗 */}
      {showSaveAsTemplate && templateSourcePage && (
        <SaveAsTemplateModal
          type="page"
          sourceName={templateSourcePage.name}
          onSave={handleConfirmSaveAsTemplate}
          onCancel={() => {
            setShowSaveAsTemplate(false);
            setTemplateSourcePage(null);
          }}
        />
      )}

      {/* 参数配置弹窗 */}
      {showParamsConfig && paramsConfigPage && (
        <PageParamsConfig
          projectId={projectId}
          roleId={roleId}
          page={paramsConfigPage}
          allPages={pages}
          onSave={handleSaveParamsConfig}
          onCancel={() => {
            setShowParamsConfig(false);
            setParamsConfigPage(null);
          }}
        />
      )}
    </div>
  );
}

window.PageDefinition = PageDefinition;

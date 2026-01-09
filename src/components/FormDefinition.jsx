// 表单定义组件（新版 - 支持表单分类）
function FormDefinition({ projectId }) {
  const [forms, setForms] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [showTypeModal, setShowTypeModal] = React.useState(false);
  const [showSubTypeModal, setShowSubTypeModal] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState('');
  const [selectedSubType, setSelectedSubType] = React.useState('');
  const [showFormBuilder, setShowFormBuilder] = React.useState(false);
  const [showBaseFormModal, setShowBaseFormModal] = React.useState(false);
  const [globalLoading, setGlobalLoading] = React.useState(false); // 全局加载状态
  const [globalLoadingText, setGlobalLoadingText] = React.useState(''); // 全局加载文本

  // 数据录入相关状态
  const [showDataEntryModal, setShowDataEntryModal] = React.useState(false);
  const [dataEntryForm, setDataEntryForm] = React.useState(null);

  // 查看表单相关状态
  const [showViewerModal, setShowViewerModal] = React.useState(false);
  const [viewerForm, setViewerForm] = React.useState(null);

  // 子表和再造表管理器状态（入口1：从定义表单进入）
  const [showSubTableManager, setShowSubTableManager] = React.useState(false);
  const [showRebuildTableManager, setShowRebuildTableManager] = React.useState(false);

  // 加载表单列表和字段列表
  React.useEffect(() => {
    loadFormsAndFields();
  }, [projectId]);

  const loadFormsAndFields = async () => {
    console.log('=== loadFormsAndFields 开始 ===');
    try {
      console.log('加载表单列表...');
      const formList = await window.dndDB.getFormsByProjectId(projectId);
      console.log('表单列表加载完成，数量:', formList?.length);

      console.log('设置表单列表');
      setForms(formList);

      console.log('加载字段列表...');
      const fieldList = await window.dndDB.getFieldsByProjectId(projectId);
      console.log('字段列表加载完成，数量:', fieldList?.length);
      setFields(fieldList);

      console.log('=== loadFormsAndFields 完成 ===');
    } catch (error) {
      console.error('loadFormsAndFields 失败:', error);
      alert('加载数据失败：' + error);
    }
  };

  // 打开新建表单 - 第一步：选择表单类型
  const openCreateModal = () => {
    setSelectedType('');
    setSelectedSubType('');
    setShowFormBuilder(false);
    setShowTypeModal(true);
  };

  // 选择表单类型（对象表 / 属性表）
  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setShowTypeModal(false);
    
    if (type === '属性表') {
      // 属性表直接进入构建（使用旧的逻辑）
      setShowFormBuilder(true);
    } else if (type === '对象表') {
      // 对象表需要选择子类型
      setShowSubTypeModal(true);
    }
  };

  // 选择对象表子类型（基础表 / 衍生表 / 合表 / 子表 / 再造表）
  const handleSubTypeSelect = (subType) => {
    setSelectedSubType(subType);
    setShowSubTypeModal(false);

    if (subType === '子表') {
      // 入口1：打开子表管理器（需要选择操作目标表）
      setShowSubTableManager(true);
    } else if (subType === '再造表') {
      // 入口1：打开再造表管理器（需要选择操作目标表）
      setShowRebuildTableManager(true);
    } else {
      // 基础表、衍生表、合表进入构建流程
      setShowFormBuilder(true);
    }
  };

  // 关闭表单构建器
  const closeFormBuilder = () => {
    setShowFormBuilder(false);
    setSelectedType('');
    setSelectedSubType('');
    loadFormsAndFields(); // 刷新列表
  };

  // 删除表单
  const handleDelete = async (form) => {
    if (!confirm(`确定要删除表单"${form.name}"吗？此操作不可恢复！`)) {
      return;
    }

    try {
      await window.dndDB.deleteForm(projectId, form.id);
      alert('表单删除成功！');
      loadFormsAndFields();
    } catch (error) {
      alert('删除失败：' + error);
    }
  };

  // 判断是否为基础表（可以添加数据）
  const isBaseForm = (form) => {
    const subType = form.subType || '';
    // 兼容旧数据（独立基础表、关联基础表）和新数据
    return subType === '独立基础表' ||
           subType === '关联基础表' ||
           subType === '普通独立基础表' ||
           subType === '详情独立基础表' ||
           subType === '普通关联基础表' ||
           subType === '标题关联基础表';
  };

  // 判断是否为属性表
  const isAttributeForm = (form) => {
    return form.type === '属性表单';
  };

  // 判断是否可以添加数据（基础表或属性表）
  const canAddData = (form) => {
    return isBaseForm(form) || isAttributeForm(form);
  };

  // 打开数据录入模态框
  const openDataEntryModal = (form) => {
    setDataEntryForm(form);
    setShowDataEntryModal(true);
  };

  // 关闭数据录入模态框
  const closeDataEntryModal = () => {
    setShowDataEntryModal(false);
    setDataEntryForm(null);
    loadFormsAndFields(); // 刷新列表以显示数据数量
  };

  // 打开查看模态框
  const openViewerModal = (form) => {
    setViewerForm(form);
    setShowViewerModal(true);
  };

  // 关闭查看模态框
  const closeViewerModal = () => {
    setShowViewerModal(false);
    setViewerForm(null);
  };

  return (
    <div className="space-y-6">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">表单库（项目级共享）</h2>
          <p className="mt-1 text-sm text-gray-500">
            定义数据表单结构，支持基础表、衍生表、合表等多种类型
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 添加新表单
        </button>
      </div>

      {/* 表单列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                表单ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                表单名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                表单类型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                表单性质
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                子类型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                数据量
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {forms.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  暂无表单，点击右上角"添加新表单"开始创建
                </td>
              </tr>
            ) : (
              forms.map(form => (
                <tr key={form.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                    {form.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {form.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      form.type === '对象表单' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {form.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {form.formNature || '基础表单'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      form.subType === '独立基础表' ? 'bg-green-100 text-green-800' :
                      form.subType === '普通独立基础表' ? 'bg-green-100 text-green-800' :
                      form.subType === '详情独立基础表' ? 'bg-teal-100 text-teal-800' :
                      form.subType === '关联基础表' ? 'bg-yellow-100 text-yellow-800' :
                      form.subType === '普通关联基础表' ? 'bg-yellow-100 text-yellow-800' :
                      form.subType === '标题关联基础表' ? 'bg-orange-100 text-orange-800' :
                      form.subType === '合表' ? 'bg-pink-100 text-pink-800' :
                      form.subType === '衍生表' ? 'bg-red-100 text-red-800' :
                      form.subType === '子表' ? 'bg-purple-100 text-purple-800' :
                      form.subType === '再造表' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {form.subType || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {canAddData(form) ? (
                      <span className="text-gray-900 font-medium">
                        {form.data?.length || 0} 条
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {/* 查看按钮 - 所有表单都显示 */}
                    <button
                      onClick={() => openViewerModal(form)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      查看
                    </button>
                    {/* 添加数据按钮 - 基础表和属性表显示 */}
                    {canAddData(form) && (
                      <button
                        onClick={() => openDataEntryModal(form)}
                        className={`hover:opacity-75 ${
                          isAttributeForm(form) ? 'text-purple-600' : 'text-blue-600'
                        }`}
                      >
                        添加数据
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(form)}
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

      {/* 第一步：选择表单类型（对象表 / 属性表） */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">选择表单类型</h3>
            </div>
            
            <div className="px-6 py-6 space-y-3">
              <button
                onClick={() => handleTypeSelect('对象表')}
                className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="font-medium text-gray-900">对象表</div>
                <div className="text-sm text-gray-500 mt-1">
                  用于存储实体数据（如：学生信息、订单记录）
                </div>
              </button>
              
              <button
                onClick={() => handleTypeSelect('属性表')}
                className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <div className="font-medium text-gray-900">属性表</div>
                <div className="text-sm text-gray-500 mt-1">
                  用于定义分类属性（如：地区、类别、状态）
                </div>
              </button>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowTypeModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 第二步：选择对象表子类型（基础表 / 衍生表 / 合表 / 子表 / 再造表） */}
      {showSubTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">选择对象表类型</h3>
            </div>
            
            <div className="px-6 py-6 space-y-3">
              <button
                onClick={() => handleSubTypeSelect('基础表')}
                className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
              >
                <div className="font-medium text-gray-900">基础表</div>
                <div className="text-sm text-gray-500 mt-1">
                  数据来自外部输入，物理存储（独立基础表 / 关联基础表）
                </div>
              </button>
              
              <button
                onClick={() => handleSubTypeSelect('衍生表')}
                className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all"
              >
                <div className="font-medium text-gray-900">衍生表</div>
                <div className="text-sm text-gray-500 mt-1">
                  通过表达式计算生成，虚拟表（不物理存储）
                </div>
              </button>
              
              <button
                onClick={() => handleSubTypeSelect('合表')}
                className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all"
              >
                <div className="font-medium text-gray-900">合表</div>
                <div className="text-sm text-gray-500 mt-1">
                  合并主键相同的多个表单，虚拟表（不物理存储）
                </div>
              </button>

              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="text-sm text-gray-500 mb-3">
                  以下类型需在表单查看器中通过功能按钮创建
                </div>
              </div>

              <button
                onClick={() => handleSubTypeSelect('子表')}
                className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
              >
                <div className="font-medium text-gray-900">子表</div>
                <div className="text-sm text-gray-500 mt-1">
                  截取原表的一部分数据（横向/纵向/混合截取）
                </div>
              </button>
              
              <button
                onClick={() => handleSubTypeSelect('再造表')}
                className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all"
              >
                <div className="font-medium text-gray-900">再造表</div>
                <div className="text-sm text-gray-500 mt-1">
                  按字段分组后聚合运算，生成新表
                </div>
              </button>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowSubTypeModal(false);
                  setShowTypeModal(true);
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                返回
              </button>
              <button
                onClick={() => setShowSubTypeModal(false)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 第三步：表单构建器（根据选择的类型显示不同组件） */}
      {showFormBuilder && (
        <div>
          {selectedType === '属性表' && (
            <AttributeFormBuilder
              projectId={projectId}
              onClose={closeFormBuilder}
              onSuccess={loadFormsAndFields}
            />
          )}

          {selectedType === '对象表' && selectedSubType === '基础表' && !showBaseFormModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">选择基础表类型</h3>
                </div>
                
                <div className="px-6 py-6 space-y-3">
                  <button
                    onClick={() => setShowBaseFormModal('independent')}
                    className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all"
                  >
                    <div className="font-medium text-gray-900">独立基础表</div>
                    <div className="text-sm text-gray-500 mt-1">
                      全部字段来自外部输入，不包含关联字段（外键）
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setShowBaseFormModal('related')}
                    className="w-full px-6 py-4 text-left border-2 border-gray-200 rounded-lg hover:border-yellow-500 hover:bg-yellow-50 transition-all"
                  >
                    <div className="font-medium text-gray-900">关联基础表</div>
                    <div className="text-sm text-gray-500 mt-1">
                      包含关联字段（外键），来自其他独立基础表的主键
                    </div>
                  </button>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
                  <button
                    onClick={() => {
                      setShowFormBuilder(false);
                      setShowSubTypeModal(true);
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    返回
                  </button>
                  <button
                    onClick={closeFormBuilder}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 独立基础表构建器 */}
          {showBaseFormModal === 'independent' && (
            <IndependentBaseForm
              projectId={projectId}
              onClose={() => {
                setShowBaseFormModal(false);
                closeFormBuilder();
              }}
              onSuccess={loadFormsAndFields}
              onLoadingChange={(loading, text) => {
                setGlobalLoading(loading);
                setGlobalLoadingText(text || '正在创建表单...');
              }}
            />
          )}

          {/* 关联基础表构建器 */}
          {showBaseFormModal === 'related' && (
            <RelatedBaseForm
              projectId={projectId}
              onClose={() => {
                setShowBaseFormModal(false);
                closeFormBuilder();
              }}
              onSuccess={loadFormsAndFields}
              onLoadingChange={(loading, text) => {
                setGlobalLoading(loading);
                setGlobalLoadingText(text || '正在创建表单...');
              }}
            />
          )}

          {selectedType === '对象表' && selectedSubType === '衍生表' && (
            <DerivedFormBuilder
              projectId={projectId}
              onClose={closeFormBuilder}
              onSuccess={loadFormsAndFields}
            />
          )}

          {selectedType === '对象表' && selectedSubType === '合表' && (
            <MergedFormBuilder
              projectId={projectId}
              onClose={closeFormBuilder}
              onSuccess={loadFormsAndFields}
            />
          )}
        </div>
      )}

      {/* 数据录入模态框 - 根据表单类型显示不同组件 */}
      {showDataEntryModal && dataEntryForm && (
        isAttributeForm(dataEntryForm) ? (
          <AttributeFormDataEntry
            projectId={projectId}
            form={dataEntryForm}
            fields={fields}
            onClose={closeDataEntryModal}
            onSuccess={loadFormsAndFields}
          />
        ) : (
          <BaseFormDataEntry
            projectId={projectId}
            form={dataEntryForm}
            fields={fields}
            forms={forms}
            onClose={closeDataEntryModal}
            onSuccess={loadFormsAndFields}
          />
        )
      )}

      {/* 查看表单模态框 */}
      {showViewerModal && viewerForm && (
        <FormViewer
          projectId={projectId}
          form={viewerForm}
          fields={fields}
          forms={forms}
          onClose={closeViewerModal}
        />
      )}

      {/* 子表管理器（入口1：从定义表单进入） */}
      {showSubTableManager && (
        <SubTableManager
          projectId={projectId}
          form={null} // 入口1不需要指定表单
          fields={fields}
          forms={forms}
          onClose={() => setShowSubTableManager(false)}
          onSuccess={loadFormsAndFields}
        />
      )}

      {/* 再造表管理器（入口1：从定义表单进入） */}
      {showRebuildTableManager && (
        <RebuildTableManager
          projectId={projectId}
          form={null} // 入口1不需要指定表单
          fields={fields}
          forms={forms}
          onClose={() => setShowRebuildTableManager(false)}
          onSuccess={loadFormsAndFields}
        />
      )}

      {/* 全局加载遮罩 */}
      {globalLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
            <div className="text-gray-700 font-medium text-lg">{globalLoadingText}</div>
            <div className="text-gray-500 text-sm mt-2">请稍候，这可能需要几秒钟</div>
          </div>
        </div>
      )}
    </div>
  );
}

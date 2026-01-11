// 合表构建组件
function MergedFormBuilder({ projectId, onClose, onSuccess }) {
  const [step, setStep] = React.useState(1); // 1: 输入名称, 2: 选择表单
  const [formName, setFormName] = React.useState('');
  const [baseForms, setBaseForms] = React.useState([]); // 所有基础表
  const [selectedForms, setSelectedForms] = React.useState([]); // 已选择的表单
  const [fields, setFields] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  // 加载基础表列表
  React.useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const formList = await window.dndDB.getFormsByProjectId(projectId);
      // 筛选基础表（独立基础表和关联基础表）
      const baseFormList = formList.filter(f => 
        f.type === '对象表单' && (f.subType === '独立基础表' || f.subType === '关联基础表')
      );
      setBaseForms(baseFormList);

      const fieldList = await window.dndDB.getFieldsByProjectId(projectId);
      setFields(fieldList);
    } catch (error) {
      alert('加载数据失败：' + error);
    }
  };

  // 获取字段名称
  const getFieldName = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  // 获取表单的主键字段ID
  const getFormPrimaryKey = (form) => {
    return form.structure?.primaryKey;
  };

  // 获取已选择表单的公共主键
  const getCommonPrimaryKey = () => {
    if (selectedForms.length === 0) return null;
    return getFormPrimaryKey(selectedForms[0]);
  };

  // 获取可选的表单（主键必须与已选表单相同）
  const getAvailableForms = () => {
    const commonPK = getCommonPrimaryKey();
    
    return baseForms.filter(form => {
      // 排除已选择的
      if (selectedForms.some(sf => sf.id === form.id)) return false;
      
      // 如果还没选择任何表单，所有基础表都可选
      if (!commonPK) return true;
      
      // 主键必须相同
      return getFormPrimaryKey(form) === commonPK;
    });
  };

  // 添加表单
  const handleAddForm = (form) => {
    setSelectedForms([...selectedForms, form]);
  };

  // 移除表单
  const handleRemoveForm = (formId) => {
    setSelectedForms(selectedForms.filter(f => f.id !== formId));
  };

  // 获取合并后的所有字段（去重）
  const getMergedFields = () => {
    const fieldMap = new Map();
    
    selectedForms.forEach(form => {
      if (form.structure && form.structure.fields) {
        form.structure.fields.forEach(fieldConfig => {
          if (!fieldMap.has(fieldConfig.fieldId)) {
            fieldMap.set(fieldConfig.fieldId, {
              ...fieldConfig,
              sourceFormId: form.id,
              sourceFormName: form.name
            });
          }
        });
      }
    });

    return Array.from(fieldMap.values());
  };

  // 进入第二步
  const goToStep2 = () => {
    if (!formName.trim()) {
      alert('请输入合表名称');
      return;
    }
    setStep(2);
  };

  // 提交保存
  const handleSubmit = async () => {
    if (selectedForms.length < 2) {
      alert('请至少选择两个基础表进行合并');
      return;
    }

    setLoading(true);

    try {
      const commonPK = getCommonPrimaryKey();
      const mergedFields = getMergedFields();

      const formData = {
        name: formName.trim(),
        type: '对象表单',
        formNature: '合表',
        subType: '合表',
        structure: {
          primaryKey: commonPK,
          sourceForms: selectedForms.map(f => ({
            formId: f.id,
            formName: f.name
          })),
          fields: mergedFields
        },
        // 合表不存储数据，数据来自源表单
        data: null
      };

      await window.dndDB.addForm(projectId, formData);
      alert('合表创建成功！');
      onSuccess();
      onClose();
    } catch (error) {
      alert('创建合表失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            创建合表 - 步骤 {step}/2
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 ? '设置合表名称' : '选择要合并的基础表（主键必须相同）'}
          </p>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* 合表名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  合表名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：学生完整信息表"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              {/* 说明 */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-orange-700">
                      <strong>合表说明：</strong>
                    </p>
                    <ul className="text-sm text-orange-600 mt-1 list-disc list-inside">
                      <li>合表将多个<strong>主键相同</strong>的基础表合并为一个虚拟表</li>
                      <li>合表不存储数据，查询时从各个源表动态获取</li>
                      <li>适用于将分散的信息整合显示</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 可用基础表数量 */}
              <div className="text-sm text-gray-600">
                当前可用的基础表：<strong>{baseForms.length}</strong> 个
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* 已选择的表单 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  已选择的基础表 ({selectedForms.length} 个)
                </label>
                <div className="border border-gray-300 rounded-lg divide-y divide-gray-200">
                  {selectedForms.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      请从下方选择要合并的基础表
                    </div>
                  ) : (
                    selectedForms.map((form, index) => (
                      <div key={form.id} className="px-4 py-3 bg-orange-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="px-2 py-1 text-xs font-semibold bg-orange-600 text-white rounded-full">
                              {index + 1}
                            </span>
                            <span className="font-medium text-gray-900">{form.name}</span>
                            <span className="text-xs text-gray-500">
                              主键: {getFieldName(getFormPrimaryKey(form))}
                            </span>
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              form.subType === '独立基础表' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {form.subType}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveForm(form.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 公共主键信息 */}
              {selectedForms.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <strong>公共主键：</strong>{getFieldName(getCommonPrimaryKey())}
                    <span className="text-blue-500 ml-2">
                      （只有主键相同的表单才能继续添加）
                    </span>
                  </p>
                </div>
              )}

              {/* 可选择的表单 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  可添加的基础表
                  {selectedForms.length > 0 && (
                    <span className="text-xs text-gray-500 ml-2">
                      （主键必须为：{getFieldName(getCommonPrimaryKey())}）
                    </span>
                  )}
                </label>
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {getAvailableForms().length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      {baseForms.length === 0 
                        ? '没有可用的基础表，请先创建基础表' 
                        : selectedForms.length === 0
                        ? '没有可用的基础表'
                        : '没有其他主键相同的基础表可添加'}
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {getAvailableForms().map(form => (
                        <div key={form.id} className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{form.name}</div>
                              <div className="text-xs text-gray-500">
                                主键: {getFieldName(getFormPrimaryKey(form))} | {form.subType}
                              </div>
                            </div>
                            <button
                              onClick={() => handleAddForm(form)}
                              className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                            >
                              添加
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 合并后的字段预览 */}
              {selectedForms.length >= 2 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    合并后的字段预览 ({getMergedFields().length} 个字段)
                  </label>
                  <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">字段名称</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">来源表单</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">角色</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {getMergedFields().map(fieldConfig => (
                          <tr key={fieldConfig.fieldId} className={fieldConfig.isPrimaryKey ? 'bg-blue-50' : ''}>
                            <td className="px-4 py-2 text-sm text-gray-900">
                              {getFieldName(fieldConfig.fieldId)}
                              {fieldConfig.isPrimaryKey && (
                                <span className="ml-2 px-1 py-0.5 text-xs bg-blue-600 text-white rounded">主键</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">{fieldConfig.sourceFormName}</td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {fieldConfig.isRelatedField ? '关联字段' : 
                               fieldConfig.isAttributeField ? '属性字段' : '普通字段'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div>
            {step === 2 && (
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                ← 返回上一步
              </button>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              取消
            </button>

            {step === 1 && (
              <button
                onClick={goToStep2}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                下一步 →
              </button>
            )}

            {step === 2 && (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={selectedForms.length < 2 || loading}
              >
                {loading ? '保存中...' : '确定创建'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.DNDComponents.MergedFormBuilder = MergedFormBuilder;

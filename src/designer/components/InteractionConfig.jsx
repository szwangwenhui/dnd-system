// 交互区块配置弹窗组件
function InteractionConfig({ isOpen, onClose, block, onSave, projectId }) {
  // 配置状态
  const [config, setConfig] = React.useState({
    targetFormId: block?.targetFormId || '',
    buttonText: block?.buttonText || '添加数据',
    writeOnSubmit: block?.writeOnSubmit !== false, // 默认为true，提交时写入数据
  });

  // 表单列表
  const [forms, setForms] = React.useState([]);
  const [selectedForm, setSelectedForm] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [fields, setFields] = React.useState([]); // 字段列表，用于显示字段名称

  // 加载表单列表（基础表单 + 属性表）
  React.useEffect(() => {
    if (!isOpen) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        const formList = await window.dndDB.getFormsByProjectId(projectId);
        const fieldList = await window.dndDB.getFieldsByProjectId(projectId);
        setFields(fieldList);
        
        // 显示基础表单和属性表
        const availableForms = formList.filter(f => 
          f.formNature === '基础表单' || 
          f.subType === '独立基础表' || 
          f.subType === '关联基础表' ||
          f.type === '属性表单'  // 新增：支持属性表
        );
        setForms(availableForms);
        
        // 如果已有选中的表单，加载其信息
        if (config.targetFormId) {
          const form = availableForms.find(f => f.id === config.targetFormId);
          setSelectedForm(form);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [isOpen, projectId]);

  // 获取字段名称
  const getFieldName = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field?.name || fieldId;
  };

  // 判断是否为属性表
  const isAttributeForm = (form) => {
    return form?.type === '属性表单';
  };

  // 当选择表单时更新
  const handleFormChange = (formId) => {
    setConfig(prev => ({ ...prev, targetFormId: formId }));
    const form = forms.find(f => f.id === formId);
    setSelectedForm(form);
  };

  // 保存配置
  const handleSave = () => {
    if (!config.targetFormId) {
      alert('请选择目标表单');
      return;
    }
    
    onSave({
      targetFormId: config.targetFormId,
      targetFormName: selectedForm?.name || '',
      targetFormType: isAttributeForm(selectedForm) ? 'attribute' : 'base',  // 新增：标记表单类型
      buttonText: config.buttonText || '添加数据',
      writeOnSubmit: config.writeOnSubmit, // 新增：是否提交时写入数据
    });
    onClose();
  };

  // 获取表单的字段列表（兼容基础表和属性表）
  const getFormFields = (form) => {
    if (!form || !form.structure) return [];
    
    if (isAttributeForm(form)) {
      // 属性表使用 levelFields
      return form.structure.levelFields || [];
    } else {
      // 基础表使用 fields
      return form.structure.fields || [];
    }
  };

  if (!isOpen) return null;

  // 分组表单：基础表和属性表
  const baseForms = forms.filter(f => !isAttributeForm(f));
  const attributeForms = forms.filter(f => isAttributeForm(f));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-xl">⚡</span>
            <h2 className="text-lg font-semibold text-gray-800">配置交互区块</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 配置内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">加载中...</div>
          ) : (
            <div className="space-y-6">
              {/* 目标表单选择 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">📋 目标表单</h3>
                <p className="text-xs text-gray-500 mb-2">
                  选择用户提交数据要存入的表单（支持基础表单和属性表）
                </p>
                <select
                  value={config.targetFormId}
                  onChange={(e) => handleFormChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="">-- 请选择表单 --</option>
                  
                  {/* 基础表单组 */}
                  {baseForms.length > 0 && (
                    <optgroup label="📦 基础表单">
                      {baseForms.map(form => (
                        <option key={form.id} value={form.id}>
                          {form.name} - {form.subType || form.formNature}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  
                  {/* 属性表组 */}
                  {attributeForms.length > 0 && (
                    <optgroup label="🏷️ 属性表">
                      {attributeForms.map(form => (
                        <option key={form.id} value={form.id}>
                          {form.name} - {form.structure?.levels || '?'}级属性
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                
                {/* 显示选中表单的字段信息 */}
                {selectedForm && selectedForm.structure && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <div className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      {isAttributeForm(selectedForm) ? (
                        <>
                          <span className="text-purple-600 mr-2">🏷️</span>
                          属性表字段（{selectedForm.structure.levels}级）
                        </>
                      ) : (
                        <>
                          <span className="text-blue-600 mr-2">📦</span>
                          表单字段（{getFormFields(selectedForm).length}个）
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {isAttributeForm(selectedForm) ? (
                        // 属性表显示级别字段
                        selectedForm.structure.levelFields?.map((lf, index) => (
                          <span 
                            key={index}
                            className="px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-800"
                          >
                            L{lf.level}: {getFieldName(lf.fieldId)}
                          </span>
                        ))
                      ) : (
                        // 基础表显示字段
                        getFormFields(selectedForm).map((field, index) => (
                          <span 
                            key={index}
                            className={`px-2 py-0.5 rounded text-xs ${
                              field.isPrimaryKey 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {field.isPrimaryKey && '🔑 '}
                            {getFieldName(field.fieldId)}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 按钮设置 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">🔘 按钮设置</h3>
                
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">按钮文字</label>
                  <input
                    type="text"
                    value={config.buttonText}
                    onChange={(e) => setConfig(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="添加数据"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
                
                {/* 按钮预览 */}
                <div className="mt-3">
                  <label className="block text-sm text-gray-600 mb-2">预览效果</label>
                  <div className="flex justify-center p-4 bg-gray-100 rounded">
                    <button className={`px-6 py-2 text-white rounded hover:opacity-90 ${
                      isAttributeForm(selectedForm) ? 'bg-purple-600' : 'bg-blue-600'
                    }`}>
                      {config.buttonText || '添加数据'}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    {isAttributeForm(selectedForm) 
                      ? '属性表数据录入（紫色主题）' 
                      : '按钮样式可在右侧样式面板中调整'}
                  </p>
                </div>
              </div>

              {/* 提交行为设置 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">⚙️ 提交行为</h3>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.writeOnSubmit}
                    onChange={(e) => setConfig(prev => ({ ...prev, writeOnSubmit: e.target.checked }))}
                    className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm text-gray-700 font-medium">提交时写入数据</span>
                    <p className="text-xs text-gray-500 mt-1">
                      {config.writeOnSubmit 
                        ? '✅ 用户提交后，数据将自动写入目标表单，然后触发关联的数据流程'
                        : '⚠️ 用户提交后，数据不会写入表单，仅触发关联的数据流程（适用于校验场景）'}
                    </p>
                  </div>
                </label>
                
                {!config.writeOnSubmit && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <strong>💡 提示：</strong>此模式适用于需要先进行存在性校验的场景。
                    数据流程可以根据校验结果决定是否写入数据。
                  </div>
                )}
              </div>

              {forms.length === 0 && (
                <div className="text-center text-gray-500 py-4 bg-yellow-50 rounded">
                  <p>暂无可用的表单</p>
                  <p className="text-xs mt-1">请先在"定义表单"中创建基础表单或属性表</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!config.targetFormId}
            className={`px-6 py-2 rounded ${
              config.targetFormId
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
}

window.InteractionConfig = InteractionConfig;

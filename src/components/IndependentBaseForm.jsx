// 独立基础表构建组件
function IndependentBaseForm({ projectId, onClose, onSuccess }) {
  const [fields, setFields] = React.useState([]);
  const [forms, setForms] = React.useState([]); // 所有表单（用于查找属性表）
  const [formName, setFormName] = React.useState('');
  const [selectedPrimaryKey, setSelectedPrimaryKey] = React.useState('');
  const [selectedFields, setSelectedFields] = React.useState([]);
  const [selectedAttributeFields, setSelectedAttributeFields] = React.useState([]); // 已选的属性字段
  const [step, setStep] = React.useState(1); // 1: 输入表单名称, 2: 选择主键, 3: 添加字段
  
  // 主键自增配置
  const [primaryKeyConfig, setPrimaryKeyConfig] = React.useState({
    mode: 'manual',       // 'manual' 手动填写, 'auto' 系统自增
    startValue: 1,        // 开始值
    incrementType: 'natural',  // 'natural' 自然增加, 'jump' 跳跃增加
    jumpStep: 1           // 跳跃数
  });

  // 加载字段列表和表单列表
  React.useEffect(() => {
    loadFields();
    loadForms();
  }, [projectId]);

  const loadFields = async () => {
    try {
      const fieldList = await window.dndDB.getFieldsByProjectId(projectId);
      setFields(fieldList);
    } catch (error) {
      alert('加载字段失败：' + error);
    }
  };

  const loadForms = async () => {
    try {
      const formList = await window.dndDB.getFormsByProjectId(projectId);
      setForms(formList);
    } catch (error) {
      console.error('加载表单失败：', error);
    }
  };

  // 获取主键字段列表（字段角色=主键）
  const getPrimaryKeyFields = () => {
    return fields.filter(f => f.role === '主键');
  };

  // 获取基础字段列表（字段性质=基础字段）
  const getBaseFields = () => {
    return fields.filter(f => f.nature === '基础字段');
  };

  // 获取属性字段列表（字段性质=属性字段）
  const getAttributeFields = () => {
    return fields.filter(f => f.nature === '属性字段');
  };

  // 获取所有属性表
  const getAttributeForms = () => {
    return forms.filter(f => f.type === '属性表单');
  };

  // 查找属性字段所属的属性表
  const findAttributeFormByFieldId = (fieldId) => {
    const attributeForms = getAttributeForms();
    for (const form of attributeForms) {
      const levelFields = form.structure?.levelFields || [];
      if (levelFields.some(lf => lf.fieldId === fieldId)) {
        return form;
      }
    }
    return null;
  };

  // 获取属性字段在属性表中的级别
  const getFieldLevelInAttributeForm = (fieldId, attributeForm) => {
    const levelFields = attributeForm.structure?.levelFields || [];
    const levelField = levelFields.find(lf => lf.fieldId === fieldId);
    return levelField?.level || 0;
  };

  // 检查是否可以添加该属性字段（必须按从高到低的顺序）
  const canAddAttributeField = (fieldId) => {
    const attributeForm = findAttributeFormByFieldId(fieldId);
    if (!attributeForm) {
      return { canAdd: false, reason: '该属性字段尚未关联任何属性表，请先创建属性表' };
    }

    const fieldLevel = getFieldLevelInAttributeForm(fieldId, attributeForm);
    
    // 检查同一属性表中已选择的字段
    const sameFormSelectedFields = selectedAttributeFields.filter(sf => {
      const sfForm = findAttributeFormByFieldId(sf.fieldId);
      return sfForm && sfForm.id === attributeForm.id;
    });

    if (sameFormSelectedFields.length === 0) {
      // 第一个选择的字段必须是第1级
      if (fieldLevel !== 1) {
        return { canAdd: false, reason: `必须先选择该属性表的第1级字段` };
      }
      return { canAdd: true };
    }

    // 找出已选择的最低级别
    const maxSelectedLevel = Math.max(...sameFormSelectedFields.map(sf => 
      getFieldLevelInAttributeForm(sf.fieldId, attributeForm)
    ));

    // 新字段必须是下一级
    if (fieldLevel !== maxSelectedLevel + 1) {
      return { canAdd: false, reason: `必须按顺序选择，下一个应该是第${maxSelectedLevel + 1}级` };
    }

    return { canAdd: true };
  };

  // 添加属性字段
  const handleAddAttributeField = (fieldId) => {
    const checkResult = canAddAttributeField(fieldId);
    if (!checkResult.canAdd) {
      alert(checkResult.reason);
      return;
    }

    const attributeForm = findAttributeFormByFieldId(fieldId);
    const fieldLevel = getFieldLevelInAttributeForm(fieldId, attributeForm);

    setSelectedAttributeFields([
      ...selectedAttributeFields,
      {
        fieldId: fieldId,
        required: true,
        attributeFormId: attributeForm.id,
        attributeFormName: attributeForm.name,
        level: fieldLevel
      }
    ]);
  };

  // 移除属性字段（需要同时移除更低级别的字段）
  const handleRemoveAttributeField = (fieldId) => {
    const attributeForm = findAttributeFormByFieldId(fieldId);
    const fieldLevel = getFieldLevelInAttributeForm(fieldId, attributeForm);

    // 移除该字段及同一属性表中更低级别的字段
    setSelectedAttributeFields(selectedAttributeFields.filter(sf => {
      const sfForm = findAttributeFormByFieldId(sf.fieldId);
      if (!sfForm || sfForm.id !== attributeForm.id) {
        return true; // 保留其他属性表的字段
      }
      const sfLevel = getFieldLevelInAttributeForm(sf.fieldId, attributeForm);
      return sfLevel < fieldLevel; // 只保留更高级别的字段
    }));
  };

  // 添加字段到选择列表
  const handleAddField = (fieldId, required = true) => {
    if (selectedFields.some(f => f.fieldId === fieldId)) {
      alert('该字段已添加');
      return;
    }

    setSelectedFields([
      ...selectedFields,
      {
        fieldId: fieldId,
        required: required,
        isPrimaryKey: false,
        hasDefault: false,
        defaultValue: ''
      }
    ]);
  };

  // 移除字段
  const handleRemoveField = (fieldId) => {
    setSelectedFields(selectedFields.filter(f => f.fieldId !== fieldId));
  };

  // 切换必填状态
  const toggleRequired = (fieldId) => {
    setSelectedFields(selectedFields.map(f => 
      f.fieldId === fieldId ? { ...f, required: !f.required } : f
    ));
  };

  // 切换是否有默认值
  const toggleHasDefault = (fieldId) => {
    setSelectedFields(selectedFields.map(f => 
      f.fieldId === fieldId ? { ...f, hasDefault: !f.hasDefault, defaultValue: '' } : f
    ));
  };

  // 更新默认值
  const updateDefaultValue = (fieldId, value) => {
    setSelectedFields(selectedFields.map(f => 
      f.fieldId === fieldId ? { ...f, defaultValue: value } : f
    ));
  };

  // 提交表单
  const handleSubmit = async () => {
    // 验证
    if (!formName.trim()) {
      alert('请输入表单名称');
      return;
    }

    if (!selectedPrimaryKey) {
      alert('请选择主键字段');
      return;
    }

    if (selectedFields.length === 0) {
      alert('请至少添加一个字段');
      return;
    }

    try {
      // 构建表单结构
      const formStructure = {
        primaryKey: selectedPrimaryKey,
        primaryKeyConfig: primaryKeyConfig, // 主键自增配置
        fields: [
          // 主键字段
          {
            fieldId: selectedPrimaryKey,
            required: true,
            isPrimaryKey: true
          },
          // 其他基础字段
          ...selectedFields,
          // 属性字段
          ...selectedAttributeFields.map(af => ({
            fieldId: af.fieldId,
            required: af.required,
            isPrimaryKey: false,
            isAttributeField: true,
            attributeFormId: af.attributeFormId,
            level: af.level
          }))
        ]
      };

      // 创建表单
      const newForm = await window.dndDB.addForm(projectId, {
        name: formName,
        type: '对象表单',
        formNature: '基础表单',
        subType: '独立基础表',
        structure: formStructure
      });

      // 更新所有使用的字段的 relatedForms
      const allFieldIds = [
        selectedPrimaryKey, 
        ...selectedFields.map(f => f.fieldId),
        ...selectedAttributeFields.map(af => af.fieldId)
      ];
      for (const fieldId of allFieldIds) {
        await window.dndDB.updateFieldRelatedForms(projectId, fieldId, newForm.id, 'add');
      }

      alert('独立基础表创建成功！');
      onSuccess();
      onClose();
    } catch (error) {
      alert('创建失败：' + error.message);
    }
  };

  // 获取字段名称
  const getFieldName = (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            创建独立基础表
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            全部字段来自外部输入，数据物理存储
          </p>
        </div>

        {/* 步骤指示器 */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <span className="ml-2 text-sm font-medium">表单名称</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
              <span className="ml-2 text-sm font-medium">选择主键</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">添加字段</span>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* 步骤1: 输入表单名称 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表单名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：学生信息表"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>提示：</strong>独立基础表的全部字段都来自外部输入，不包含任何关联字段（外键）。
                </p>
              </div>
            </div>
          )}

          {/* 步骤2: 选择主键字段 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  主键字段 <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedPrimaryKey}
                  onChange={(e) => setSelectedPrimaryKey(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择主键字段</option>
                  {getPrimaryKeyFields().map(field => (
                    <option key={field.id} value={field.id}>
                      {field.name} ({field.type})
                    </option>
                  ))}
                </select>
              </div>

              {getPrimaryKeyFields().length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-700">
                    <strong>注意：</strong>当前没有可用的主键字段，请先在"定义字段"中创建字段角色为"主键"的字段。
                  </p>
                </div>
              )}

              {/* 主键数据添加方式 */}
              {selectedPrimaryKey && (
                <div className="border border-gray-200 rounded-lg p-4 mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    主键数据添加方式
                  </label>
                  <div className="flex space-x-6 mb-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="pkMode"
                        checked={primaryKeyConfig.mode === 'manual'}
                        onChange={() => setPrimaryKeyConfig({ ...primaryKeyConfig, mode: 'manual' })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">手动填写</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="pkMode"
                        checked={primaryKeyConfig.mode === 'auto'}
                        onChange={() => setPrimaryKeyConfig({ ...primaryKeyConfig, mode: 'auto' })}
                        className="form-radio h-4 w-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-gray-700">系统自增</span>
                    </label>
                  </div>

                  {/* 系统自增配置 */}
                  {primaryKeyConfig.mode === 'auto' && (
                    <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="text-sm text-gray-700 w-20">开始值：</label>
                        <input
                          type="number"
                          value={primaryKeyConfig.startValue}
                          onChange={(e) => setPrimaryKeyConfig({ 
                            ...primaryKeyConfig, 
                            startValue: parseInt(e.target.value) || 1 
                          })}
                          min="0"
                          className="w-32 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <label className="text-sm text-gray-700 w-20">增加方式：</label>
                        <div className="flex space-x-4">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="incrementType"
                              checked={primaryKeyConfig.incrementType === 'natural'}
                              onChange={() => setPrimaryKeyConfig({ ...primaryKeyConfig, incrementType: 'natural' })}
                              className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">自然增加</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              name="incrementType"
                              checked={primaryKeyConfig.incrementType === 'jump'}
                              onChange={() => setPrimaryKeyConfig({ ...primaryKeyConfig, incrementType: 'jump' })}
                              className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-sm text-gray-700">跳跃增加</span>
                          </label>
                        </div>
                      </div>

                      {primaryKeyConfig.incrementType === 'jump' && (
                        <div className="flex items-center space-x-4">
                          <label className="text-sm text-gray-700 w-20">跳跃数：</label>
                          <input
                            type="number"
                            value={primaryKeyConfig.jumpStep}
                            onChange={(e) => setPrimaryKeyConfig({ 
                              ...primaryKeyConfig, 
                              jumpStep: parseInt(e.target.value) || 1 
                            })}
                            min="1"
                            className="w-32 px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      )}

                      <div className="text-xs text-blue-600 mt-2">
                        预览：{primaryKeyConfig.startValue}, {primaryKeyConfig.startValue + (primaryKeyConfig.incrementType === 'jump' ? primaryKeyConfig.jumpStep : 1)}, {primaryKeyConfig.startValue + (primaryKeyConfig.incrementType === 'jump' ? primaryKeyConfig.jumpStep * 2 : 2)}, ...
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>提示：</strong>主键字段必须具有唯一性，用于标识每条记录。
                  {primaryKeyConfig.mode === 'auto' && ' 系统自增模式下，主键值将自动生成，无需手动填写。'}
                </p>
              </div>
            </div>
          )}

          {/* 步骤3: 添加字段 */}
          {step === 3 && (
            <div className="space-y-4">
              {/* 已选择的字段列表 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  已添加的字段
                </label>
                <div className="border border-gray-300 rounded-lg divide-y divide-gray-200">
                  {/* 主键字段（固定显示） */}
                  <div className="px-4 py-3 bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">
                          主键
                        </span>
                        <span className="font-medium text-gray-900">
                          {getFieldName(selectedPrimaryKey)}
                        </span>
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                          必填
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 其他字段 */}
                  {selectedFields.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      尚未添加其他字段，请从下方选择
                    </div>
                  ) : (
                    selectedFields.map(field => {
                      const fieldInfo = fields.find(f => f.id === field.fieldId);
                      return (
                        <div key={field.fieldId} className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="font-medium text-gray-900">
                                {fieldInfo?.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {fieldInfo?.type}
                              </span>
                              <button
                                onClick={() => toggleRequired(field.fieldId)}
                                className={`px-2 py-1 text-xs rounded-full ${
                                  field.required 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {field.required ? '必填' : '非必填'}
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveField(field.fieldId)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              移除
                            </button>
                          </div>
                          
                          {/* 默认值设置 */}
                          <div className="mt-2 flex items-center space-x-3">
                            <label className="flex items-center space-x-1 text-sm text-gray-600">
                              <input
                                type="checkbox"
                                checked={field.hasDefault || false}
                                onChange={() => toggleHasDefault(field.fieldId)}
                                className="w-4 h-4 text-blue-600"
                              />
                              <span>设置默认值</span>
                            </label>
                            {field.hasDefault && (
                              <>
                                {fieldInfo?.type === '逻辑' ? (
                                  <select
                                    value={field.defaultValue || ''}
                                    onChange={(e) => updateDefaultValue(field.fieldId, e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                  >
                                    <option value="">请选择</option>
                                    <option value="true">是</option>
                                    <option value="false">否</option>
                                  </select>
                                ) : fieldInfo?.type === '日期/时间' ? (
                                  <input
                                    type="datetime-local"
                                    value={field.defaultValue || ''}
                                    onChange={(e) => updateDefaultValue(field.fieldId, e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : fieldInfo?.type === '整数' || fieldInfo?.type === '浮点数' ? (
                                  <input
                                    type="number"
                                    step={fieldInfo?.type === '浮点数' ? '0.01' : '1'}
                                    value={field.defaultValue || ''}
                                    onChange={(e) => updateDefaultValue(field.fieldId, e.target.value)}
                                    placeholder="输入默认值"
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    value={field.defaultValue || ''}
                                    onChange={(e) => updateDefaultValue(field.fieldId, e.target.value)}
                                    placeholder="输入默认值"
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* 已选择的属性字段 */}
                  {selectedAttributeFields.length > 0 && (
                    <>
                      <div className="px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium">
                        属性字段
                      </div>
                      {selectedAttributeFields.map(af => {
                        const fieldInfo = fields.find(f => f.id === af.fieldId);
                        return (
                          <div key={af.fieldId} className="px-4 py-3 bg-purple-50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="px-2 py-1 text-xs font-semibold bg-purple-600 text-white rounded-full">
                                  第{af.level}级
                                </span>
                                <span className="font-medium text-gray-900">
                                  {fieldInfo?.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {af.attributeFormName}
                                </span>
                              </div>
                              <button
                                onClick={() => handleRemoveAttributeField(af.fieldId)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                移除
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>

              {/* 可选择的字段列表 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  添加基础字段
                </label>
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {getBaseFields().length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      没有可用的基础字段，请先在"定义字段"中创建
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {getBaseFields()
                        .filter(f => f.id !== selectedPrimaryKey) // 排除已选为主键的字段
                        .filter(f => !selectedFields.some(sf => sf.fieldId === f.id)) // 排除已添加的字段
                        .map(field => (
                          <div key={field.id} className="px-4 py-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">{field.name}</div>
                                <div className="text-xs text-gray-500">{field.type}</div>
                              </div>
                              <button
                                onClick={() => handleAddField(field.id, true)}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                              >
                                添加
                              </button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </div>
              </div>

              {/* 可选择的属性字段列表 */}
              {getAttributeFields().length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    添加属性字段 <span className="text-xs text-gray-500">（可选，需按级别顺序添加）</span>
                  </label>
                  <div className="border border-purple-300 rounded-lg max-h-64 overflow-y-auto">
                    <div className="divide-y divide-gray-200">
                      {getAttributeFields()
                        .filter(f => !selectedAttributeFields.some(sf => sf.fieldId === f.id)) // 排除已添加的
                        .map(field => {
                          const attributeForm = findAttributeFormByFieldId(field.id);
                          const checkResult = canAddAttributeField(field.id);
                          const fieldLevel = attributeForm ? getFieldLevelInAttributeForm(field.id, attributeForm) : 0;
                          
                          return (
                            <div key={field.id} className={`px-4 py-3 ${checkResult.canAdd ? 'hover:bg-purple-50' : 'bg-gray-100'}`}>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium text-gray-900">{field.name}</span>
                                    {attributeForm && (
                                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                                        {attributeForm.name} - 第{fieldLevel}级
                                      </span>
                                    )}
                                  </div>
                                  {!attributeForm && (
                                    <div className="text-xs text-yellow-600">未关联属性表</div>
                                  )}
                                  {attributeForm && !checkResult.canAdd && (
                                    <div className="text-xs text-red-500">{checkResult.reason}</div>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleAddAttributeField(field.id)}
                                  disabled={!checkResult.canAdd}
                                  className={`px-3 py-1 text-sm rounded ${
                                    checkResult.canAdd 
                                      ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  添加
                                </button>
                              </div>
                            </div>
                          );
                        })
                      }
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                ← 上一步
              </button>
            )}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && !formName.trim()) {
                    alert('请输入表单名称');
                    return;
                  }
                  if (step === 2 && !selectedPrimaryKey) {
                    alert('请选择主键字段');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                下一步 →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                创建表单
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.IndependentBaseForm = IndependentBaseForm;
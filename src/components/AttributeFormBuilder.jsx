// 属性表构建组件
function AttributeFormBuilder({ projectId, onClose, onSuccess }) {
  const [step, setStep] = React.useState(1); // 1: 基本信息, 2: 添加级别字段
  const [formName, setFormName] = React.useState('');
  const [levelCount, setLevelCount] = React.useState(2); // 默认2级
  const [levelFields, setLevelFields] = React.useState([]); // 各级别对应的字段
  const [attributeFields, setAttributeFields] = React.useState([]); // 可选的属性字段列表
  const [currentLevel, setCurrentLevel] = React.useState(1); // 当前正在配置的级别
  const [loading, setLoading] = React.useState(false);

  // 加载属性字段列表
  React.useEffect(() => {
    loadAttributeFields();
  }, [projectId]);

  const loadAttributeFields = async () => {
    try {
      const fieldList = await window.dndDB.getFieldsByProjectId(projectId);
      // 只筛选属性字段
      const attrFields = fieldList.filter(f => f.nature === '属性字段');
      setAttributeFields(attrFields);
    } catch (error) {
      alert('加载属性字段失败：' + error);
    }
  };

  // 获取已选择的字段ID列表
  const getSelectedFieldIds = () => {
    return levelFields.map(lf => lf.fieldId);
  };

  // 获取可选的属性字段（排除已选的）
  const getAvailableFields = () => {
    const selectedIds = getSelectedFieldIds();
    return attributeFields.filter(f => !selectedIds.includes(f.id));
  };

  // 处理级数变化
  const handleLevelCountChange = (e) => {
    const count = parseInt(e.target.value);
    if (count >= 1 && count <= 10) {
      setLevelCount(count);
      // 如果减少级数，截断已选的字段
      if (levelFields.length > count) {
        setLevelFields(levelFields.slice(0, count));
      }
    }
  };

  // 进入第二步
  const goToStep2 = () => {
    if (!formName.trim()) {
      alert('请输入属性表名称');
      return;
    }
    if (attributeFields.length < levelCount) {
      alert(`属性字段数量不足！需要至少 ${levelCount} 个属性字段，当前只有 ${attributeFields.length} 个`);
      return;
    }
    setStep(2);
    setCurrentLevel(1);
  };

  // 选择某级别的字段
  const handleSelectField = (fieldId) => {
    const field = attributeFields.find(f => f.id === fieldId);
    if (!field) return;

    const newLevelFields = [...levelFields];
    // 检查是否已有该级别的配置
    const existingIndex = newLevelFields.findIndex(lf => lf.level === currentLevel);
    
    if (existingIndex >= 0) {
      // 更新现有配置
      newLevelFields[existingIndex] = {
        level: currentLevel,
        fieldId: field.id,
        fieldName: field.name
      };
    } else {
      // 添加新配置
      newLevelFields.push({
        level: currentLevel,
        fieldId: field.id,
        fieldName: field.name
      });
    }
    
    // 按级别排序
    newLevelFields.sort((a, b) => a.level - b.level);
    setLevelFields(newLevelFields);
  };

  // 获取当前级别已选择的字段
  const getCurrentLevelField = () => {
    return levelFields.find(lf => lf.level === currentLevel);
  };

  // 继续添加下一级
  const goToNextLevel = () => {
    if (!getCurrentLevelField()) {
      alert(`请选择第 ${currentLevel} 级属性字段`);
      return;
    }
    if (currentLevel < levelCount) {
      setCurrentLevel(currentLevel + 1);
    }
  };

  // 返回上一级
  const goToPrevLevel = () => {
    if (currentLevel > 1) {
      setCurrentLevel(currentLevel - 1);
    }
  };

  // 检查是否所有级别都已配置
  const isAllLevelsConfigured = () => {
    return levelFields.length === levelCount;
  };

  // 提交保存
  const handleSubmit = async () => {
    if (!isAllLevelsConfigured()) {
      alert('请完成所有级别的字段配置');
      return;
    }

    setLoading(true);

    try {
      const formData = {
        name: formName.trim(),
        type: '属性表单',
        formNature: '属性表',
        subType: null,
        structure: {
          levels: levelCount,
          levelFields: levelFields.map(lf => ({
            level: lf.level,
            fieldId: lf.fieldId
          }))
        },
        data: [] // 属性表初始无数据
      };

      await window.dndDB.addForm(projectId, formData);
      alert('属性表创建成功！');
      onSuccess();
      onClose();
    } catch (error) {
      alert('创建属性表失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            创建属性表 - 步骤 {step}/2
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {step === 1 ? '设置属性表名称和级数' : `配置各级别属性字段（当前：第 ${currentLevel} 级）`}
          </p>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              {/* 属性表名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  属性表名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如：行政区划表、性别表"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* 级数设置 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  属性级数 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={levelCount}
                  onChange={handleLevelCountChange}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  设置属性的层级数量（1-10级），例如：省→市→县 为3级
                </p>
              </div>

              {/* 属性字段提示 */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-purple-700">
                      当前可用的属性字段：<strong>{attributeFields.length}</strong> 个
                      {attributeFields.length < levelCount && (
                        <span className="text-red-600 ml-2">
                          （不足，需要至少 {levelCount} 个）
                        </span>
                      )}
                    </p>
                    {attributeFields.length > 0 && (
                      <p className="text-xs text-purple-600 mt-1">
                        {attributeFields.map(f => f.name).join('、')}
                      </p>
                    )}
                    {attributeFields.length === 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        请先在"字段库"中创建属性字段
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* 级别进度指示 */}
              <div className="flex items-center justify-center space-x-2 mb-6">
                {Array.from({ length: levelCount }, (_, i) => i + 1).map(level => (
                  <div key={level} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all ${
                        level === currentLevel
                          ? 'bg-purple-600 text-white'
                          : levelFields.find(lf => lf.level === level)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                      onClick={() => setCurrentLevel(level)}
                    >
                      {level}
                    </div>
                    {level < levelCount && (
                      <div className={`w-8 h-1 ${
                        levelFields.find(lf => lf.level === level) ? 'bg-green-500' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>

              {/* 当前级别配置 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  选择第 {currentLevel} 级属性字段
                </h4>
                
                {/* 已选择的字段 */}
                {getCurrentLevelField() && (
                  <div className="mb-4 p-3 bg-purple-100 rounded-lg">
                    <span className="text-sm text-purple-700">
                      已选择：<strong>{getCurrentLevelField().fieldName}</strong>
                    </span>
                  </div>
                )}

                {/* 可选字段列表 */}
                <div className="space-y-2">
                  {getAvailableFields().length === 0 && !getCurrentLevelField() ? (
                    <p className="text-sm text-gray-500 text-center py-4">
                      没有可用的属性字段
                    </p>
                  ) : (
                    getAvailableFields().map(field => (
                      <button
                        key={field.id}
                        onClick={() => handleSelectField(field.id)}
                        className="w-full px-4 py-3 text-left border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
                      >
                        <div className="font-medium text-gray-900">{field.name}</div>
                        <div className="text-xs text-gray-500">
                          {field.id} | 类型：{field.type}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* 已配置的级别汇总 */}
              {levelFields.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">已配置的级别</h4>
                  <div className="space-y-2">
                    {levelFields.map(lf => (
                      <div 
                        key={lf.level} 
                        className={`flex justify-between items-center p-2 rounded ${
                          lf.level === currentLevel ? 'bg-purple-50' : 'bg-gray-50'
                        }`}
                      >
                        <span className="text-sm">
                          第 {lf.level} 级：<strong>{lf.fieldName}</strong>
                        </span>
                        <button
                          onClick={() => setCurrentLevel(lf.level)}
                          className="text-xs text-purple-600 hover:text-purple-800"
                        >
                          修改
                        </button>
                      </div>
                    ))}
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
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                disabled={attributeFields.length < levelCount}
              >
                下一步 →
              </button>
            )}

            {step === 2 && (
              <>
                {currentLevel < levelCount && (
                  <button
                    onClick={goToNextLevel}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    disabled={!getCurrentLevelField()}
                  >
                    继续添加第 {currentLevel + 1} 级 →
                  </button>
                )}
                {currentLevel === levelCount && (
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    disabled={!isAllLevelsConfigured() || loading}
                  >
                    {loading ? '保存中...' : '确定提交'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.AttributeFormBuilder = AttributeFormBuilder;

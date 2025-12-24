// 按钮配置弹窗组件 - 统一入口
// 根据按钮类型动态加载对应的配置界面

function ButtonConfig({ isOpen, onClose, block, onSave, projectId, roleId, blocks }) {
  // 调试日志
  console.log('=== ButtonConfig 调试 ===');
  console.log('收到的 blocks:', blocks);
  
  // 当前选择的按钮类型
  const [buttonType, setButtonType] = React.useState(block?.buttonType || '');
  // 按钮配置
  const [config, setConfig] = React.useState(block?.buttonConfig || {});
  // 按钮文字
  const [buttonText, setButtonText] = React.useState(block?.buttonText || '按钮');
  // 所有可用的按钮类型
  const [availableTypes, setAvailableTypes] = React.useState([]);

  // 加载可用的按钮类型
  React.useEffect(() => {
    if (isOpen && window.ButtonRegistry) {
      setAvailableTypes(window.ButtonRegistry.getAll());
    }
  }, [isOpen]);

  // 初始化配置
  React.useEffect(() => {
    if (isOpen && block) {
      setButtonType(block.buttonType || '');
      setConfig(block.buttonConfig || {});
      setButtonText(block.buttonText || '按钮');
    }
  }, [isOpen, block]);

  // 切换按钮类型时，加载默认配置
  const handleTypeChange = (newType) => {
    setButtonType(newType);
    if (newType && window.ButtonRegistry) {
      const defaultConfig = window.ButtonRegistry.getDefaultConfig(newType);
      setConfig(defaultConfig);
    } else {
      setConfig({});
    }
  };

  // 更新配置
  const handleConfigChange = (newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  };

  // 保存
  const handleSave = () => {
    if (!buttonType) {
      alert('请选择按钮类型');
      return;
    }

    // 验证配置
    if (window.ButtonRegistry) {
      const validation = window.ButtonRegistry.validate(buttonType, config);
      if (!validation.valid) {
        alert('配置不完整：\n' + validation.errors.join('\n'));
        return;
      }
    }

    onSave({
      buttonType,
      buttonConfig: config,
      buttonText
    });
    onClose();
  };

  // 渲染按钮类型特定的配置界面
  const renderTypeConfig = () => {
    if (!buttonType || !window.ButtonRegistry) {
      return (
        <div className="text-center text-gray-500 py-8">
          请先选择按钮类型
        </div>
      );
    }

    const typeInfo = window.ButtonRegistry.get(buttonType);
    if (!typeInfo || !typeInfo.renderConfig) {
      return (
        <div className="text-center text-gray-500 py-8">
          该按钮类型暂无额外配置
        </div>
      );
    }

    // 调用按钮类型的配置渲染函数（作为React组件）
    const ConfigComponent = typeInfo.renderConfig;
    return (
      <ConfigComponent
        config={config}
        onChange={handleConfigChange}
        projectId={projectId}
        roleId={roleId}
        blocks={blocks}
      />
    );
  };

  // 按分类组织按钮类型
  const getTypesByCategory = () => {
    if (!window.ButtonRegistry) return [];
    
    const categories = window.ButtonRegistry.getCategories();
    return categories.map(cat => ({
      ...cat,
      types: availableTypes.filter(t => t.category === cat.id)
    })).filter(cat => cat.types.length > 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[85vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-xl">🔘</span>
            <h2 className="text-lg font-semibold text-gray-800">配置按钮</h2>
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
          <div className="space-y-6">
            {/* 按钮文字 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3">📝 按钮文字</h3>
              <input
                type="text"
                value={buttonText}
                onChange={(e) => setButtonText(e.target.value)}
                placeholder="输入按钮显示文字"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
              {/* 预览 */}
              <div className="mt-3 flex justify-center p-4 bg-gray-100 rounded">
                <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  {buttonText || '按钮'}
                </button>
              </div>
            </div>

            {/* 按钮类型选择 */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-700 mb-3">🎯 按钮类型</h3>
              
              {getTypesByCategory().map(category => (
                <div key={category.id} className="mb-4">
                  <div className="text-sm text-gray-500 mb-2">
                    {category.icon} {category.label}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {category.types.map(type => (
                      <div
                        key={type.typeId}
                        onClick={() => handleTypeChange(type.typeId)}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          buttonType === type.typeId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xl mr-2">{type.icon}</span>
                        <div>
                          <div className="font-medium text-gray-800">{type.label}</div>
                          {type.description && (
                            <div className="text-xs text-gray-500">{type.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {availableTypes.length === 0 && (
                <div className="text-center text-gray-500 py-4">
                  暂无可用的按钮类型
                </div>
              )}
            </div>

            {/* 按钮类型特定配置 */}
            {buttonType && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">⚙️ 功能配置</h3>
                {renderTypeConfig()}
              </div>
            )}
          </div>
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
            disabled={!buttonType}
            className={`px-6 py-2 rounded ${
              buttonType
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

window.ButtonConfig = ButtonConfig;

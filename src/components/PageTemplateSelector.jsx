// 页面模板选择弹窗组件
// 功能：选择自行设计或采用模板，选择复用样式/功能

function PageTemplateSelector({ 
  projectId, 
  onSelect,  // (选择结果) => void
  onCancel   // () => void
}) {
  const [step, setStep] = React.useState(1); // 1: 选择模式, 2: 选择模板, 3: 选择复用项
  const [mode, setMode] = React.useState(''); // 'self' | 'template'
  const [templates, setTemplates] = React.useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');
  const [copyStyle, setCopyStyle] = React.useState(true);
  const [copyFunctions, setCopyFunctions] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  // 加载页面模板列表
  React.useEffect(() => {
    if (step === 2) {
      loadTemplates();
    }
  }, [step]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const list = await window.dndDB.getPageTemplatesByProjectId(projectId);
      setTemplates(list);
    } catch (error) {
      console.error('加载模板失败:', error);
      alert('加载模板失败：' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 步骤1：选择模式
  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === 'self') {
      // 自行设计，直接返回
      onSelect({ mode: 'self' });
    } else {
      // 采用模板，进入下一步
      setStep(2);
    }
  };

  // 步骤2：选择模板
  const handleTemplateSelect = () => {
    if (!selectedTemplateId) {
      alert('请选择一个模板');
      return;
    }
    setStep(3);
  };

  // 步骤3：确认复用选项
  const handleConfirm = () => {
    if (!copyStyle && !copyFunctions) {
      alert('请至少选择一个复用项');
      return;
    }
    onSelect({
      mode: 'template',
      templateId: selectedTemplateId,
      copyStyle,
      copyFunctions
    });
  };

  // 返回上一步
  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedTemplateId('');
    } else if (step === 3) {
      setStep(2);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {step === 1 && '设计页面'}
            {step === 2 && '选择页面模板'}
            {step === 3 && '选择复用项'}
          </h3>
        </div>

        {/* 内容区 */}
        <div className="px-6 py-4">
          {/* 步骤1：选择模式 */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">请选择页面设计方式：</p>
              <button
                onClick={() => handleModeSelect('self')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✏️</span>
                  <div>
                    <div className="font-medium text-gray-900">自行设计</div>
                    <div className="text-sm text-gray-500">从空白页面开始设计</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleModeSelect('template')}
                className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📋</span>
                  <div>
                    <div className="font-medium text-gray-900">采用模板</div>
                    <div className="text-sm text-gray-500">从已有模板快速创建</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* 步骤2：选择模板 */}
          {step === 2 && (
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-gray-500">加载中...</div>
              ) : templates.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📭</div>
                  <div className="text-gray-500">暂无页面模板</div>
                  <div className="text-sm text-gray-400 mt-1">请先在页面列表中将页面设为模板</div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600">选择要使用的页面模板：</p>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- 请选择模板 --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.description ? `(${t.description})` : ''}
                      </option>
                    ))}
                  </select>
                  {selectedTemplateId && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md text-sm">
                      {(() => {
                        const t = templates.find(t => t.id === selectedTemplateId);
                        return t ? (
                          <>
                            <div><strong>模板名称：</strong>{t.name}</div>
                            {t.description && <div><strong>描述：</strong>{t.description}</div>}
                            <div><strong>区块数量：</strong>{t.blocks?.length || 0} 个</div>
                            <div><strong>创建时间：</strong>{new Date(t.createdAt).toLocaleString()}</div>
                          </>
                        ) : null;
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 步骤3：选择复用项 */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">请选择要复用的内容：</p>
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyStyle}
                  onChange={(e) => setCopyStyle(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">复用样式</div>
                  <div className="text-sm text-gray-500">包含区块位置、尺寸、背景、边框、子区块等</div>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyFunctions}
                  onChange={(e) => setCopyFunctions(e.target.checked)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <div className="ml-3">
                  <div className="font-medium text-gray-900">复用功能</div>
                  <div className="text-sm text-gray-500">包含数据绑定、交互配置、按钮配置等</div>
                </div>
              </label>
              {!copyStyle && !copyFunctions && (
                <div className="text-red-500 text-sm">⚠️ 请至少选择一个复用项</div>
              )}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                ← 上一步
              </button>
            )}
          </div>
          <div className="space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            {step === 2 && templates.length > 0 && (
              <button
                onClick={handleTemplateSelect}
                disabled={!selectedTemplateId}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步 →
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleConfirm}
                disabled={!copyStyle && !copyFunctions}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 确保命名空间存在
window.DNDComponents = window.DNDComponents || {};
window.DNDComponents.PageTemplateSelector = PageTemplateSelector;

console.log('[DND2] PageTemplateSelector.jsx 加载完成');

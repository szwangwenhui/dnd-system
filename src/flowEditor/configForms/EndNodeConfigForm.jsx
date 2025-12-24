// 结束节点配置表单
function EndNodeConfigForm({ config, onChange, pages }) {
  // 确保所有子配置对象都存在
  const defaultConfig = {
    endType: 'silent',
    alertConfig: { alertType: 'success', message: '' },
    jumpConfig: { pageId: '', pageName: '', openMode: 'replace', params: [] },
    backConfig: { refresh: false },
    refreshConfig: { message: '' },
    closePopupConfig: { refreshParent: false }
  };
  
  const [localConfig, setLocalConfig] = React.useState({
    ...defaultConfig,
    ...config,
    alertConfig: { ...defaultConfig.alertConfig, ...(config?.alertConfig || {}) },
    jumpConfig: { ...defaultConfig.jumpConfig, ...(config?.jumpConfig || {}) },
    backConfig: { ...defaultConfig.backConfig, ...(config?.backConfig || {}) },
    refreshConfig: { ...defaultConfig.refreshConfig, ...(config?.refreshConfig || {}) },
    closePopupConfig: { ...defaultConfig.closePopupConfig, ...(config?.closePopupConfig || {}) }
  });

  // 单个路径更新
  const updateConfig = (path, value) => {
    setLocalConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = newConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      onChange(newConfig);
      return newConfig;
    });
  };

  // 批量更新多个路径
  const updateConfigBatch = (updates) => {
    setLocalConfig(prev => {
      const newConfig = JSON.parse(JSON.stringify(prev));
      updates.forEach(({ path, value }) => {
        const keys = path.split('.');
        let obj = newConfig;
        for (let i = 0; i < keys.length - 1; i++) {
          obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
      });
      onChange(newConfig);
      return newConfig;
    });
  };

  // 跳转参数管理
  const addParam = () => {
    const params = [...(localConfig.jumpConfig.params || []), { name: '', valueType: 'fixed', value: '' }];
    updateConfig('jumpConfig.params', params);
  };

  const removeParam = (index) => {
    const params = localConfig.jumpConfig.params.filter((_, i) => i !== index);
    updateConfig('jumpConfig.params', params);
  };

  const updateParam = (index, field, value) => {
    const params = [...localConfig.jumpConfig.params];
    params[index] = { ...params[index], [field]: value };
    updateConfig('jumpConfig.params', params);
  };

  return (
    <div className="space-y-4">
      {/* 结束方式 */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">结束方式</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'silent', label: '静默结束', desc: '无任何提示' },
            { value: 'alert', label: '提示后结束', desc: '显示消息' },
            { value: 'jump', label: '跳转页面', desc: '打开新页面' },
            { value: 'back', label: '返回上一页', desc: '回到来源页' },
            { value: 'refresh', label: '刷新当前页', desc: '重新加载' },
            { value: 'closePopup', label: '关闭弹窗', desc: '关闭模态框' }
          ].map(opt => (
            <label
              key={opt.value}
              className={`flex flex-col p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                localConfig.endType === opt.value
                  ? 'border-blue-500 bg-blue-900/30'
                  : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={localConfig.endType === opt.value}
                  onChange={() => updateConfig('endType', opt.value)}
                  className="text-blue-500"
                />
                <span className="text-gray-200 text-sm font-medium">{opt.label}</span>
              </div>
              <span className="text-gray-500 text-xs mt-1 ml-5">{opt.desc}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 提示后结束配置 */}
      {localConfig.endType === 'alert' && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">提示配置</h4>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">提示类型</label>
            <div className="flex space-x-2">
              {[
                { value: 'success', label: '成功', color: 'green' },
                { value: 'error', label: '错误', color: 'red' },
                { value: 'warning', label: '警告', color: 'yellow' },
                { value: 'info', label: '信息', color: 'blue' }
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => updateConfig('alertConfig.alertType', t.value)}
                  className={`flex-1 py-2 rounded text-sm transition-colors ${
                    localConfig.alertConfig.alertType === t.value
                      ? `bg-${t.color}-600 text-white`
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                  style={localConfig.alertConfig.alertType === t.value ? {
                    backgroundColor: t.color === 'green' ? '#059669' : t.color === 'red' ? '#dc2626' : t.color === 'yellow' ? '#d97706' : '#2563eb'
                  } : {}}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">提示内容</label>
            <input
              type="text"
              value={localConfig.alertConfig.message}
              onChange={(e) => updateConfig('alertConfig.message', e.target.value)}
              placeholder="请输入提示文字..."
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">支持变量：如 {'{user.姓名}'} 会被替换为实际值</p>
          </div>
        </div>
      )}

      {/* 跳转页面配置 */}
      {localConfig.endType === 'jump' && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">跳转配置</h4>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">目标页面</label>
            <select
              value={localConfig.jumpConfig.pageId}
              onChange={(e) => {
                const page = pages?.find(p => p.id === e.target.value);
                updateConfigBatch([
                  { path: 'jumpConfig.pageId', value: e.target.value },
                  { path: 'jumpConfig.pageName', value: page?.name || '' }
                ]);
              }}
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
            >
              <option value="">-- 选择页面 --</option>
              {pages?.map(p => (
                <option key={p.id} value={p.id}>[{p.roleName}] {p.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">打开方式</label>
            <div className="flex space-x-2">
              {[
                { value: 'replace', label: '替换当前页' },
                { value: 'newWindow', label: '新窗口打开' }
              ].map(m => (
                <button
                  key={m.value}
                  onClick={() => updateConfig('jumpConfig.openMode', m.value)}
                  className={`flex-1 py-2 rounded text-sm transition-colors ${
                    localConfig.jumpConfig.openMode === m.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">传入参数</label>
              <button
                onClick={addParam}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + 添加参数
              </button>
            </div>
            
            {localConfig.jumpConfig.params?.length > 0 ? (
              <div className="space-y-2">
                {localConfig.jumpConfig.params.map((param, index) => (
                  <div key={index} className="flex space-x-2 items-center">
                    <input
                      type="text"
                      value={param.name}
                      onChange={(e) => updateParam(index, 'name', e.target.value)}
                      placeholder="参数名"
                      className="w-24 bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                    />
                    <select
                      value={param.valueType}
                      onChange={(e) => updateParam(index, 'valueType', e.target.value)}
                      className="w-20 bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                    >
                      <option value="fixed">固定值</option>
                      <option value="variable">变量</option>
                    </select>
                    <input
                      type="text"
                      value={param.value}
                      onChange={(e) => updateParam(index, 'value', e.target.value)}
                      placeholder={param.valueType === 'variable' ? 'order.id' : '值'}
                      className="flex-1 bg-gray-600 text-gray-200 rounded px-2 py-1 text-sm border border-gray-500"
                    />
                    <button
                      onClick={() => removeParam(index)}
                      className="text-red-400 hover:text-red-300 px-2"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500 bg-gray-600 rounded p-2 text-center">
                暂无参数
              </div>
            )}
          </div>
        </div>
      )}

      {/* 返回上一页配置 */}
      {localConfig.endType === 'back' && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">返回配置</h4>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.backConfig.refresh}
              onChange={(e) => updateConfig('backConfig.refresh', e.target.checked)}
              className="rounded text-blue-500"
            />
            <span className="text-gray-200 text-sm">返回后刷新上一页</span>
          </label>
        </div>
      )}

      {/* 刷新当前页配置 */}
      {localConfig.endType === 'refresh' && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">刷新配置</h4>
          
          <div>
            <label className="block text-xs text-gray-400 mb-1">提示信息（可选）</label>
            <input
              type="text"
              value={localConfig.refreshConfig.message}
              onChange={(e) => updateConfig('refreshConfig.message', e.target.value)}
              placeholder="如：保存成功"
              className="w-full bg-gray-600 text-gray-200 rounded px-3 py-2 text-sm border border-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* 关闭弹窗配置 */}
      {localConfig.endType === 'closePopup' && (
        <div className="bg-gray-700 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-300">关闭弹窗配置</h4>
          
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.closePopupConfig.refreshParent}
              onChange={(e) => updateConfig('closePopupConfig.refreshParent', e.target.checked)}
              className="rounded text-blue-500"
            />
            <span className="text-gray-200 text-sm">关闭后刷新父页面</span>
          </label>
        </div>
      )}
    </div>
  );
}

window.EndNodeConfigForm = EndNodeConfigForm;

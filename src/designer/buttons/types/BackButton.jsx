// 回退页面按钮 - 动作按钮类型
// 返回上一页，无需配置

function BackButtonConfig({ config, onChange }) {
  return (
    <div className="text-center py-6">
      <div className="text-4xl mb-3">↩️</div>
      <div className="text-gray-600">
        点击按钮将返回上一页
      </div>
      <div className="text-xs text-gray-400 mt-2">
        无需额外配置
      </div>
    </div>
  );
}

// 执行回退
async function executeBackButton(config, context) {
  // 使用浏览器历史回退
  if (window.history.length > 1) {
    window.history.back();
    return { success: true };
  } else {
    return { success: false, error: '没有可回退的页面' };
  }
}

// 验证配置（总是有效）
function validateBackButton(config) {
  return { valid: true, errors: [] };
}

// 注册按钮类型
if (window.ButtonRegistry) {
  window.ButtonRegistry.register('back', {
    label: '回退页面',
    icon: '↩️',
    description: '返回上一页',
    category: 'action',
    renderConfig: BackButtonConfig,
    execute: executeBackButton,
    validate: validateBackButton,
    defaultConfig: {}
  });
}

window.BackButtonConfig = BackButtonConfig;

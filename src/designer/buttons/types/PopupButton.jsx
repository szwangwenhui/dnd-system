// 弹窗控制按钮 - 动作按钮类型
// 包含两个按钮类型：打开弹窗、关闭弹窗

// ========== 打开弹窗按钮 ==========

function OpenPopupButtonConfig({ config, onChange, projectId, roleId, blocks }) {
  // 从传入的blocks中筛选弹窗区块（有isPopup标签的区块）
  const popupBlocks = React.useMemo(() => {
    if (!blocks || !Array.isArray(blocks)) {
      return [];
    }
    
    // 筛选有弹窗标签的区块
    const filtered = blocks.filter(b => b.isPopup === true);
    
    console.log('筛选弹窗区块：', filtered.length, '个');
    return filtered;
  }, [blocks]);

  return (
    <div className="space-y-4">
      {/* 目标弹窗 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          目标弹窗区块 <span className="text-red-500">*</span>
        </label>
        {popupBlocks.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded border border-dashed border-gray-300">
            <div className="text-gray-400 text-sm">暂无弹窗区块</div>
            <div className="text-gray-400 text-xs mt-1">
              请先在区块列表中勾选"设为弹窗"
            </div>
          </div>
        ) : (
          <select
            value={config.targetBlockId || ''}
            onChange={(e) => {
              const block = popupBlocks.find(b => b.id === e.target.value);
              onChange({ 
                targetBlockId: e.target.value,
                targetBlockName: block?.name || block?.id || ''
              });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          >
            <option value="">-- 请选择弹窗区块 --</option>
            {popupBlocks.map(block => (
              <option key={block.id} value={block.id}>
                {block.id} {block.name ? `(${block.name})` : ''}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 配置预览 */}
      {config.targetBlockId && (
        <div className="p-3 bg-green-50 rounded text-sm text-green-700">
          点击此按钮将打开弹窗 "{config.targetBlockName || config.targetBlockId}"
        </div>
      )}
    </div>
  );
}

// 执行打开弹窗
async function executeOpenPopup(config, context) {
  console.log('=== executeOpenPopup 执行 ===');
  console.log('config:', config);
  console.log('config.targetBlockId:', config.targetBlockId);
  
  if (!config.targetBlockId) {
    console.log('错误：未选择目标弹窗');
    return { success: false, error: '未选择目标弹窗' };
  }

  // 触发打开弹窗事件（将目标区块层级改为正常值）
  console.log('触发 openPopup 事件，blockId:', config.targetBlockId);
  window.dispatchEvent(new CustomEvent('openPopup', {
    detail: {
      blockId: config.targetBlockId
    }
  }));

  console.log('openPopup 事件已触发');
  return { success: true };
}

// 验证打开弹窗配置
function validateOpenPopup(config) {
  const errors = [];
  if (!config.targetBlockId) {
    errors.push('请选择目标弹窗区块');
  }
  return { valid: errors.length === 0, errors };
}

// 关闭弹窗功能已移至弹窗区块自带的❌按钮

// ========== 注册按钮类型 ==========

if (window.ButtonRegistry) {
  // 注册打开弹窗按钮
  window.ButtonRegistry.register('openPopup', {
    label: '打开弹窗',
    icon: '📤',
    description: '打开指定的弹窗区块',
    category: 'action',
    renderConfig: OpenPopupButtonConfig,
    execute: executeOpenPopup,
    validate: validateOpenPopup,
    defaultConfig: {
      targetBlockId: '',
      targetBlockName: ''
    }
  });

  // 关闭弹窗按钮已取消 - 弹窗区块自带❌关闭按钮
}

window.OpenPopupButtonConfig = OpenPopupButtonConfig;

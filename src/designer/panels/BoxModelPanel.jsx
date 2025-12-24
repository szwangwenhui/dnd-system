// 盒模型样式面板
// 包含：宽度、高度、内边距、外边距、显示模式、溢出控制
function BoxModelPanel({ block, onUpdate }) {
  if (!block) return null;

  const style = block.style || {};

  // 更新样式
  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...style, [key]: value }
    });
  };

  // 更新区块属性
  const updateBlock = (key, value) => {
    onUpdate({ [key]: value });
  };

  return (
    <div className="space-y-3">
      {/* 位置 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">位置 (px)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-gray-400">X</span>
            <input
              type="number"
              value={block.x || 0}
              onChange={(e) => updateBlock('x', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <span className="text-xs text-gray-400">Y</span>
            <input
              type="number"
              value={block.y || 0}
              onChange={(e) => updateBlock('y', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* 尺寸 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">尺寸 (px)</label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-xs text-gray-400">宽度</span>
            <input
              type="number"
              value={block.width || 100}
              min="20"
              onChange={(e) => updateBlock('width', Math.max(20, parseInt(e.target.value) || 20))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <span className="text-xs text-gray-400">高度</span>
            <input
              type="number"
              value={block.height || 100}
              min="20"
              onChange={(e) => updateBlock('height', Math.max(20, parseInt(e.target.value) || 20))}
              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>
      </div>

      {/* 内边距 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">内边距 - padding (px)</label>
        <div className="grid grid-cols-4 gap-1">
          <div>
            <span className="text-xs text-gray-400">上</span>
            <input
              type="number"
              value={style.paddingTop || 0}
              min="0"
              onChange={(e) => updateStyle('paddingTop', parseInt(e.target.value) || 0)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-sm text-center"
            />
          </div>
          <div>
            <span className="text-xs text-gray-400">右</span>
            <input
              type="number"
              value={style.paddingRight || 0}
              min="0"
              onChange={(e) => updateStyle('paddingRight', parseInt(e.target.value) || 0)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-sm text-center"
            />
          </div>
          <div>
            <span className="text-xs text-gray-400">下</span>
            <input
              type="number"
              value={style.paddingBottom || 0}
              min="0"
              onChange={(e) => updateStyle('paddingBottom', parseInt(e.target.value) || 0)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-sm text-center"
            />
          </div>
          <div>
            <span className="text-xs text-gray-400">左</span>
            <input
              type="number"
              value={style.paddingLeft || 0}
              min="0"
              onChange={(e) => updateStyle('paddingLeft', parseInt(e.target.value) || 0)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-sm text-center"
            />
          </div>
        </div>
      </div>

      {/* 外边距 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">外边距 - margin (px)</label>
        <div className="grid grid-cols-4 gap-1">
          <div>
            <span className="text-xs text-gray-400">上</span>
            <input
              type="number"
              value={style.marginTop || 0}
              onChange={(e) => updateStyle('marginTop', parseInt(e.target.value) || 0)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-sm text-center"
            />
          </div>
          <div>
            <span className="text-xs text-gray-400">右</span>
            <input
              type="number"
              value={style.marginRight || 0}
              onChange={(e) => updateStyle('marginRight', parseInt(e.target.value) || 0)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-sm text-center"
            />
          </div>
          <div>
            <span className="text-xs text-gray-400">下</span>
            <input
              type="number"
              value={style.marginBottom || 0}
              onChange={(e) => updateStyle('marginBottom', parseInt(e.target.value) || 0)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-sm text-center"
            />
          </div>
          <div>
            <span className="text-xs text-gray-400">左</span>
            <input
              type="number"
              value={style.marginLeft || 0}
              onChange={(e) => updateStyle('marginLeft', parseInt(e.target.value) || 0)}
              className="w-full px-1 py-1 border border-gray-300 rounded text-sm text-center"
            />
          </div>
        </div>
      </div>

      {/* 显示模式 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">显示模式 - display</label>
        <select
          value={style.display || 'block'}
          onChange={(e) => updateStyle('display', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="block">block (块级)</option>
          <option value="inline">inline (行内)</option>
          <option value="inline-block">inline-block (行内块)</option>
          <option value="flex">flex (弹性)</option>
          <option value="grid">grid (网格)</option>
          <option value="none">none (隐藏)</option>
        </select>
      </div>

      {/* 溢出控制 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">溢出控制 - overflow</label>
        <select
          value={style.overflow || 'visible'}
          onChange={(e) => updateStyle('overflow', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="visible">visible (可见)</option>
          <option value="hidden">hidden (隐藏)</option>
          <option value="scroll">scroll (滚动条)</option>
          <option value="auto">auto (自动)</option>
        </select>
      </div>

      {/* 盒模型计算方式 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">盒模型 - box-sizing</label>
        <select
          value={style.boxSizing || 'border-box'}
          onChange={(e) => updateStyle('boxSizing', e.target.value)}
          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
        >
          <option value="border-box">border-box (包含边框)</option>
          <option value="content-box">content-box (仅内容)</option>
        </select>
      </div>
    </div>
  );
}

window.BoxModelPanel = BoxModelPanel;

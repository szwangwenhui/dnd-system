// 定位样式面板
// 包含：定位模式、偏移量、层级
function PositionPanel({ block, onUpdate }) {
  if (!block) return null;

  const style = block.style || {};

  // 更新样式
  const updateStyle = (key, value) => {
    onUpdate({
      style: { ...style, [key]: value }
    });
  };

  // 定位模式说明
  const positionModes = [
    { value: 'static', label: 'static (默认)', desc: '正常文档流，top/left等无效' },
    { value: 'relative', label: 'relative (相对)', desc: '相对自身原位置偏移' },
    { value: 'absolute', label: 'absolute (绝对)', desc: '相对最近定位祖先偏移' },
    { value: 'fixed', label: 'fixed (固定)', desc: '相对视口固定位置' },
    { value: 'sticky', label: 'sticky (粘性)', desc: '滚动到阈值时固定' },
  ];

  // 当前定位模式
  const currentPosition = style.position || 'static';
  const isPositioned = currentPosition !== 'static';

  return (
    <div className="space-y-4">
      {/* 定位模式 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">定位模式 - position</label>
        <select
          value={currentPosition}
          onChange={(e) => updateStyle('position', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
        >
          {positionModes.map(mode => (
            <option key={mode.value} value={mode.value}>{mode.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          {positionModes.find(m => m.value === currentPosition)?.desc}
        </p>
      </div>

      {/* 偏移量 - 仅非static时显示 */}
      {isPositioned && (
        <div className="p-3 bg-gray-50 rounded space-y-3">
          <label className="block text-xs font-medium text-gray-600">偏移量 (px)</label>
          
          {/* 可视化偏移设置 */}
          <div className="relative w-full h-32 border border-gray-300 rounded bg-white">
            {/* 中心区块示意 */}
            <div className="absolute inset-8 border-2 border-dashed border-blue-300 rounded flex items-center justify-center text-xs text-gray-400">
              区块
            </div>
            
            {/* Top */}
            <div className="absolute top-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <span className="text-xs text-gray-500 mb-1">top</span>
              <input
                type="number"
                value={style.top || ''}
                onChange={(e) => updateStyle('top', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="auto"
                className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
              />
            </div>
            
            {/* Bottom */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center">
              <input
                type="number"
                value={style.bottom || ''}
                onChange={(e) => updateStyle('bottom', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="auto"
                className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
              />
              <span className="text-xs text-gray-500 mt-1">bottom</span>
            </div>
            
            {/* Left */}
            <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">left</span>
                <input
                  type="number"
                  value={style.left || ''}
                  onChange={(e) => updateStyle('left', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="auto"
                  className="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                />
              </div>
            </div>
            
            {/* Right */}
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
              <div className="flex flex-col items-center">
                <span className="text-xs text-gray-500 mb-1">right</span>
                <input
                  type="number"
                  value={style.right || ''}
                  onChange={(e) => updateStyle('right', e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="auto"
                  className="w-14 px-1 py-0.5 border border-gray-300 rounded text-xs text-center"
                />
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500">
            提示：留空表示auto，同时设置top和bottom会忽略bottom
          </p>
        </div>
      )}

      {/* 层级 */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-2">层级 - z-index</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={style.zIndex || 0}
            onChange={(e) => updateStyle('zIndex', parseInt(e.target.value) || 0)}
            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm"
          />
          <span className="text-xs text-gray-500">数值越大越靠前</span>
        </div>
        
        {/* 快捷层级按钮 */}
        <div className="flex flex-wrap gap-1 mt-2">
          {[
            { label: '底层', value: -1 },
            { label: '默认', value: 0 },
            { label: '普通', value: 10 },
            { label: '悬浮', value: 100 },
            { label: '弹窗', value: 1000 },
            { label: '最顶', value: 9999 },
          ].map(preset => (
            <button
              key={preset.value}
              onClick={() => updateStyle('zIndex', preset.value)}
              className={`px-2 py-1 text-xs border rounded ${
                style.zIndex === preset.value
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {preset.label} ({preset.value})
            </button>
          ))}
        </div>
      </div>

      {/* 定位预设 */}
      <div className="border-t border-gray-200 pt-4">
        <label className="block text-xs font-medium text-gray-600 mb-2">定位预设</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              updateStyle('position', 'absolute');
              updateStyle('top', 0);
              updateStyle('left', 0);
              updateStyle('right', undefined);
              updateStyle('bottom', undefined);
            }}
            className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 text-left"
          >
            📍 左上角
          </button>
          <button
            onClick={() => {
              updateStyle('position', 'absolute');
              updateStyle('top', 0);
              updateStyle('right', 0);
              updateStyle('left', undefined);
              updateStyle('bottom', undefined);
            }}
            className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 text-left"
          >
            📍 右上角
          </button>
          <button
            onClick={() => {
              updateStyle('position', 'absolute');
              updateStyle('bottom', 0);
              updateStyle('left', 0);
              updateStyle('top', undefined);
              updateStyle('right', undefined);
            }}
            className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 text-left"
          >
            📍 左下角
          </button>
          <button
            onClick={() => {
              updateStyle('position', 'absolute');
              updateStyle('bottom', 0);
              updateStyle('right', 0);
              updateStyle('top', undefined);
              updateStyle('left', undefined);
            }}
            className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 text-left"
          >
            📍 右下角
          </button>
          <button
            onClick={() => {
              updateStyle('position', 'absolute');
              updateStyle('top', 0);
              updateStyle('left', 0);
              updateStyle('right', 0);
              updateStyle('bottom', 0);
            }}
            className="px-3 py-2 text-xs border border-gray-300 rounded hover:bg-gray-50 text-left col-span-2"
          >
            📐 铺满父容器
          </button>
        </div>
      </div>

      {/* 重置定位 */}
      <button
        onClick={() => {
          updateStyle('position', 'static');
          updateStyle('top', undefined);
          updateStyle('right', undefined);
          updateStyle('bottom', undefined);
          updateStyle('left', undefined);
          updateStyle('zIndex', 0);
        }}
        className="w-full py-2 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
      >
        重置定位
      </button>
    </div>
  );
}

window.PositionPanel = PositionPanel;

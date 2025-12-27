// Icon管理器组件
// 功能：显示Icon列表、添加/编辑/删除Icon、拖拽Icon到画布
function IconManager({ 
  isOpen, 
  onClose, 
  projectIcons = [],
  onUpdateProjectIcons,
  pages = [],
  blocks = [],
  onDragIconToCanvas
}) {
  // 当前视图：list（列表）或 edit（编辑）
  const [view, setView] = React.useState('list');
  // 当前编辑的Icon
  const [editingIcon, setEditingIcon] = React.useState(null);
  // 拖拽状态
  const [draggedIcon, setDraggedIcon] = React.useState(null);

  // 关闭时重置状态
  React.useEffect(() => {
    if (!isOpen) {
      setView('list');
      setEditingIcon(null);
    }
  }, [isOpen]);

  // 添加新Icon
  const handleAddIcon = () => {
    setEditingIcon({
      id: `icon-${Date.now()}`,
      name: '',
      size: { width: 32, height: 32 },
      image: null,
      action: { type: 'navigatePage', targetPageId: null, targetPopupId: null },
      description: ''
    });
    setView('edit');
  };

  // 编辑Icon
  const handleEditIcon = (icon) => {
    setEditingIcon({ ...icon });
    setView('edit');
  };

  // 删除Icon
  const handleDeleteIcon = (iconId) => {
    if (confirm('确定要删除这个Icon吗？')) {
      const updated = projectIcons.filter(i => i.id !== iconId);
      onUpdateProjectIcons(updated);
    }
  };

  // 保存Icon
  const handleSaveIcon = (iconData) => {
    const existing = projectIcons.find(i => i.id === iconData.id);
    let updated;
    if (existing) {
      updated = projectIcons.map(i => i.id === iconData.id ? iconData : i);
    } else {
      updated = [...projectIcons, iconData];
    }
    onUpdateProjectIcons(updated);
    setView('list');
    setEditingIcon(null);
  };

  // 拖拽开始
  const handleDragStart = (e, icon) => {
    setDraggedIcon(icon);
    e.dataTransfer.setData('application/json', JSON.stringify({
      type: 'icon',
      iconId: icon.id,
      iconData: icon
    }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  // 获取弹窗模板列表（isPopup && isTemplate）
  const popupTemplates = blocks.filter(b => b.isPopup === true && b.isTemplate === true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-[600px] max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            {view === 'list' ? '🔘 Icon 管理' : (editingIcon?.id && projectIcons.find(i => i.id === editingIcon.id) ? '编辑 Icon' : '添加 Icon')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-auto p-4">
          {view === 'list' ? (
            <IconListView 
              icons={projectIcons}
              onAdd={handleAddIcon}
              onEdit={handleEditIcon}
              onDelete={handleDeleteIcon}
              onDragStart={handleDragStart}
            />
          ) : (
            <IconEditView
              icon={editingIcon}
              onSave={handleSaveIcon}
              onCancel={() => { setView('list'); setEditingIcon(null); }}
              pages={pages}
              popupTemplates={popupTemplates}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Icon列表视图
function IconListView({ icons, onAdd, onEdit, onDelete, onDragStart }) {
  return (
    <div>
      {/* 添加按钮 */}
      <div className="mb-4">
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
        >
          <span>+</span>
          <span>添加新 Icon</span>
        </button>
      </div>

      {/* Icon列表 */}
      {icons.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔘</div>
          <p>暂无Icon，点击上方按钮添加</p>
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 border-b">图标</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 border-b">名称</th>
              <th className="px-3 py-2 text-left text-sm font-medium text-gray-600 border-b">功能说明</th>
              <th className="px-3 py-2 text-center text-sm font-medium text-gray-600 border-b">操作</th>
            </tr>
          </thead>
          <tbody>
            {icons.map(icon => (
              <tr key={icon.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border-b">
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, icon)}
                    className="w-10 h-10 border border-gray-200 rounded cursor-move flex items-center justify-center bg-white hover:border-blue-400 hover:shadow"
                    title="拖拽到画布"
                  >
                    {icon.image ? (
                      <img src={icon.image.url} alt={icon.name} className="max-w-full max-h-full object-contain" />
                    ) : (
                      <span className="text-gray-400 text-xs">无图</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 border-b text-sm text-gray-700">{icon.name || '未命名'}</td>
                <td className="px-3 py-2 border-b text-sm text-gray-500">{icon.description || '-'}</td>
                <td className="px-3 py-2 border-b text-center">
                  <button
                    onClick={() => onEdit(icon)}
                    className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded mr-1"
                  >
                    设置
                  </button>
                  <button
                    onClick={() => onDelete(icon.id)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 使用提示 */}
      {icons.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded text-sm text-blue-700">
          💡 提示：按住图标可拖拽到画布上
        </div>
      )}
    </div>
  );
}

// Icon编辑视图
function IconEditView({ icon, onSave, onCancel, pages, popupTemplates }) {
  const [formData, setFormData] = React.useState(icon);
  const [imagePreview, setImagePreview] = React.useState(icon.image?.url || null);
  const fileInputRef = React.useRef(null);

  // 处理图片上传
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target.result;
      setImagePreview(url);
      setFormData(prev => ({
        ...prev,
        image: { url, type: 'base64', name: file.name }
      }));
    };
    reader.readAsDataURL(file);
  };

  // 更新表单数据
  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // 更新action
  const updateAction = (field, value) => {
    setFormData(prev => ({
      ...prev,
      action: { ...prev.action, [field]: value }
    }));
  };

  // 更新尺寸
  const updateSize = (field, value) => {
    const num = parseInt(value) || 32;
    setFormData(prev => ({
      ...prev,
      size: { ...prev.size, [field]: Math.max(16, Math.min(64, num)) }
    }));
  };

  // 保存
  const handleSubmit = () => {
    if (!formData.name) {
      alert('请输入Icon名称');
      return;
    }
    if (!formData.image) {
      alert('请上传Icon图片');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="space-y-4">
      {/* Icon名称 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Icon名称 *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          placeholder="如：返回主页"
        />
      </div>

      {/* 尺寸设置 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">默认尺寸（可在画布上调整）</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={formData.size.width}
            onChange={(e) => updateSize('width', e.target.value)}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
            min="16"
            max="64"
          />
          <span className="text-gray-500">×</span>
          <input
            type="number"
            value={formData.size.height}
            onChange={(e) => updateSize('height', e.target.value)}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
            min="16"
            max="64"
          />
          <span className="text-sm text-gray-500">（16-64像素）</span>
        </div>
      </div>

      {/* 图片上传 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Icon图片 *</label>
        <div className="flex items-start space-x-4">
          {/* 预览区 */}
          <div 
            className="w-24 h-24 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 cursor-pointer hover:border-blue-400"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="预览" className="max-w-full max-h-full object-contain" />
            ) : (
              <span className="text-gray-400 text-sm text-center">点击上传<br/>图片</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="text-sm text-gray-500">
            <p>支持 JPG、PNG、GIF、SVG 格式</p>
            <p>建议使用透明背景的图片</p>
          </div>
        </div>
      </div>

      {/* 功能设置 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">点击功能</label>
        <div className="space-y-3 p-3 bg-gray-50 rounded">
          {/* 跳转固定页 */}
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="radio"
              name="actionType"
              checked={formData.action.type === 'navigatePage'}
              onChange={() => updateAction('type', 'navigatePage')}
              className="mt-1"
            />
            <div className="flex-1">
              <span className="text-sm text-gray-700">跳转固定页</span>
              {formData.action.type === 'navigatePage' && (
                <select
                  value={formData.action.targetPageId || ''}
                  onChange={(e) => updateAction('targetPageId', e.target.value)}
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">请选择页面</option>
                  {pages.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
          </label>

          {/* 返回前页 */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="actionType"
              checked={formData.action.type === 'goBack'}
              onChange={() => updateAction('type', 'goBack')}
            />
            <span className="text-sm text-gray-700">返回前页</span>
          </label>

          {/* 唤醒固定弹窗 */}
          <label className="flex items-start space-x-2 cursor-pointer">
            <input
              type="radio"
              name="actionType"
              checked={formData.action.type === 'openPopup'}
              onChange={() => updateAction('type', 'openPopup')}
              className="mt-1"
            />
            <div className="flex-1">
              <span className="text-sm text-gray-700">唤醒固定弹窗</span>
              {formData.action.type === 'openPopup' && (
                <select
                  value={formData.action.targetPopupId || ''}
                  onChange={(e) => updateAction('targetPopupId', e.target.value)}
                  className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  <option value="">请选择弹窗</option>
                  {popupTemplates.length === 0 ? (
                    <option disabled>暂无弹窗模板（需设为弹窗+模板）</option>
                  ) : (
                    popupTemplates.map(b => (
                      <option key={b.id} value={b.id}>{b.id}</option>
                    ))
                  )}
                </select>
              )}
            </div>
          </label>
        </div>
      </div>

      {/* 功能说明 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">功能说明（≤50字）</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value.slice(0, 50))}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          placeholder="简要描述Icon的功能"
          maxLength={50}
        />
        <div className="text-right text-xs text-gray-400">{formData.description?.length || 0}/50</div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          确定提交
        </button>
      </div>
    </div>
  );
}

window.IconManager = IconManager;
console.log('[DND2] IconManager.jsx 加载完成');

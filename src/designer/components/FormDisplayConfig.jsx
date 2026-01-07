// 表单显示配置弹窗组件
function FormDisplayConfig({ isOpen, onClose, block, onSave, projectId, roleId }) {
  // 配置状态
  const [config, setConfig] = React.useState({
    formId: block?.formConfig?.formId || '',
    displayFields: block?.formConfig?.displayFields || [],
    columnWidths: block?.formConfig?.columnWidths || {},  // 列宽配置 {fieldId: width}
    totalRecords: block?.formConfig?.totalRecords || '',
    pageSize: block?.formConfig?.pageSize || '',
    sortOrder: block?.formConfig?.sortOrder || 'desc',  // 显示顺序: desc=倒序(默认), asc=顺序

    // 表头样式
    headerBgColor: block?.formConfig?.headerBgColor || '#f3f4f6',
    headerTextColor: block?.formConfig?.headerTextColor || '#374151',
    headerHeight: block?.formConfig?.headerHeight || 40,
    headerFontSize: block?.formConfig?.headerFontSize || 13,
    headerFontFamily: block?.formConfig?.headerFontFamily || 'Arial',

    // 表体样式（单元格全局样式）
    rowBgColor: block?.formConfig?.rowBgColor || '#ffffff',
    rowAltBgColor: block?.formConfig?.rowAltBgColor || '#f9fafb',
    rowHeight: block?.formConfig?.rowHeight || 36,

    // 单元格全局样式
    cellFontFamily: block?.formConfig?.cellFontFamily || 'Arial',
    cellFontSize: block?.formConfig?.cellFontSize || 12,
    cellColor: block?.formConfig?.cellColor || '#374151',
    cellPaddingTop: block?.formConfig?.cellPaddingTop || 4,
    cellPaddingRight: block?.formConfig?.cellPaddingRight || 8,
    cellPaddingBottom: block?.formConfig?.cellPaddingBottom || 4,
    cellPaddingLeft: block?.formConfig?.cellPaddingLeft || 8,
    cellTextAlign: block?.formConfig?.cellTextAlign || 'left',
    cellVerticalAlign: block?.formConfig?.cellVerticalAlign || 'middle',
    cellWordWrap: block?.formConfig?.cellWordWrap || 'nowrap',

    // 表底样式
    footerEnabled: block?.formConfig?.footerEnabled !== false,  // 是否启用表尾
    footerBgColor: block?.formConfig?.footerBgColor || '#f3f4f6',
    footerTextColor: block?.formConfig?.footerTextColor || '#374151',
    footerHeight: block?.formConfig?.footerHeight || 36,
    footerFontSize: block?.formConfig?.footerFontSize || 12,
    footerFontFamily: block?.formConfig?.footerFontFamily || 'Arial',

    // 边框样式
    borderColor: block?.formConfig?.borderColor || '#e5e7eb',
    borderWidth: block?.formConfig?.borderWidth || 1,
    innerHorizontalBorderColor: block?.formConfig?.innerHorizontalBorderColor || '#e5e7eb',
    innerHorizontalBorderWidth: block?.formConfig?.innerHorizontalBorderWidth || 1,
    innerVerticalBorderColor: block?.formConfig?.innerVerticalBorderColor || '#e5e7eb',
    innerVerticalBorderWidth: block?.formConfig?.innerVerticalBorderWidth || 1,
    showOuterBorder: block?.formConfig?.showOuterBorder !== false,
    showInnerBorder: block?.formConfig?.showInnerBorder !== false,

    // 特殊单元格（合并+独立样式）
    specialCells: block?.formConfig?.specialCells || [],

    // 操作列配置
    showActionColumn: block?.formConfig?.showActionColumn || false,
    actionColumnTitle: block?.formConfig?.actionColumnTitle || '操作',
    actionColumnWidth: block?.formConfig?.actionColumnWidth || 150,
    actionButtons: block?.formConfig?.actionButtons || {
      edit: { enabled: false, text: '修改', color: '#3b82f6' },
      delete: { enabled: false, text: '删除', color: '#ef4444', confirmText: '确定要删除这条记录吗？' },
      top: { enabled: false, textOn: '取消置顶', textOff: '置顶', color: '#f59e0b', field: '' }
    },
  });

  // 特殊单元格编辑状态
  const [editingSpecialCell, setEditingSpecialCell] = React.useState(null);
  const [showSpecialCellModal, setShowSpecialCellModal] = React.useState(false);

  // 表单列表和字段列表
  const [forms, setForms] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // 加载表单列表
  React.useEffect(() => {
    if (!isOpen) return;
    
    const loadForms = async () => {
      setLoading(true);
      try {
        // 使用dndDB加载表单
        const formList = await window.dndDB.getFormsByProjectId(projectId);
        console.log('加载到的表单列表:', formList);
        setForms(formList || []);
      } catch (error) {
        console.error('加载表单失败:', error);
        setForms([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadForms();
  }, [isOpen, projectId]);

  // 当选择表单后加载字段
  React.useEffect(() => {
    if (!config.formId) {
      setFields([]);
      return;
    }
    
    const loadFields = async () => {
      try {
        // 使用dndDB加载字段
        const fieldList = await window.dndDB.getFieldsByProjectId(projectId);
        console.log('加载到的字段列表:', fieldList);
        
        // 获取选中表单的结构
        const selectedForm = forms.find(f => f.id === config.formId);
        console.log('选中的表单:', selectedForm);
        
        if (selectedForm && selectedForm.structure && selectedForm.structure.fields) {
          // 筛选表单中使用的字段
          const formFieldIds = selectedForm.structure.fields.map(f => f.fieldId);
          const formFields = fieldList.filter(f => formFieldIds.includes(f.id));
          setFields(formFields);
        } else {
          // 如果没有结构，显示所有字段
          setFields(fieldList || []);
        }
      } catch (error) {
        console.error('加载字段失败:', error);
        setFields([]);
      }
    };
    
    loadFields();
  }, [config.formId, projectId, forms]);

  // 更新配置
  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  // 切换字段选择
  const toggleField = (fieldId) => {
    setConfig(prev => {
      const current = prev.displayFields || [];
      if (current.includes(fieldId)) {
        return { ...prev, displayFields: current.filter(id => id !== fieldId) };
      } else {
        return { ...prev, displayFields: [...current, fieldId] };
      }
    });
  };

  // 全选/取消全选
  const toggleAllFields = () => {
    if (config.displayFields.length === fields.length) {
      setConfig(prev => ({ ...prev, displayFields: [] }));
    } else {
      setConfig(prev => ({ ...prev, displayFields: fields.map(f => f.id) }));
    }
  };

  // 特殊单元格操作函数
  const addSpecialCell = () => {
    const newSpecialCell = {
      id: Date.now().toString(),
      startRow: 0,
      endRow: 0,
      startCol: 0,
      endCol: 0,
      fontFamily: config.cellFontFamily,
      fontSize: config.cellFontSize,
      color: config.cellColor,
      bgColor: '',
      paddingTop: config.cellPaddingTop,
      paddingRight: config.cellPaddingRight,
      paddingBottom: config.cellPaddingBottom,
      paddingLeft: config.cellPaddingLeft,
      textAlign: config.cellTextAlign,
      verticalAlign: config.cellVerticalAlign,
      wordWrap: config.cellWordWrap
    };
    setEditingSpecialCell(newSpecialCell);
    setShowSpecialCellModal(true);
  };

  const editSpecialCell = (specialCell) => {
    setEditingSpecialCell(specialCell);
    setShowSpecialCellModal(true);
  };

  const deleteSpecialCell = (specialCellId) => {
    if (window.confirm('确定要删除这个特殊单元格吗？')) {
      const newSpecialCells = config.specialCells.filter(sc => sc.id !== specialCellId);
      updateConfig('specialCells', newSpecialCells);
    }
  };

  const saveSpecialCell = (specialCell) => {
    const existingIndex = config.specialCells.findIndex(sc => sc.id === specialCell.id);
    let newSpecialCells;
    if (existingIndex >= 0) {
      newSpecialCells = [...config.specialCells];
      newSpecialCells[existingIndex] = specialCell;
    } else {
      newSpecialCells = [...config.specialCells, specialCell];
    }
    updateConfig('specialCells', newSpecialCells);
    setShowSpecialCellModal(false);
    setEditingSpecialCell(null);
  };

  // 保存配置
  const handleSave = () => {
    // 构建字段信息（包含ID和名称）
    const fieldInfos = config.displayFields.map(fieldId => {
      const field = fields.find(f => f.id === fieldId);
      return {
        fieldId: fieldId,
        fieldName: field ? field.name : fieldId
      };
    });

    // 获取表单名称
    const selectedForm = forms.find(f => f.id === config.formId);

    // 构建操作栏配置（当用户选择显示操作列时）
    const actionColumn = config.showActionColumn ? {
      enabled: true,
      title: config.actionColumnTitle || '操作',
      width: config.actionColumnWidth || 150,
      buttons: config.actionButtons || {
        edit: { enabled: false, text: '修改', color: '#3b82f6' },
        delete: { enabled: false, text: '删除', color: '#ef4444', confirmText: '确定要删除这条记录吗？' },
        top: { enabled: false, textOn: '取消置顶', textOff: '置顶', color: '#f59e0b', field: '' }
      }
    } : null;

    const saveData = {
      formConfig: {
        ...config,
        formName: selectedForm ? selectedForm.name : '',
        fieldInfos: fieldInfos,  // 保存字段ID和名称的映射
        actionColumn: actionColumn,  // 使用用户配置的操作栏
        sourceFormId: selectedForm?.structure?.sourceFormId || null
      }
    };

    console.log('保存表单配置:', JSON.stringify(saveData, null, 2));
    console.log('字段列表:', fields);
    console.log('选中的字段ID:', config.displayFields);
    console.log('构建的fieldInfos:', fieldInfos);
    console.log('构建的actionColumn:', actionColumn);

    onSave(saveData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-[700px] max-h-[90vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-xl">📋</span>
            <h2 className="text-lg font-semibold text-gray-800">配置表单显示</h2>
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
          {loading ? (
            <div className="text-center text-gray-500 py-8">加载中...</div>
          ) : (
            <div className="space-y-6">
              {/* 数据源配置 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">📊 数据源</h3>
                
                {/* 选择表单 */}
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">选择表单</label>
                  <select
                    value={config.formId}
                    onChange={(e) => {
                      updateConfig('formId', e.target.value);
                      updateConfig('displayFields', []);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  >
                    <option value="">-- 请选择表单 --</option>
                    {forms.map(form => (
                      <option key={form.id} value={form.id}>
                        {form.name} ({form.id})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 选择显示字段 */}
                {config.formId && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm text-gray-600">选择显示列</label>
                      <button
                        onClick={toggleAllFields}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {config.displayFields.length === fields.length ? '取消全选' : '全选'}
                      </button>
                    </div>
                    <div className="border border-gray-200 rounded p-2 max-h-32 overflow-y-auto">
                      {fields.length === 0 ? (
                        <div className="text-gray-400 text-sm text-center py-2">
                          该表单暂无字段
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-1">
                          {fields.map(field => (
                            <label key={field.id} className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded">
                              <input
                                type="checkbox"
                                checked={config.displayFields.includes(field.id)}
                                onChange={() => toggleField(field.id)}
                                className="w-4 h-4"
                              />
                              <span className="truncate" title={field.name}>
                                {field.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      已选 {config.displayFields.length} / {fields.length} 个字段
                    </div>
                  </div>
                )}

                {/* 列宽配置 - 仅当选择了字段时显示 */}
                {config.displayFields.length > 0 && (
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">列宽设置 (px)</label>
                    <div className="border border-gray-200 rounded p-2 max-h-40 overflow-y-auto">
                      <div className="space-y-2">
                        {config.displayFields.map(fieldId => {
                          const field = fields.find(f => f.id === fieldId);
                          return (
                            <div key={fieldId} className="flex items-center justify-between">
                              <span className="text-sm text-gray-700 truncate flex-1 mr-2" title={field?.name || fieldId}>
                                {field?.name || fieldId}
                              </span>
                              <input
                                type="number"
                                value={config.columnWidths[fieldId] || ''}
                                onChange={(e) => {
                                  const newWidths = { ...config.columnWidths };
                                  if (e.target.value) {
                                    newWidths[fieldId] = parseInt(e.target.value);
                                  } else {
                                    delete newWidths[fieldId];
                                  }
                                  updateConfig('columnWidths', newWidths);
                                }}
                                placeholder="自动"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                                min="50"
                                max="500"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      留空表示自动宽度，建议范围 50-500px
                    </div>
                  </div>
                )}

                {/* 显示顺序配置 */}
                {config.formId && (
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">显示顺序</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sortOrder"
                          value="desc"
                          checked={config.sortOrder === 'desc'}
                          onChange={(e) => updateConfig('sortOrder', e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">倒序（最新在前）</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sortOrder"
                          value="asc"
                          checked={config.sortOrder === 'asc'}
                          onChange={(e) => updateConfig('sortOrder', e.target.value)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">顺序（最早在前）</span>
                      </label>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      倒序：最新录入的数据显示在最上方；顺序：按录入先后顺序显示
                    </div>
                  </div>
                )}

                {/* 操作列配置 */}
                {config.formId && (
                  <div className="mb-3 p-3 border border-orange-200 bg-orange-50 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={config.showActionColumn}
                          onChange={(e) => updateConfig('showActionColumn', e.target.checked)}
                          className="w-4 h-4 text-orange-600"
                        />
                        <span className="text-sm font-medium text-gray-700">📌 显示操作列</span>
                      </label>
                    </div>
                    
                    {config.showActionColumn && (
                      <div className="space-y-3 mt-3">
                        {/* 操作列标题和宽度 */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">列标题</label>
                            <input
                              type="text"
                              value={config.actionColumnTitle}
                              onChange={(e) => updateConfig('actionColumnTitle', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">列宽 (px)</label>
                            <input
                              type="number"
                              value={config.actionColumnWidth}
                              onChange={(e) => updateConfig('actionColumnWidth', parseInt(e.target.value) || 150)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              min="80"
                              max="300"
                            />
                          </div>
                        </div>
                        
                        {/* 操作按钮配置 */}
                        <div className="space-y-2">
                          <label className="block text-xs text-gray-600">操作按钮</label>
                          
                          {/* 修改按钮 */}
                          <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                            <input
                              type="checkbox"
                              checked={config.actionButtons.edit.enabled}
                              onChange={(e) => updateConfig('actionButtons', {
                                ...config.actionButtons,
                                edit: { ...config.actionButtons.edit, enabled: e.target.checked }
                              })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">✏️ 修改</span>
                            {config.actionButtons.edit.enabled && (
                              <>
                                <input
                                  type="text"
                                  value={config.actionButtons.edit.text}
                                  onChange={(e) => updateConfig('actionButtons', {
                                    ...config.actionButtons,
                                    edit: { ...config.actionButtons.edit, text: e.target.value }
                                  })}
                                  className="w-16 px-2 py-0.5 border border-gray-300 rounded text-xs"
                                  placeholder="按钮文字"
                                />
                                <input
                                  type="color"
                                  value={config.actionButtons.edit.color}
                                  onChange={(e) => updateConfig('actionButtons', {
                                    ...config.actionButtons,
                                    edit: { ...config.actionButtons.edit, color: e.target.value }
                                  })}
                                  className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                                  title="按钮颜色"
                                />
                              </>
                            )}
                          </div>
                          
                          {/* 删除按钮 */}
                          <div className="flex items-center space-x-2 p-2 bg-white rounded border border-gray-200">
                            <input
                              type="checkbox"
                              checked={config.actionButtons.delete.enabled}
                              onChange={(e) => updateConfig('actionButtons', {
                                ...config.actionButtons,
                                delete: { ...config.actionButtons.delete, enabled: e.target.checked }
                              })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">🗑️ 删除</span>
                            {config.actionButtons.delete.enabled && (
                              <>
                                <input
                                  type="text"
                                  value={config.actionButtons.delete.text}
                                  onChange={(e) => updateConfig('actionButtons', {
                                    ...config.actionButtons,
                                    delete: { ...config.actionButtons.delete, text: e.target.value }
                                  })}
                                  className="w-16 px-2 py-0.5 border border-gray-300 rounded text-xs"
                                  placeholder="按钮文字"
                                />
                                <input
                                  type="color"
                                  value={config.actionButtons.delete.color}
                                  onChange={(e) => updateConfig('actionButtons', {
                                    ...config.actionButtons,
                                    delete: { ...config.actionButtons.delete, color: e.target.value }
                                  })}
                                  className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                                  title="按钮颜色"
                                />
                              </>
                            )}
                          </div>
                          
                          {/* 置顶按钮 */}
                          <div className="flex flex-wrap items-center gap-2 p-2 bg-white rounded border border-gray-200">
                            <input
                              type="checkbox"
                              checked={config.actionButtons.top.enabled}
                              onChange={(e) => updateConfig('actionButtons', {
                                ...config.actionButtons,
                                top: { ...config.actionButtons.top, enabled: e.target.checked }
                              })}
                              className="w-4 h-4"
                            />
                            <span className="text-sm">📌 置顶</span>
                            {config.actionButtons.top.enabled && (
                              <>
                                <select
                                  value={config.actionButtons.top.field}
                                  onChange={(e) => updateConfig('actionButtons', {
                                    ...config.actionButtons,
                                    top: { ...config.actionButtons.top, field: e.target.value }
                                  })}
                                  className="px-2 py-0.5 border border-gray-300 rounded text-xs"
                                >
                                  <option value="">选择置顶字段</option>
                                  {fields.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  value={config.actionButtons.top.textOff}
                                  onChange={(e) => updateConfig('actionButtons', {
                                    ...config.actionButtons,
                                    top: { ...config.actionButtons.top, textOff: e.target.value }
                                  })}
                                  className="w-14 px-2 py-0.5 border border-gray-300 rounded text-xs"
                                  placeholder="置顶"
                                  title="未置顶时显示"
                                />
                                <input
                                  type="text"
                                  value={config.actionButtons.top.textOn}
                                  onChange={(e) => updateConfig('actionButtons', {
                                    ...config.actionButtons,
                                    top: { ...config.actionButtons.top, textOn: e.target.value }
                                  })}
                                  className="w-20 px-2 py-0.5 border border-gray-300 rounded text-xs"
                                  placeholder="取消置顶"
                                  title="已置顶时显示"
                                />
                                <input
                                  type="color"
                                  value={config.actionButtons.top.color}
                                  onChange={(e) => updateConfig('actionButtons', {
                                    ...config.actionButtons,
                                    top: { ...config.actionButtons.top, color: e.target.value }
                                  })}
                                  className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                                  title="按钮颜色"
                                />
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          操作按钮将显示在表格最后一列，点击可对该行数据进行操作
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 数据量配置 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">总记录数</label>
                    <input
                      type="number"
                      value={config.totalRecords}
                      onChange={(e) => updateConfig('totalRecords', e.target.value)}
                      placeholder="留空显示全部"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">每页显示</label>
                    <input
                      type="number"
                      value={config.pageSize}
                      onChange={(e) => updateConfig('pageSize', e.target.value)}
                      placeholder="留空不分页"
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 表头样式 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">🎨 表头样式</h3>
                <div className="grid grid-cols-4 gap-4 mb-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">背景色</label>
                    <input
                      type="color"
                      value={config.headerBgColor}
                      onChange={(e) => updateConfig('headerBgColor', e.target.value)}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">文字颜色</label>
                    <input
                      type="color"
                      value={config.headerTextColor}
                      onChange={(e) => updateConfig('headerTextColor', e.target.value)}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">字号(px)</label>
                    <input
                      type="number"
                      value={config.headerFontSize || 13}
                      onChange={(e) => updateConfig('headerFontSize', parseInt(e.target.value) || 13)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">字体</label>
                    <select
                      value={config.headerFontFamily || 'Arial'}
                      onChange={(e) => updateConfig('headerFontFamily', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="Arial">Arial</option>
                      <option value="微软雅黑">微软雅黑</option>
                      <option value="宋体">宋体</option>
                      <option value="黑体">黑体</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">行高(px)</label>
                  <input
                    type="number"
                    value={config.headerHeight}
                    onChange={(e) => updateConfig('headerHeight', parseInt(e.target.value) || 40)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>

              {/* 表身样式 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">📊 表身样式</h3>
                <div className="space-y-4">
                  {/* 基础样式 */}
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">行高(px)</label>
                      <input
                        type="number"
                        value={config.rowHeight}
                        onChange={(e) => updateConfig('rowHeight', parseInt(e.target.value) || 36)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">字体</label>
                      <select
                        value={config.cellFontFamily}
                        onChange={(e) => updateConfig('cellFontFamily', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="Arial">Arial</option>
                        <option value="微软雅黑">微软雅黑</option>
                        <option value="宋体">宋体</option>
                        <option value="黑体">黑体</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">字号(px)</label>
                      <input
                        type="number"
                        value={config.cellFontSize}
                        onChange={(e) => updateConfig('cellFontSize', parseInt(e.target.value) || 12)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">文字颜色</label>
                      <input
                        type="color"
                        value={config.cellColor}
                        onChange={(e) => updateConfig('cellColor', e.target.value)}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 背景色 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">背景色</label>
                    <div className="flex space-x-2">
                      <input
                        type="color"
                        value={config.rowBgColor}
                        onChange={(e) => updateConfig('rowBgColor', e.target.value)}
                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="color"
                        value={config.rowAltBgColor}
                        onChange={(e) => updateConfig('rowAltBgColor', e.target.value)}
                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                        title="交替行背景色"
                      />
                      <span className="text-xs text-gray-400 self-center">普通行 / 交替行</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 单元格样式 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">📏 单元格样式</h3>
                <div className="space-y-4">
                  {/* 对齐方式 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">水平对齐</label>
                      <select
                        value={config.cellTextAlign}
                        onChange={(e) => updateConfig('cellTextAlign', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="left">左对齐</option>
                        <option value="center">居中</option>
                        <option value="right">右对齐</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">垂直对齐</label>
                      <select
                        value={config.cellVerticalAlign}
                        onChange={(e) => updateConfig('cellVerticalAlign', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="top">顶部</option>
                        <option value="middle">居中</option>
                        <option value="bottom">底部</option>
                      </select>
                    </div>
                  </div>

                  {/* 内边距 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">内边距(px)</label>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">上</label>
                        <input
                          type="number"
                          value={config.cellPaddingTop}
                          onChange={(e) => updateConfig('cellPaddingTop', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">右</label>
                        <input
                          type="number"
                          value={config.cellPaddingRight}
                          onChange={(e) => updateConfig('cellPaddingRight', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">下</label>
                        <input
                          type="number"
                          value={config.cellPaddingBottom}
                          onChange={(e) => updateConfig('cellPaddingBottom', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">左</label>
                        <input
                          type="number"
                          value={config.cellPaddingLeft}
                          onChange={(e) => updateConfig('cellPaddingLeft', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 换行方式 */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">换行方式</label>
                    <select
                      value={config.cellWordWrap}
                      onChange={(e) => updateConfig('cellWordWrap', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="nowrap">不换行</option>
                      <option value="wrap">自动换行</option>
                      <option value="break-word">单词换行</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 表底样式 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700">📊 表底样式</h3>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.footerEnabled}
                      onChange={(e) => updateConfig('footerEnabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-600">启用表底</span>
                  </label>
                </div>
                {config.footerEnabled && (
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">高度(px)</label>
                      <input
                        type="number"
                        value={config.footerHeight}
                        onChange={(e) => updateConfig('footerHeight', parseInt(e.target.value) || 36)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">背景色</label>
                      <input
                        type="color"
                        value={config.footerBgColor}
                        onChange={(e) => updateConfig('footerBgColor', e.target.value)}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">文字颜色</label>
                      <input
                        type="color"
                        value={config.footerTextColor}
                        onChange={(e) => updateConfig('footerTextColor', e.target.value)}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">字号(px)</label>
                      <input
                        type="number"
                        value={config.footerFontSize || 12}
                        onChange={(e) => updateConfig('footerFontSize', parseInt(e.target.value) || 12)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">字体</label>
                      <select
                        value={config.footerFontFamily || 'Arial'}
                        onChange={(e) => updateConfig('footerFontFamily', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      >
                        <option value="Arial">Arial</option>
                        <option value="微软雅黑">微软雅黑</option>
                        <option value="宋体">宋体</option>
                        <option value="黑体">黑体</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 边框样式 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3">📐 边框样式</h3>
                <div className="space-y-4">
                  {/* 外边框 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">外边框</h4>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.showOuterBorder}
                          onChange={(e) => updateConfig('showOuterBorder', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-xs text-gray-600">显示</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">颜色</label>
                        <input
                          type="color"
                          value={config.borderColor}
                          onChange={(e) => updateConfig('borderColor', e.target.value)}
                          className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">宽度(px)</label>
                        <input
                        type="number"
                        value={config.borderWidth}
                        onChange={(e) => updateConfig('borderWidth', parseInt(e.target.value) || 1)}
                        min="0"
                        className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                      />
                      </div>
                    </div>
                  </div>

                  {/* 内边框 */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-700">内部边框</h4>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.showInnerBorder}
                          onChange={(e) => updateConfig('showInnerBorder', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-xs text-gray-600">显示</span>
                      </label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {/* 横边 */}
                      <div className="border border-gray-200 rounded p-3">
                        <h5 className="text-xs font-medium text-gray-600 mb-2">横边（行）</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">颜色</label>
                            <input
                              type="color"
                              value={config.innerHorizontalBorderColor}
                              onChange={(e) => updateConfig('innerHorizontalBorderColor', e.target.value)}
                              className="w-full h-7 border border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">宽度(px)</label>
                            <input
                              type="number"
                              value={config.innerHorizontalBorderWidth}
                              onChange={(e) => updateConfig('innerHorizontalBorderWidth', parseInt(e.target.value) || 1)}
                              min="0"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                          </div>
                        </div>
                      </div>
                      {/* 竖边 */}
                      <div className="border border-gray-200 rounded p-3">
                        <h5 className="text-xs font-medium text-gray-600 mb-2">竖边（列）</h5>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">颜色</label>
                            <input
                              type="color"
                              value={config.innerVerticalBorderColor}
                              onChange={(e) => updateConfig('innerVerticalBorderColor', e.target.value)}
                              className="w-full h-7 border border-gray-300 rounded cursor-pointer"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">宽度(px)</label>
                            <input
                              type="number"
                              value={config.innerVerticalBorderWidth}
                              onChange={(e) => updateConfig('innerVerticalBorderWidth', parseInt(e.target.value) || 1)}
                              min="0"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 特殊单元格配置 */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-700">🎯 特殊单元格（合并）</h3>
                  <button
                    onClick={addSpecialCell}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    + 添加
                  </button>
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  特殊单元格可以合并多个单元格并设置独立样式。在设计页面中，鼠标左键按住拖动可以定义合并区域。
                </div>
                {config.specialCells.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-4 border border-dashed border-gray-300 rounded">
                    暂无特殊单元格
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {config.specialCells.map((specialCell, index) => (
                      <div key={specialCell.id || index} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200">
                        <div className="flex-1 text-sm">
                          <span className="font-medium text-gray-700">
                            行{specialCell.startRow}-{specialCell.endRow} · 列{specialCell.startCol}-{specialCell.endCol}
                          </span>
                          {specialCell.bgColor && (
                            <span
                              className="ml-2 inline-block w-4 h-4 rounded border"
                              style={{ backgroundColor: specialCell.bgColor }}
                            />
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => editSpecialCell(specialCell)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => deleteSpecialCell(specialCell.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 特殊单元格编辑弹窗 */}
        {showSpecialCellModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[110]">
            <div className="bg-white rounded-lg shadow-xl w-[500px] max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800">
                  {editingSpecialCell?.id ? '编辑特殊单元格' : '添加特殊单元格'}
                </h2>
                <button
                  onClick={() => {
                    setShowSpecialCellModal(false);
                    setEditingSpecialCell(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* 合并范围 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">起始行</label>
                    <input
                      type="number"
                      value={editingSpecialCell?.startRow || 0}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, startRow: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">结束行</label>
                    <input
                      type="number"
                      value={editingSpecialCell?.endRow || 0}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, endRow: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">起始列</label>
                    <input
                      type="number"
                      value={editingSpecialCell?.startCol || 0}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, startCol: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">结束列</label>
                    <input
                      type="number"
                      value={editingSpecialCell?.endCol || 0}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, endCol: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      min="0"
                    />
                  </div>
                </div>

                {/* 样式配置 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">字号(px)</label>
                    <input
                      type="number"
                      value={editingSpecialCell?.fontSize || 12}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, fontSize: parseInt(e.target.value) || 12 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">字体</label>
                    <select
                      value={editingSpecialCell?.fontFamily || 'Arial'}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, fontFamily: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="Arial">Arial</option>
                      <option value="微软雅黑">微软雅黑</option>
                      <option value="宋体">宋体</option>
                      <option value="黑体">黑体</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">文字颜色</label>
                    <input
                      type="color"
                      value={editingSpecialCell?.color || '#374151'}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, color: e.target.value })}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">背景色（留空则透明）</label>
                    <input
                      type="color"
                      value={editingSpecialCell?.bgColor || '#ffffff'}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, bgColor: e.target.value })}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">水平对齐</label>
                    <select
                      value={editingSpecialCell?.textAlign || 'left'}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, textAlign: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="left">左对齐</option>
                      <option value="center">居中</option>
                      <option value="right">右对齐</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">垂直对齐</label>
                    <select
                      value={editingSpecialCell?.verticalAlign || 'middle'}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, verticalAlign: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    >
                      <option value="top">顶部</option>
                      <option value="middle">居中</option>
                      <option value="bottom">底部</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">上边距</label>
                    <input
                      type="number"
                      value={editingSpecialCell?.paddingTop || 4}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, paddingTop: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">右边距</label>
                    <input
                      type="number"
                      value={editingSpecialCell?.paddingRight || 8}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, paddingRight: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">下边距</label>
                    <input
                      type="number"
                      value={editingSpecialCell?.paddingBottom || 4}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, paddingBottom: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">左边距</label>
                    <input
                      type="number"
                      value={editingSpecialCell?.paddingLeft || 8}
                      onChange={(e) => setEditingSpecialCell({ ...editingSpecialCell, paddingLeft: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50">
                <button
                  onClick={() => {
                    setShowSpecialCellModal(false);
                    setEditingSpecialCell(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
                >
                  取消
                </button>
                <button
                  onClick={() => saveSpecialCell(editingSpecialCell)}
                  className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

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
            disabled={!config.formId || config.displayFields.length === 0}
            className={`px-6 py-2 rounded ${
              config.formId && config.displayFields.length > 0
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

window.FormDisplayConfig = FormDisplayConfig;
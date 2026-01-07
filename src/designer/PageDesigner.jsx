// DND2 页面设计器 - 主组件
// 原文件: src/designer/PageDesigner.jsx (1,739行)
// Phase 5 拆分: 文件 5/5 (主组件)
//
// 依赖的拆分模块:
// - CloseConfirmModal.jsx - 关闭确认弹窗组件
// - useDesignerState.js - 状态管理Hook (可选增强)
// - designerUtils.js - 工具函数 (可选增强)
// - useDragResize.js - 拖拽缩放Hook (可选增强)
//
// 加载顺序: designerUtils.js -> useDesignerState.js -> useDragResize.js -> CloseConfirmModal.jsx -> PageDesigner.jsx

function PageDesigner({ projectId, roleId, page, onClose, onSave }) {
  // ===== 状态管理 =====
  // 兼容旧数据结构：优先从design中读取，否则从page直接读取
  const [blocks, setBlocks] = React.useState(page.design?.blocks || page.blocks || []);
  const [selectedBlockId, setSelectedBlockId] = React.useState(null);
  const [canvasType, setCanvasType] = React.useState(page.design?.canvasType || page.canvasType || 'PC');
  const [scale, setScale] = React.useState(100);
  const [panelPosition, setPanelPosition] = React.useState({ x: window.innerWidth - 340, y: 60 });
  const [showPanel, setShowPanel] = React.useState(false);
  const [expandedBlocks, setExpandedBlocks] = React.useState({});
  const [showCloseModal, setShowCloseModal] = React.useState(false);
  const [closeProgress, setCloseProgress] = React.useState(page.designProgress || 0);
  const [hasChanges, setHasChanges] = React.useState(false);

  // ===== 画布装饰层（图形编辑器绘制的内容）=====
  const [canvasDecorations, setCanvasDecorations] = React.useState(page.design?.canvasDecorations || []);

  // ===== Icon实例状态 =====
  const [iconInstances, setIconInstances] = React.useState(page.design?.iconInstances || []);
  const [selectedIconId, setSelectedIconId] = React.useState(null);
  const [projectIcons, setProjectIcons] = React.useState([]);  // 项目级别的Icon定义
  const [showIconManager, setShowIconManager] = React.useState(false);
  const [allPages, setAllPages] = React.useState([]);  // 所有页面（用于Icon设置）

  // ===== 面板收起/展开状态 =====
  const [leftPanelCollapsed, setLeftPanelCollapsed] = React.useState(false);

  // ===== 区块模板状态 =====
  const [showBlockTemplateSelector, setShowBlockTemplateSelector] = React.useState(false);
  const [showSaveBlockTemplate, setShowSaveBlockTemplate] = React.useState(false);
  const [templateSourceBlock, setTemplateSourceBlock] = React.useState(null);

  // ===== 表单和字段数据 =====
  const [forms, setForms] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [dataFlows, setDataFlows] = React.useState([]);

  // ===== 区域数据 =====
  const [areas, setAreas] = React.useState(page.areas || []);
  const [showAreas, setShowAreas] = React.useState(false);
  const [hideContentInAreas, setHideContentInAreas] = React.useState(false);
  const [currentAreaId, setCurrentAreaId] = React.useState(null);
  const [showAreaList, setShowAreaList] = React.useState(false);  // 是否显示区域列表
  const [showBlockList, setShowBlockList] = React.useState(false);  // 是否显示区块列表
  const [showAddAreaModal, setShowAddAreaModal] = React.useState(false);
  const [showEditAreaModal, setShowEditAreaModal] = React.useState(false);
  const [editingArea, setEditingArea] = React.useState(null);

  // ===== 区域拖拽状态 =====
  const [areaDragState, setAreaDragState] = React.useState({
    isDragging: false,
    areaId: null,
    startX: 0,
    startY: 0,
    startAreaX: 0,
    startAreaY: 0
  });

  const [areaResizeState, setAreaResizeState] = React.useState({
    isResizing: false,
    areaId: null,
    direction: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startAreaX: 0,
    startAreaY: 0
  });

  // ===== 画布平移状态 =====
  const [canvasPanState, setCanvasPanState] = React.useState({
    isPanning: false,
    startX: 0,
    startY: 0,
    panX: 0,
    panY: 0
  });

  // 加载表单、字段和流程数据
  React.useEffect(() => {
    const loadFormsAndFields = async () => {
      if (!projectId || !window.dndDB) return;
      try {
        // 使用正确的API方法名
        const formsData = await window.dndDB.getFormsByProjectId(projectId);
        const fieldsData = await window.dndDB.getFieldsByProjectId(projectId);
        const flowsData = await window.dndDB.getDataFlowsByProjectId(projectId);
        console.log('加载表单数据:', formsData?.length, '个');
        console.log('加载字段数据:', fieldsData?.length, '个');
        console.log('加载流程数据:', flowsData?.length, '个');
        setForms(formsData || []);
        setFields(fieldsData || []);
        setDataFlows(flowsData || []);
      } catch (error) {
        console.error('加载表单和字段失败:', error);
      }
    };
    loadFormsAndFields();
  }, [projectId, roleId]);

  // 加载项目Icons和所有页面
  React.useEffect(() => {
    const loadProjectData = async () => {
      if (!projectId || !window.dndDB) return;
      try {
        // 加载项目数据获取icons
        const project = await window.dndDB.getProjectById(projectId);
        if (project) {
          setProjectIcons(project.icons || []);
        }
        // 加载所有页面
        const pages = await window.dndDB.getPagesByRoleId(projectId, roleId);
        setAllPages(pages || []);
        console.log('加载项目Icons:', project?.icons?.length || 0, '个');
        console.log('加载页面:', pages?.length || 0, '个');
      } catch (error) {
        console.error('加载项目数据失败:', error);
      }
    };
    loadProjectData();
  }, [projectId, roleId]);

  // ===== 富文本编辑器状态 =====
  const [showEditor, setShowEditor] = React.useState(false);
  const [editorContent, setEditorContent] = React.useState('');
  const [editorTitle, setEditorTitle] = React.useState('富文本编辑器');
  const [editorTargetBlockId, setEditorTargetBlockId] = React.useState(null);

  // ===== 图形编辑器状态 =====
  const [showGraphicEditor, setShowGraphicEditor] = React.useState(false);
  const [graphicEditorTarget, setGraphicEditorTarget] = React.useState(null); // null=整个画布, blockId=指定区块

  // ===== 媒体预览状态 =====
  const [mediaPreview, setMediaPreview] = React.useState({ show: false, type: null, url: null, name: null });

  // ===== 表单配置弹窗状态 =====
  const [formConfigModal, setFormConfigModal] = React.useState({ show: false, blockId: null });

  // ===== 交互配置弹窗状态 =====
  const [interactionConfigModal, setInteractionConfigModal] = React.useState({ show: false, blockId: null });

  // ===== 数据录入对话框状态 =====
  const [dataEntryDialog, setDataEntryDialog] = React.useState({ show: false, formId: null, formName: null });

  // ===== 数据编辑对话框状态 =====
  const [dataEditDialog, setDataEditDialog] = React.useState({ show: false, formId: null, formName: null, recordData: null });

  // ===== 按钮配置弹窗状态 =====
  const [buttonConfigModal, setButtonConfigModal] = React.useState({ show: false, blockId: null });

  // 监听媒体预览事件
  React.useEffect(() => {
    const handlePreviewImage = (e) => {
      setMediaPreview({ show: true, type: 'image', url: e.detail.url, name: e.detail.name });
    };
    const handlePreviewVideo = (e) => {
      setMediaPreview({ show: true, type: 'video', url: e.detail.url, name: e.detail.name });
    };
    
    window.addEventListener('previewImage', handlePreviewImage);
    window.addEventListener('previewVideo', handlePreviewVideo);
    
    return () => {
      window.removeEventListener('previewImage', handlePreviewImage);
      window.removeEventListener('previewVideo', handlePreviewVideo);
    };
  }, []);

  // 监听表单配置事件
  React.useEffect(() => {
    const handleOpenFormConfig = (e) => {
      setFormConfigModal({ show: true, blockId: e.detail.blockId });
    };
    
    window.addEventListener('openFormConfig', handleOpenFormConfig);
    
    return () => {
      window.removeEventListener('openFormConfig', handleOpenFormConfig);
    };
  }, []);

  // 监听交互配置事件
  React.useEffect(() => {
    const handleLoadFormsForBlock = (e) => {
      setInteractionConfigModal({ show: true, blockId: e.detail.blockId });
    };
    
    window.addEventListener('loadFormsForBlock', handleLoadFormsForBlock);
    
    return () => {
      window.removeEventListener('loadFormsForBlock', handleLoadFormsForBlock);
    };
  }, []);

  // 监听数据录入事件
  React.useEffect(() => {
    const handleOpenDataEntry = (e) => {
      setDataEntryDialog({ 
        show: true, 
        formId: e.detail.formId,
        formName: e.detail.formName
      });
    };
    
    window.addEventListener('openDataEntry', handleOpenDataEntry);
    
    return () => {
      window.removeEventListener('openDataEntry', handleOpenDataEntry);
    };
  }, []);

  // 监听按钮配置事件
  React.useEffect(() => {
    const handleOpenButtonConfig = (e) => {
      setButtonConfigModal({ show: true, blockId: e.detail.blockId });
    };
    
    window.addEventListener('openButtonConfig', handleOpenButtonConfig);
    
    return () => {
      window.removeEventListener('openButtonConfig', handleOpenButtonConfig);
    };
  }, []);

  // 监听编辑记录事件
  React.useEffect(() => {
    const handleEditFormRecord = (e) => {
      console.log('编辑记录事件:', e.detail);
      setDataEditDialog({
        show: true,
        formId: e.detail.formId,
        formName: e.detail.formName,
        recordData: e.detail.record
      });
    };
    
    window.addEventListener('editFormRecord', handleEditFormRecord);
    
    return () => {
      window.removeEventListener('editFormRecord', handleEditFormRecord);
    };
  }, []);

  // 监听删除记录事件
  React.useEffect(() => {
    const handleDeleteFormRecord = async (e) => {
      console.log('删除记录事件:', e.detail);
      const { formId, record, projectId: pid } = e.detail;
      
      try {
        // 获取表单结构以找到主键
        const forms = await window.dndDB.getFormsByProjectId(pid || projectId);
        const form = forms.find(f => f.id === formId);
        if (!form || !form.structure?.primaryKey) {
          alert('无法删除：表单结构错误');
          return;
        }
        
        const pkValue = record[form.structure.primaryKey];
        await window.dndDB.deleteFormData(pid || projectId, formId, pkValue);
        alert('删除成功！');
        
        // 触发刷新
        window.dispatchEvent(new CustomEvent('formDataChanged', { detail: { formId } }));
      } catch (error) {
        console.error('删除失败:', error);
        alert('删除失败: ' + error.message);
      }
    };
    
    window.addEventListener('deleteFormRecord', handleDeleteFormRecord);
    
    return () => {
      window.removeEventListener('deleteFormRecord', handleDeleteFormRecord);
    };
  }, [projectId]);

  // 监听更新记录事件（用于置顶等状态切换）
  React.useEffect(() => {
    const handleUpdateFormRecord = async (e) => {
      console.log('更新记录事件:', e.detail);
      const { formId, record, updates, projectId: pid } = e.detail;
      
      try {
        // 获取表单结构以找到主键
        const forms = await window.dndDB.getFormsByProjectId(pid || projectId);
        const form = forms.find(f => f.id === formId);
        if (!form || !form.structure?.primaryKey) {
          alert('无法更新：表单结构错误');
          return;
        }
        
        const pkValue = record[form.structure.primaryKey];
        const newData = { ...record, ...updates };
        await window.dndDB.updateFormData(pid || projectId, formId, pkValue, newData);
        
        // 触发刷新
        window.dispatchEvent(new CustomEvent('formDataChanged', { detail: { formId } }));
      } catch (error) {
        console.error('更新失败:', error);
        alert('更新失败: ' + error.message);
      }
    };
    
    window.addEventListener('updateFormRecord', handleUpdateFormRecord);
    
    return () => {
      window.removeEventListener('updateFormRecord', handleUpdateFormRecord);
    };
  }, [projectId]);

  // 保存表单配置
  const handleSaveFormConfig = (updates) => {
    if (formConfigModal.blockId) {
      const currentBlocks = blocksRef.current;
      const newBlocks = currentBlocks.map(b => 
        b.id === formConfigModal.blockId 
          ? { ...b, ...updates }
          : b
      );
      setBlocks(newBlocks);
      setHasChanges(true);
      historyRef.current.save(newBlocks);
      updateHistoryState();
    }
  };

  // 保存交互配置
  const handleSaveInteractionConfig = (updates) => {
    if (interactionConfigModal.blockId) {
      const currentBlocks = blocksRef.current;
      const newBlocks = currentBlocks.map(b => 
        b.id === interactionConfigModal.blockId 
          ? { ...b, ...updates }
          : b
      );
      setBlocks(newBlocks);
      setHasChanges(true);
      historyRef.current.save(newBlocks);
      updateHistoryState();
    }
  };

  // 保存按钮配置
  const handleSaveButtonConfig = (updates) => {
    if (buttonConfigModal.blockId) {
      const currentBlocks = blocksRef.current;
      const newBlocks = currentBlocks.map(b => 
        b.id === buttonConfigModal.blockId 
          ? { ...b, ...updates }
          : b
      );
      setBlocks(newBlocks);
      setHasChanges(true);
      historyRef.current.save(newBlocks);
      updateHistoryState();
    }
  };

  // 打开编辑器
  const handleOpenEditor = () => {
    console.log('打开编辑器, selectedBlockId:', selectedBlockId);
    console.log('blocks:', blocks);
    
    // 必须选中一个显示类型的区块才能打开编辑器
    const selectedBlock = blocks.find(b => b.id === selectedBlockId);
    console.log('找到的区块:', selectedBlock);
    
    if (!selectedBlock) {
      alert('请先选中一个区块（单击画布上的区块）');
      return;
    }
    if (selectedBlock.type !== '显示') {
      alert('只有"显示"类型的区块可以使用富文本编辑器');
      return;
    }
    
    // 加载区块现有内容
    const currentContent = selectedBlock.content?.html || '';
    setEditorContent(currentContent);
    setEditorTitle(`编辑区块 ${selectedBlock.id} 的内容`);
    setEditorTargetBlockId(selectedBlock.id);
    setShowEditor(true);
  };

  // 打开图形编辑器
  const handleOpenGraphicEditor = () => {
    console.log('打开图形编辑器, selectedBlockId:', selectedBlockId);
    
    // 如果选中了区块，以该区块为画布；否则以整个设计画布为画布
    const selectedBlock = selectedBlockId ? blocks.find(b => b.id === selectedBlockId) : null;
    
    if (selectedBlock) {
      // 检查是否是适合绘图的区块类型
      if (selectedBlock.type !== '显示') {
        alert('图形编辑器只能用于"显示"类型的区块，或者不选中任何区块直接在画布上绘制装饰');
        return;
      }
      setGraphicEditorTarget(selectedBlock);
    } else {
      // 以整个画布为目标
      setGraphicEditorTarget(null);
    }
    
    setShowGraphicEditor(true);
  };

  // 保存图形编辑器内容
  const handleGraphicEditorSave = (imageData, elements) => {
    console.log('图形编辑器保存:', '元素数量:', elements?.length);
    
    if (graphicEditorTarget) {
      // 选中了区块：把绘制内容保存到该区块的graphicElements中
      updateBlockWithHistory(graphicEditorTarget.id, {
        graphicElements: elements
      });
      setHasChanges(true);
    } else {
      // 没有选中区块：保存为画布装饰层
      if (elements && elements.length > 0) {
        setCanvasDecorations(prev => [...prev, ...elements]);
        setHasChanges(true);
      }
    }
    
    setShowGraphicEditor(false);
    setGraphicEditorTarget(null);
  };

  // 保存编辑器内容
  const handleEditorSave = (content) => {
    if (editorTargetBlockId) {
      // 保存到目标区块
      updateBlockWithHistory(editorTargetBlockId, {
        content: {
          type: 'richtext',
          html: content.html,
          text: content.text
        }
      });
    }
    setShowEditor(false);
    setEditorTargetBlockId(null);
  };

  // ===== Icon相关处理函数 =====
  
  // 生成Icon实例ID
  const generateIconInstanceId = () => `icon-inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 更新项目Icons
  const handleIconsChange = async (newIcons) => {
    setProjectIcons(newIcons);
    // 保存到项目
    try {
      const project = await window.dndDB.getProjectById(projectId);
      if (project) {
        await window.dndDB.updateProject({
          ...project,
          icons: newIcons
        });
        console.log('项目Icons已保存:', newIcons.length, '个');
      }
    } catch (error) {
      console.error('保存项目Icons失败:', error);
    }
  };

  // 处理Icon拖放到画布
  const handleIconDrop = (e, dropX, dropY) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      if (data.type !== 'icon') return;
      
      const icon = data.iconData;  // 使用iconData而不是icon
      const newInstance = {
        id: generateIconInstanceId(),
        iconId: icon.id,
        x: dropX,
        y: dropY,
        width: icon.size?.width || 32,
        height: icon.size?.height || 32,
        parentBlockId: null,  // 暂时先放在公共画布
        zIndex: 9999
      };
      
      setIconInstances(prev => [...prev, newInstance]);
      setSelectedIconId(newInstance.id);
      setSelectedBlockId(null);  // 取消区块选中
      setHasChanges(true);
      console.log('添加Icon实例:', newInstance);
    } catch (error) {
      console.error('处理Icon拖放失败:', error);
    }
  };

  // 选中Icon
  const handleSelectIcon = (iconId) => {
    setSelectedIconId(iconId);
    setSelectedBlockId(null);  // 取消区块选中
  };

  // Icon拖拽移动
  const [iconDragState, setIconDragState] = React.useState({ isDragging: false, iconId: null, startX: 0, startY: 0, startIconX: 0, startIconY: 0 });

  const handleIconDragStart = (e, iconId) => {
    const instance = iconInstances.find(i => i.id === iconId);
    if (!instance) return;
    setIconDragState({
      isDragging: true,
      iconId,
      startX: e.clientX,
      startY: e.clientY,
      startIconX: instance.x,
      startIconY: instance.y
    });
    setSelectedIconId(iconId);
    setSelectedBlockId(null);
  };

  // Icon缩放
  const [iconResizeState, setIconResizeState] = React.useState({ isResizing: false, iconId: null, direction: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startIconX: 0, startIconY: 0 });

  const handleIconResizeStart = (e, iconId, direction) => {
    const instance = iconInstances.find(i => i.id === iconId);
    if (!instance) return;
    setIconResizeState({
      isResizing: true,
      iconId,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: instance.width,
      startHeight: instance.height,
      startIconX: instance.x,
      startIconY: instance.y
    });
  };

  // 删除Icon实例
  const handleDeleteIcon = (iconId) => {
    setIconInstances(prev => prev.filter(i => i.id !== iconId));
    if (selectedIconId === iconId) {
      setSelectedIconId(null);
    }
    setHasChanges(true);
  };

  // Icon拖拽和缩放的鼠标事件处理
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      // Icon拖拽
      if (iconDragState.isDragging) {
        const dx = (e.clientX - iconDragState.startX) / (scale / 100);
        const dy = (e.clientY - iconDragState.startY) / (scale / 100);
        setIconInstances(prev => prev.map(inst => 
          inst.id === iconDragState.iconId 
            ? { ...inst, x: Math.max(0, iconDragState.startIconX + dx), y: Math.max(0, iconDragState.startIconY + dy) }
            : inst
        ));
      }
      // Icon缩放
      if (iconResizeState.isResizing) {
        const dx = (e.clientX - iconResizeState.startX) / (scale / 100);
        const dy = (e.clientY - iconResizeState.startY) / (scale / 100);
        const dir = iconResizeState.direction;
        
        setIconInstances(prev => prev.map(inst => {
          if (inst.id !== iconResizeState.iconId) return inst;
          let newWidth = iconResizeState.startWidth;
          let newHeight = iconResizeState.startHeight;
          let newX = iconResizeState.startIconX;
          let newY = iconResizeState.startIconY;
          
          if (dir.includes('e')) newWidth = Math.max(16, iconResizeState.startWidth + dx);
          if (dir.includes('w')) { newWidth = Math.max(16, iconResizeState.startWidth - dx); newX = iconResizeState.startIconX + dx; }
          if (dir.includes('s')) newHeight = Math.max(16, iconResizeState.startHeight + dy);
          if (dir.includes('n')) { newHeight = Math.max(16, iconResizeState.startHeight - dy); newY = iconResizeState.startIconY + dy; }
          
          return { ...inst, x: newX, y: newY, width: newWidth, height: newHeight };
        }));
      }
    };

    const handleMouseUp = () => {
      if (iconDragState.isDragging || iconResizeState.isResizing) {
        setHasChanges(true);
      }
      setIconDragState({ isDragging: false, iconId: null, startX: 0, startY: 0, startIconX: 0, startIconY: 0 });
      setIconResizeState({ isResizing: false, iconId: null, direction: null, startX: 0, startY: 0, startWidth: 0, startHeight: 0, startIconX: 0, startIconY: 0 });
    };

    if (iconDragState.isDragging || iconResizeState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [iconDragState, iconResizeState, scale]);

  // ===== 历史记录管理 =====
  const historyRef = React.useRef(new HistoryManager(50));
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  React.useEffect(() => {
    historyRef.current.save(blocks);
    updateHistoryState();
  }, []);

  const updateHistoryState = () => {
    const info = historyRef.current.getInfo();
    setCanUndo(info.canUndo);
    setCanRedo(info.canRedo);
  };

  const saveToHistory = (newBlocks) => {
    historyRef.current.save(newBlocks);
    updateHistoryState();
  };

  const handleUndo = () => {
    const prevState = historyRef.current.undo();
    if (prevState) {
      setBlocks(prevState);
      setHasChanges(true);
      updateHistoryState();
    }
  };

  const handleRedo = () => {
    const nextState = historyRef.current.redo();
    if (nextState) {
      setBlocks(nextState);
      setHasChanges(true);
      updateHistoryState();
    }
  };

  // ===== 区块操作 =====
  const generateBlockId = (areaId = null) => {
    // 获取区域编号（两位），如果没有区域则为00
    const areaNum = areaId ? areaId.substring(1).padStart(2, '0') : '00';

    // 找出该区域内最大的区块序号
    const areaBlocks = blocks.filter(b => b.areaId === areaId);
    const maxBlockNum = areaBlocks.reduce((max, block) => {
      // 区块ID格式：BAA00，其中AA是区域编号，00是区块序号
      const blockNum = parseInt(block.id.substring(3));
      return blockNum > max ? blockNum : max;
    }, 0);

    const nextBlockNum = maxBlockNum + 1;
    if (nextBlockNum > 99) {
      alert('一个区域最多支持99个区块');
      return null;
    }

    return `B${areaNum}${nextBlockNum.toString().padStart(2, '0')}`;
  };

  // 点击添加区块按钮 - 显示模板选择弹窗
  const handleAddBlock = () => {
    setShowBlockTemplateSelector(true);
  };

  // 处理区块模板选择结果
  const handleBlockTemplateSelect = async (result) => {
    setShowBlockTemplateSelector(false);

    if (result.mode === 'self') {
      // 自行设计 - 创建空白区块
      createNewBlock();
    } else if (result.mode === 'template') {
      // 采用模板
      try {
        const blockData = await window.dndDB.createBlockFromTemplate(
          projectId,
          result.templateId,
          {
            copyStyle: result.copyStyle,
            copyFunctions: result.copyFunctions,
            x: 10,
            y: 10
          }
        );

        // 生成新的区块ID
        const blockId = generateBlockId(currentAreaId);
        if (!blockId) return;
        blockData.id = blockId;
        blockData.areaId = currentAreaId;  // 关联到当前区域

        const area = currentAreaId ? areas.find(a => a.id === currentAreaId) : null;

        // 设置相对位置
        blockData.relativeX = blockData.x;
        blockData.relativeY = blockData.y;

        // 计算绝对位置
        if (area) {
          blockData.x = area.x + blockData.relativeX;
          blockData.y = area.y + blockData.relativeY;
        }

        blockData.createdAt = new Date().toISOString();

        const newBlocks = [...blocks, blockData];
        setBlocks(newBlocks);
        setSelectedBlockId(blockData.id);
        setShowPanel(true);
        setHasChanges(true);
        saveToHistory(newBlocks);
        setHasChanges(true);
        saveToHistory(newBlocks);
      } catch (error) {
        alert('应用模板失败：' + error.message);
      }
    }
  };

  // 创建空白区块
  const createNewBlock = () => {
    const blockId = generateBlockId(currentAreaId);
    if (!blockId) return;

    const area = currentAreaId ? areas.find(a => a.id === currentAreaId) : null;

    const newBlock = {
      id: blockId,
      type: '显示',
      level: 1,         // 层级：1=顶级，2=二级，3=三级...
      parentId: null,   // 父区块ID，level=1时为null
      areaId: currentAreaId,  // 关联到当前区域
      // 区块位置是相对于区域的
      relativeX: 10,
      relativeY: 10,
      width: 100,
      height: 100,
      style: {
        backgroundColor: '#ffffff',
        borderColor: '#cccccc',
        borderWidth: 1,
        borderStyle: 'solid',
        borderRadius: 0
      },
      createdAt: new Date().toISOString()
    };

    // 计算绝对位置（用于显示）
    if (area) {
      newBlock.x = area.x + newBlock.relativeX;
      newBlock.y = area.y + newBlock.relativeY;
    } else {
      newBlock.x = newBlock.relativeX;
      newBlock.y = newBlock.relativeY;
    }

    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
    setShowPanel(true);
    setHasChanges(true);
    saveToHistory(newBlocks);
  };

  // 保存区块为模板
  const handleSaveBlockAsTemplate = (block) => {
    setTemplateSourceBlock(block);
    setShowSaveBlockTemplate(true);
  };

  // 确认保存区块模板
  const handleConfirmSaveBlockTemplate = async (name, description) => {
    try {
      const block = templateSourceBlock;

      const template = {
        name,
        description,
        sourceBlockId: block.id,
        blockType: block.type,
        style: {
          x: block.x,
          y: block.y,
          width: block.width,
          height: block.height,
          style: block.style,
          contentType: block.contentType,
          sourceType: block.sourceType
        },
        children: block.children || [],
        functions: {
          dataBinding: block.dataBinding || null,
          interaction: block.interaction || null,
          buttonConfig: block.buttonConfig || null
        }
      };

      await window.dndDB.addBlockTemplate(projectId, template);
      alert('区块模板保存成功！');
      setShowSaveBlockTemplate(false);
      setTemplateSourceBlock(null);
    } catch (error) {
      alert('保存模板失败：' + error.message);
    }
  };

  // ========== 区域管理函数 ==========

  // 生成区域ID - 格式：A01, A02, ... A99
  const generateAreaId = () => {
    if (areas.length === 0) return 'A01';
    const maxNum = areas.reduce((max, area) => {
      const num = parseInt(area.id.substring(1));
      return num > max ? num : max;
    }, 0);
    const nextNum = maxNum + 1;
    if (nextNum > 99) {
      alert('最多支持99个区域');
      return null;
    }
    return `A${nextNum.toString().padStart(2, '0')}`;
  };

  // 检测两个区域是否重叠
  const isAreaOverlap = (area1, area2) => {
    return !(area1.x + area1.width <= area2.x ||
             area2.x + area2.width <= area1.x ||
             area1.y + area1.height <= area2.y ||
             area2.y + area2.height <= area1.y);
  };

  // 检测区域是否与其他区域重叠
  const isAreaOverlapping = (testArea, excludeAreaId = null) => {
    return areas.some(area =>
      area.id !== excludeAreaId && isAreaOverlap(testArea, area)
    );
  };

  // 添加区域
  const handleAddArea = () => {
    const newArea = {
      id: generateAreaId(),
      name: '',
      x: 0,
      y: 0,
      width: 300,
      height: 300,
      createdAt: new Date().toISOString()
    };
    setEditingArea(newArea);
    setShowAddAreaModal(true);
  };

  // 确认添加区域
  const confirmAddArea = () => {
    if (!editingArea.name.trim()) {
      alert('请输入区域名称');
      return;
    }
    if (editingArea.name.length > 10) {
      alert('区域名称不能超过10个汉字');
      return;
    }

    // 检测重叠
    if (isAreaOverlapping(editingArea)) {
      alert('区域不能与其他区域重叠');
      return;
    }

    const newAreas = [...areas, { ...editingArea }];
    setAreas(newAreas);
    setShowAddAreaModal(false);
    setEditingArea(null);
    setHasChanges(true);
  };

  // 编辑区域
  const handleEditArea = (areaId) => {
    const area = areas.find(a => a.id === areaId);
    if (area) {
      setEditingArea({ ...area });
      setShowEditAreaModal(true);
    }
  };

  // 确认编辑区域
  const confirmEditArea = () => {
    if (!editingArea.name.trim()) {
      alert('请输入区域名称');
      return;
    }
    if (editingArea.name.length > 10) {
      alert('区域名称不能超过10个汉字');
      return;
    }

    // 如果修改了位置或尺寸，检测重叠
    const oldArea = areas.find(a => a.id === editingArea.id);
    const positionChanged = oldArea.x !== editingArea.x || oldArea.y !== editingArea.y ||
                          oldArea.width !== editingArea.width || oldArea.height !== editingArea.height;
    if (positionChanged && isAreaOverlapping(editingArea, editingArea.id)) {
      alert('区域不能与其他区域重叠');
      return;
    }

    const newAreas = areas.map(a =>
      a.id === editingArea.id ? { ...editingArea } : a
    );
    setAreas(newAreas);
    setShowEditAreaModal(false);
    setEditingArea(null);
    setHasChanges(true);
  };

  // 删除区域
  const handleDeleteArea = (areaId) => {
    const area = areas.find(a => a.id === areaId);
    if (!area) return;

    const blockCount = blocks.filter(b => b.areaId === areaId).length;
    if (!confirm(`确定要删除区域"${area.name}"吗？\n该区域内有 ${blockCount} 个区块，删除区域将同时删除这些区块。`)) {
      return;
    }

    // 删除区域和其所属的区块
    const newAreas = areas.filter(a => a.id !== areaId);
    const newBlocks = blocks.filter(b => b.areaId !== areaId);

    setAreas(newAreas);
    setBlocks(newBlocks);
    if (selectedBlockId && !newBlocks.find(b => b.id === selectedBlockId)) {
      setSelectedBlockId(null);
      setShowPanel(false);
    }
    setHasChanges(true);

    // 如果正在设计该区域，退出设计模式
    if (currentAreaId === areaId) {
      setCurrentAreaId(null);
    }
  };

  // 进入区域设计模式
  const handleEnterAreaDesignMode = (areaId) => {
    setCurrentAreaId(areaId);
    setShowAreaList(false);  // 关闭区域列表
    setShowBlockList(true);  // 打开区块列表
  };

  // 退出区域设计模式
  const handleExitAreaDesignMode = () => {
    setCurrentAreaId(null);
  };

  // 获取当前设计的区域
  const getCurrentArea = () => {
    return areas.find(a => a.id === currentAreaId);
  };

  // 获取当前区域内的区块
  const getCurrentAreaBlocks = () => {
    if (!currentAreaId) return blocks;
    return blocks.filter(b => b.areaId === currentAreaId);
  };

  // ===== 区域拖拽和缩放处理 =====
  const handleAreaDragStart = (e, areaId) => {
    e.stopPropagation();
    const area = areas.find(a => a.id === areaId);
    if (!area) return;
    setAreaDragState({
      isDragging: true,
      areaId,
      startX: e.clientX,
      startY: e.clientY,
      startAreaX: area.x,
      startAreaY: area.y
    });
  };

  const handleAreaResizeStart = (e, areaId, direction) => {
    e.stopPropagation();
    const area = areas.find(a => a.id === areaId);
    if (!area) return;
    setAreaResizeState({
      isResizing: true,
      areaId,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: area.width,
      startHeight: area.height,
      startAreaX: area.x,
      startAreaY: area.y
    });
  };

  // 限制区块在区域内
  const constrainBlockToArea = (block, area) => {
    if (!area) return { ...block };

    // 将绝对位置转换为相对位置
    let relativeX = block.x - area.x;
    let relativeY = block.y - area.y;

    // 限制相对位置在区域边界内
    if (relativeX < 0) relativeX = 0;
    if (relativeY < 0) relativeY = 0;
    if (relativeX + block.width > area.width) relativeX = area.width - block.width;
    if (relativeY + block.height > area.height) relativeY = area.height - block.height;

    // 计算新的绝对位置
    return {
      ...block,
      x: area.x + relativeX,
      y: area.y + relativeY,
      relativeX,
      relativeY
    };
  };

  const handleDeleteBlock = (blockId) => {
    if (!confirm('确定要删除该区块吗？')) return;
    const newBlocks = blocks.filter(b => b.id !== blockId);
    setBlocks(newBlocks);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
      setShowPanel(false);
    }
    setHasChanges(true);
    saveToHistory(newBlocks);
  };

  // 为交互区块生成子区块（自行设计样式）
  const handleGenerateChildBlocks = (parentBlockId) => {
    const parentBlock = blocks.find(b => b.id === parentBlockId);
    if (!parentBlock || parentBlock.type !== '交互') return;
    
    const form = forms.find(f => f.id === parentBlock.targetFormId);
    if (!form) {
      alert('请先选择目标表单');
      return;
    }
    
    // 获取选中的字段（包括主键）
    const primaryKeyId = form.structure?.primaryKey;
    const selectedFieldIds = [primaryKeyId, ...(parentBlock.selectedFields || [])].filter(Boolean);
    
    if (selectedFieldIds.length === 0) {
      alert('没有可用的字段');
      return;
    }
    
    // 删除该父区块下已有的子区块
    let newBlocks = blocks.filter(b => b.parentId !== parentBlockId);
    
    // 计算子区块的起始位置（相对于父区块）
    const startX = 10;
    let currentY = 10;
    const rowHeight = 35;
    const promptWidth = 80;
    const inputWidth = parentBlock.width - promptWidth - 30;
    const inputHeight = 28;
    
    // 生成子区块ID
    let childIndex = 1;
    const generateChildId = () => {
      return `${parentBlockId}-C${String(childIndex++).padStart(3, '0')}`;
    };
    
    // 分离普通字段和属性字段
    const normalFields = [];
    const attributeFields = [];
    
    selectedFieldIds.forEach(fieldId => {
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        // 判断是否是属性字段（来自属性表）
        const formField = form.structure?.fields?.find(ff => ff.fieldId === fieldId);
        if (field.source === '属性表' || formField?.fromAttributeTable) {
          attributeFields.push({ fieldId, field, formField });
        } else {
          normalFields.push({ fieldId, field, formField });
        }
      }
    });
    
    const generatedBlocks = [];
    
    // 1. 为每个普通字段生成：提示区块 + 填写区块
    normalFields.forEach(({ fieldId, field }) => {
      const isPrimaryKey = fieldId === primaryKeyId;
      
      // 提示区块
      const promptBlock = {
        id: generateChildId(),
        type: '显示',
        parentId: parentBlockId,
        level: (parentBlock.level || 1) + 1,
        subType: 'prompt',
        fieldId: fieldId,
        x: parentBlock.x + startX,
        y: parentBlock.y + currentY,
        relativeX: startX,
        relativeY: currentY,
        width: promptWidth,
        height: inputHeight,
        content: field.name + (isPrimaryKey ? '*' : ''),
        style: {
          backgroundColor: 'transparent',
          color: '#374151',
          fontSize: 12,
          textAlign: 'right',
          padding: 4,
          borderWidth: 0,
          zIndex: parentBlock.style?.zIndex ?? 0
        },
        createdAt: new Date().toISOString()
      };
      generatedBlocks.push(promptBlock);
      
      // 填写区块
      const inputBlock = {
        id: generateChildId(),
        type: '显示',
        parentId: parentBlockId,
        level: (parentBlock.level || 1) + 1,
        subType: 'input',
        fieldId: fieldId,
        isPrimaryKey: isPrimaryKey,
        x: parentBlock.x + startX + promptWidth + 10,
        y: parentBlock.y + currentY,
        relativeX: startX + promptWidth + 10,
        relativeY: currentY,
        width: inputWidth,
        height: inputHeight,
        content: '',
        placeholder: `请输入${field.name}`,
        style: {
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db',
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: 4,
          padding: 4,
          fontSize: 12,
          zIndex: parentBlock.style?.zIndex ?? 0
        },
        createdAt: new Date().toISOString()
      };
      generatedBlocks.push(inputBlock);
      
      currentY += rowHeight;
    });
    
    // 2. 为属性字段生成级联下拉区块
    if (attributeFields.length > 0) {
      // 提示区块
      const cascaderPromptBlock = {
        id: generateChildId(),
        type: '显示',
        parentId: parentBlockId,
        level: (parentBlock.level || 1) + 1,
        subType: 'prompt',
        fieldId: attributeFields.map(af => af.fieldId).join(','),
        x: parentBlock.x + startX,
        y: parentBlock.y + currentY,
        relativeX: startX,
        relativeY: currentY,
        width: promptWidth,
        height: inputHeight,
        content: '属性选择',
        style: {
          backgroundColor: 'transparent',
          color: '#374151',
          fontSize: 12,
          textAlign: 'right',
          padding: 4,
          borderWidth: 0,
          zIndex: parentBlock.style?.zIndex ?? 0
        },
        createdAt: new Date().toISOString()
      };
      generatedBlocks.push(cascaderPromptBlock);
      
      // 级联下拉区块
      const cascaderBlock = {
        id: generateChildId(),
        type: '显示',
        parentId: parentBlockId,
        level: (parentBlock.level || 1) + 1,
        subType: 'cascader',
        fieldIds: attributeFields.map(af => af.fieldId),
        x: parentBlock.x + startX + promptWidth + 10,
        y: parentBlock.y + currentY,
        relativeX: startX + promptWidth + 10,
        relativeY: currentY,
        width: inputWidth,
        height: inputHeight,
        style: {
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db',
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: 4,
          padding: 4,
          fontSize: 12,
          zIndex: parentBlock.style?.zIndex ?? 0
        },
        createdAt: new Date().toISOString()
      };
      generatedBlocks.push(cascaderBlock);
      
      currentY += rowHeight;
    }
    
    // 3. 生成提交按钮子区块
    currentY += 10; // 间距
    const submitBlock = {
      id: generateChildId(),
      type: '显示',
      parentId: parentBlockId,
      level: (parentBlock.level || 1) + 1,
      subType: 'submit',
      x: parentBlock.x + startX + promptWidth + 10,
      y: parentBlock.y + currentY,
      relativeX: startX + promptWidth + 10,
      relativeY: currentY,
      width: inputWidth,
      height: 32,
      content: '确认提交',
      style: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        borderRadius: 4,
        borderWidth: 0,
        padding: 4,
        cursor: 'pointer',
        zIndex: parentBlock.style?.zIndex ?? 0
      },
      createdAt: new Date().toISOString()
    };
    generatedBlocks.push(submitBlock);
    
    currentY += 42; // 按钮高度 + 底部间距
    
    // 4. 调整父区块高度以容纳所有子区块
    const updatedParentBlock = {
      ...parentBlock,
      height: Math.max(parentBlock.height, currentY + 10),
      childBlocksGenerated: true
    };
    
    // 更新blocks
    newBlocks = newBlocks.map(b => b.id === parentBlockId ? updatedParentBlock : b);
    newBlocks = [...newBlocks, ...generatedBlocks];
    
    setBlocks(newBlocks);
    setHasChanges(true);
    saveToHistory(newBlocks);
    
    alert(`已生成 ${generatedBlocks.length} 个子区块`);
  };

  // 为流程按钮生成子区块（自行设计样式）
  const handleGenerateFlowButtonChildBlocks = async (parentBlockId) => {
    const parentBlock = blocks.find(b => b.id === parentBlockId);
    if (!parentBlock || parentBlock.type !== '按钮' || parentBlock.buttonType !== 'flow') return;
    
    const config = parentBlock.buttonConfig || {};
    
    // 删除该父区块下已有的子区块
    let newBlocks = blocks.filter(b => b.parentId !== parentBlockId);
    
    // 计算子区块的起始位置
    const startX = 10;
    let currentY = 10;
    const rowHeight = 35;
    const promptWidth = 80;
    const inputWidth = parentBlock.width - promptWidth - 30;
    const inputHeight = 28;
    
    // 生成子区块ID
    let childIndex = 1;
    const generateChildId = () => {
      return `${parentBlockId}-C${String(childIndex++).padStart(3, '0')}`;
    };
    
    const generatedBlocks = [];
    
    // ===== 对话框方式 =====
    if (config.paramMode === 'dialog' && config.dialogFormId) {
      const form = forms.find(f => f.id === config.dialogFormId);
      if (!form) {
        alert('请先选择关联表单');
        return;
      }
      
      // 获取表单字段
      const formFieldIds = form.structure?.fields?.map(f => f.fieldId) || [];
      
      // 为每个字段生成：提示区块 + 输入区块
      for (const fieldId of formFieldIds) {
        const field = fields.find(f => f.id === fieldId);
        
        // 提示区块
        const promptBlock = {
          id: generateChildId(),
          type: '显示',
          parentId: parentBlockId,
          level: (parentBlock.level || 1) + 1,
          subType: 'flowPrompt',
          fieldId: fieldId,
          x: parentBlock.x + startX,
          y: parentBlock.y + currentY,
          relativeX: startX,
          relativeY: currentY,
          width: promptWidth,
          height: inputHeight,
          content: field?.name || fieldId,
          style: {
            backgroundColor: 'transparent',
            color: '#374151',
            fontSize: 12,
            textAlign: 'right',
            padding: 4,
            borderWidth: 0,
            zIndex: parentBlock.style?.zIndex ?? 0
          },
          createdAt: new Date().toISOString()
        };
        generatedBlocks.push(promptBlock);
        
        // 输入区块
        const inputBlock = {
          id: generateChildId(),
          type: '显示',
          parentId: parentBlockId,
          level: (parentBlock.level || 1) + 1,
          subType: 'flowInput',
          fieldId: fieldId,
          x: parentBlock.x + startX + promptWidth + 10,
          y: parentBlock.y + currentY,
          relativeX: startX + promptWidth + 10,
          relativeY: currentY,
          width: inputWidth,
          height: inputHeight,
          placeholder: `请输入${field?.name || ''}`,
          style: {
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: 4,
            padding: 4,
            fontSize: 12,
            zIndex: parentBlock.style?.zIndex ?? 0
          },
          createdAt: new Date().toISOString()
        };
        generatedBlocks.push(inputBlock);
        
        currentY += rowHeight;
      }
      
      // 生成提交按钮
      currentY += 10;
      const submitBlock = {
        id: generateChildId(),
        type: '显示',
        parentId: parentBlockId,
        level: (parentBlock.level || 1) + 1,
        subType: 'flowSubmit',
        flowId: config.flowId,
        flowName: config.flowName,
        x: parentBlock.x + startX + promptWidth + 10,
        y: parentBlock.y + currentY,
        relativeX: startX + promptWidth + 10,
        relativeY: currentY,
        width: inputWidth,
        height: 32,
        content: '确认提交',
        style: {
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          fontSize: 14,
          fontWeight: 'bold',
          textAlign: 'center',
          borderRadius: 4,
          borderWidth: 0,
          padding: 4,
          cursor: 'pointer',
          zIndex: parentBlock.style?.zIndex ?? 0
        },
        createdAt: new Date().toISOString()
      };
      generatedBlocks.push(submitBlock);
      currentY += 42;
    }
    
    // ===== 多项选择方式 =====
    if (config.paramMode === 'selection' && config.attrTableId) {
      // 加载属性表数据获取选项
      let options = [];
      try {
        if (config.attrTableId && window.dndDB) {
          const attrData = await window.dndDB.getFormDataList(projectId, config.attrTableId);
          if (attrData && attrData.length > 0) {
            if (config.selectStyle === 'cascade') {
              // 级联下拉暂时用简单方式
              options = ['级联选项1', '级联选项2', '级联选项3'];
            } else {
              // 获取指定字段的唯一值
              const uniqueValues = [...new Set(attrData.map(d => d[config.attrFieldId]).filter(Boolean))];
              options = uniqueValues;
            }
          }
        }
      } catch (error) {
        console.error('加载选项数据失败:', error);
      }
      
      if (options.length === 0) {
        options = ['选项1', '选项2', '选项3']; // 默认占位选项
      }
      
      // 根据选择形式生成子区块
      if (config.selectStyle === 'buttons') {
        // 按钮组：生成多个按钮子区块（横向排列）
        const buttonWidth = Math.floor((parentBlock.width - 20 - (options.length - 1) * 10) / options.length);
        let currentX = startX;
        
        options.forEach((option, index) => {
          const buttonBlock = {
            id: generateChildId(),
            type: '显示',
            parentId: parentBlockId,
            level: (parentBlock.level || 1) + 1,
            subType: 'flowOptionButton',
            optionValue: option,
            flowId: config.flowId,
            flowName: config.flowName,
            selectMode: config.selectMode,
            x: parentBlock.x + currentX,
            y: parentBlock.y + currentY,
            relativeX: currentX,
            relativeY: currentY,
            width: buttonWidth,
            height: 32,
            content: option,
            style: {
              backgroundColor: '#6366f1',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 'medium',
              textAlign: 'center',
              borderRadius: 4,
              borderWidth: 0,
              padding: 4,
              cursor: 'pointer',
              zIndex: parentBlock.style?.zIndex ?? 0
            },
            createdAt: new Date().toISOString()
          };
          generatedBlocks.push(buttonBlock);
          currentX += buttonWidth + 10;
        });
        currentY += 42;
      } else if (config.selectStyle === 'cascade') {
        // 级联下拉
        const cascadeBlock = {
          id: generateChildId(),
          type: '显示',
          parentId: parentBlockId,
          level: (parentBlock.level || 1) + 1,
          subType: 'flowCascade',
          attrTableId: config.attrTableId,
          cascadeFromField: config.cascadeFromField,
          cascadeToField: config.cascadeToField,
          flowId: config.flowId,
          flowName: config.flowName,
          x: parentBlock.x + startX,
          y: parentBlock.y + currentY,
          relativeX: startX,
          relativeY: currentY,
          width: parentBlock.width - 20,
          height: inputHeight,
          style: {
            backgroundColor: '#ffffff',
            borderColor: '#d1d5db',
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: 4,
            padding: 4,
            fontSize: 12,
            zIndex: parentBlock.style?.zIndex ?? 0
          },
          createdAt: new Date().toISOString()
        };
        generatedBlocks.push(cascadeBlock);
        currentY += rowHeight;
        
        // 确认按钮
        currentY += 10;
        const confirmBlock = {
          id: generateChildId(),
          type: '显示',
          parentId: parentBlockId,
          level: (parentBlock.level || 1) + 1,
          subType: 'flowSubmit',
          flowId: config.flowId,
          flowName: config.flowName,
          x: parentBlock.x + startX,
          y: parentBlock.y + currentY,
          relativeX: startX,
          relativeY: currentY,
          width: parentBlock.width - 20,
          height: 32,
          content: '确认选择',
          style: {
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'center',
            borderRadius: 4,
            borderWidth: 0,
            padding: 4,
            cursor: 'pointer',
            zIndex: parentBlock.style?.zIndex ?? 0
          },
          createdAt: new Date().toISOString()
        };
        generatedBlocks.push(confirmBlock);
        currentY += 42;
      } else {
        // 勾选框（默认）
        options.forEach((option, index) => {
          const checkboxBlock = {
            id: generateChildId(),
            type: '显示',
            parentId: parentBlockId,
            level: (parentBlock.level || 1) + 1,
            subType: 'flowCheckbox',
            optionValue: option,
            selectMode: config.selectMode,
            x: parentBlock.x + startX,
            y: parentBlock.y + currentY,
            relativeX: startX,
            relativeY: currentY,
            width: parentBlock.width - 20,
            height: inputHeight,
            content: option,
            style: {
              backgroundColor: 'transparent',
              color: '#374151',
              fontSize: 12,
              padding: 4,
              borderWidth: 0,
              zIndex: parentBlock.style?.zIndex ?? 0
            },
            createdAt: new Date().toISOString()
          };
          generatedBlocks.push(checkboxBlock);
          currentY += rowHeight;
        });
        
        // 确认按钮
        currentY += 10;
        const confirmBlock = {
          id: generateChildId(),
          type: '显示',
          parentId: parentBlockId,
          level: (parentBlock.level || 1) + 1,
          subType: 'flowSubmit',
          flowId: config.flowId,
          flowName: config.flowName,
          x: parentBlock.x + startX,
          y: parentBlock.y + currentY,
          relativeX: startX,
          relativeY: currentY,
          width: parentBlock.width - 20,
          height: 32,
          content: '确认选择',
          style: {
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 'bold',
            textAlign: 'center',
            borderRadius: 4,
            borderWidth: 0,
            padding: 4,
            cursor: 'pointer',
            zIndex: parentBlock.style?.zIndex ?? 0
          },
          createdAt: new Date().toISOString()
        };
        generatedBlocks.push(confirmBlock);
        currentY += 42;
      }
    }
    
    if (generatedBlocks.length === 0) {
      alert('无法生成子区块，请检查配置');
      return;
    }
    
    // 调整父区块高度
    const updatedParentBlock = {
      ...parentBlock,
      height: Math.max(parentBlock.height, currentY + 10),
      childBlocksGenerated: true
    };
    
    // 更新blocks
    newBlocks = newBlocks.map(b => b.id === parentBlockId ? updatedParentBlock : b);
    newBlocks = [...newBlocks, ...generatedBlocks];
    
    setBlocks(newBlocks);
    setHasChanges(true);
    saveToHistory(newBlocks);
    
    alert(`已生成 ${generatedBlocks.length} 个子区块`);
  };

  const handleSelectBlock = (blockId) => {
    setSelectedBlockId(blockId);
    setShowPanel(true);  // 打开样式面板
  };

  // 从区块列表选择 - 同时滚动到区块位置
  const handleSelectBlockFromList = (blockId) => {
    setSelectedBlockId(blockId);
    setShowPanel(true);  // 打开样式面板

    // 滚动到区块位置（延迟执行以确保DOM更新）
    setTimeout(() => {
      scrollToBlock(blockId);
    }, 50);
  };

  // 滚动到指定区块
  const scrollToBlock = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    // 获取画布容器
    const canvasContainer = document.querySelector('.flex-1.overflow-auto.bg-gray-200');
    if (!canvasContainer) return;
    
    // 计算目标滚动位置 - 将区块滚动到屏幕中间
    const containerHeight = canvasContainer.clientHeight;
    const blockY = block.y * (scale / 100);
    const blockHeight = block.height * (scale / 100);
    
    // 目标：让区块在容器可视区域的中间
    const targetScrollTop = blockY - (containerHeight / 2) + (blockHeight / 2) + 30; // 30是顶部提示的高度
    
    canvasContainer.scrollTo({
      top: Math.max(0, targetScrollTop),
      behavior: 'smooth'
    });
  };

  const updateBlock = (blockId, updates) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, ...updates } : b));
    setHasChanges(true);
  };

  const updateBlockWithHistory = (blockId, updates) => {
    const newBlocks = blocks.map(b => b.id === blockId ? { ...b, ...updates } : b);
    setBlocks(newBlocks);
    setHasChanges(true);
    saveToHistory(newBlocks);
  };

  const toggleBlockExpand = (blockId) => {
    setExpandedBlocks(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  // ===== 拖拽状态 =====
  const [dragState, setDragState] = React.useState({
    isDragging: false, blockId: null, startX: 0, startY: 0, startBlockX: 0, startBlockY: 0
  });

  const [resizeState, setResizeState] = React.useState({
    isResizing: false, blockId: null, direction: '', startX: 0, startY: 0,
    startWidth: 0, startHeight: 0, startBlockX: 0, startBlockY: 0
  });

  // 画布平移处理
  const handleCanvasPanStart = (e) => {
    // 只有点击画布空白处（不是区块或区域）才平移
    if (e.target === e.currentTarget || e.target.classList.contains('canvas-grid')) {
      setCanvasPanState({
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        panX: canvasPanState.panX,
        panY: canvasPanState.panY
      });
    }
  };

  const handleCanvasPanMove = (e) => {
    if (canvasPanState.isPanning) {
      const deltaX = e.clientX - canvasPanState.startX;
      const deltaY = e.clientY - canvasPanState.startY;
      setCanvasPanState(prev => ({
        ...prev,
        panX: prev.panX + deltaX,
        panY: prev.panY + deltaY
      }));
    }
  };

  const handleCanvasPanEnd = () => {
    setCanvasPanState(prev => ({ ...prev, isPanning: false }));
  };

  const handleBlockDragStart = (e, blockId) => {
    e.stopPropagation();
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    setDragState({
      isDragging: true, blockId, startX: e.clientX, startY: e.clientY,
      startBlockX: block.x, startBlockY: block.y
    });
    setSelectedBlockId(blockId);
  };

  const handleBlockResizeStart = (e, blockId, direction) => {
    e.stopPropagation();
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    setResizeState({
      isResizing: true, blockId, direction, startX: e.clientX, startY: e.clientY,
      startWidth: block.width, startHeight: block.height,
      startBlockX: block.x, startBlockY: block.y
    });
  };

  // 获取所有下级区块（递归）
  const getAllDescendantsForDrag = (blockId, allBlocks) => {
    const descendants = [];
    const children = allBlocks.filter(b => b.parentId === blockId);
    children.forEach(child => {
      descendants.push(child);
      descendants.push(...getAllDescendantsForDrag(child.id, allBlocks));
    });
    return descendants;
  };

  // ===== 鼠标事件处理 =====
  React.useEffect(() => {
    const handleMouseMove = (e) => {
      // 画布平移
      if (canvasPanState.isPanning) {
        const deltaX = e.clientX - canvasPanState.startX;
        const deltaY = e.clientY - canvasPanState.startY;
        setCanvasPanState(prev => ({
          ...prev,
          panX: prev.panX + deltaX,
          panY: prev.panY + deltaY
        }));
      }

      // 区域拖拽 - 区块同步移动
      if (areaDragState.isDragging) {
        const deltaX = (e.clientX - areaDragState.startX) / (scale / 100);
        const deltaY = (e.clientY - areaDragState.startY) / (scale / 100);
        const newAreaX = Math.max(0, Math.round(areaDragState.startAreaX + deltaX));
        const newAreaY = Math.max(0, Math.round(areaDragState.startAreaY + deltaY));

        // 同时更新区域和其所属的区块
        setAreas(prev => prev.map(area => {
          if (area.id === areaDragState.areaId) {
            return { ...area, x: newAreaX, y: newAreaY };
          }
          return area;
        }));

        // 区域内的区块同步移动
        setBlocks(prev => prev.map(block => {
          if (block.areaId === areaDragState.areaId) {
            return {
              ...block,
              x: newAreaX + block.relativeX,
              y: newAreaY + block.relativeY
            };
          }
          return block;
        }));
      }

      // 区域缩放
      if (areaResizeState.isResizing) {
        const deltaX = (e.clientX - areaResizeState.startX) / (scale / 100);
        const deltaY = (e.clientY - areaResizeState.startY) / (scale / 100);
        const dir = areaResizeState.direction;
        let newWidth = areaResizeState.startWidth;
        let newHeight = areaResizeState.startHeight;
        let newAreaX = areaResizeState.startAreaX;
        let newAreaY = areaResizeState.startAreaY;

        if (dir.includes('e')) newWidth = Math.max(100, areaResizeState.startWidth + deltaX);
        if (dir.includes('w')) {
          newWidth = Math.max(100, areaResizeState.startWidth - deltaX);
          newAreaX = areaResizeState.startAreaX + (areaResizeState.startWidth - newWidth);
        }
        if (dir.includes('s')) newHeight = Math.max(100, areaResizeState.startHeight + deltaY);
        if (dir.includes('n')) {
          newHeight = Math.max(100, areaResizeState.startHeight - deltaY);
          newAreaY = areaResizeState.startAreaY + (areaResizeState.startHeight - newHeight);
        }

        // 更新区域大小
        setAreas(prev => prev.map(area => {
          if (area.id === areaResizeState.areaId) {
            return {
              ...area,
              x: Math.max(0, Math.round(newAreaX)),
              y: Math.max(0, Math.round(newAreaY)),
              width: Math.round(newWidth),
              height: Math.round(newHeight)
            };
          }
          return area;
        }));

        // 限制区域内的区块大小
        setBlocks(prev => prev.map(block => {
          if (block.areaId === areaResizeState.areaId) {
            // 检查区块是否超出区域边界
            let constrainedBlock = { ...block };
            const area = areas.find(a => a.id === areaResizeState.areaId);

            if (area) {
              // 计算新的绝对位置
              const newX = newAreaX + block.relativeX;
              const newY = newAreaY + block.relativeY;

              // 限制区块位置和大小
              if (block.x + block.width > area.x + area.width) {
                constrainedBlock.width = Math.min(block.width, newWidth - block.relativeX);
              }
              if (block.y + block.height > area.y + area.height) {
                constrainedBlock.height = Math.min(block.height, newHeight - block.relativeY);
              }
            }
            return constrainedBlock;
          }
          return block;
        }));
      }

      if (dragState.isDragging) {
        const deltaX = (e.clientX - dragState.startX) / (scale / 100);
        const deltaY = (e.clientY - dragState.startY) / (scale / 100);
        const newX = Math.max(0, Math.round(dragState.startBlockX + deltaX));
        const newY = Math.max(0, Math.round(dragState.startBlockY + deltaY));

        // 获取当前被拖拽的区块
        const draggedBlock = blocks.find(b => b.id === dragState.blockId);
        if (!draggedBlock) return;

        // 计算位置变化量
        const moveX = newX - draggedBlock.x;
        const moveY = newY - draggedBlock.y;

        // 获取所有下级区块
        const descendants = getAllDescendantsForDrag(dragState.blockId, blocks);

        // 批量更新：被拖拽的区块 + 所有下级区块
        const newBlocks = blocks.map(b => {
          if (b.id === dragState.blockId) {
            // 更新被拖拽的区块
            let updatedBlock = { ...b, x: newX, y: newY };

            // 如果区块属于某个区域，更新相对位置并限制在区域内
            if (b.areaId) {
              const area = areas.find(a => a.id === b.areaId);
              if (area) {
                // 更新相对位置
                updatedBlock.relativeX = newX - area.x;
                updatedBlock.relativeY = newY - area.y;

                // 限制在区域内
                const constrained = constrainBlockToArea(updatedBlock, area);
                updatedBlock.x = constrained.x;
                updatedBlock.y = constrained.y;
                updatedBlock.relativeX = constrained.relativeX;
                updatedBlock.relativeY = constrained.relativeY;
              }
            }

            return updatedBlock;
          }
          if (descendants.find(d => d.id === b.id)) {
            // 下级区块同步移动
            let updatedChild = {
              ...b,
              x: Math.max(0, b.x + moveX),
              y: Math.max(0, b.y + moveY)
            };

            // 如果子区块属于某个区域，更新相对位置并限制在区域内
            if (b.areaId) {
              const area = areas.find(a => a.id === b.areaId);
              if (area) {
                updatedChild.relativeX = updatedChild.x - area.x;
                updatedChild.relativeY = updatedChild.y - area.y;

                const constrained = constrainBlockToArea(updatedChild, area);
                updatedChild.x = constrained.x;
                updatedChild.y = constrained.y;
                updatedChild.relativeX = constrained.relativeX;
                updatedChild.relativeY = constrained.relativeY;
              }
            }

            return updatedChild;
          }
          return b;
        });

        setBlocks(newBlocks);
        setHasChanges(true);
      }
      if (resizeState.isResizing) {
        const deltaX = (e.clientX - resizeState.startX) / (scale / 100);
        const deltaY = (e.clientY - resizeState.startY) / (scale / 100);
        const dir = resizeState.direction;
        let newW = resizeState.startWidth;
        let newH = resizeState.startHeight;
        let newX = resizeState.startBlockX;
        let newY = resizeState.startBlockY;
        if (dir.includes('e')) newW = Math.max(20, resizeState.startWidth + deltaX);
        if (dir.includes('w')) {
          newW = Math.max(20, resizeState.startWidth - deltaX);
          newX = resizeState.startBlockX + (resizeState.startWidth - newW);
        }
        if (dir.includes('s')) newH = Math.max(20, resizeState.startHeight + deltaY);
        if (dir.includes('n')) {
          newH = Math.max(20, resizeState.startHeight - deltaY);
          newY = resizeState.startBlockY + (resizeState.startHeight - newH);
        }
        updateBlock(resizeState.blockId, {
          x: Math.max(0, Math.round(newX)),
          y: Math.max(0, Math.round(newY)),
          width: Math.round(newW),
          height: Math.round(newH)
        });
      }
    };

    const handleMouseUp = () => {
      if (canvasPanState.isPanning) {
        handleCanvasPanEnd();
      }
      if (areaDragState.isDragging) {
        setHasChanges(true);
        setAreaDragState(prev => ({ ...prev, isDragging: false }));
      }
      if (areaResizeState.isResizing) {
        setHasChanges(true);
        setAreaResizeState(prev => ({ ...prev, isResizing: false }));
      }
      if (dragState.isDragging) {
        // 拖拽结束后，更新子区块的相对位置
        const draggedBlock = blocks.find(b => b.id === dragState.blockId);
        if (draggedBlock) {
          const children = blocks.filter(b => b.parentId === dragState.blockId);
          if (children.length > 0) {
            const newBlocks = blocks.map(b => {
              if (b.parentId === dragState.blockId) {
                // 更新子区块与父区块的相对位置
                return {
                  ...b,
                  relativeX: b.x - draggedBlock.x,
                  relativeY: b.y - draggedBlock.y
                };
              }
              return b;
            });
            setBlocks(newBlocks);
          }
        }
        saveToHistory(blocks);
        setDragState(prev => ({ ...prev, isDragging: false }));
      }
      if (resizeState.isResizing) {
        saveToHistory(blocks);
        setResizeState(prev => ({ ...prev, isResizing: false }));
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [areaDragState, areaResizeState, dragState, resizeState, canvasPanState, scale, blocks, areas]);

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget || e.target.classList.contains('canvas-grid')) {
      setSelectedBlockId(null);
      setShowPanel(false);
    }
  };

  // ===== 保存和关闭 =====
  const handleSave = async () => {
    try {
      const updatedPage = {
        ...page,
        design: {
          blocks,
          areas,  // 保存区域数据
          canvasType,
          canvasDecorations,
          iconInstances  // 保存Icon实例
        },
        updatedAt: new Date().toISOString()
      };

      console.log('保存页面 - blocks数量:', blocks.length);
      console.log('保存页面 - areas数量:', areas.length);
      console.log('保存页面 - canvasDecorations数量:', canvasDecorations.length);
      console.log('保存页面 - iconInstances数量:', iconInstances.length);

      await onSave(updatedPage);
      setHasChanges(false);
      alert('保存成功！');
    } catch (error) {
      alert('保存失败：' + error.message);
    }
  };

  const handleClose = () => {
    hasChanges ? setShowCloseModal(true) : onClose();
  };

  const confirmClose = async (saveBeforeClose) => {
    try {
      const updatedPage = {
        ...page,
        design: {
          blocks: saveBeforeClose ? blocks : (page.design?.blocks || page.blocks || []),
          areas: saveBeforeClose ? areas : (page.design?.areas || []),
          canvasType,
          canvasDecorations: saveBeforeClose ? canvasDecorations : (page.design?.canvasDecorations || []),
          iconInstances: saveBeforeClose ? iconInstances : (page.design?.iconInstances || [])
        },
        designProgress: closeProgress,
        updatedAt: new Date().toISOString()
      };
      await onSave(updatedPage);
      onClose();
    } catch (error) {
      alert('操作失败：' + error.message);
    }
  };

  const handleCanvasTypeChange = (type) => {
    setCanvasType(type);
    setHasChanges(true);
  };

  // 处理区块内容变化（直接编辑）
  const handleBlockContentChange = (blockId, content) => {
    updateBlock(blockId, { content });
  };

  // 获取所有子区块（递归）
  const getAllDescendants = (blockId, allBlocks) => {
    const descendants = [];
    const directChildren = allBlocks.filter(b => b.parentId === blockId);
    directChildren.forEach(child => {
      descendants.push(child);
      descendants.push(...getAllDescendants(child.id, allBlocks));
    });
    return descendants;
  };

  // 处理区块样式变更（用于Canvas中的弹窗关闭等操作）
  // 当修改层级时，同步更新所有子区块的层级
  const handleBlockStyleChange = (blockId, styleKey, styleValue) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    // 如果是修改层级，需要同步更新所有子区块
    if (styleKey === 'zIndex') {
      const descendants = getAllDescendants(blockId, blocks);
      
      // 批量更新：父区块 + 所有子区块
      const newBlocks = blocks.map(b => {
        if (b.id === blockId) {
          return { ...b, style: { ...b.style, zIndex: styleValue } };
        }
        if (descendants.find(d => d.id === b.id)) {
          return { ...b, style: { ...b.style, zIndex: styleValue } };
        }
        return b;
      });
      
      setBlocks(newBlocks);
      setHasChanges(true);
      saveToHistory(newBlocks);
    } else {
      // 其他样式属性，只更新当前区块
      const newStyle = { ...block.style, [styleKey]: styleValue };
      updateBlockWithHistory(blockId, { style: newStyle });
    }
  };

  // 处理左侧面板的区块更新
  // 当更新isPopup或style.zIndex时，自动联动更新所有下级区块
  const handleUpdateBlockFromList = (blockId, updates) => {
    // 检查是否需要层级联动（设为弹窗或修改zIndex）
    const needsZIndexSync = updates.isPopup !== undefined || 
                            (updates.style && updates.style.zIndex !== undefined);
    
    if (needsZIndexSync) {
      // 获取新的zIndex值
      const block = blocks.find(b => b.id === blockId);
      if (!block) return;
      
      const newZIndex = updates.style?.zIndex ?? (updates.isPopup ? -1 : 0);
      
      // 获取所有下级区块（递归）
      const getAllDescendantsLocal = (targetId) => {
        const descendants = [];
        const children = blocks.filter(b => b.parentId === targetId);
        children.forEach(child => {
          descendants.push(child);
          descendants.push(...getAllDescendantsLocal(child.id));
        });
        return descendants;
      };
      
      const descendants = getAllDescendantsLocal(blockId);
      
      // 批量更新：当前区块 + 所有下级区块
      const newBlocks = blocks.map(b => {
        if (b.id === blockId) {
          // 更新当前区块
          return { 
            ...b, 
            ...updates,
            style: { ...b.style, ...updates.style, zIndex: newZIndex }
          };
        }
        if (descendants.find(d => d.id === b.id)) {
          // 更新下级区块的zIndex
          return { 
            ...b, 
            style: { ...b.style, zIndex: newZIndex }
          };
        }
        return b;
      });
      
      setBlocks(newBlocks);
      setHasChanges(true);
      saveToHistory(newBlocks);
    } else {
      // 普通更新，不需要联动
      updateBlockWithHistory(blockId, updates);
    }
  };

  // 处理图片上传 - 使用ref来避免闭包问题
  const blocksRef = React.useRef(blocks);
  blocksRef.current = blocks;

  React.useEffect(() => {
    const handleImageUpload = (e) => {
      const { blockId, file } = e.detail;
      if (!file) return;
      
      // 检查文件大小（限制5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
      }
      
      // 转换为Base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        // 直接更新blocks状态
        const currentBlocks = blocksRef.current;
        const newBlocks = currentBlocks.map(b => 
          b.id === blockId 
            ? { ...b, imageUrl: base64, imageName: file.name }
            : b
        );
        setBlocks(newBlocks);
        setHasChanges(true);
        historyRef.current.save(newBlocks);
        updateHistoryState();
      };
      reader.onerror = () => {
        alert('图片读取失败');
      };
      reader.readAsDataURL(file);
    };

    const handleVideoUpload = (e) => {
      const { blockId, file } = e.detail;
      if (!file) return;
      
      // 检查文件大小（限制20MB）
      if (file.size > 20 * 1024 * 1024) {
        alert('视频大小不能超过20MB');
        return;
      }
      
      // 转换为Base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        // 直接更新blocks状态
        const currentBlocks = blocksRef.current;
        const newBlocks = currentBlocks.map(b => 
          b.id === blockId 
            ? { ...b, videoUrl: base64, videoName: file.name }
            : b
        );
        setBlocks(newBlocks);
        setHasChanges(true);
        historyRef.current.save(newBlocks);
        updateHistoryState();
      };
      reader.onerror = () => {
        alert('视频读取失败');
      };
      reader.readAsDataURL(file);
    };

    // 尝试上传到服务器的函数
    const uploadToServer = async (file, type) => {
      try {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = async (event) => {
            const base64 = event.target.result;
            try {
              const response = await fetch('http://localhost:8088/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: type,
                  name: file.name,
                  data: base64
                })
              });
              if (response.ok) {
                const result = await response.json();
                resolve({ success: true, url: result.url, name: file.name });
              } else {
                resolve({ success: false, base64: base64, name: file.name });
              }
            } catch (error) {
              // 服务器不可用，回退到Base64
              resolve({ success: false, base64: base64, name: file.name });
            }
          };
          reader.onerror = () => reject(new Error('文件读取失败'));
          reader.readAsDataURL(file);
        });
      } catch (error) {
        return { success: false, error: error.message };
      }
    };

    // 增强版图片上传（优先服务器，回退Base64）
    const handleImageUploadEnhanced = async (e) => {
      const { blockId, file } = e.detail;
      if (!file) return;
      
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过5MB');
        return;
      }
      
      const result = await uploadToServer(file, 'image');
      const currentBlocks = blocksRef.current;
      const newBlocks = currentBlocks.map(b => 
        b.id === blockId 
          ? { 
              ...b, 
              imageUrl: result.success ? result.url : result.base64, 
              imageName: result.name,
              imageStorageType: result.success ? 'server' : 'base64'
            }
          : b
      );
      setBlocks(newBlocks);
      setHasChanges(true);
      historyRef.current.save(newBlocks);
      updateHistoryState();
      
      if (result.success) {
        console.log('图片已上传到服务器:', result.url);
      } else {
        console.log('图片使用Base64存储（服务器不可用）');
      }
    };

    // 增强版视频上传（优先服务器，回退Base64）
    const handleVideoUploadEnhanced = async (e) => {
      const { blockId, file } = e.detail;
      if (!file) return;
      
      if (file.size > 20 * 1024 * 1024) {
        alert('视频大小不能超过20MB');
        return;
      }
      
      const result = await uploadToServer(file, 'video');
      const currentBlocks = blocksRef.current;
      const newBlocks = currentBlocks.map(b => 
        b.id === blockId 
          ? { 
              ...b, 
              videoUrl: result.success ? result.url : result.base64, 
              videoName: result.name,
              videoStorageType: result.success ? 'server' : 'base64'
            }
          : b
      );
      setBlocks(newBlocks);
      setHasChanges(true);
      historyRef.current.save(newBlocks);
      updateHistoryState();
      
      if (result.success) {
        console.log('视频已上传到服务器:', result.url);
      } else {
        console.log('视频使用Base64存储（服务器不可用）');
      }
    };

    window.addEventListener('blockImageUpload', handleImageUploadEnhanced);
    window.addEventListener('blockVideoUpload', handleVideoUploadEnhanced);
    
    return () => {
      window.removeEventListener('blockImageUpload', handleImageUploadEnhanced);
      window.removeEventListener('blockVideoUpload', handleVideoUploadEnhanced);
    };
  }, []);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  const handleUpdateSelectedBlock = (updates) => {
    if (selectedBlockId) updateBlockWithHistory(selectedBlockId, updates);
  };

  // ===== 渲染 =====
  return (
    <div className="fixed inset-0 bg-gray-100 z-[200] flex flex-col">
      <DesignerToolbar
        page={page} canvasType={canvasType} setCanvasType={handleCanvasTypeChange}
        scale={scale} setScale={setScale} canUndo={canUndo} canRedo={canRedo}
        onUndo={handleUndo} onRedo={handleRedo} onSave={handleSave}
        onClose={handleClose} hasChanges={hasChanges}
        onOpenEditor={handleOpenEditor}
        onOpenGraphicEditor={handleOpenGraphicEditor}
        onOpenStylePanel={() => {
          if (!selectedBlockId) {
            alert('请先选中一个区块');
            return;
          }
          setShowPanel(true);
        }}
        onOpenIconManager={() => {
          console.log('[PageDesigner] onOpenIconManager 被调用');
          console.log('[PageDesigner] 当前 showIconManager:', showIconManager);
          console.log('[PageDesigner] window.IconManager:', window.IconManager);
          setShowIconManager(true);
          console.log('[PageDesigner] setShowIconManager(true) 已执行');
        }}
        selectedBlockId={selectedBlockId}
        showAreas={showAreas} setShowAreas={setShowAreas}
        hideContentInAreas={hideContentInAreas} setHideContentInAreas={setHideContentInAreas}
      />
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧面板 */}
        <div className="relative flex flex-col" style={{ width: leftPanelCollapsed ? '24px' : '240px', transition: 'width 0.3s' }}>
          {!leftPanelCollapsed && (
            <>
              {/* 区域列表切换按钮 */}
              <button
                onClick={() => setShowAreaList(!showAreaList)}
                className="w-full px-3 py-2 border-b border-gray-200 text-sm font-medium transition-colors bg-white hover:bg-gray-50 flex items-center justify-between"
              >
                <span className={showAreaList ? 'text-purple-600' : 'text-gray-600'}>
                  📍 区域列表
                </span>
                <span className="text-gray-400">{showAreaList ? '▼' : '▶'}</span>
              </button>

              {/* 区域列表面板 */}
              {showAreaList && (
                <div className="flex-1 overflow-y-auto p-2">
                  {currentAreaId ? (
                    // 区域设计模式显示
                    <div className="space-y-4">
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                        <div className="font-medium text-purple-700 mb-2">当前设计的区域</div>
                        {(() => {
                          const currentArea = getCurrentArea();
                          return currentArea ? (
                            <>
                              <div className="text-sm text-gray-600">
                                <strong>区域编号：</strong>{currentArea.id}
                              </div>
                              <div className="text-sm text-gray-600">
                                <strong>区域名称：</strong>{currentArea.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                <strong>几何数据：</strong>
                                ({currentArea.x}, {currentArea.y}) 宽{currentArea.width}×高{currentArea.height}
                              </div>
                            </>
                          ) : null;
                        })()}
                      </div>
                      <button
                        onClick={handleExitAreaDesignMode}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                      >
                        ← 退出区域设计模式
                      </button>
                    </div>
                  ) : (
                    // 正常模式：显示所有区域
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">区域列表</span>
                        <button
                          onClick={handleAddArea}
                          className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                        >
                          + 添加新区域
                        </button>
                      </div>

                      {areas.length === 0 ? (
                        <div className="text-center text-gray-400 text-sm py-8">
                          暂无区域<br/>点击上方按钮添加
                        </div>
                      ) : (
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">区域编号</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">区域名称</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {areas.map(area => (
                                <tr key={area.id} className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleEnterAreaDesignMode(area.id)}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-mono">{area.id}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{area.name}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center space-x-1" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleEditArea(area.id)}
                                      className="text-blue-600 hover:text-blue-900"
                                      title="修改"
                                    >
                                      修改
                                    </button>
                                    <button
                                      onClick={() => handleDeleteArea(area.id)}
                                      className="text-red-600 hover:text-red-900"
                                      title="删除"
                                    >
                                      删除
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* 区块列表切换按钮 */}
              <button
                onClick={() => setShowBlockList(!showBlockList)}
                className="w-full px-3 py-2 border-b border-gray-200 text-sm font-medium transition-colors bg-white hover:bg-gray-50 flex items-center justify-between"
              >
                <span className={!showAreaList && !currentAreaId ? 'text-blue-600' : 'text-gray-600'}>
                  📦 区块列表{currentAreaId && ` (${getCurrentArea()?.name})`}
                </span>
                <span className="text-gray-400">{showBlockList ? '▼' : '▶'}</span>
              </button>

              {/* 区块列表面板 */}
              {showBlockList && (
                <div className="flex-1 overflow-y-auto p-2">
                  <BlockList
                    blocks={currentAreaId ? getCurrentAreaBlocks() : blocks}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={handleSelectBlockFromList}
                    onAddBlock={handleAddBlock}
                    onDeleteBlock={handleDeleteBlock}
                    expandedBlocks={expandedBlocks}
                    onToggleExpand={toggleBlockExpand}
                    onUpdateBlock={handleUpdateBlockFromList}
                    onGenerateChildBlocks={handleGenerateChildBlocks}
                    onGenerateFlowButtonChildBlocks={handleGenerateFlowButtonChildBlocks}
                    onSaveAsTemplate={handleSaveBlockAsTemplate}
                    projectId={projectId}
                    roleId={roleId}
                    forms={forms}
                    fields={fields}
                    dataFlows={dataFlows}
                  />
                </div>
              )}
            </>
          )}
          {/* 左侧收起/展开按钮 */}
          <button
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1/2 z-10 w-6 h-12 bg-white border border-gray-300 rounded-r flex items-center justify-center hover:bg-gray-100 shadow-sm"
            title={leftPanelCollapsed ? '展开列表' : '收起列表'}
          >
            <span className="text-gray-500 text-xs">{leftPanelCollapsed ? '▶' : '◀'}</span>
          </button>
        </div>
        
        {/* 中间画布区域 */}
        <div className="flex-1 relative" onMouseDown={handleCanvasPanStart}>
          <DesignerCanvas
            blocks={currentAreaId ? getCurrentAreaBlocks() : blocks}
            selectedBlockId={selectedBlockId}
            canvasType={canvasType} scale={scale} onSelectBlock={handleSelectBlock}
            onBlockDragStart={handleBlockDragStart}
            onBlockResizeStart={handleBlockResizeStart}
            onCanvasClick={handleCanvasClick}
            onBlockContentChange={handleBlockContentChange}
            onBlockStyleChange={handleBlockStyleChange}
            projectId={projectId}
            canvasDecorations={canvasDecorations}
            iconInstances={iconInstances}
            projectIcons={projectIcons}
            selectedIconId={selectedIconId}
            onSelectIcon={handleSelectIcon}
            onIconDragStart={handleIconDragStart}
            onIconResizeStart={handleIconResizeStart}
            onIconDrop={handleIconDrop}
            onDeleteIcon={handleDeleteIcon}
            areas={areas}
            showAreas={showAreas}
            hideContentInAreas={hideContentInAreas}
            currentAreaId={currentAreaId}
            onAreaDragStart={handleAreaDragStart}
            onAreaResizeStart={handleAreaResizeStart}
            panX={canvasPanState.panX}
            panY={canvasPanState.panY}
          />
        </div>
      </div>
      {showPanel && selectedBlock && (
        <StylePanel
          block={selectedBlock} onUpdate={handleUpdateSelectedBlock}
          position={panelPosition} onPositionChange={setPanelPosition}
          onClose={() => setShowPanel(false)}
        />
      )}
      {/* 添加区域弹窗 */}
      {showAddAreaModal && editingArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">添加新区域</h3>

            <div className="space-y-4">
              {/* 区域名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  区域名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingArea.name}
                  onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value.slice(0, 10) })}
                  placeholder="10个汉字以内"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  maxLength={10}
                />
              </div>

              {/* 几何数据 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  几何数据 (X, Y, 宽×高)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <span className="text-xs text-gray-500">X</span>
                    <input
                      type="number"
                      value={editingArea.x}
                      onChange={(e) => setEditingArea({ ...editingArea, x: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Y</span>
                    <input
                      type="number"
                      value={editingArea.y}
                      onChange={(e) => setEditingArea({ ...editingArea, y: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      min="0"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">宽</span>
                    <input
                      type="number"
                      value={editingArea.width}
                      onChange={(e) => setEditingArea({ ...editingArea, width: Math.max(50, parseInt(e.target.value) || 50) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      min="50"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">高</span>
                    <input
                      type="number"
                      value={editingArea.height}
                      onChange={(e) => setEditingArea({ ...editingArea, height: Math.max(50, parseInt(e.target.value) || 50) })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      min="50"
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500">
                初始数据：(0, 0) 300×300，区域拖拽后系统自动更新
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddAreaModal(false);
                  setEditingArea(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={confirmAddArea}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                确认添加
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑区域弹窗 */}
      {showEditAreaModal && editingArea && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg shadow-xl w-96 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">修改区域</h3>

            <div className="space-y-4">
              {/* 区域名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  区域名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editingArea.name}
                  onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value.slice(0, 10) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  maxLength={10}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditAreaModal(false);
                  setEditingArea(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={confirmEditArea}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <CloseConfirmModal
          hasChanges={hasChanges}
          closeProgress={closeProgress}
          setCloseProgress={setCloseProgress}
          onCancel={() => setShowCloseModal(false)}
          onConfirm={confirmClose}
        />
      )}
      {showEditor && (
        <RichTextEditor
          isOpen={showEditor}
          onClose={() => setShowEditor(false)}
          initialContent={editorContent}
          onSave={handleEditorSave}
          title={editorTitle}
        />
      )}
      {showGraphicEditor && (
        <GraphicEditor
          isOpen={showGraphicEditor}
          onClose={() => { setShowGraphicEditor(false); setGraphicEditorTarget(null); }}
          onSave={handleGraphicEditorSave}
          targetBlock={graphicEditorTarget}
          canvasWidth={window.StyleUtils?.getCanvasConfig(canvasType)?.width || 1600}
          canvasHeight={window.StyleUtils?.getCanvasConfig(canvasType)?.minHeight || 800}
        />
      )}
      {mediaPreview.show && (
        <MediaPreview
          type={mediaPreview.type}
          url={mediaPreview.url}
          name={mediaPreview.name}
          onClose={() => setMediaPreview({ show: false, type: null, url: null, name: null })}
        />
      )}
      {formConfigModal.show && (
        <FormDisplayConfig
          isOpen={formConfigModal.show}
          onClose={() => setFormConfigModal({ show: false, blockId: null })}
          block={blocks.find(b => b.id === formConfigModal.blockId)}
          onSave={handleSaveFormConfig}
          projectId={projectId}
          roleId={roleId}
        />
      )}
      {interactionConfigModal.show && (
        <InteractionConfig
          isOpen={interactionConfigModal.show}
          onClose={() => setInteractionConfigModal({ show: false, blockId: null })}
          block={blocks.find(b => b.id === interactionConfigModal.blockId)}
          onSave={handleSaveInteractionConfig}
          projectId={projectId}
        />
      )}
      {dataEntryDialog.show && (
        <DataEntryDialog
          isOpen={dataEntryDialog.show}
          onClose={() => setDataEntryDialog({ show: false, formId: null, formName: null })}
          formId={dataEntryDialog.formId}
          formName={dataEntryDialog.formName}
          projectId={projectId}
        />
      )}
      {buttonConfigModal.show && window.ButtonConfig && (
        <ButtonConfig
          isOpen={buttonConfigModal.show}
          onClose={() => setButtonConfigModal({ show: false, blockId: null })}
          block={blocks.find(b => b.id === buttonConfigModal.blockId)}
          onSave={handleSaveButtonConfig}
          projectId={projectId}
          roleId={roleId}
        />
      )}
      {dataEditDialog.show && window.DataEditDialog && (
        <DataEditDialog
          isOpen={dataEditDialog.show}
          onClose={() => setDataEditDialog({ show: false, formId: null, formName: null, recordData: null })}
          formId={dataEditDialog.formId}
          formName={dataEditDialog.formName}
          recordData={dataEditDialog.recordData}
          projectId={projectId}
          onSuccess={() => {
            // 触发刷新
            window.dispatchEvent(new CustomEvent('formDataChanged', { detail: { formId: dataEditDialog.formId } }));
          }}
        />
      )}

      {/* 区块模板选择弹窗 */}
      {showBlockTemplateSelector && (
        <BlockTemplateSelector
          projectId={projectId}
          onSelect={handleBlockTemplateSelect}
          onCancel={() => setShowBlockTemplateSelector(false)}
        />
      )}

      {/* 保存区块为模板弹窗 */}
      {showSaveBlockTemplate && templateSourceBlock && (
        <SaveAsTemplateModal
          type="block"
          sourceName={templateSourceBlock.id}
          onSave={handleConfirmSaveBlockTemplate}
          onCancel={() => {
            setShowSaveBlockTemplate(false);
            setTemplateSourceBlock(null);
          }}
        />
      )}
      
      {/* Icon管理器 */}
      {console.log('[PageDesigner] 渲染检查 - showIconManager:', showIconManager, 'window.IconManager:', !!window.IconManager)}
      {showIconManager && window.IconManager && (
        <IconManager
          isOpen={showIconManager}
          onClose={() => setShowIconManager(false)}
          projectIcons={projectIcons}
          onUpdateProjectIcons={handleIconsChange}
          pages={allPages}
          blocks={blocks}
        />
      )}
      {showIconManager && !window.IconManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg">
            <p className="text-red-500">错误: IconManager 组件未加载</p>
            <button onClick={() => setShowIconManager(false)} className="mt-4 px-4 py-2 bg-gray-200 rounded">关闭</button>
          </div>
        </div>
      )}
    </div>
  );
}

// CloseConfirmModal组件已拆分到 CloseConfirmModal.jsx
// 如果未加载独立文件，使用内置版本
if (typeof CloseConfirmModal === 'undefined') {
  window.CloseConfirmModal = function({ hasChanges, closeProgress, setCloseProgress, onCancel, onConfirm }) {
    return React.createElement('div', { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]' },
      React.createElement('div', { className: 'bg-white rounded-lg shadow-xl w-96 p-6' },
        React.createElement('h3', { className: 'text-lg font-semibold text-gray-900 mb-4' }, '关闭设计页面'),
        hasChanges && React.createElement('div', { className: 'mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700' }, '⚠️ 您有未保存的更改'),
        React.createElement('div', { className: 'mb-4' },
          React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, '请输入当前设计进度'),
          React.createElement('div', { className: 'flex items-center space-x-2' },
            React.createElement('input', { type: 'number', value: closeProgress, onChange: (e) => setCloseProgress(Math.min(100, Math.max(0, parseInt(e.target.value) || 0))), min: '0', max: '100', className: 'w-20 px-3 py-2 border border-gray-300 rounded' }),
            React.createElement('span', { className: 'text-gray-500' }, '%'),
            React.createElement('div', { className: 'flex-1 bg-gray-200 rounded-full h-2' },
              React.createElement('div', { className: 'h-2 bg-blue-500 rounded-full', style: { width: closeProgress + '%' } })
            )
          )
        ),
        React.createElement('div', { className: 'flex justify-end space-x-3' },
          React.createElement('button', { onClick: onCancel, className: 'px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100' }, '取消'),
          hasChanges && React.createElement('button', { onClick: () => onConfirm(true), className: 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700' }, '保存并关闭'),
          React.createElement('button', { onClick: () => onConfirm(false), className: hasChanges ? 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600' : 'px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700' }, hasChanges ? '不保存关闭' : '确认关闭')
        )
      )
    );
  };
}

window.PageDesigner = PageDesigner;

// DND2 页面设计器 - 状态管理Hook
// 原文件: src/designer/PageDesigner.jsx 状态定义和数据加载部分
// Phase 5 拆分: 文件 2/5
//
// 提供页面设计器所需的所有状态和基本数据加载

function useDesignerState(page, projectId, roleId) {
  // ===== 核心状态 =====
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

  // ===== 表单和字段数据 =====
  const [forms, setForms] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [dataFlows, setDataFlows] = React.useState([]);

  // ===== 富文本编辑器状态 =====
  const [showEditor, setShowEditor] = React.useState(false);
  const [editorContent, setEditorContent] = React.useState('');
  const [editorTitle, setEditorTitle] = React.useState('富文本编辑器');
  const [editorTargetBlockId, setEditorTargetBlockId] = React.useState(null);

  // ===== 媒体预览状态 =====
  const [mediaPreview, setMediaPreview] = React.useState({ show: false, type: null, url: null, name: null });

  // ===== 弹窗状态 =====
  const [formConfigModal, setFormConfigModal] = React.useState({ show: false, blockId: null });
  const [interactionConfigModal, setInteractionConfigModal] = React.useState({ show: false, blockId: null });
  const [dataEntryDialog, setDataEntryDialog] = React.useState({ show: false, formId: null, formName: null });
  const [dataEditDialog, setDataEditDialog] = React.useState({ show: false, formId: null, formName: null, recordData: null });
  const [buttonConfigModal, setButtonConfigModal] = React.useState({ show: false, blockId: null });

  // ===== 历史记录 =====
  const historyRef = React.useRef(new HistoryManager(50));
  const [canUndo, setCanUndo] = React.useState(false);
  const [canRedo, setCanRedo] = React.useState(false);

  // 加载表单、字段和流程数据
  React.useEffect(() => {
    const loadFormsAndFields = async () => {
      if (!projectId || !window.dndDB) return;
      try {
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

  // 获取当前选中的区块
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  return {
    // 核心状态
    blocks, setBlocks,
    selectedBlockId, setSelectedBlockId,
    selectedBlock,
    canvasType, setCanvasType,
    scale, setScale,
    panelPosition, setPanelPosition,
    showPanel, setShowPanel,
    expandedBlocks, setExpandedBlocks,
    showCloseModal, setShowCloseModal,
    closeProgress, setCloseProgress,
    hasChanges, setHasChanges,
    
    // 数据
    forms, setForms,
    fields, setFields,
    dataFlows, setDataFlows,
    
    // 编辑器状态
    showEditor, setShowEditor,
    editorContent, setEditorContent,
    editorTitle, setEditorTitle,
    editorTargetBlockId, setEditorTargetBlockId,
    
    // 媒体预览
    mediaPreview, setMediaPreview,
    
    // 弹窗状态
    formConfigModal, setFormConfigModal,
    interactionConfigModal, setInteractionConfigModal,
    dataEntryDialog, setDataEntryDialog,
    dataEditDialog, setDataEditDialog,
    buttonConfigModal, setButtonConfigModal,
    
    // 历史记录
    historyRef,
    canUndo, setCanUndo,
    canRedo, setCanRedo
  };
}

window.useDesignerState = useDesignerState;

console.log('[DND2] designer/useDesignerState.js 加载完成');

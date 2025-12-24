// DND2 预览模块 - 样式常量
// 原文件: src/preview/Preview.jsx 中的内联样式提取
// 
// 集中管理预览模块的样式常量

window.PreviewStyles = {
  // 弹窗遮罩层
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },

  // 弹窗容器
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    maxHeight: '80vh',
    overflow: 'auto'
  },

  // 紫色标题栏（属性表）
  attributeHeader: {
    backgroundColor: '#7c3aed',
    color: 'white',
    padding: '16px 24px',
    borderRadius: '8px 8px 0 0'
  },

  // 蓝色标题栏（基础表）
  basicHeader: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '16px 24px',
    borderRadius: '8px 8px 0 0'
  },

  // 底部按钮区域
  modalFooter: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },

  // 取消按钮
  cancelButton: {
    padding: '8px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },

  // 确认按钮（蓝色）
  confirmButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#3b82f6',
    color: 'white',
    cursor: 'pointer'
  },

  // 确认按钮（紫色）
  purpleButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#7c3aed',
    color: 'white',
    cursor: 'pointer'
  },

  // 输入框
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },

  // 下拉选择框
  select: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '14px'
  },

  // 表单字段标签
  fieldLabel: {
    display: 'block',
    marginBottom: '4px',
    fontSize: '14px',
    color: '#374151'
  },

  // 必填标记
  requiredMark: {
    color: '#ef4444'
  },

  // 区块基础样式
  blockBase: {
    position: 'absolute',
    boxSizing: 'border-box'
  },

  // 表格样式
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  },

  tableHeader: {
    backgroundColor: '#f8fafc',
    fontWeight: 'bold',
    padding: '12px 8px',
    borderBottom: '2px solid #e2e8f0',
    textAlign: 'left'
  },

  tableCell: {
    padding: '10px 8px',
    borderBottom: '1px solid #e2e8f0'
  },

  // 空状态
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#9ca3af'
  },

  // 操作按钮
  actionButton: {
    padding: '4px 8px',
    fontSize: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '4px'
  },

  // 编辑按钮
  editButton: {
    backgroundColor: '#dbeafe',
    color: '#1d4ed8'
  },

  // 删除按钮
  deleteButton: {
    backgroundColor: '#fee2e2',
    color: '#dc2626'
  },

  // 置顶按钮
  topButton: {
    backgroundColor: '#fef3c7',
    color: '#d97706'
  }
};

console.log('[DND2] preview/previewStyles.js 加载完成');

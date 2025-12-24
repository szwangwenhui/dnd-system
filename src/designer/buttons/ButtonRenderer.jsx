// 按钮渲染组件 - 中性按钮模式
// 在画布上渲染按钮，功能由数据流程定义
// 注：设计模式下的功能执行由Canvas层统一处理

function ButtonRenderer({ block, style, projectId, context, isPreview }) {
  const [executing, setExecuting] = React.useState(false);

  // 处理按钮点击（仅预览模式下触发数据流程）
  const handleClick = async (e) => {
    // 设计模式下：不阻止冒泡，让事件传递到Canvas层统一处理
    if (!isPreview) {
      // 不调用 e.stopPropagation()，让事件冒泡到外层
      return;
    }
    
    // 预览模式下：阻止冒泡，自己处理
    e.stopPropagation();

    console.log('按钮点击, block:', block, 'context:', context);

    // 触发数据流程事件（由数据流程引擎监听）
    window.dispatchEvent(new CustomEvent('buttonClick', {
      detail: {
        blockId: block.id,
        pageId: context?.pageId || block.pageId,
        projectId,
        roleId: context?.roleId,
        context
      }
    }));
  };

  // 获取按钮文字 - 允许为空
  const getButtonText = () => {
    if (executing) return '处理中...';
    // 如果 buttonText 是空字符串，显示空；如果是 undefined/null，显示空
    return block.buttonText ?? '';
  };

  // 渲染按钮 - 应用样式面板的配置
  const buttonStyle = {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // 应用样式面板的背景色，默认蓝色
    backgroundColor: style?.backgroundColor || '#3b82f6',
    color: style?.color || '#ffffff',
    borderRadius: style?.borderRadius || '4px',
    fontSize: style?.fontSize || '14px',
    fontWeight: style?.fontWeight || 'normal',
    cursor: isPreview ? (executing ? 'wait' : 'pointer') : 'default',
    border: style?.border || 'none',
    opacity: executing ? 0.7 : 1,
    transition: 'all 0.2s',
    // 应用其他可能的样式
    padding: style?.padding,
    boxShadow: style?.boxShadow,
    textAlign: 'center'
  };

  return (
    <button
      style={buttonStyle}
      onClick={handleClick}
      disabled={executing}
      onMouseOver={(e) => {
        if (isPreview && !executing) {
          e.currentTarget.style.opacity = '0.9';
        }
      }}
      onMouseOut={(e) => {
        if (isPreview && !executing) {
          e.currentTarget.style.opacity = '1';
        }
      }}
      title={block.buttonText || '按钮'}
    >
      {getButtonText()}
    </button>
  );
}

window.ButtonRenderer = ButtonRenderer;

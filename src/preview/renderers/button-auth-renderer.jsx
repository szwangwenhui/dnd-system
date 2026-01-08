// 按钮和认证区块渲染器
// 负责渲染按钮区块和用户账号认证区块

export const createButtonAuthRenderer = (props) => {
  const {
    projectId,
    pageId,
    roleId,
    blocks,
    pages,
    forms,
    fields
  } = props;

  // 渲染按钮区块
  const renderButtonBlock = (block, blockStyle, contentStyle, PopupCloseButton) => {
    // 完全继承blockStyle，只添加按钮特有的交互样式
    // blockStyle 已经包含了完整的边框、圆角等样式
    const style = block.style || {};

    // 判断用户是否设置了背景色
    const isTransparentBg = !style.backgroundColor || style.backgroundColor === 'transparent';
    const hasCustomColor = style.color && style.color !== '#333' && style.color !== '#333333';

    // 从内容样式获取字体设置
    const fontSize = contentStyle.fontSize || 14;
    const fontFamily = contentStyle.fontFamily || 'inherit';
    const fontWeight = contentStyle.fontWeight || 'normal';

    // 根据背景色决定文字颜色
    let bgColor, textColor;
    if (isTransparentBg) {
      // 透明背景：保持透明，文字用设置的颜色或默认蓝色
      bgColor = 'transparent';
      textColor = hasCustomColor ? style.color : '#3b82f6';
    } else {
      // 有背景色：使用设置的背景色，文字用设置的颜色或默认白色
      bgColor = style.backgroundColor;
      textColor = hasCustomColor ? style.color : '#ffffff';
    }

    const finalStyle = {
      ...blockStyle,  // 继承所有样式（包括边框）
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      userSelect: 'none',
      // 字体样式
      fontSize: fontSize,
      fontFamily: fontFamily,
      fontWeight: fontWeight,
      // 颜色
      backgroundColor: bgColor,
      color: textColor,
    };

    const handleClick = async () => {
      console.log('按钮点击:', block.id, '类型:', block.buttonType);

      // 根据按钮类型执行不同的操作
      if (block.buttonType && window.ButtonRegistry) {
        const context = {
          projectId: projectId,
          pageId: pageId,
          roleId: roleId,
          blockId: block.id,
          blocks: blocks,  // 添加blocks以便查找父区块
          pages: pages,
          forms: forms,
          fields: fields
        };

        try {
          const result = await window.ButtonRegistry.execute(
            block.buttonType,
            block.buttonConfig || {},
            context
          );
          console.log('按钮执行结果:', result);
        } catch (error) {
          console.error('按钮执行失败:', error);
        }
      } else {
        // 没有配置buttonType，使用旧的事件触发方式（兼容中性按钮）
        window.dispatchEvent(new CustomEvent('buttonClick', {
          detail: {
            blockId: block.id,
            pageId: pageId,
            projectId: projectId,
            roleId: roleId
          }
        }));
        console.log('按钮点击（中性按钮模式），触发数据流程事件:', block.id);
      }
    };

    // 获取按钮显示文字
    // 如果是"登录/注册"按钮且用户已登录，显示用户名
    let displayText = block.buttonText ?? '';
    if (block.buttonType === 'openPopup' && block.isBuiltIn) {
      // 检查是否已登录（从localStorage获取）
      try {
        const endUser = localStorage.getItem('dnd_end_user');
        if (endUser) {
          const user = JSON.parse(endUser);
          if (user && user.account) {
            displayText = user.nickname || user.account.split('@')[0] || '已登录';
          }
        }
      } catch (e) {
        console.error('读取用户信息失败:', e);
      }
    }

    return (
      <div
        key={block.id}
        style={finalStyle}
        onClick={handleClick}
      >
        {PopupCloseButton && <PopupCloseButton />}
        {displayText}
      </div>
    );
  };

  // 渲染用户账号区块
  const renderAuthBlock = (block, blockStyle, PopupCloseButton) => {
    const config = block.authConfig || {};
    const style = block.style || {};

    // 构建样式配置传递给AuthBlock
    const authStyle = {
      fontSize: style.fontSize || 14,
      fontFamily: style.fontFamily || 'inherit',
      loginBgColor: style.backgroundColor || '#3b82f6',
      loginTextColor: style.color || '#ffffff',
      registerBgColor: 'transparent',
      registerTextColor: style.backgroundColor || '#3b82f6',
      registerBorderColor: style.backgroundColor || '#3b82f6',
      nicknameColor: style.color || '#374151',
      avatarBgColor: '#e5e7eb',
      avatarTextColor: '#6b7280',
    };

    // 处理页面跳转
    const handleNavigate = (targetPageId) => {
      if (targetPageId) {
        const targetPage = pages.find(p => p.id === targetPageId);
        if (targetPage) {
          const url = `preview.html?projectId=${projectId}&roleId=${roleId}&pageId=${targetPageId}`;
          window.location.href = url;
        }
      }
    };

    return (
      <div key={block.id} style={{
        ...blockStyle,
        display: 'flex',
        alignItems: 'center',
        justifyContent: style.textAlign === 'center' ? 'center' : (style.textAlign === 'right' ? 'flex-end' : 'flex-start'),
      }}>
        {PopupCloseButton && <PopupCloseButton />}
        {window.AuthBlock ? (
          <window.AuthBlock
            block={block}
            style={authStyle}
            config={config}
            onNavigate={handleNavigate}
          />
        ) : (
          <div style={{ color: '#9ca3af', fontSize: 12 }}>
            用户账号组件未加载
          </div>
        )}
      </div>
    );
  };

  return {
    renderButtonBlock,
    renderAuthBlock
  };
};

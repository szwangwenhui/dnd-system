// 懒加载组件缓存
const lazyComponentsCache = {};
const loadingScripts = {};

// 创建命名空间
window.DNDComponents = window.DNDComponents || {};

// 动态加载组件脚本
async function loadComponentScript(src, componentGlobalName) {
  console.log('[LazyLoader] loadComponentScript 调用:', { src, componentGlobalName });
  console.log('[LazyLoader] 当前页面 URL:', window.location.href);

  // 如果已经加载过，直接返回
  if (window.DNDComponents[componentGlobalName]) {
    console.log('[LazyLoader] 组件已加载:', componentGlobalName);
    return window.DNDComponents[componentGlobalName];
  }

  // 如果已经在加载中，返回同一个 Promise
  if (loadingScripts[src]) {
    console.log('[LazyLoader] 脚本正在加载中:', src);
    return loadingScripts[src];
  }

  // 转换相对路径为绝对路径
  let fullSrc = src;
  if (src.startsWith('./')) {
    const relativePath = src.substring(2); // 移除 './'
    fullSrc = window.location.origin + '/' + relativePath;
  }

  // 添加时间戳以破坏缓存（仅在开发环境）
  // 浏览器环境没有 process 对象，使用 window 对象判断
  const isDevelopment = typeof window !== 'undefined' && window.location?.hostname === 'localhost';
  const cacheBuster = isDevelopment ? `?t=${Date.now()}` : '';
  fullSrc += cacheBuster;

  console.log('[LazyLoader] 转换后路径:', fullSrc);

  // 创建加载 Promise
  const loadPromise = (async () => {
    try {
      console.log('[LazyLoader] 开始 fetch 文件...');
      const response = await fetch(fullSrc);
      console.log('[LazyLoader] fetch response status:', response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const sourceCode = await response.text();
      console.log('[LazyLoader] 源代码长度:', sourceCode.length, '字符');

      // 使用 Babel 编译
      console.log('[LazyLoader] 开始 Babel 编译...');
      const compiledCode = window.Babel.transform(sourceCode, {
        presets: ['react']
      }).code;
      console.log('[LazyLoader] 编译后代码长度:', compiledCode.length, '字符');

      // 执行编译后的代码，并捕获函数定义
      console.log('[LazyLoader] 执行编译后的代码...');
      let component;
      try {
        // 直接在全局作用域执行编译后的代码
        console.log('[LazyLoader] 直接执行编译代码到全局作用域...');
        const compiledFunction = new Function(compiledCode);
        compiledFunction();

        // 从命名空间中获取组件
        component = window.DNDComponents[componentGlobalName];
        console.log('[LazyLoader] 代码执行完成');
        console.log('[LazyLoader] 从命名空间获取组件:', componentGlobalName, '是否存在:', !!component);
        console.log('[LazyLoader] 组件类型:', typeof component);
      } catch (execError) {
        console.error('[LazyLoader] 代码执行错误:', execError);
        console.error('[LazyLoader] 错误堆栈:', execError.stack);
        throw execError;
      }

      if (!component) {
        throw new Error('组件未找到: ' + componentGlobalName);
      }

      console.log('[LazyLoader] 组件可用:', componentGlobalName);
      console.log('[LazyLoader] 组件是否为函数:', typeof component === 'function');
      lazyComponentsCache[src] = true;
      return component;
    } catch (error) {
      console.error('[LazyLoader] 加载失败:', error);
      throw error;
    } finally {
      delete loadingScripts[src];
    }
  })();

  loadingScripts[src] = loadPromise;
  return loadPromise;
}

// 导出 loadComponentScript 到全局，供其他组件使用
window.loadComponentScript = loadComponentScript;

// 辅助函数：渲染懒加载的组件（不被 Babel 编译）
window.renderLazyComponent = function(Component, props) {
  console.log('[renderLazyComponent] 开始渲染组件');
  console.log('[renderLazyComponent] Component:', Component);
  console.log('[renderLazyComponent] Component 类型:', typeof Component);
  console.log('[renderLazyComponent] props:', props);
  console.log('[renderLazyComponent] props 类型:', typeof props);

  // 使用 React.createElement 而不是 JSX，避免 Babel 编译问题
  const result = React.createElement(Component, props);
  console.log('[renderLazyComponent] 渲染完成');

  return result;
};

// 包装组件：用于渲染懒加载的组件
window.LazyLoadedComponentWrapper = function({ componentGlobalName, ...props }) {
  console.log('[LazyLoadedComponentWrapper] 开始渲染');
  console.log('[LazyLoadedComponentWrapper] componentGlobalName:', componentGlobalName);
  console.log('[LazyLoadedComponentWrapper] props:', props);

  // 从命名空间获取组件
  const Component = window.DNDComponents[componentGlobalName];
  console.log('[LazyLoadedComponentWrapper] Component:', Component);

  if (!Component) {
    console.error('[LazyLoadedComponentWrapper] 组件未找到:', componentGlobalName);
    return React.createElement('div', { style: { color: 'red' } }, '组件未找到: ' + componentGlobalName);
  }

  // 渲染组件
  console.log('[LazyLoadedComponentWrapper] 调用 React.createElement');
  const result = React.createElement(Component, props);
  console.log('[LazyLoadedComponentWrapper] 渲染完成');

  return result;
};

// 富文本编辑器组件 v2
// 使用全局 React
const React = window.React;
const { useState, useEffect, useRef } = React;

// 等待 wangEditor CDN 加载完成
const wangEditorPromise = new Promise((resolve) => {
  const checkWangEditor = () => {
    // wangEditor 5.x 的导出方式
    if (window.wangEditor && window.wangEditorForReact) {
      console.log('[RichTextEditor] wangEditor 加载完成');
      resolve();
    } else {
      setTimeout(checkWangEditor, 100);
    }
  };
  checkWangEditor();
});

function RichTextEditor({ isOpen, initialContent, onSave, onCancel }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [editor, setEditor] = useState(null);
  const [html, setHtml] = useState(initialContent || '');

  // 等待 wangEditor 加载完成
  useEffect(() => {
    wangEditorPromise.then(() => {
      setIsLoaded(true);
    });
  }, []);

  // 编辑器配置
  const editorConfig = {
    placeholder: '请输入内容...',
    MENU_CONF: {}
  };

  // 工具栏配置
  const toolbarConfig = {
    // 排除一些不需要的工具
    excludeKeys: ['group-video']
  };

  // 及时销毁 editor
  useEffect(() => {
    return () => {
      if (editor == null) return;
      editor.destroy();
      setEditor(null);
    };
  }, [editor]);

  // 当打开编辑器时，设置初始内容
  useEffect(() => {
    if (isOpen) {
      setHtml(initialContent || '');
    }
  }, [isOpen, initialContent]);

  const handleSave = () => {
    if (onSave) {
      onSave(html);
    }
  };

  if (!isOpen) return null;

  // 如果 wangEditor 未加载完成，显示加载中
  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-gray-500">加载富文本编辑器中...</div>
        </div>
      </div>
    );
  }

  // 获取 Editor 和 Toolbar 组件
  const { Editor, Toolbar } = window.wangEditorForReact || {};
  if (!Editor || !Toolbar) {
    console.error('[RichTextEditor] Editor 或 Toolbar 组件未找到');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="text-red-500">编辑器组件加载失败</div>
          <div className="text-xs text-gray-500 mt-2">请检查网络连接并刷新页面</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[95vw] h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">富文本编辑器</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 编辑器容器 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* 工具栏 */}
          <div className="border-b border-gray-200">
            <Toolbar
              editor={editor}
              defaultConfig={toolbarConfig}
              mode="default"
              style={{ borderBottom: '1px solid #f0f0f0' }}
            />
          </div>

          {/* 编辑区域 */}
          <div className="flex-1 overflow-auto bg-white">
            <Editor
              defaultConfig={editorConfig}
              value={html}
              onCreated={setEditor}
              onChange={editor => setHtml(editor.getHtml())}
              mode="default"
              style={{ height: '100%' }}
            />
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            确定提交
          </button>
        </div>
      </div>
    </div>
  );
}

window.RichTextEditor = RichTextEditor;

// 富文本编辑器组件（基于Quill）
// 用于编辑静态文本内容

function RichTextEditor({ isOpen, onClose, initialContent, onSave, title }) {
  const containerRef = React.useRef(null);
  const quillInstanceRef = React.useRef(null);
  const [editorReady, setEditorReady] = React.useState(false);

  // 初始化或重新初始化Quill
  React.useEffect(() => {
    if (!isOpen) {
      // 关闭时清理
      if (quillInstanceRef.current) {
        quillInstanceRef.current = null;
      }
      setEditorReady(false);
      return;
    }

    // 打开时延迟初始化，确保DOM已渲染
    const timer = setTimeout(() => {
      if (!containerRef.current) return;
      
      // 确保Quill已加载
      if (typeof Quill === 'undefined') {
        console.error('Quill未加载');
        return;
      }

      // 清空容器
      containerRef.current.innerHTML = '';
      
      // 创建编辑器容器
      const editorDiv = document.createElement('div');
      editorDiv.style.minHeight = '350px';
      containerRef.current.appendChild(editorDiv);

      // 初始化Quill
      const quill = new Quill(editorDiv, {
        theme: 'snow',
        placeholder: '在这里输入内容...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link', 'image'],
            ['blockquote', 'code-block'],
            ['clean']
          ]
        }
      });

      // 设置初始内容
      if (initialContent && initialContent.trim()) {
        quill.root.innerHTML = initialContent;
      }

      quillInstanceRef.current = quill;
      setEditorReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, initialContent]);

  // 保存内容
  const handleSave = () => {
    if (quillInstanceRef.current) {
      const html = quillInstanceRef.current.root.innerHTML;
      const text = quillInstanceRef.current.getText().trim();
      
      console.log('保存内容:', { html, text }); // 调试用
      
      // 先调用保存
      onSave({
        html: html,
        text: text,
        isEmpty: text.length === 0
      });
    } else {
      console.log('Quill实例不存在');
      onClose();
    }
  };

  // 清空内容
  const handleClear = () => {
    if (quillInstanceRef.current) {
      quillInstanceRef.current.setText('');
    }
  };

  // 插入示例内容
  const insertSample = () => {
    if (quillInstanceRef.current) {
      quillInstanceRef.current.root.innerHTML = `
        <h1>文章标题</h1>
        <p>这是一段正文内容。您可以在这里编辑您的文章。</p>
        <h2>二级标题</h2>
        <p>支持<strong>加粗</strong>、<em>斜体</em>、<u>下划线</u>等格式。</p>
        <ul>
          <li>列表项目 1</li>
          <li>列表项目 2</li>
          <li>列表项目 3</li>
        </ul>
        <blockquote>这是一段引用文字。</blockquote>
        <p>更多内容请继续编辑...</p>
      `;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg shadow-xl w-[900px] max-h-[90vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <span className="text-xl">📝</span>
            <h2 className="text-lg font-semibold text-gray-800">
              {title || '富文本编辑器'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 快捷操作栏 */}
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 flex items-center space-x-2">
          <span className="text-sm text-gray-500">快捷操作：</span>
          <button
            onClick={insertSample}
            className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            插入示例
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            清空内容
          </button>
          {!editorReady && (
            <span className="text-xs text-orange-500">编辑器加载中...</span>
          )}
        </div>

        {/* 编辑器区域 */}
        <div className="flex-1 overflow-auto p-6">
          <div 
            ref={containerRef}
            className="border border-gray-300 rounded bg-white"
            style={{ minHeight: '400px' }}
          />
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-500">
            提示：可使用工具栏设置文字格式，支持插入图片和链接
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-100"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!editorReady}
              className={`px-6 py-2 rounded ${
                editorReady 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              确定保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.RichTextEditor = RichTextEditor;

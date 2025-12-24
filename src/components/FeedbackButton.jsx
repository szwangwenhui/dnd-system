/**
 * DND 反馈按钮组件
 * 悬浮在页面右下角，点击后弹出反馈表单
 * 支持文字描述和截图
 */

function FeedbackButton() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [content, setContent] = React.useState('');
  const [screenshot, setScreenshot] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [capturing, setCapturing] = React.useState(false);

  // 截图功能
  const captureScreenshot = async () => {
    setCapturing(true);
    
    // 暂时隐藏反馈弹窗
    setIsOpen(false);
    
    try {
      // 等待弹窗关闭动画
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 使用 html2canvas 截图（如果可用）
      if (window.html2canvas) {
        const canvas = await window.html2canvas(document.body, {
          logging: false,
          useCORS: true,
          scale: 0.5 // 降低分辨率以减小文件大小
        });
        const dataUrl = canvas.toDataURL('image/png');
        setScreenshot(dataUrl);
      } else {
        // 如果没有 html2canvas，提示用户手动截图
        alert('截图功能需要 html2canvas 库。请手动截图后粘贴描述。');
      }
    } catch (err) {
      console.error('截图失败:', err);
      alert('截图失败，请手动描述问题');
    } finally {
      setCapturing(false);
      setIsOpen(true);
    }
  };

  // 从剪贴板粘贴图片
  const handlePaste = async (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (e) => {
          setScreenshot(e.target.result);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // 提交反馈
  const handleSubmit = async () => {
    if (!content.trim()) {
      alert('请输入反馈内容');
      return;
    }

    setLoading(true);
    try {
      let screenshotUrl = null;
      
      // 如果有截图，先上传
      if (screenshot && window.supabaseStorage) {
        try {
          screenshotUrl = await window.supabaseStorage.uploadScreenshot(screenshot);
        } catch (err) {
          console.error('截图上传失败:', err);
          // 继续提交，只是没有截图
        }
      }

      // 提交反馈
      await window.supabaseFeedback.submit(content, screenshotUrl);
      
      setSuccess(true);
      setContent('');
      setScreenshot(null);
      
      // 3秒后关闭
      setTimeout(() => {
        setSuccess(false);
        setIsOpen(false);
      }, 2000);
    } catch (err) {
      console.error('提交反馈失败:', err);
      alert('提交失败: ' + (err.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 删除截图
  const removeScreenshot = () => {
    setScreenshot(null);
  };

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          right: '24px',
          bottom: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        }}
        title="反馈问题"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      {/* 反馈弹窗 */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
          onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onPaste={handlePaste}
          >
            {/* 标题栏 */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                📝 问题反馈
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '0',
                  lineHeight: '1'
                }}
              >
                ×
              </button>
            </div>

            {/* 内容区 */}
            <div style={{ padding: '24px' }}>
              {success ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: '#dcfce7',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '32px'
                  }}>
                    ✓
                  </div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#166534' }}>提交成功！</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>感谢您的反馈，我们会尽快处理</p>
                </div>
              ) : (
                <>
                  {/* 问题描述 */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      问题描述 <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="请详细描述您遇到的问题或建议..."
                      style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '12px',
                        fontSize: '14px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        resize: 'vertical',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  {/* 截图区域 */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#374151',
                      marginBottom: '8px'
                    }}>
                      截图（可选）
                    </label>
                    
                    {screenshot ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={screenshot}
                          alt="截图预览"
                          style={{
                            width: '100%',
                            borderRadius: '8px',
                            border: '2px solid #e5e7eb'
                          }}
                        />
                        <button
                          onClick={removeScreenshot}
                          style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <div style={{
                        display: 'flex',
                        gap: '12px'
                      }}>
                        <button
                          onClick={captureScreenshot}
                          disabled={capturing}
                          style={{
                            flex: 1,
                            padding: '12px',
                            fontSize: '14px',
                            border: '2px dashed #d1d5db',
                            borderRadius: '8px',
                            background: '#f9fafb',
                            cursor: capturing ? 'not-allowed' : 'pointer',
                            color: '#6b7280',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          📷 {capturing ? '截图中...' : '截取当前页面'}
                        </button>
                      </div>
                    )}
                    <p style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginTop: '8px',
                      marginBottom: 0
                    }}>
                      💡 提示：也可以直接 Ctrl+V 粘贴剪贴板中的截图
                    </p>
                  </div>

                  {/* 提交按钮 */}
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !content.trim()}
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '16px',
                      fontWeight: '600',
                      color: 'white',
                      background: (loading || !content.trim())
                        ? '#9ca3af'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: (loading || !content.trim()) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {loading ? '提交中...' : '提交反馈'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// 导出
window.FeedbackButton = FeedbackButton;
console.log('[DND2] components/FeedbackButton.jsx 加载完成');

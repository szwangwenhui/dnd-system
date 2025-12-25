/**
 * 问题反馈列表组件
 * 功能：
 * - 显示所有用户提交的反馈
 * - 查看截图（点击放大）
 * - 回复功能（类似BBS）
 */

function FeedbackList({ onClose }) {
  const [feedbacks, setFeedbacks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [expandedId, setExpandedId] = React.useState(null); // 展开的反馈ID
  const [replyContent, setReplyContent] = React.useState(''); // 回复内容
  const [replyingId, setReplyingId] = React.useState(null); // 正在回复的反馈ID
  const [submittingReply, setSubmittingReply] = React.useState(false);
  const [imageModal, setImageModal] = React.useState({ show: false, src: '' }); // 图片放大弹窗

  // 加载反馈列表
  React.useEffect(() => {
    loadFeedbacks();
  }, []);

  const loadFeedbacks = async () => {
    setLoading(true);
    setError(null);
    try {
      // 从 Supabase 加载反馈数据
      const { data, error: fetchError } = await window.supabaseClient
        .from('feedbacks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // 为每个反馈加载回复
      const feedbacksWithReplies = await Promise.all(
        (data || []).map(async (feedback) => {
          const { data: replies } = await window.supabaseClient
            .from('feedback_replies')
            .select('*')
            .eq('feedback_id', feedback.id)
            .order('created_at', { ascending: true });
          return { ...feedback, replies: replies || [] };
        })
      );

      setFeedbacks(feedbacksWithReplies);
    } catch (err) {
      console.error('加载反馈失败:', err);
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 提交回复
  const handleSubmitReply = async (feedbackId) => {
    if (!replyContent.trim()) {
      alert('请输入回复内容');
      return;
    }

    setSubmittingReply(true);
    try {
      const currentUser = window.currentUser;
      if (!currentUser) {
        alert('请先登录');
        return;
      }

      const { error: insertError } = await window.supabaseClient
        .from('feedback_replies')
        .insert({
          feedback_id: feedbackId,
          user_id: currentUser.id,
          user_email: currentUser.email,
          content: replyContent.trim(),
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // 清空输入并重新加载
      setReplyContent('');
      setReplyingId(null);
      await loadFeedbacks();
    } catch (err) {
      console.error('回复失败:', err);
      alert('回复失败: ' + err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  // 格式化时间
  const formatTime = (isoString) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 生成显示用的编号（基于创建时间）
  const getDisplayId = (feedback) => {
    if (!feedback.created_at) return feedback.id?.substring(0, 8) || '-';
    const date = new Date(feedback.created_at);
    return date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0') + '-' +
      String(date.getHours()).padStart(2, '0') +
      String(date.getMinutes()).padStart(2, '0');
  };

  // 获取用户显示名
  const getUserDisplayName = (email) => {
    if (!email) return '匿名用户';
    return email.split('@')[0];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col mx-4">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <h2 className="text-xl font-bold text-gray-800">问题反馈列表</h2>
            <span className="text-sm text-gray-500">
              共 {feedbacks.length} 条反馈
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-500">加载中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">加载失败: {error}</div>
              <button
                onClick={loadFeedbacks}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                重试
              </button>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📭</div>
              <div>暂无反馈记录</div>
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacks.map((feedback) => (
                <div
                  key={feedback.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* 反馈主体 */}
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* 头部信息 */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-sm text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            #{getDisplayId(feedback)}
                          </span>
                          <span className="text-sm text-gray-600">
                            👤 {getUserDisplayName(feedback.user_email)}
                          </span>
                          <span className="text-sm text-gray-400">
                            {formatTime(feedback.created_at)}
                          </span>
                        </div>
                        
                        {/* 反馈内容 */}
                        <div className="text-gray-800 whitespace-pre-wrap">
                          {feedback.content}
                        </div>
                      </div>

                      {/* 截图缩略图 */}
                      {feedback.screenshot && (
                        <div
                          className="ml-4 flex-shrink-0 cursor-pointer"
                          onClick={() => setImageModal({ show: true, src: feedback.screenshot })}
                        >
                          <div className="w-16 h-16 bg-gray-200 rounded border-2 border-gray-300 hover:border-blue-400 flex items-center justify-center overflow-hidden">
                            <img
                              src={feedback.screenshot}
                              alt="截图"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="text-xs text-center text-gray-500 mt-1">
                            点击放大
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
                        className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1"
                      >
                        💬 {feedback.replies?.length || 0} 条回复
                        <span>{expandedId === feedback.id ? '▲' : '▼'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setReplyingId(replyingId === feedback.id ? null : feedback.id);
                          setExpandedId(feedback.id);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        ✏️ 回复
                      </button>
                    </div>
                  </div>

                  {/* 回复列表（展开时显示） */}
                  {expandedId === feedback.id && (
                    <div className="border-t border-gray-200">
                      {/* 已有回复 */}
                      {feedback.replies && feedback.replies.length > 0 && (
                        <div className="divide-y divide-gray-100">
                          {feedback.replies.map((reply, index) => (
                            <div key={index} className="p-4 pl-8 bg-white">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {getUserDisplayName(reply.user_email)}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {formatTime(reply.created_at)}
                                </span>
                              </div>
                              <div className="text-gray-600 text-sm whitespace-pre-wrap">
                                {reply.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 回复输入框 */}
                      {replyingId === feedback.id && (
                        <div className="p-4 bg-blue-50 border-t border-blue-100">
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="输入回复内容..."
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button
                              onClick={() => {
                                setReplyingId(null);
                                setReplyContent('');
                              }}
                              className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleSubmitReply(feedback.id)}
                              disabled={submittingReply}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                            >
                              {submittingReply ? '提交中...' : '提交回复'}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 无回复提示 */}
                      {(!feedback.replies || feedback.replies.length === 0) && replyingId !== feedback.id && (
                        <div className="p-4 text-center text-gray-400 text-sm">
                          暂无回复，点击"回复"添加第一条回复
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center flex-shrink-0">
          <span className="text-sm text-gray-500">
            💡 点击截图可放大查看，点击回复可参与讨论
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            关闭
          </button>
        </div>
      </div>

      {/* 图片放大弹窗 */}
      {imageModal.show && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60]"
          onClick={() => setImageModal({ show: false, src: '' })}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <img
              src={imageModal.src}
              alt="截图"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <button
              onClick={() => setImageModal({ show: false, src: '' })}
              className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 shadow-lg"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}

// 导出到全局
window.FeedbackList = FeedbackList;
console.log('[DND2] components/FeedbackList.jsx 加载完成');

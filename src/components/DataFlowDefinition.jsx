// 数据流程定义组件
function DataFlowDefinition({ projectId, onDesignFlow }) {
  const [dataFlows, setDataFlows] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [showViewModal, setShowViewModal] = React.useState(false);
  const [editingFlow, setEditingFlow] = React.useState(null);
  const [viewingFlow, setViewingFlow] = React.useState(null);
  
  // 关联数据
  const [pages, setPages] = React.useState([]);
  const [forms, setForms] = React.useState([]);
  const [pageButtons, setPageButtons] = React.useState([]);
  
  // 表单数据
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    triggerType: 'button',
    triggerConfig: {
      bindPageId: '', bindPageName: '', bindBlockId: '', bindBlockName: '',
      frequency: 'daily', time: '02:00', weekDay: '1', monthDay: '1',
      watchFormId: '', watchFormName: '', changeType: 'any',
      checkFormId: '', checkFormName: '', conditionExpression: '', checkInterval: 'hourly'
    },
    expectedResults: []
  });

  React.useEffect(() => { loadData(); }, [projectId]);

  const loadData = async () => {
    try {
      const flowList = await window.dndDB.getDataFlowsByProjectId(projectId);
      setDataFlows(flowList || []);
      const formList = await window.dndDB.getFormsByProjectId(projectId);
      setForms(formList || []);
      const project = await window.dndDB.getProjectById(projectId);
      const allPages = [];
      if (project && project.roles) {
        for (const role of project.roles) {
          if (role.pages) {
            role.pages.forEach(page => {
              allPages.push({ ...page, roleName: role.name, roleId: role.id });
            });
          }
        }
      }
      setPages(allPages);
    } catch (error) { console.error('加载数据失败:', error); }
  };

  const loadPageButtons = (pageId) => {
    const page = pages.find(p => p.id === pageId);
    if (!page || !page.design || !page.design.blocks) { setPageButtons([]); return; }
    // 筛选按钮和交互类型的区块（中文类型名）
    const buttons = page.design.blocks.filter(block => block.type === '按钮' || block.type === '交互');
    setPageButtons(buttons);
  };

  const openCreateModal = () => {
    setEditingFlow(null);
    setFormData({
      name: '', description: '', triggerType: 'button',
      triggerConfig: {
        bindPageId: '', bindPageName: '', bindBlockId: '', bindBlockName: '',
        frequency: 'daily', time: '02:00', weekDay: '1', monthDay: '1',
        watchFormId: '', watchFormName: '', changeType: 'any',
        checkFormId: '', checkFormName: '', conditionExpression: '', checkInterval: 'hourly'
      },
      expectedResults: []
    });
    setPageButtons([]);
    setShowModal(true);
  };

  const openEditModal = (flow) => {
    setEditingFlow(flow);
    setFormData({
      name: flow.name, description: flow.description || '',
      triggerType: flow.trigger?.type || 'button',
      triggerConfig: flow.trigger?.config || {
        bindPageId: '', bindPageName: '', bindBlockId: '', bindBlockName: '',
        frequency: 'daily', time: '02:00', weekDay: '1', monthDay: '1',
        watchFormId: '', watchFormName: '', changeType: 'any',
        checkFormId: '', checkFormName: '', conditionExpression: '', checkInterval: 'hourly'
      },
      expectedResults: flow.expectedResults || []
    });
    if (flow.trigger?.config?.bindPageId) { loadPageButtons(flow.trigger.config.bindPageId); }
    setShowModal(true);
  };

  const openViewModal = (flow) => { setViewingFlow(flow); setShowViewModal(true); };
  const closeModal = () => { setShowModal(false); setEditingFlow(null); };
  const closeViewModal = () => { setShowViewModal(false); setViewingFlow(null); };

  const updateTriggerConfig = (key, value) => {
    setFormData(prev => ({ ...prev, triggerConfig: { ...prev.triggerConfig, [key]: value } }));
  };

  const handlePageSelect = (pageId) => {
    const page = pages.find(p => p.id === pageId);
    updateTriggerConfig('bindPageId', pageId);
    updateTriggerConfig('bindPageName', page ? page.name : '');
    updateTriggerConfig('bindBlockId', '');
    updateTriggerConfig('bindBlockName', '');
    loadPageButtons(pageId);
  };

  const handleButtonSelect = (blockId) => {
    const block = pageButtons.find(b => b.id === blockId);
    updateTriggerConfig('bindBlockId', blockId);
    // 获取按钮显示文字：优先buttonText，其次content.text，最后用ID
    const displayText = block ? (block.buttonText || block.content?.text || block.id) : '';
    updateTriggerConfig('bindBlockName', displayText);
  };

  const handleWatchFormSelect = (formId) => {
    const form = forms.find(f => f.id === formId);
    updateTriggerConfig('watchFormId', formId);
    updateTriggerConfig('watchFormName', form ? form.name : '');
  };

  const handleCheckFormSelect = (formId) => {
    const form = forms.find(f => f.id === formId);
    updateTriggerConfig('checkFormId', formId);
    updateTriggerConfig('checkFormName', form ? form.name : '');
  };

  const addExpectedResult = (type) => {
    const newResult = {
      id: `RES-${Date.now()}`, type, targetFormId: '', targetFormName: '',
      targetPageId: '', targetPageName: '', notifyType: 'success', message: '', description: ''
    };
    setFormData(prev => ({ ...prev, expectedResults: [...prev.expectedResults, newResult] }));
  };

  const updateExpectedResult = (resultId, key, value) => {
    setFormData(prev => ({
      ...prev,
      expectedResults: prev.expectedResults.map(r => r.id === resultId ? { ...r, [key]: value } : r)
    }));
  };

  const removeExpectedResult = (resultId) => {
    setFormData(prev => ({ ...prev, expectedResults: prev.expectedResults.filter(r => r.id !== resultId) }));
  };

  const handleResultFormSelect = (resultId, formId) => {
    const form = forms.find(f => f.id === formId);
    updateExpectedResult(resultId, 'targetFormId', formId);
    updateExpectedResult(resultId, 'targetFormName', form ? form.name : '');
  };

  const handleResultPageSelect = (resultId, pageId) => {
    const page = pages.find(p => p.id === pageId);
    updateExpectedResult(resultId, 'targetPageId', pageId);
    updateExpectedResult(resultId, 'targetPageName', page ? page.name : '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { alert('请输入流程名称'); return; }
    if (formData.name.trim().length > 10) { alert('流程名称不能超过10个字'); return; }
    if (formData.description && formData.description.length > 200) { alert('流程描述不能超过200个字'); return; }
    // 触发条件已移至开始节点配置，这里不再校验
    try {
      const flowData = {
        name: formData.name.trim(), 
        description: formData.description.trim(),
        // 不再保存触发条件和执行结果，这些在流程设计中配置
        trigger: null,
        expectedResults: []
      };
      if (editingFlow) {
        await window.dndDB.updateDataFlow(projectId, editingFlow.id, flowData);
        alert('数据流程修改成功！请在"设计"中配置触发条件和流程逻辑');
      } else {
        await window.dndDB.addDataFlow(projectId, flowData);
        alert('数据流程添加成功！请点击"设计"配置触发条件和流程逻辑');
      }
      closeModal(); loadData();
    } catch (error) { alert('操作失败：' + error.message); }
  };

  const handleDelete = async (flow) => {
    if (!confirm(`确定要删除数据流程"${flow.name}"吗？`)) return;
    try {
      await window.dndDB.deleteDataFlow(projectId, flow.id);
      alert('删除成功！'); loadData();
    } catch (error) { alert('删除失败：' + error.message); }
  };

  const handleDesign = (flow) => {
    // 跳转到独立的流程编辑器页面
    const flowEditorUrl = `floweditor.html?projectId=${projectId}&flowId=${flow.id}&flowName=${encodeURIComponent(flow.name)}&mode=design`;
    window.location.href = flowEditorUrl;
  };

  const getTriggerTypeText = (type) => {
    const types = { button: '按钮触发', schedule: '定时触发', dataChange: '数据变化', condition: '条件触发' };
    return types[type] || type;
  };

  const getTriggerDescription = (trigger) => {
    if (!trigger) return '-';
    const c = trigger.config || {};
    switch (trigger.type) {
      case 'button': return `${c.bindPageName || '?'} - ${c.bindBlockName || '?'}`;
      case 'schedule':
        const freq = { daily: '每天', weekly: '每周', monthly: '每月', hourly: '每小时' };
        return `${freq[c.frequency] || ''} ${c.time || ''}`;
      case 'dataChange':
        const ct = { any: '任何变化', create: '新增', update: '修改', delete: '删除' };
        return `${c.watchFormName || '?'} ${ct[c.changeType] || ''}`;
      case 'condition': return `${c.checkFormName || '?'}: ${c.conditionExpression || '?'}`;
      default: return '-';
    }
  };

  const getResultsDescription = (results) => {
    if (!results || results.length === 0) return '未设置';
    return results.map(r => {
      switch (r.type) {
        case 'dataCreate': return `新增[${r.targetFormName || '?'}]`;
        case 'dataUpdate': return `更新[${r.targetFormName || '?'}]`;
        case 'dataDelete': return `删除[${r.targetFormName || '?'}]`;
        case 'pageJump': return `跳转[${r.targetPageName || '?'}]`;
        case 'notification': return `通知`;
        default: return r.type;
      }
    }).join(', ');
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">数据流程列表</h3>
        <button onClick={openCreateModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + 添加新数据流程
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">流程编号</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">流程名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">触发条件</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">执行结果</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dataFlows.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">暂无数据流程</td></tr>
            ) : (
              dataFlows.map(flow => (
                <tr key={flow.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 text-sm font-mono">{flow.id}</td>
                  <td className="px-4 py-4 text-sm font-medium">{flow.name}</td>
                  <td className="px-4 py-4 text-sm">
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded mr-1">{getTriggerTypeText(flow.trigger?.type)}</span>
                    <span className="text-gray-600">{getTriggerDescription(flow.trigger)}</span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-600">{getResultsDescription(flow.expectedResults)}</td>
                  <td className="px-4 py-4 text-sm space-x-2">
                    <button onClick={() => handleDesign(flow)} className="text-purple-600 hover:text-purple-900">设计</button>
                    <button onClick={() => openViewModal(flow)} className="text-green-600 hover:text-green-900">查看</button>
                    <button onClick={() => openEditModal(flow)} className="text-blue-600 hover:text-blue-900">修改</button>
                    <button onClick={() => handleDelete(flow)} className="text-red-600 hover:text-red-900">删除</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700"><strong>提示：</strong>数据流程定义包括触发条件和预期结果。点击"设计"进入流程编辑器。</p>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold">{editingFlow ? '修改数据流程' : '添加新数据流程'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-4 space-y-6">
                {/* 基本信息 */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-3">📋 基本信息</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">流程名称 <span className="text-red-500">*</span></label>
                      <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg" placeholder="不超过10个字" maxLength={10} required />
                      <p className="text-xs text-gray-500 mt-1">{formData.name.length}/10</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">流程描述</label>
                      <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg" rows={2} maxLength={200} placeholder="不超过200个字" />
                      <p className="text-xs text-gray-500 mt-1">{formData.description.length}/200</p>
                    </div>
                  </div>
                </div>

                {/* 提示信息 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-500 text-xl">💡</span>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">触发条件和执行结果在哪里设置？</p>
                      <p className="text-blue-600">
                        创建流程后，点击"设计"进入流程编辑器，在<strong>开始节点</strong>中配置触发条件，
                        通过添加各种节点来设计流程的执行逻辑和结果。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50">取消</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">确定提交</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">查看数据流程</h3>
              <button onClick={closeViewModal} className="text-gray-400 hover:text-gray-600">×</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-500">流程编号</label><p className="font-mono">{viewingFlow.id}</p></div>
                <div><label className="text-sm text-gray-500">流程名称</label><p className="font-medium">{viewingFlow.name}</p></div>
              </div>
              <div><label className="text-sm text-gray-500">流程描述</label><p>{viewingFlow.description || '-'}</p></div>
              <div className="border-t pt-4">
                <label className="text-sm text-gray-500">触发条件</label>
                <div className="bg-gray-50 rounded-lg p-3 mt-2">
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">{getTriggerTypeText(viewingFlow.trigger?.type)}</span>
                  <p className="text-sm mt-1">{getTriggerDescription(viewingFlow.trigger)}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <label className="text-sm text-gray-500">执行结果</label>
                {viewingFlow.expectedResults?.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {viewingFlow.expectedResults.map((r, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg p-2 text-sm">
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded mr-2">
                          {r.type === 'dataCreate' && '新增'}{r.type === 'dataUpdate' && '更新'}{r.type === 'dataDelete' && '删除'}
                          {r.type === 'pageJump' && '跳转'}{r.type === 'notification' && '通知'}
                        </span>
                        {r.targetFormName || r.targetPageName || r.message || r.description || '-'}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-400 mt-2">未设置</p>}
              </div>
              <div className="border-t pt-4">
                <label className="text-sm text-gray-500">流程设计</label>
                <p className={viewingFlow.design ? 'text-green-600' : 'text-gray-400'}>
                  {viewingFlow.design ? `已设计（${viewingFlow.design.nodes?.length || 0}个节点）` : '未设计'}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
              <button onClick={closeViewModal} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">关闭</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.DataFlowDefinition = DataFlowDefinition;

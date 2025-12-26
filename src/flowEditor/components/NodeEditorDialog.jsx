// 节点编辑对话框
function NodeEditorDialog({ node, projectId, flowId, flowName, forms, fields, pages, nodes, dataFlows, blocks, onClose, onSave }) {
  const [name, setName] = React.useState(node.name || '');
  const [config, setConfig] = React.useState(JSON.parse(JSON.stringify(node.config || {})));

  const primitive = window.PrimitiveRegistry.get(node.type);

  const handleSave = () => {
    onSave({ name, config });
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
  };

  // 根据节点类型渲染对应的配置表单
  const renderConfigForm = () => {
    switch (node.type) {
      case 'start':
        return (
          <StartNodeConfigForm
            config={config}
            onChange={handleConfigChange}
            pages={pages}
            forms={forms}
            blocks={blocks}
            fields={fields}
          />
        );
      
      case 'end':
        return (
          <EndNodeConfigForm
            config={config}
            onChange={handleConfigChange}
            pages={pages}
          />
        );
      
      case 'read':
        return (
          <ReadNodeConfigForm
            config={config}
            onChange={handleConfigChange}
            projectId={projectId}
            flowId={flowId}
            flowName={flowName}
            nodeId={node.id}
            forms={forms}
            fields={fields}
            pages={pages}
            blocks={blocks}
          />
        );
      
      case 'write':
        return (
          <WriteNodeConfigForm
            config={config}
            onChange={handleConfigChange}
            projectId={projectId}
            flowId={flowId}
            flowName={flowName}
            nodeId={node.id}
            forms={forms}
            fields={fields}
            pages={pages}
            blocks={blocks}
          />
        );
      
      case 'update':
        return (
          <UpdateNodeConfigForm
            config={config}
            onChange={handleConfigChange}
            forms={forms}
            fields={fields}
            pages={pages}
            blocks={blocks}
            projectId={projectId}
            flowId={flowId}
            nodeId={node.id}
          />
        );
      
      case 'delete':
        return (
          <DeleteNodeConfigForm
            config={config}
            onChange={handleConfigChange}
            forms={forms}
            fields={fields}
            pages={pages}
            blocks={blocks}
            projectId={projectId}
            flowId={flowId}
            nodeId={node.id}
          />
        );
      
      case 'binaryBranch':
        return (
          <BinaryBranchConfigForm
            node={{ ...node, config }}
            nodes={nodes}
            flows={dataFlows}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
            projectId={projectId}
            flowId={flowId}
            forms={forms}
          />
        );
      
      case 'multiBranch':
        return (
          <MultiBranchConfigForm
            node={{ ...node, config }}
            nodes={nodes}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
            projectId={projectId}
            flowId={flowId}
          />
        );
      
      case 'prompt':
      case 'alert':
        return (
          <PromptConfigForm
            node={{ ...node, config }}
            nodes={nodes}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
          />
        );
      
      case 'pageJump':
      case 'jump':
        return (
          <JumpConfigForm
            node={{ ...node, config }}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
            projectId={projectId}
            flowId={flowId}
          />
        );
      
      case 'loop':
        return (
          <LoopConfigForm
            node={{ ...node, config }}
            nodes={nodes}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
          />
        );
      
      case 'loopStart':
        return (
          <LoopStartConfigForm
            config={config}
            onChange={handleConfigChange}
            pages={pages}
            forms={forms}
            blocks={blocks}
            fields={fields}
            variables={[]}
            nodes={nodes}
            projectId={projectId}
            flowId={flowId}
          />
        );
      
      case 'loopEnd':
        return (
          <LoopEndConfigForm
            config={config}
            onChange={handleConfigChange}
            nodes={nodes}
          />
        );
      
      case 'continue':
        return (
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-300 mb-2">⏭️ 跳过当前迭代</div>
            <p className="text-xs text-gray-400">
              执行到此节点时，将跳过循环体中剩余的节点，直接进入下一次循环。
            </p>
            <div className="mt-3 text-xs text-blue-400 bg-blue-900/30 rounded p-2">
              💡 此节点必须在循环体内使用
            </div>
          </div>
        );
      
      case 'wait':
        return (
          <WaitConfigForm
            node={{ ...node, config }}
            nodes={nodes}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
          />
        );
      
      case 'break':
        return (
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-300 mb-2">⏹️ 跳出循环</div>
            <p className="text-xs text-gray-400">
              执行到此节点时，将立即结束整个循环，跳转到循环结束节点之后的节点继续执行。
            </p>
            <div className="mt-3 text-xs text-red-400 bg-red-900/30 rounded p-2">
              ⚠️ 此节点必须在循环体内使用
            </div>
          </div>
        );
      
      case 'existCheck':
        return (
          <ExistCheckConfigForm
            node={{ ...node, config }}
            nodes={nodes}
            forms={forms}
            fields={fields}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
            projectId={projectId}
            flowId={flowId}
          />
        );
      
      case 'formatCheck':
        return (
          <FormatCheckConfigForm
            node={{ ...node, config }}
            nodes={nodes}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
            projectId={projectId}
            flowId={flowId}
            forms={forms}
          />
        );
      
      case 'propCheck':
        return (
          <PropCheckConfigForm
            node={{ ...node, config }}
            nodes={nodes}
            forms={forms}
            fields={fields}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
            projectId={projectId}
            flowId={flowId}
          />
        );
      
      case 'calculate':
        return (
          <CalculateConfigForm
            node={{ ...node, config }}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
            projectId={projectId}
            flowId={flowId}
            flowName={flowName}
            forms={forms}
            fields={fields}
          />
        );
      
      case 'aggregate':
        return (
          <AggregateConfigForm
            node={{ ...node, config }}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
          />
        );
      
      case 'apiCall':
        return (
          <ApiCallConfigForm
            node={{ ...node, config }}
            nodes={nodes}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
          />
        );
      
      case 'subFlow':
        return (
          <SubFlowConfigForm
            node={{ ...node, config }}
            dataFlows={dataFlows}
            onUpdate={(updates) => {
              if (updates.config) handleConfigChange(updates.config);
            }}
          />
        );
      
      // 所有节点配置表单已完成
      default:
        return (
          <div className="text-gray-400 text-sm">
            <p className="mb-4">此节点类型的配置表单将在后续阶段开发</p>
            <div className="bg-gray-700 rounded p-3">
              <div className="text-xs text-gray-500 mb-2">当前配置（JSON）：</div>
              <pre className="text-xs text-gray-300 overflow-x-auto">
                {JSON.stringify(config, null, 2)}
              </pre>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl w-[550px] max-h-[85vh] flex flex-col border border-gray-700">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{primitive?.icon || '?'}</span>
            <div>
              <h2 className="text-lg font-semibold text-white">编辑节点</h2>
              <p className="text-sm text-gray-400">{primitive?.name || node.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        
        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* 节点名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">节点名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="输入节点名称"
            />
          </div>
          
          {/* 节点ID（只读） */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">节点ID</label>
            <input
              type="text"
              value={node.id}
              disabled
              className="w-full bg-gray-900 text-gray-500 rounded-lg px-3 py-2 text-sm border border-gray-700 cursor-not-allowed"
            />
          </div>
          
          {/* 分隔线 */}
          <hr className="border-gray-700" />
          
          {/* 配置表单 */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              {primitive?.description || '节点配置'}
            </h3>
            {renderConfigForm()}
          </div>
        </div>
        
        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

window.NodeEditorDialog = NodeEditorDialog;

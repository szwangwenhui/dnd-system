// 数据流程编辑器 - 画布拖拽模式
function FlowEditor({ projectId, flowId, flowName, onBack }) {
  const [flow, setFlow] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  // 关联数据
  const [forms, setForms] = React.useState([]);
  const [pages, setPages] = React.useState([]);
  const [fields, setFields] = React.useState([]);
  const [blocks, setBlocks] = React.useState([]);
  const [dataFlows, setDataFlows] = React.useState([]);
  
  // 节点和连线数据
  const [nodes, setNodes] = React.useState([]);
  const [edges, setEdges] = React.useState([]);
  const [selectedNodeId, setSelectedNodeId] = React.useState(null);
  
  // 画布状态
  const [canvasOffset, setCanvasOffset] = React.useState({ x: 0, y: 0 });
  const [scale, setScale] = React.useState(1);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panStart, setPanStart] = React.useState({ x: 0, y: 0 });
  
  // 拖拽节点状态
  const [draggingNode, setDraggingNode] = React.useState(null);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  
  // 连线状态
  const [connecting, setConnecting] = React.useState(null);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  
  // 右键菜单
  const [contextMenu, setContextMenu] = React.useState(null);
  
  // 编辑对话框
  const [showNodeEditor, setShowNodeEditor] = React.useState(false);
  const [editingNode, setEditingNode] = React.useState(null);
  
  // 变量管理面板
  const [showVariableManager, setShowVariableManager] = React.useState(false);

  const canvasRef = React.useRef(null);

  // 加载数据
  React.useEffect(() => { loadData(); }, [projectId, flowId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const flowData = await window.dndDB.getDataFlowById(projectId, flowId);
      setFlow(flowData);
      
      if (flowData?.design?.nodes) {
        setNodes(flowData.design.nodes);
        setEdges(flowData.design.edges || []);
      } else {
        // 初始化
        setNodes([
          { id: 'N001', type: 'start', name: '开始', x: 300, y: 80, config: {} },
          { id: 'N002', type: 'end', name: '结束', x: 300, y: 400, config: {} }
        ]);
        setEdges([{ id: 'E001', from: 'N001', to: 'N002' }]);
      }
      
      const formList = await window.dndDB.getFormsByProjectId(projectId);
      setForms(formList || []);
      
      const project = await window.dndDB.getProjectById(projectId);
      console.log('=== 项目完整结构 ===');
      console.log('project:', project);
      
      // 获取项目级别的字段定义
      const projectFields = await window.dndDB.getFieldsByProjectId(projectId);
      console.log('项目字段定义:', projectFields);
      
      // 构建字段ID到名称的映射
      const fieldNameMap = {};
      (projectFields || []).forEach(f => {
        fieldNameMap[f.id] = f.name;
      });
      console.log('字段ID->名称映射:', fieldNameMap);
      
      // 从表单的字段引用中构建字段信息，关联字段名称
      const allFields = [];
      formList.forEach(form => {
        const formFields = form.structure?.fields || form.fields || [];
        formFields.forEach(field => {
          const fieldId = field.fieldId || field.id;
          allFields.push({ 
            ...field, 
            formId: form.id, 
            formName: form.name,
            id: fieldId,
            // 从映射中获取字段名称，如果没有则显示ID
            name: fieldNameMap[fieldId] || fieldId
          });
        });
      });
      setFields(allFields);
      console.log('关联后的字段:', allFields);
      
      // 收集页面和区块
      const allPages = [];
      const allBlocks = [];
      project?.roles?.forEach(role => {
        role.pages?.forEach(page => {
          allPages.push({ ...page, roleName: role.name, roleId: role.id });
          // 收集页面中的区块
          page.design?.blocks?.forEach(block => {
            allBlocks.push({ ...block, pageId: page.id, pageName: page.name, roleName: role.name });
          });
        });
      });
      setPages(allPages);
      setBlocks(allBlocks);
      
      // 调试日志
      console.log('=== 流程编辑器数据加载 ===');
      console.log('pages:', allPages);
      console.log('blocks:', allBlocks);
      console.log('forms:', formList);
      
      // 加载数据流程列表
      const flows = await window.dndDB.getDataFlowsByProjectId(projectId);
      setDataFlows(flows || []);
      
      setLoading(false);
    } catch (error) {
      console.error('加载失败:', error);
      alert('加载失败：' + error.message);
      setLoading(false);
    }
  };

  // 保存
  // 校验节点配置完整性
  const validateNodeConfigs = () => {
    const errors = [];
    
    for (const node of nodes) {
      const config = node.config || {};
      
      switch (node.type) {
        case 'start':
          if (!config.triggerType) {
            errors.push(`开始节点 [${node.name || node.id}]：未配置触发方式`);
          } else if (config.triggerType === 'button') {
            // 按钮触发时，页面和按钮为可选项，不再强制验证
            // 可以在页面设计时通过"流程按钮"关联流程
          } else if (config.triggerType === 'dataChange') {
            if (!config.dataChangeConfig?.formId) {
              errors.push(`开始节点 [${node.name || node.id}]：数据变化触发需要选择监听表单`);
            }
          } else if (config.triggerType === 'condition' || config.triggerType === 'interval') {
            if (!config.conditionConfig?.formId && !config.intervalConfig?.formId) {
              errors.push(`开始节点 [${node.name || node.id}]：条件满足触发需要选择检查表单`);
            }
          }
          break;
          
        case 'read':
          if (config.sourceType === 'page') {
            if (!config.pageSource?.pageId || !config.pageSource?.blockId) {
              errors.push(`读取节点 [${node.name || node.id}]：页面输入框模式需要选择页面和区块`);
            }
          } else if (config.sourceType === 'form') {
            if (!config.formSource?.formId) {
              errors.push(`读取节点 [${node.name || node.id}]：后台表单模式需要选择表单`);
            }
          }
          if (!config.outputVar) {
            errors.push(`读取节点 [${node.name || node.id}]：需要创建输出变量`);
          }
          break;
          
        case 'write':
          if (!config.formId) {
            errors.push(`写入节点 [${node.name || node.id}]：需要选择目标表单`);
          }
          break;
          
        case 'update':
          if (!config.formId) {
            errors.push(`更新节点 [${node.name || node.id}]：需要选择目标表单`);
          }
          break;
          
        case 'delete':
          if (!config.formId) {
            errors.push(`删除节点 [${node.name || node.id}]：需要选择目标表单`);
          }
          break;
          
        case 'existCheck':
          if (!config.sourceVariableId) {
            errors.push(`存在性校验节点 [${node.name || node.id}]：需要选择校验对象变量`);
          }
          if (!config.targetFormId) {
            errors.push(`存在性校验节点 [${node.name || node.id}]：需要选择目标表单`);
          }
          if (!config.matchRules || config.matchRules.length === 0) {
            errors.push(`存在性校验节点 [${node.name || node.id}]：需要添加匹配规则`);
          }
          break;
          
        case 'binaryBranch':
          if (!config.leftVariableId) {
            errors.push(`是非分叉节点 [${node.name || node.id}]：需要配置判断条件`);
          }
          break;
          
        case 'alert':
        case 'prompt':
          if (!config.message) {
            errors.push(`提示节点 [${node.name || node.id}]：需要配置提示内容`);
          }
          break;
          
        case 'jump':
        case 'pageJump':
          if (!config.targetPageId) {
            errors.push(`跳转节点 [${node.name || node.id}]：需要选择目标页面`);
          }
          break;
          
        // end节点不需要配置
        case 'end':
          break;
          
        default:
          // 其他节点类型暂不校验
          break;
      }
    }
    
    return errors;
  };

  const handleSave = async () => {
    // 先校验节点配置
    const errors = validateNodeConfigs();
    
    if (errors.length > 0) {
      const message = '以下节点配置不完整：\n\n' + errors.join('\n');
      const proceed = confirm(message + '\n\n是否仍要保存？（不完整的节点可能无法正常执行）');
      if (!proceed) return;
    }
    
    try {
      await window.dndDB.saveDataFlowDesign(projectId, flowId, {
        nodes, edges, updatedAt: new Date().toISOString()
      });
      alert('保存成功！');
    } catch (error) {
      alert('保存失败：' + error.message);
    }
  };

  // 生成ID
  const generateNodeId = () => {
    const maxNum = nodes.reduce((max, n) => {
      const match = n.id.match(/N(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return 'N' + (maxNum + 1).toString().padStart(3, '0');
  };

  const generateEdgeId = () => {
    const maxNum = edges.reduce((max, e) => {
      const match = e.id.match(/E(\d+)/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    return 'E' + (maxNum + 1).toString().padStart(3, '0');
  };

  // 从工具栏拖入新节点
  const handleDropNewNode = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== handleDropNewNode 触发 ===');
    
    // 尝试多种方式获取 primitiveId
    let primitiveId = e.dataTransfer.getData('primitiveId');
    if (!primitiveId) {
      primitiveId = e.dataTransfer.getData('text/plain');
      console.log('从 text/plain 获取:', primitiveId);
    }
    if (!primitiveId) {
      primitiveId = e.dataTransfer.getData('text');
      console.log('从 text 获取:', primitiveId);
    }
    
    console.log('最终 primitiveId:', primitiveId);
    console.log('dataTransfer types:', e.dataTransfer.types);
    
    if (!primitiveId) {
      console.log('没有 primitiveId，返回');
      return;
    }
    
    const primitive = window.PrimitiveRegistry.get(primitiveId);
    console.log('primitive:', primitive);
    if (!primitive) {
      console.log('找不到原语，返回');
      return;
    }
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasOffset.x) / scale;
    const y = (e.clientY - rect.top - canvasOffset.y) / scale;
    
    const newNode = {
      id: generateNodeId(),
      type: primitiveId,
      name: primitive.name,
      x: Math.round(x / 20) * 20,
      y: Math.round(y / 20) * 20,
      config: { ...primitive.defaultConfig }
    };
    
    console.log('创建新节点:', newNode);
    
    if (primitive.isBranch && primitive.branchType === 'binary') {
      newNode.branches = { yes: null, no: null };
    }
    
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
    console.log('节点添加完成');
  };

  // 画布拖动
  const handleCanvasMouseDown = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-grid')) {
      if (e.shiftKey || e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
      } else {
        setSelectedNodeId(null);
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: (e.clientX - rect.left - canvasOffset.x) / scale,
        y: (e.clientY - rect.top - canvasOffset.y) / scale
      });
    }
    
    if (isPanning) {
      setCanvasOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    
    if (draggingNode) {
      const x = (e.clientX - rect.left - canvasOffset.x) / scale - dragOffset.x;
      const y = (e.clientY - rect.top - canvasOffset.y) / scale - dragOffset.y;
      setNodes(nodes.map(n => n.id === draggingNode ? { ...n, x: Math.round(x / 20) * 20, y: Math.round(y / 20) * 20 } : n));
    }
  };

  const handleCanvasMouseUp = (e) => {
    setIsPanning(false);
    setDraggingNode(null);
    
    // 如果正在连线，检查是否在某个节点的输入点上松开
    if (connecting) {
      // 检查鼠标位置是否在某个节点的输入点范围内
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - canvasOffset.x) / scale;
      const mouseY = (e.clientY - rect.top - canvasOffset.y) / scale;
      
      // 遍历所有节点，检查是否在输入点范围内
      let targetNodeId = null;
      for (const node of nodes) {
        if (node.id === connecting.nodeId) continue; // 跳过源节点
        if (node.type === 'start') continue; // 开始节点没有输入点
        
        // 输入点位置：节点顶部中间
        const inputX = node.x + 60; // 节点宽度120，中心点在60
        const inputY = node.y - 4;  // 输入点在节点上方
        
        // 检查鼠标是否在输入点附近（30px范围内）
        const distance = Math.sqrt(Math.pow(mouseX - inputX, 2) + Math.pow(mouseY - inputY, 2));
        if (distance < 30) {
          targetNodeId = node.id;
          break;
        }
      }
      
      if (targetNodeId) {
        // 在输入点上松开，创建连线
        console.log('在输入点上松开，目标节点:', targetNodeId);
        completeConnection(targetNodeId);
      } else {
        // 不在输入点上，取消连线
        console.log('取消连线');
        setConnecting(null);
      }
    }
  };

  // 节点拖动
  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - canvasOffset.x) / scale;
    const y = (e.clientY - rect.top - canvasOffset.y) / scale;
    
    setDraggingNode(nodeId);
    setDragOffset({ x: x - node.x, y: y - node.y });
    setSelectedNodeId(nodeId);
  };

  // 连线操作 - 从输出点开始
  const handleOutputClick = (e, nodeId, outputType) => {
    e.stopPropagation();
    console.log('开始连线，从节点:', nodeId, '输出类型:', outputType);
    setConnecting({ nodeId, outputType });
  };

  // 连线操作 - 点击输入点完成
  const handleInputClick = (e, nodeId) => {
    e.stopPropagation();
    completeConnection(nodeId);
  };

  // 连线操作 - 鼠标松开在输入点上完成
  const handleInputMouseUp = (e, nodeId) => {
    e.stopPropagation();
    completeConnection(nodeId);
  };

  // 完成连线的共用逻辑
  const completeConnection = (targetNodeId) => {
    if (connecting && connecting.nodeId !== targetNodeId) {
      // 检查是否已存在连线
      const exists = edges.some(edge => 
        edge.from === connecting.nodeId && edge.to === targetNodeId
      );
      if (!exists) {
        const newEdge = {
          id: generateEdgeId(),
          from: connecting.nodeId,
          to: targetNodeId,
          fromOutput: connecting.outputType || 'default'
        };
        console.log('创建连线:', newEdge);
        setEdges([...edges, newEdge]);
      }
    }
    setConnecting(null);
  };

  // 删除节点
  const handleDeleteNode = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    const primitive = window.PrimitiveRegistry.get(node?.type);
    if (primitive?.canDelete === false) {
      alert('此节点不能删除');
      return;
    }
    setNodes(nodes.filter(n => n.id !== nodeId));
    setEdges(edges.filter(e => e.from !== nodeId && e.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // 删除连线
  const handleDeleteEdge = (edgeId) => {
    setEdges(edges.filter(e => e.id !== edgeId));
  };

  // 缩放
  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setScale(Math.min(2, Math.max(0.3, scale + delta)));
    }
  };

  // 导出
  const handleExport = () => {
    let doc = `# 数据流程：${flow?.name || '未命名'}\n\n`;
    doc += `## 节点列表\n\n| ID | 名称 | 类型 |\n|---|---|---|\n`;
    nodes.forEach(n => {
      const p = window.PrimitiveRegistry.get(n.type);
      doc += `| ${n.id} | ${n.name} | ${p?.icon || ''} ${p?.name || n.type} |\n`;
    });
    doc += `\n## 连线\n\n`;
    edges.forEach(e => doc += `- ${e.from} → ${e.to}\n`);
    
    const blob = new Blob([doc], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `流程_${flow?.name || flowId}.md`;
    a.click();
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-400">加载中...</div>;
  }

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* 顶部工具栏 */}
      <div className="h-12 bg-gray-800 border-b border-gray-700 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="text-gray-400 hover:text-white flex items-center space-x-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>返回</span>
          </button>
          <div className="h-4 w-px bg-gray-600"></div>
          <h1 className="text-white font-medium">{flowName || flow?.name || '未命名流程'}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-sm">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(Math.min(2, scale + 0.1))} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          </button>
          <button onClick={() => setScale(Math.max(0.3, scale - 0.1))} className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
          </button>
          <div className="h-4 w-px bg-gray-600 mx-2"></div>
          <button 
            onClick={() => setShowVariableManager(true)} 
            className="px-3 py-1.5 text-gray-300 hover:text-white border border-gray-600 rounded hover:bg-gray-700 text-sm flex items-center gap-1"
            title="管理中间变量"
          >
            <span>📦</span>
            <span>变量</span>
          </button>
          <button onClick={handleExport} className="px-3 py-1.5 text-gray-300 hover:text-white border border-gray-600 rounded hover:bg-gray-700 text-sm">
            导出
          </button>
          <button onClick={handleSave} className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            保存
          </button>
        </div>
      </div>
      
      {/* 主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧工具栏 */}
        <div className="w-14 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-3 space-y-1 flex-shrink-0">
          <PrimitiveToolbar />
        </div>
        
        {/* 中间画布 */}
        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden cursor-default"
          style={{ backgroundColor: '#1a1a2e' }}
          onMouseDown={(e) => {
            handleCanvasMouseDown(e);
            if (contextMenu) setContextMenu(null); // 点击关闭右键菜单
          }}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()} // 禁用画布默认右键菜单
          onDrop={(e) => {
            console.log('画布收到drop事件');
            handleDropNewNode(e);
          }}
          onDragOver={(e) => { 
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            console.log('画布收到dragEnter事件');
          }}
        >
          {/* 网格背景 - 不拦截指针事件 */}
          <div 
            className="canvas-grid absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
              `,
              backgroundSize: `${20 * scale}px ${20 * scale}px`,
              backgroundPosition: `${canvasOffset.x}px ${canvasOffset.y}px`
            }}
          />
          
          {/* 节点和连线层 - 允许拖放事件穿透 */}
          <div 
            style={{ transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${scale})`, transformOrigin: '0 0' }}
            onDrop={(e) => {
              console.log('节点层收到drop事件');
              handleDropNewNode(e);
            }}
            onDragOver={(e) => { 
              e.preventDefault(); 
              e.dataTransfer.dropEffect = 'copy';
            }}
          >
            {/* SVG连线 - 带右键菜单 */}
            <svg 
              className="absolute top-0 left-0" 
              style={{ width: 2000, height: 2000, overflow: 'visible' }}
            >
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#4B5563" />
                </marker>
              </defs>
              {edges.map(edge => {
                const fromNode = nodes.find(n => n.id === edge.from);
                const toNode = nodes.find(n => n.id === edge.to);
                if (!fromNode || !toNode) return null;
                
                // 使用动态连接点计算
                let x1, y1, x2, y2, pathD;
                let fromSide = 'bottom';
                let toSide = 'top';
                
                if (window.FlowConnectionUtils) {
                  const ports = window.FlowConnectionUtils.calcBestPorts(fromNode, toNode, edge.fromOutput);
                  x1 = ports.fromPos.x;
                  y1 = ports.fromPos.y;
                  x2 = ports.toPos.x;
                  y2 = ports.toPos.y;
                  fromSide = ports.fromOutput;
                  toSide = ports.toInput;
                  pathD = window.FlowConnectionUtils.generatePath(ports.fromPos, ports.toPos, fromSide, toSide);
                } else {
                  // 回退到原来的固定位置计算
                  x1 = fromNode.x + 60;
                  y1 = fromNode.y + 70;  // 节点底部
                  x2 = toNode.x + 60;
                  y2 = toNode.y;  // 节点顶部
                  const midY = (y1 + y2) / 2;
                  pathD = `M${x1},${y1} C${x1},${midY} ${x2},${midY} ${x2},${y2}`;
                }
                
                return (
                  <g key={edge.id}>
                    {/* 透明的宽击中区域 - 用于右键菜单 */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="15"
                      style={{ cursor: 'pointer' }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContextMenu({
                          type: 'edge',
                          id: edge.id,
                          x: e.clientX,
                          y: e.clientY
                        });
                      }}
                    />
                    {/* 可见的连线 */}
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#4B5563"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                      style={{ pointerEvents: 'none' }}
                    />
                    {edge.fromOutput && edge.fromOutput !== 'default' && (
                      <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 10} fill="#9CA3AF" fontSize="10" textAnchor="middle">
                        {edge.fromOutput === 'yes' ? '是' : edge.fromOutput === 'no' ? '否' : edge.fromOutput}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* 正在连线 */}
              {connecting && (() => {
                const fromNode = nodes.find(n => n.id === connecting.nodeId);
                if (!fromNode) return null;
                
                // 计算动态起点
                let startX, startY;
                if (window.FlowConnectionUtils) {
                  // 临时计算到鼠标位置的最佳输出点
                  const tempTarget = { x: mousePos.x - 60, y: mousePos.y - 35, type: 'temp' };
                  const ports = window.FlowConnectionUtils.calcBestPorts(fromNode, tempTarget, connecting.outputType);
                  startX = ports.fromPos.x;
                  startY = ports.fromPos.y;
                } else {
                  startX = fromNode.x + 60;
                  startY = fromNode.y + 70;
                }
                
                return (
                  <>
                    <path
                      d={`M${startX},${startY} L${mousePos.x},${mousePos.y}`}
                      fill="none"
                      stroke="#60A5FA"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                    />
                    <circle cx={mousePos.x} cy={mousePos.y} r="8" fill="#60A5FA" opacity="0.5" />
                  </>
                );
              })()}
            </svg>
            
            {/* 节点 */}
            {nodes.map(node => {
              // 计算该节点的连接点位置
              let inputSide = 'top';
              let outputSide = 'bottom';
              let secondaryInputSide = null;
              
              // 根据连线计算最佳位置
              if (window.FlowConnectionUtils) {
                // 找到连入该节点的边
                const incomingEdges = edges.filter(e => e.to === node.id);
                // 找到从该节点连出的边
                const outgoingEdges = edges.filter(e => e.from === node.id);
                
                // 如果有连入的边，使用第一条边来决定输入位置
                if (incomingEdges.length > 0) {
                  const firstIncoming = incomingEdges[0];
                  const fromNode = nodes.find(n => n.id === firstIncoming.from);
                  if (fromNode) {
                    const ports = window.FlowConnectionUtils.calcBestPorts(fromNode, node, firstIncoming.fromOutput);
                    inputSide = ports.toInput;
                  }
                }
                
                // 如果有连出的边，使用第一条边来决定输出位置
                if (outgoingEdges.length > 0) {
                  const firstOutgoing = outgoingEdges[0];
                  const toNode = nodes.find(n => n.id === firstOutgoing.to);
                  if (toNode) {
                    const ports = window.FlowConnectionUtils.calcBestPorts(node, toNode, firstOutgoing.fromOutput);
                    outputSide = ports.fromOutput;
                  }
                }
                
                // 循环节点的第二输入点
                const isLoop = node.type === 'loop' || node.type === 'loopStart';
                if (isLoop) {
                  secondaryInputSide = 'left';
                }
              }
              
              return (
                <FlowNode
                  key={node.id}
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  isConnecting={!!connecting}
                  inputSide={inputSide}
                  outputSide={outputSide}
                  secondaryInputSide={secondaryInputSide}
                  onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                  onDoubleClick={() => { setEditingNode(node); setShowNodeEditor(true); }}
                  onOutputClick={(e, type) => handleOutputClick(e, node.id, type)}
                  onInputClick={(e) => handleInputClick(e, node.id)}
                  onInputMouseUp={(e) => handleInputMouseUp(e, node.id)}
                  onDelete={() => handleDeleteNode(node.id)}
                />
              );
            })}
          </div>
          
          {/* 操作提示 */}
          <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-gray-800/80 px-3 py-2 rounded-lg">
            {connecting ? (
              <span className="text-blue-400">🔗 拖到目标节点顶部松开完成连线，或点击空白处取消</span>
            ) : (
              <span>💡 拖拽节点下方圆点创建连线 | 右键点击连线删除 | 双击节点编辑</span>
            )}
          </div>
        </div>
        
        {/* 右键菜单 - 放在画布外面避免事件冲突 */}
        {contextMenu && (
          <div 
            className="fixed bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1"
            style={{ left: contextMenu.x, top: contextMenu.y, zIndex: 9999 }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'edge' && (
              <button
                className="w-full px-4 py-2 text-left text-sm text-gray-200 hover:bg-red-600 flex items-center space-x-2"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('删除连线:', contextMenu.id);
                  handleDeleteEdge(contextMenu.id);
                  setContextMenu(null);
                }}
              >
                <span>🗑</span>
                <span>删除连线</span>
              </button>
            )}
          </div>
        )}
        
        {/* 右侧属性面板 */}
        <div className="w-96 bg-gray-800 border-l border-gray-700 flex-shrink-0 overflow-y-auto">
          <NodePropertiesPanel
            node={selectedNode}
            forms={forms}
            fields={fields}
            pages={pages}
            nodes={nodes}
            onUpdate={(updates) => {
              if (selectedNode) {
                setNodes(nodes.map(n => n.id === selectedNode.id ? { ...n, ...updates } : n));
              }
            }}
            onEdit={() => { if (selectedNode) { setEditingNode(selectedNode); setShowNodeEditor(true); }}}
            onDelete={() => { if (selectedNode) handleDeleteNode(selectedNode.id); }}
          />
        </div>
      </div>
      
      {/* 编辑对话框 */}
      {showNodeEditor && editingNode && (
        <NodeEditorDialog
          node={editingNode}
          projectId={projectId}
          flowId={flowId}
          flowName={flowName || flow?.name}
          forms={forms}
          fields={fields}
          pages={pages}
          blocks={blocks}
          nodes={nodes}
          dataFlows={dataFlows}
          onClose={() => { setShowNodeEditor(false); setEditingNode(null); }}
          onSave={(updates) => {
            setNodes(nodes.map(n => n.id === editingNode.id ? { ...n, ...updates } : n));
            setShowNodeEditor(false);
            setEditingNode(null);
          }}
        />
      )}
      
      {/* 变量管理面板 */}
      {showVariableManager && (
        <VariableManagerPanel
          projectId={projectId}
          onClose={() => setShowVariableManager(false)}
        />
      )}
    </div>
  );
}

window.FlowEditor = FlowEditor;

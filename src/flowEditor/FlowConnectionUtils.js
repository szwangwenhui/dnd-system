/**
 * 流程节点连接点位置计算工具
 * 
 * 规则：
 * 1. 普通节点（单输入单输出）：6种合法组合
 *    - 输入上 + 输出下/左/右
 *    - 输入左 + 输出右/下
 *    - 输入右 + 输出下
 * 
 * 2. 多条件分支节点（单输入多输出）：
 *    - 输入固定在上边
 *    - 输出分布在左、右、下
 * 
 * 3. 多输入节点/汇合节点：
 *    - 输入分布在上、左
 *    - 输出分布在右、下
 * 
 * 4. 循环节点（双输入单输出）：
 *    - 初始输入固定在上边
 *    - 循环输入固定在左边
 *    - 输出在右或下
 * 
 * 5. 特殊节点：
 *    - 开始节点：只有输出，可在下/左/右
 *    - 结束节点：只有输入，可在上/左/右
 */

const FlowConnectionUtils = {
  // 节点尺寸常量（缩小到70%）
  NODE_WIDTH: 84,
  NODE_HEIGHT: 50,  // 包含头部和内容
  
  // 获取连接点在节点边上的位置
  getPortPosition(node, side) {
    const { x, y } = node;
    const w = this.NODE_WIDTH;
    const h = this.NODE_HEIGHT;
    
    switch (side) {
      case 'top':
        return { x: x + w / 2, y: y };
      case 'bottom':
        return { x: x + w / 2, y: y + h };
      case 'left':
        return { x: x, y: y + h / 2 };
      case 'right':
        return { x: x + w, y: y + h / 2 };
      default:
        return { x: x + w / 2, y: y + h };
    }
  },
  
  // 普通节点的合法输入/输出组合
  validCombinations: [
    { input: 'top', output: 'bottom' },    // 上进下出（最优）
    { input: 'top', output: 'left' },      // 上进左出
    { input: 'top', output: 'right' },     // 上进右出
    { input: 'left', output: 'right' },    // 左进右出
    { input: 'left', output: 'bottom' },   // 左进下出
    { input: 'right', output: 'bottom' }   // 右进下出
  ],
  
  // 计算两点之间的距离
  calcDistance(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  },
  
  // 获取节点类型信息
  getNodeTypeInfo(node) {
    const primitive = window.PrimitiveRegistry?.get(node.type);
    
    return {
      isStart: node.type === 'start',
      isEnd: node.type === 'end',
      isBranch: primitive?.isBranch || false,
      branchType: primitive?.branchType || null,  // 'binary' 或 'multi'
      isLoop: node.type === 'loop' || node.type === 'loopStart',
      isMultiInput: primitive?.isMultiInput || false,
      hasInput: primitive?.connections?.hasInput !== false && node.type !== 'start',
      hasOutput: primitive?.connections?.hasOutput !== false && node.type !== 'end'
    };
  },
  
  // 获取节点的固定连接点配置（特殊节点）
  getFixedPorts(node) {
    const info = this.getNodeTypeInfo(node);
    
    // 开始节点：只有输出，不能在上边
    if (info.isStart) {
      return {
        inputSides: [],
        outputSides: ['bottom', 'left', 'right'],
        defaultOutput: 'bottom'
      };
    }
    
    // 结束节点：只有输入，不能在下边
    if (info.isEnd) {
      return {
        inputSides: ['top', 'left', 'right'],
        outputSides: [],
        defaultInput: 'top'
      };
    }
    
    // 多条件分支：输入固定上边，输出在左右下
    if (info.isBranch && info.branchType === 'multi') {
      return {
        inputSides: ['top'],
        outputSides: ['left', 'bottom', 'right'],
        fixedInput: 'top'
      };
    }
    
    // 二元分支（是/否）：输入固定上边，两个输出在下边两侧
    if (info.isBranch && info.branchType === 'binary') {
      return {
        inputSides: ['top'],
        outputSides: ['bottom'],  // 特殊处理，两个输出点都在下边
        fixedInput: 'top',
        binaryOutputs: true
      };
    }
    
    // 循环节点：初始输入上边，循环输入左边，输出右或下
    if (info.isLoop) {
      return {
        inputSides: ['top', 'left'],  // top=初始, left=循环
        outputSides: ['right', 'bottom'],
        fixedInputs: { initial: 'top', loop: 'left' }
      };
    }
    
    // 多输入节点：输入在上和左，输出在右和下
    if (info.isMultiInput) {
      return {
        inputSides: ['top', 'left'],
        outputSides: ['right', 'bottom']
      };
    }
    
    // 普通节点：使用合法组合
    return null;
  },
  
  // 为两个节点之间的连线计算最佳连接点位置
  calcBestPorts(fromNode, toNode, fromOutputType = 'default') {
    const fromInfo = this.getNodeTypeInfo(fromNode);
    const toInfo = this.getNodeTypeInfo(toNode);
    const fromFixed = this.getFixedPorts(fromNode);
    const toFixed = this.getFixedPorts(toNode);
    
    // 默认值
    let bestFromOutput = 'bottom';
    let bestToInput = 'top';
    
    // 处理特殊节点
    
    // 开始节点的输出
    if (fromInfo.isStart) {
      bestFromOutput = this.calcBestOutputForStart(fromNode, toNode);
    }
    
    // 结束节点的输入
    if (toInfo.isEnd) {
      bestToInput = this.calcBestInputForEnd(fromNode, toNode);
    }
    
    // 二元分支的输出（是/否）
    if (fromFixed?.binaryOutputs) {
      // 保持在底部，但计算哪个更近
      bestFromOutput = 'bottom';
      bestToInput = this.calcBestInputForTarget(fromNode, toNode, ['top', 'left', 'right']);
    }
    
    // 多条件分支的输出
    else if (fromFixed?.fixedInput === 'top' && fromFixed.outputSides) {
      bestFromOutput = this.calcBestSide(fromNode, toNode, fromFixed.outputSides);
      bestToInput = this.calcBestInputForTarget(fromNode, toNode, toFixed?.inputSides || ['top', 'left', 'right']);
    }
    
    // 循环节点
    else if (toFixed?.fixedInputs) {
      // 根据连线类型决定输入点
      if (fromOutputType === 'loop' || fromOutputType === 'loopBack') {
        bestToInput = 'left';  // 循环跳回
      } else {
        bestToInput = 'top';   // 初始进入
      }
      bestFromOutput = this.calcBestOutputForSource(fromNode, toNode, fromFixed?.outputSides || ['bottom', 'left', 'right']);
    }
    
    // 普通节点：找最短距离的合法组合
    else if (!fromFixed && !toFixed) {
      const result = this.calcBestCombination(fromNode, toNode);
      bestFromOutput = result.output;
      bestToInput = result.input;
    }
    
    // 混合情况
    else {
      if (fromFixed) {
        bestFromOutput = this.calcBestSide(fromNode, toNode, fromFixed.outputSides || ['bottom']);
      }
      if (toFixed) {
        bestToInput = this.calcBestSide(toNode, fromNode, toFixed.inputSides || ['top']);
      }
      
      // 如果还是默认，使用普通计算
      if (!fromFixed) {
        const validOutputs = this.getValidOutputsForInput(bestToInput);
        bestFromOutput = this.calcBestSide(fromNode, toNode, validOutputs);
      }
      if (!toFixed) {
        const validInputs = this.getValidInputsForOutput(bestFromOutput);
        bestToInput = this.calcBestSide(toNode, fromNode, validInputs);
      }
    }
    
    return {
      fromOutput: bestFromOutput,
      toInput: bestToInput,
      fromPos: this.getPortPosition(fromNode, bestFromOutput),
      toPos: this.getPortPosition(toNode, bestToInput)
    };
  },
  
  // 为开始节点计算最佳输出方向
  calcBestOutputForStart(startNode, targetNode) {
    const validSides = ['bottom', 'left', 'right'];
    return this.calcBestSide(startNode, targetNode, validSides);
  },
  
  // 为结束节点计算最佳输入方向
  calcBestInputForEnd(sourceNode, endNode) {
    const validSides = ['top', 'left', 'right'];
    return this.calcBestSide(endNode, sourceNode, validSides);
  },
  
  // 计算目标节点的最佳输入方向
  calcBestInputForTarget(fromNode, toNode, validSides) {
    return this.calcBestSide(toNode, fromNode, validSides);
  },
  
  // 计算源节点的最佳输出方向
  calcBestOutputForSource(fromNode, toNode, validSides) {
    return this.calcBestSide(fromNode, toNode, validSides);
  },
  
  // 从可选边中选择最接近目标的边
  calcBestSide(node, targetNode, validSides) {
    if (!validSides || validSides.length === 0) return 'bottom';
    if (validSides.length === 1) return validSides[0];
    
    const targetCenter = {
      x: targetNode.x + this.NODE_WIDTH / 2,
      y: targetNode.y + this.NODE_HEIGHT / 2
    };
    
    let bestSide = validSides[0];
    let minDist = Infinity;
    
    for (const side of validSides) {
      const pos = this.getPortPosition(node, side);
      const dist = this.calcDistance(pos, targetCenter);
      if (dist < minDist) {
        minDist = dist;
        bestSide = side;
      }
    }
    
    return bestSide;
  },
  
  // 普通节点：找最短距离的合法组合
  calcBestCombination(fromNode, toNode) {
    let bestOutput = 'bottom';
    let bestInput = 'top';
    let minDist = Infinity;
    
    for (const combo of this.validCombinations) {
      const fromPos = this.getPortPosition(fromNode, combo.output);
      const toPos = this.getPortPosition(toNode, combo.input);
      const dist = this.calcDistance(fromPos, toPos);
      
      if (dist < minDist) {
        minDist = dist;
        bestOutput = combo.output;
        bestInput = combo.input;
      }
    }
    
    return { output: bestOutput, input: bestInput };
  },
  
  // 给定输入位置，获取合法的输出位置列表
  getValidOutputsForInput(inputSide) {
    switch (inputSide) {
      case 'top':
        return ['bottom', 'left', 'right'];
      case 'left':
        return ['right', 'bottom'];
      case 'right':
        return ['bottom'];
      default:
        return ['bottom'];
    }
  },
  
  // 给定输出位置，获取合法的输入位置列表
  getValidInputsForOutput(outputSide) {
    switch (outputSide) {
      case 'bottom':
        return ['top', 'left', 'right'];
      case 'left':
        return ['top'];
      case 'right':
        return ['top', 'left'];
      default:
        return ['top'];
    }
  },
  
  // 为所有连线计算连接点位置
  calcAllEdgePorts(nodes, edges) {
    const edgePorts = {};
    
    for (const edge of edges) {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (!fromNode || !toNode) continue;
      
      const ports = this.calcBestPorts(fromNode, toNode, edge.fromOutput);
      edgePorts[edge.id] = ports;
    }
    
    return edgePorts;
  },
  
  // 生成贝塞尔曲线路径
  generatePath(fromPos, toPos, fromSide, toSide) {
    const { x: x1, y: y1 } = fromPos;
    const { x: x2, y: y2 } = toPos;
    
    // 控制点偏移量
    const offset = Math.min(80, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2) || 40;
    
    // 根据连接点方向计算控制点
    let cp1x, cp1y, cp2x, cp2y;
    
    switch (fromSide) {
      case 'bottom':
        cp1x = x1;
        cp1y = y1 + offset;
        break;
      case 'top':
        cp1x = x1;
        cp1y = y1 - offset;
        break;
      case 'left':
        cp1x = x1 - offset;
        cp1y = y1;
        break;
      case 'right':
        cp1x = x1 + offset;
        cp1y = y1;
        break;
      default:
        cp1x = x1;
        cp1y = y1 + offset;
    }
    
    switch (toSide) {
      case 'top':
        cp2x = x2;
        cp2y = y2 - offset;
        break;
      case 'bottom':
        cp2x = x2;
        cp2y = y2 + offset;
        break;
      case 'left':
        cp2x = x2 - offset;
        cp2y = y2;
        break;
      case 'right':
        cp2x = x2 + offset;
        cp2y = y2;
        break;
      default:
        cp2x = x2;
        cp2y = y2 - offset;
    }
    
    return `M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
  }
};

// 导出到全局
window.FlowConnectionUtils = FlowConnectionUtils;
console.log('[DND2] flowEditor/FlowConnectionUtils.js 加载完成');

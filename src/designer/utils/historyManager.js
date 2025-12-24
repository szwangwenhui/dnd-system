// 历史记录管理工具
// 用于撤销/重做功能

class HistoryManager {
  constructor(maxSize = 50) {
    this.history = [];
    this.currentIndex = -1;
    this.maxSize = maxSize;
  }

  // 保存状态到历史记录
  save(state) {
    // 如果当前不在最新位置，删除后面的记录
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    // 深拷贝状态
    const stateCopy = JSON.parse(JSON.stringify(state));
    this.history.push(stateCopy);

    // 限制历史记录大小
    if (this.history.length > this.maxSize) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }

    return this.currentIndex;
  }

  // 撤销
  undo() {
    if (this.canUndo()) {
      this.currentIndex--;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  // 重做
  redo() {
    if (this.canRedo()) {
      this.currentIndex++;
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  // 是否可以撤销
  canUndo() {
    return this.currentIndex > 0;
  }

  // 是否可以重做
  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  // 获取当前状态
  getCurrent() {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return JSON.parse(JSON.stringify(this.history[this.currentIndex]));
    }
    return null;
  }

  // 清空历史
  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  // 获取历史记录信息
  getInfo() {
    return {
      total: this.history.length,
      current: this.currentIndex,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    };
  }
}

// 导出到全局
window.HistoryManager = HistoryManager;

// 预设样式库
// 包含：常用样式预设、主题配色、区块模板

// ===== 主题配色方案 =====
const ThemeColors = {
  // 蓝色主题
  blue: {
    name: '蓝色主题',
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#2563eb',
    background: '#eff6ff',
    text: '#1e40af',
    border: '#93c5fd'
  },
  // 绿色主题
  green: {
    name: '绿色主题',
    primary: '#22c55e',
    secondary: '#4ade80',
    accent: '#16a34a',
    background: '#f0fdf4',
    text: '#166534',
    border: '#86efac'
  },
  // 紫色主题
  purple: {
    name: '紫色主题',
    primary: '#a855f7',
    secondary: '#c084fc',
    accent: '#9333ea',
    background: '#faf5ff',
    text: '#7c3aed',
    border: '#d8b4fe'
  },
  // 橙色主题
  orange: {
    name: '橙色主题',
    primary: '#f97316',
    secondary: '#fb923c',
    accent: '#ea580c',
    background: '#fff7ed',
    text: '#c2410c',
    border: '#fdba74'
  },
  // 灰色主题
  gray: {
    name: '灰色主题',
    primary: '#6b7280',
    secondary: '#9ca3af',
    accent: '#4b5563',
    background: '#f9fafb',
    text: '#374151',
    border: '#d1d5db'
  },
  // 深色主题
  dark: {
    name: '深色主题',
    primary: '#1f2937',
    secondary: '#374151',
    accent: '#111827',
    background: '#030712',
    text: '#f9fafb',
    border: '#4b5563'
  }
};

// ===== 区块样式预设 =====
const BlockPresets = {
  // ----- 卡片类 -----
  card: {
    name: '基础卡片',
    category: '卡片',
    style: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      paddingTop: 16,
      paddingRight: 16,
      paddingBottom: 16,
      paddingLeft: 16
    }
  },
  cardHover: {
    name: '悬浮卡片',
    category: '卡片',
    style: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      paddingTop: 16,
      paddingRight: 16,
      paddingBottom: 16,
      paddingLeft: 16,
      transitionDuration: 200,
      transitionTimingFunction: 'ease',
      hoverBoxShadow: '0 8px 16px rgba(0,0,0,0.15)',
      hoverScale: 1.02,
      cursor: 'pointer'
    }
  },
  cardShadow: {
    name: '阴影卡片',
    category: '卡片',
    style: {
      backgroundColor: '#ffffff',
      borderRadius: 12,
      borderWidth: 0,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      paddingTop: 20,
      paddingRight: 20,
      paddingBottom: 20,
      paddingLeft: 20
    }
  },

  // ----- 按钮类 -----
  btnPrimary: {
    name: '主要按钮',
    category: '按钮',
    style: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      borderRadius: 6,
      borderWidth: 0,
      paddingTop: 10,
      paddingRight: 20,
      paddingBottom: 10,
      paddingLeft: 20,
      cursor: 'pointer',
      transitionDuration: 150,
      transitionTimingFunction: 'ease',
      hoverBackgroundColor: '#2563eb',
      activeScale: 0.95
    }
  },
  btnSecondary: {
    name: '次要按钮',
    category: '按钮',
    style: {
      backgroundColor: '#ffffff',
      color: '#374151',
      borderRadius: 6,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#d1d5db',
      paddingTop: 10,
      paddingRight: 20,
      paddingBottom: 10,
      paddingLeft: 20,
      cursor: 'pointer',
      transitionDuration: 150,
      transitionTimingFunction: 'ease',
      hoverBackgroundColor: '#f9fafb',
      hoverBorderColor: '#9ca3af',
      activeScale: 0.95
    }
  },
  btnDanger: {
    name: '危险按钮',
    category: '按钮',
    style: {
      backgroundColor: '#ef4444',
      color: '#ffffff',
      borderRadius: 6,
      borderWidth: 0,
      paddingTop: 10,
      paddingRight: 20,
      paddingBottom: 10,
      paddingLeft: 20,
      cursor: 'pointer',
      transitionDuration: 150,
      transitionTimingFunction: 'ease',
      hoverBackgroundColor: '#dc2626',
      activeScale: 0.95
    }
  },
  btnRound: {
    name: '圆形按钮',
    category: '按钮',
    style: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
      borderRadius: 9999,
      borderWidth: 0,
      paddingTop: 12,
      paddingRight: 12,
      paddingBottom: 12,
      paddingLeft: 12,
      cursor: 'pointer',
      transitionDuration: 150,
      hoverBackgroundColor: '#2563eb',
      activeScale: 0.9
    }
  },

  // ----- 输入框类 -----
  input: {
    name: '基础输入框',
    category: '输入框',
    style: {
      backgroundColor: '#ffffff',
      borderRadius: 6,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#d1d5db',
      paddingTop: 10,
      paddingRight: 12,
      paddingBottom: 10,
      paddingLeft: 12,
      transitionDuration: 150,
      hoverBorderColor: '#9ca3af'
    }
  },
  inputFocus: {
    name: '聚焦输入框',
    category: '输入框',
    style: {
      backgroundColor: '#ffffff',
      borderRadius: 6,
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: '#3b82f6',
      paddingTop: 10,
      paddingRight: 12,
      paddingBottom: 10,
      paddingLeft: 12,
      boxShadow: '0 0 0 3px rgba(59,130,246,0.2)'
    }
  },

  // ----- 标签类 -----
  tag: {
    name: '基础标签',
    category: '标签',
    style: {
      backgroundColor: '#eff6ff',
      color: '#3b82f6',
      borderRadius: 4,
      borderWidth: 0,
      paddingTop: 4,
      paddingRight: 8,
      paddingBottom: 4,
      paddingLeft: 8,
      fontSize: 12
    }
  },
  tagSuccess: {
    name: '成功标签',
    category: '标签',
    style: {
      backgroundColor: '#f0fdf4',
      color: '#22c55e',
      borderRadius: 4,
      borderWidth: 0,
      paddingTop: 4,
      paddingRight: 8,
      paddingBottom: 4,
      paddingLeft: 8,
      fontSize: 12
    }
  },
  tagWarning: {
    name: '警告标签',
    category: '标签',
    style: {
      backgroundColor: '#fffbeb',
      color: '#f59e0b',
      borderRadius: 4,
      borderWidth: 0,
      paddingTop: 4,
      paddingRight: 8,
      paddingBottom: 4,
      paddingLeft: 8,
      fontSize: 12
    }
  },
  tagDanger: {
    name: '危险标签',
    category: '标签',
    style: {
      backgroundColor: '#fef2f2',
      color: '#ef4444',
      borderRadius: 4,
      borderWidth: 0,
      paddingTop: 4,
      paddingRight: 8,
      paddingBottom: 4,
      paddingLeft: 8,
      fontSize: 12
    }
  },

  // ----- 容器类 -----
  container: {
    name: '基础容器',
    category: '容器',
    style: {
      backgroundColor: '#f9fafb',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#e5e7eb',
      paddingTop: 16,
      paddingRight: 16,
      paddingBottom: 16,
      paddingLeft: 16
    }
  },
  containerFlex: {
    name: 'Flex容器',
    category: '容器',
    style: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#e5e7eb',
      paddingTop: 16,
      paddingRight: 16,
      paddingBottom: 16,
      paddingLeft: 16,
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      columnGap: 12
    }
  },
  containerGrid: {
    name: 'Grid容器',
    category: '容器',
    style: {
      backgroundColor: '#ffffff',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#e5e7eb',
      paddingTop: 16,
      paddingRight: 16,
      paddingBottom: 16,
      paddingLeft: 16,
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gridRowGap: 12,
      gridColumnGap: 12
    }
  },

  // ----- 分割线 -----
  divider: {
    name: '水平分割线',
    category: '装饰',
    style: {
      backgroundColor: '#e5e7eb',
      borderWidth: 0,
      borderRadius: 0
    }
  },
  dividerDashed: {
    name: '虚线分割线',
    category: '装饰',
    style: {
      backgroundColor: 'transparent',
      borderWidth: 0,
      borderTopWidth: 1,
      borderTopStyle: 'dashed',
      borderTopColor: '#d1d5db'
    }
  },

  // ----- 头像 -----
  avatar: {
    name: '圆形头像',
    category: '头像',
    style: {
      backgroundColor: '#e5e7eb',
      borderRadius: 9999,
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  },
  avatarSquare: {
    name: '方形头像',
    category: '头像',
    style: {
      backgroundColor: '#e5e7eb',
      borderRadius: 8,
      borderWidth: 2,
      borderStyle: 'solid',
      borderColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }
  },

  // ----- 提示框 -----
  alertInfo: {
    name: '信息提示',
    category: '提示',
    style: {
      backgroundColor: '#eff6ff',
      color: '#1e40af',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#93c5fd',
      borderLeftWidth: 4,
      borderLeftColor: '#3b82f6',
      paddingTop: 12,
      paddingRight: 16,
      paddingBottom: 12,
      paddingLeft: 16
    }
  },
  alertSuccess: {
    name: '成功提示',
    category: '提示',
    style: {
      backgroundColor: '#f0fdf4',
      color: '#166534',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#86efac',
      borderLeftWidth: 4,
      borderLeftColor: '#22c55e',
      paddingTop: 12,
      paddingRight: 16,
      paddingBottom: 12,
      paddingLeft: 16
    }
  },
  alertWarning: {
    name: '警告提示',
    category: '提示',
    style: {
      backgroundColor: '#fffbeb',
      color: '#92400e',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#fcd34d',
      borderLeftWidth: 4,
      borderLeftColor: '#f59e0b',
      paddingTop: 12,
      paddingRight: 16,
      paddingBottom: 12,
      paddingLeft: 16
    }
  },
  alertError: {
    name: '错误提示',
    category: '提示',
    style: {
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      borderRadius: 8,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#fca5a5',
      borderLeftWidth: 4,
      borderLeftColor: '#ef4444',
      paddingTop: 12,
      paddingRight: 16,
      paddingBottom: 12,
      paddingLeft: 16
    }
  }
};

// ===== 获取预设分类列表 =====
const getPresetCategories = () => {
  const categories = {};
  Object.entries(BlockPresets).forEach(([key, preset]) => {
    if (!categories[preset.category]) {
      categories[preset.category] = [];
    }
    categories[preset.category].push({ key, ...preset });
  });
  return categories;
};

// 导出到全局
window.ThemeColors = ThemeColors;
window.BlockPresets = BlockPresets;
window.getPresetCategories = getPresetCategories;

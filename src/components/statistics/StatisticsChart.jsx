/**
 * 统计模块 - 图表组件
 * 基于 Chart.js 实现多种统计图表
 */

function StatisticsChart({ statistic, data }) {
  const chartRef = React.useRef(null);
  const chartInstance = React.useRef(null);
  const [activeFields, setActiveFields] = React.useState([]);

  // 获取图表类型
  const chartType = statistic.output?.chartType || '折线图';
  const direction = statistic.config?.direction || '纵向';
  const statisticFields = statistic.config?.statisticFields || [];

  // 初始化激活的字段
  React.useEffect(() => {
    if (statisticFields.length > 0 && activeFields.length === 0) {
      // 默认显示前3个字段
      setActiveFields(statisticFields.slice(0, 3).map(f => f.fieldId));
    }
  }, [statisticFields]);

  // 颜色配置
  const colors = [
    { bg: 'rgba(59, 130, 246, 0.6)', border: 'rgb(59, 130, 246)' },   // 蓝色
    { bg: 'rgba(16, 185, 129, 0.6)', border: 'rgb(16, 185, 129)' },   // 绿色
    { bg: 'rgba(245, 158, 11, 0.6)', border: 'rgb(245, 158, 11)' },   // 橙色
    { bg: 'rgba(139, 92, 246, 0.6)', border: 'rgb(139, 92, 246)' },   // 紫色
    { bg: 'rgba(239, 68, 68, 0.6)', border: 'rgb(239, 68, 68)' },     // 红色
    { bg: 'rgba(20, 184, 166, 0.6)', border: 'rgb(20, 184, 166)' },   // 青色
    { bg: 'rgba(236, 72, 153, 0.6)', border: 'rgb(236, 72, 153)' },   // 粉色
    { bg: 'rgba(107, 114, 128, 0.6)', border: 'rgb(107, 114, 128)' }, // 灰色
  ];

  // 饼图专用颜色（更鲜艳）
  const pieColors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(20, 184, 166, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(107, 114, 128, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(168, 85, 247, 0.8)',
  ];

  // 准备图表数据
  const prepareChartData = () => {
    if (!data || data.length === 0) return null;

    // 过滤掉汇总行
    const filteredData = data.filter(row => 
      row.period !== 'SUMMARY' && 
      row.periodName !== '合计/平均' && 
      !row._isTotal && 
      !row._isSubtotal &&
      !row._isOthers
    );

    if (filteredData.length === 0) return null;

    // 获取标签
    let labels = [];
    if (direction === '纵向') {
      labels = filteredData.map(row => row.periodName || row.period);
    } else {
      // 横向统计：使用分组字段值作为标签
      const groupFields = statistic.config?.groupFields || [];
      if (groupFields.length > 0) {
        labels = filteredData.map(row => {
          const parts = groupFields.map(gf => row[gf.fieldName] || row[gf.fieldId] || '');
          return parts.join(' - ');
        });
      } else {
        labels = filteredData.map((_, index) => `项目${index + 1}`);
      }
    }

    // 饼图只使用第一个激活的统计字段
    if (chartType === '饼图') {
      const fieldId = activeFields[0] || statisticFields[0]?.fieldId;
      const fieldName = statisticFields.find(f => f.fieldId === fieldId)?.fieldName || fieldId;
      
      const values = filteredData.map(row => {
        const val = row[fieldName] || row[fieldId] || 0;
        return typeof val === 'number' ? val : parseFloat(val) || 0;
      });

      return {
        labels,
        datasets: [{
          data: values,
          backgroundColor: pieColors.slice(0, values.length),
          borderColor: pieColors.slice(0, values.length).map(c => c.replace('0.8', '1')),
          borderWidth: 2
        }]
      };
    }

    // 折线图、柱状图、点线图：多数据集
    const datasets = activeFields.map((fieldId, index) => {
      const fieldInfo = statisticFields.find(f => f.fieldId === fieldId);
      const fieldName = fieldInfo?.fieldName || fieldId;
      const color = colors[index % colors.length];

      const values = filteredData.map(row => {
        const val = row[fieldName] || row[fieldId] || 0;
        return typeof val === 'number' ? val : parseFloat(val) || 0;
      });

      const baseConfig = {
        label: fieldName,
        data: values,
        borderColor: color.border,
        backgroundColor: color.bg,
        borderWidth: 2,
        tension: 0.3,
      };

      // 点线图配置
      if (chartType === '点线图') {
        return {
          ...baseConfig,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: color.border,
          fill: false,
        };
      }

      // 柱状图配置
      if (chartType === '柱状图') {
        return {
          ...baseConfig,
          borderRadius: 4,
          barPercentage: 0.7,
        };
      }

      // 折线图配置
      return {
        ...baseConfig,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    return { labels, datasets };
  };

  // 获取Chart.js图表类型
  const getChartJsType = () => {
    switch (chartType) {
      case '折线图': return 'line';
      case '柱状图': return 'bar';
      case '饼图': return 'pie';
      case '点线图': return 'line';
      default: return 'line';
    }
  };

  // 获取图表配置选项
  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: chartType === '饼图' ? 'right' : 'top',
          labels: {
            usePointStyle: true,
            padding: 15,
            font: { size: 12 }
          }
        },
        tooltip: {
          mode: chartType === '饼图' ? 'point' : 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          padding: 10,
          callbacks: {
            label: (context) => {
              const label = context.dataset.label || context.label || '';
              const value = context.parsed.y ?? context.parsed ?? 0;
              
              if (chartType === '饼图') {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${value.toLocaleString()} (${percent}%)`;
              }
              
              return `${label}: ${value.toLocaleString()}`;
            }
          }
        }
      }
    };

    // 饼图不需要坐标轴
    if (chartType === '饼图') {
      return baseOptions;
    }

    // 其他图表的坐标轴配置
    return {
      ...baseOptions,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: direction === '纵向' ? '期间' : '分组',
            font: { size: 12, weight: 'bold' }
          },
          ticks: {
            maxRotation: 45,
            minRotation: 0,
            font: { size: 11 }
          },
          grid: {
            display: false
          }
        },
        y: {
          display: true,
          title: {
            display: true,
            text: '数值',
            font: { size: 12, weight: 'bold' }
          },
          beginAtZero: true,
          ticks: {
            font: { size: 11 },
            callback: (value) => value.toLocaleString()
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    };
  };

  // 创建/更新图表
  React.useEffect(() => {
    if (!chartRef.current || !window.Chart) return;

    const chartData = prepareChartData();
    if (!chartData) return;

    // 销毁旧图表
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // 创建新图表
    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new window.Chart(ctx, {
      type: getChartJsType(),
      data: chartData,
      options: getChartOptions()
    });

    // 清理函数
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [data, chartType, activeFields, direction]);

  // 切换字段显示
  const toggleField = (fieldId) => {
    if (chartType === '饼图') {
      // 饼图只能选一个
      setActiveFields([fieldId]);
    } else {
      setActiveFields(prev => {
        if (prev.includes(fieldId)) {
          // 至少保留一个
          if (prev.length === 1) return prev;
          return prev.filter(id => id !== fieldId);
        } else {
          return [...prev, fieldId];
        }
      });
    }
  };

  // 无数据状态
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <div>暂无数据，请先更新统计</div>
        </div>
      </div>
    );
  }

  // Chart.js 未加载
  if (!window.Chart) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <div>图表库加载失败</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 字段选择器 */}
      {statisticFields.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">显示字段：</span>
          {statisticFields.map((field, index) => {
            const isActive = activeFields.includes(field.fieldId);
            const color = colors[index % colors.length];
            
            return (
              <button
                key={field.fieldId}
                onClick={() => toggleField(field.fieldId)}
                className={`px-3 py-1 text-sm rounded-full border-2 transition-all ${
                  isActive 
                    ? 'text-white' 
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
                style={isActive ? { 
                  backgroundColor: color.border, 
                  borderColor: color.border 
                } : {}}
              >
                {field.fieldName}
                {chartType === '饼图' && isActive && ' ✓'}
              </button>
            );
          })}
          {chartType === '饼图' && (
            <span className="text-xs text-gray-400 ml-2">（饼图仅支持单字段）</span>
          )}
        </div>
      )}

      {/* 图表容器 */}
      <div className="relative" style={{ height: '320px' }}>
        <canvas ref={chartRef}></canvas>
      </div>

      {/* 图表类型提示 */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>
          {chartType} · {direction}统计 · 
          共 {data.filter(r => r.period !== 'SUMMARY' && !r._isTotal).length} 个数据点
        </span>
        <span>
          数据来源: {statistic.source?.formName || '-'}
        </span>
      </div>
    </div>
  );
}

// 导出到全局
window.StatisticsChart = StatisticsChart;

// 图形设计渲染器
// 负责在设计页渲染各种图形元素（路径、线条、箭头、矩形、圆形、喷洒等）

export const createGraphicDesignRenderer = () => {
  // 渲染图形元素
  const renderGraphicElements = (elements, offsetX = 0, offsetY = 0, scaleRatio = 1) => {
    if (!elements || elements.length === 0) return null;

    return elements.map((el, index) => {
      // 应用缩放比例
      const scaledOffsetX = offsetX / scaleRatio;
      const scaledOffsetY = offsetY / scaleRatio;

      switch (el.type) {
        case 'path':
          if (!el.points || el.points.length < 2) return null;
          const pathD = el.points.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x + scaledOffsetX} ${p.y + scaledOffsetY}`
          ).join(' ');
          return <path key={el.id || index} d={pathD} stroke={el.color} strokeWidth={el.brushSize} fill="none" strokeLinecap="round" strokeLinejoin="round" />;

        case 'line':
          return <line key={el.id || index} x1={el.startX + scaledOffsetX} y1={el.startY + scaledOffsetY} x2={el.endX + scaledOffsetX} y2={el.endY + scaledOffsetY} stroke={el.color} strokeWidth={el.brushSize} strokeLinecap="round" />;

        case 'arrow':
          const angle = Math.atan2(el.endY - el.startY, el.endX - el.startX);
          const headLength = Math.max(10, el.brushSize * 3);
          const arrowPoints = [
            `${el.endX + scaledOffsetX},${el.endY + scaledOffsetY}`,
            `${el.endX + scaledOffsetX - headLength * Math.cos(angle - Math.PI / 6)},${el.endY + scaledOffsetY - headLength * Math.sin(angle - Math.PI / 6)}`,
            `${el.endX + scaledOffsetX - headLength * Math.cos(angle + Math.PI / 6)},${el.endY + scaledOffsetY - headLength * Math.sin(angle + Math.PI / 6)}`
          ].join(' ');
          return (
            <g key={el.id || index}>
              <line x1={el.startX + scaledOffsetX} y1={el.startY + scaledOffsetY} x2={el.endX + scaledOffsetX} y2={el.endY + scaledOffsetY} stroke={el.color} strokeWidth={el.brushSize} strokeLinecap="round" />
              <polygon points={arrowPoints} fill={el.color} />
            </g>
          );

        case 'rect':
          return el.fill
            ? <rect key={el.id || index} x={el.x + scaledOffsetX} y={el.y + scaledOffsetY} width={el.w} height={el.h} fill={el.color} />
            : <rect key={el.id || index} x={el.x + scaledOffsetX} y={el.y + scaledOffsetY} width={el.w} height={el.h} stroke={el.color} strokeWidth={el.brushSize} fill="none" />;

        case 'circle':
          return el.fill
            ? <ellipse key={el.id || index} cx={el.cx + scaledOffsetX} cy={el.cy + scaledOffsetY} rx={el.rx} ry={el.ry} fill={el.color} />
            : <ellipse key={el.id || index} cx={el.cx + scaledOffsetX} cy={el.cy + scaledOffsetY} rx={el.rx} ry={el.ry} stroke={el.color} strokeWidth={el.brushSize} fill="none" />;

        case 'spray':
          return (
            <g key={el.id || index}>
              {el.dots?.map((dot, i) => (
                <circle key={i} cx={dot.x + scaledOffsetX} cy={dot.y + scaledOffsetY} r={dot.r} fill={el.color} />
              ))}
            </g>
          );

        case 'splash':
          const splashCircles = [];
          const seed = el.id || index;
          for (let i = 0; i < 30; i++) {
            const pseudoRandom = (seed * 9301 + 49297 + i * 233) % 233280 / 233280;
            const splashAngle = pseudoRandom * Math.PI * 2;
            const distance = Math.sqrt(pseudoRandom) * el.size;
            const dotSize = pseudoRandom * 5 + 2;
            splashCircles.push(
              <circle key={i} cx={el.x + scaledOffsetX + Math.cos(splashAngle) * distance} cy={el.y + scaledOffsetY + Math.sin(splashAngle) * distance} r={dotSize} fill={el.color} opacity={el.style === 'ink' ? 0.6 : 1} />
            );
          }
          return <g key={el.id || index}>{splashCircles}</g>;

        default:
          return null;
      }
    });
  };

  return {
    renderGraphicElements
  };
};

const fs = require('fs');
const { createCanvas } = require('canvas');

function createIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(0, 0, size, size);

  // 绘制四个象限
  ctx.strokeStyle = 'white';
  ctx.lineWidth = size / 20;
  
  // 垂直线
  ctx.beginPath();
  ctx.moveTo(size/2, 0);
  ctx.lineTo(size/2, size);
  ctx.stroke();
  
  // 水平线
  ctx.beginPath();
  ctx.moveTo(0, size/2);
  ctx.lineTo(size, size/2);
  ctx.stroke();

  return canvas.toBuffer();
}

// 生成不同尺寸的图标
[192, 512].forEach(size => {
  const iconBuffer = createIcon(size);
  fs.writeFileSync(`public/icons/icon-${size}x${size}.png`, iconBuffer);
  console.log(`Generated ${size}x${size} icon`);
}); 
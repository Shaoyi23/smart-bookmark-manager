// 生成简单的占位图标
// 使用canvas API创建简单的PNG图标

const fs = require('fs');
const path = require('path');

// 创建一个简单的SVG图标，然后我们可以手动创建PNG
// 或者使用在线工具转换

const iconSizes = [16, 48, 128];

// 创建简单的SVG图标内容
const createSVG = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#3b82f6" rx="${size * 0.2}"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">📚</text>
</svg>`;

// 由于Node.js默认没有canvas，我们创建一个说明文件
// 用户可以使用在线工具将SVG转换为PNG

const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 为每个尺寸创建SVG文件
iconSizes.forEach(size => {
  const svgPath = path.join(iconsDir, `icon${size}.svg`);
  fs.writeFileSync(svgPath, createSVG(size));
  console.log(`Created ${svgPath}`);
});

console.log('\n注意：需要将SVG文件转换为PNG格式。');
console.log('可以使用在线工具：https://cloudconvert.com/svg-to-png');
console.log('或者使用ImageMagick: convert icon16.svg icon16.png');


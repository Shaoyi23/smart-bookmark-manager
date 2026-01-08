// 创建简单的占位图标
// 使用base64编码的最小PNG图片

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1x1 透明PNG的base64编码
// 这是一个最小的有效PNG文件（1x1透明像素）
const minimalPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

const iconsDir = path.join(__dirname, '../icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 创建三个尺寸的占位图标
[16, 48, 128].forEach(size => {
  const iconPath = path.join(iconsDir, `icon${size}.png`);
  // 复制最小PNG（虽然尺寸不对，但至少是有效的PNG文件）
  // 更好的方法是使用sharp或canvas，但为了快速解决，我们先创建占位符
  fs.writeFileSync(iconPath, minimalPNG);
  console.log(`Created placeholder icon: ${iconPath}`);
});

console.log('\n✅ 占位图标已创建！');
console.log('注意：这些是1x1的透明占位图标，功能正常但显示很小。');
console.log('建议后续使用设计工具创建实际的图标文件。');


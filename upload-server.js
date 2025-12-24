/**
 * DND 文件上传服务器
 * 
 * 功能：
 * - 接收图片/视频上传
 * - 存储到本地 uploads 目录
 * - 返回访问URL
 * 
 * 使用方式：
 * 1. npm install express cors
 * 2. node upload-server.js
 * 3. 服务运行在 http://localhost:8088
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 8088;

// 上传目录配置
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const IMAGE_DIR = path.join(UPLOAD_DIR, 'images');
const VIDEO_DIR = path.join(UPLOAD_DIR, 'videos');

// 确保目录存在
[UPLOAD_DIR, IMAGE_DIR, VIDEO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`创建目录: ${dir}`);
  }
});

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // 支持大文件
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态文件服务 - 让上传的文件可以通过URL访问
app.use('/uploads', express.static(UPLOAD_DIR));

// 上传接口
app.post('/api/upload', (req, res) => {
  try {
    const { type, name, data } = req.body;

    if (!type || !name || !data) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    // 验证类型
    if (!['image', 'video'].includes(type)) {
      return res.status(400).json({ error: '不支持的文件类型' });
    }

    // 从Base64提取数据
    const matches = data.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: '无效的Base64数据' });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // 生成唯一文件名
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 8);
    const extension = name.split('.').pop() || (type === 'image' ? 'png' : 'mp4');
    const fileName = `${timestamp}_${randomStr}.${extension}`;

    // 确定存储目录
    const targetDir = type === 'image' ? IMAGE_DIR : VIDEO_DIR;
    const filePath = path.join(targetDir, fileName);

    // 写入文件
    fs.writeFileSync(filePath, buffer);

    // 返回URL
    const url = `http://localhost:${PORT}/uploads/${type === 'image' ? 'images' : 'videos'}/${fileName}`;

    console.log(`文件上传成功: ${fileName} (${(buffer.length / 1024).toFixed(2)} KB)`);

    res.json({
      success: true,
      url: url,
      name: fileName,
      size: buffer.length,
      type: type
    });

  } catch (error) {
    console.error('上传失败:', error);
    res.status(500).json({ error: '上传失败: ' + error.message });
  }
});

// 删除文件接口
app.delete('/api/upload/:type/:filename', (req, res) => {
  try {
    const { type, filename } = req.params;

    if (!['images', 'videos'].includes(type)) {
      return res.status(400).json({ error: '无效的文件类型' });
    }

    const filePath = path.join(UPLOAD_DIR, type, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    fs.unlinkSync(filePath);
    console.log(`文件删除成功: ${filename}`);

    res.json({ success: true });

  } catch (error) {
    console.error('删除失败:', error);
    res.status(500).json({ error: '删除失败: ' + error.message });
  }
});

// 获取文件列表接口
app.get('/api/files/:type', (req, res) => {
  try {
    const { type } = req.params;

    if (!['images', 'videos'].includes(type)) {
      return res.status(400).json({ error: '无效的文件类型' });
    }

    const targetDir = path.join(UPLOAD_DIR, type);
    const files = fs.readdirSync(targetDir).map(filename => {
      const stats = fs.statSync(path.join(targetDir, filename));
      return {
        name: filename,
        url: `http://localhost:${PORT}/uploads/${type}/${filename}`,
        size: stats.size,
        createdAt: stats.birthtime
      };
    });

    res.json({ files });

  } catch (error) {
    console.error('获取文件列表失败:', error);
    res.status(500).json({ error: '获取失败: ' + error.message });
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uploadDir: UPLOAD_DIR,
    imageCount: fs.readdirSync(IMAGE_DIR).length,
    videoCount: fs.readdirSync(VIDEO_DIR).length
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log('========================================');
  console.log('  DND 文件上传服务器已启动');
  console.log('========================================');
  console.log(`  端口: ${PORT}`);
  console.log(`  上传目录: ${UPLOAD_DIR}`);
  console.log(`  图片目录: ${IMAGE_DIR}`);
  console.log(`  视频目录: ${VIDEO_DIR}`);
  console.log('');
  console.log('  API接口:');
  console.log(`  - POST   http://localhost:${PORT}/api/upload`);
  console.log(`  - DELETE http://localhost:${PORT}/api/upload/:type/:filename`);
  console.log(`  - GET    http://localhost:${PORT}/api/files/:type`);
  console.log(`  - GET    http://localhost:${PORT}/api/health`);
  console.log('========================================');
});

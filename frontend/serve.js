const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// MIME类型映射
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);

  // 安全检查
  if (!filePath.startsWith(path.join(__dirname, 'dist'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + err.code);
      }
    } else {
      // 添加CORS头
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`🚀 项目管理大师已启动！`);
  console.log(`📱 请访问: http://localhost:${PORT}`);
  console.log(`✨ 动态渐变背景已集成！`);
});

// 错误处理
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`端口 ${PORT} 被占用，请尝试其他端口`);
  } else {
    console.error('服务器错误:', err);
  }
});
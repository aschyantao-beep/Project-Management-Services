const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

console.log('正在启动服务器...');
console.log('当前目录:', __dirname);

try {
  const server = http.createServer((req, res) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);

    let filePath = path.join(__dirname, 'dist', req.url === '/' ? 'index.html' : req.url);

    // 安全检查
    if (!filePath.startsWith(path.join(__dirname, 'dist'))) {
      res.writeHead(403, {'Content-Type': 'text/plain'});
      res.end('Forbidden');
      return;
    }

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.log(`文件不存在: ${filePath}`);
      res.writeHead(404, {'Content-Type': 'text/plain'});
      res.end('File not found: ' + req.url);
      return;
    }

    const extname = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.ico': 'image/x-icon'
    }[extname] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        console.log(`读取文件错误: ${err.message}`);
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('Server error: ' + err.message);
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      res.end(content);
      console.log(`成功发送: ${filePath} (${content.length} bytes)`);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ 服务器启动成功！`);
    console.log(`📱 本地访问: http://localhost:${PORT}`);
    console.log(`🌐 网络访问: http://${require('os').networkInterfaces().Ethernet?.[0]?.address || '127.0.0.1'}:${PORT}`);
    console.log(`🎯 按 Ctrl+C 停止服务器`);
  });

  server.on('error', (err) => {
    console.error('❌ 服务器启动失败:', err.message);
    if (err.code === 'EADDRINUSE') {
      console.log(`端口 ${PORT} 被占用，请尝试其他端口`);
    }
    process.exit(1);
  });

} catch (err) {
  console.error('❌ 启动错误:', err.message);
  process.exit(1);
}
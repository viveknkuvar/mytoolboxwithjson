const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Create a server
const server = http.createServer((req, res) => {
  const filePath = req.url === '/' ? './index.html' : `.${req.url}`;

  if (req.url === '/start-rdp' && req.method === 'POST') {
    // Handle the RDP request
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const serverName = JSON.parse(body).serverName;
      startRdpSession(serverName, res);
    });
  } else {
    // Serve static files
    fs.readFile(path.join(__dirname, filePath), (err, content) => {
      if (err) {
        res.statusCode = 404;
        res.end('File not found');
      } else {
        res.statusCode = 200;
        res.setHeader('Content-Type', getContentType(filePath));
        res.end(content);
      }
    });
  }
});

// Start the server
const port = 3000;
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

// Function to start the RDP session
function startRdpSession(serverName, res) {
  const rdpCommand = `mstsc.exe /v:${serverName}`;

  const rdpProcess = spawn(rdpCommand, {
    shell: true,
    detached: true,
  });

  rdpProcess.on('error', (error) => {
    console.error(`error: ${error.message}`);
    res.statusCode = 500;
    res.end('Failed to start RDP session');
  });

  rdpProcess.on('close', (code) => {
    console.log(`RDP process exited with code ${code}`);
    res.statusCode = 200;
    res.end('RDP session started');
  });
}

// Helper function to get the Content-Type header value based on the file extension
function getContentType(filePath) {
  const extname = path.extname(filePath);
  switch (extname) {
    case '.html':
      return 'text/html';
    case '.css':
      return 'text/css';
    case '.js':
      return 'text/javascript';
    default:
      return 'application/octet-stream';
  }
}
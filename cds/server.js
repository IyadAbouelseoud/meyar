// Placeholder until B2. Serves an empty CDS Hooks discovery document on port 3000.
import http from 'node:http';
const services = { services: [] };
http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/cds-services') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    return res.end(JSON.stringify(services));
  }
  res.writeHead(404); res.end();
}).listen(3000, () => console.log('meyar cds on :3000'));

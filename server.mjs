import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist'),port=Number(process.env.PORT||4175);
http.createServer((req,res)=>{
 let p;try{p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400).end();return;}
 if(p===root)p=path.join(root,'index.html');
 if(!p.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(p,(e,data)=>{if(e){res.writeHead(404).end('Not found');return;}
 res.writeHead(200,{'Content-Type':({'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.png':'image/png'})[path.extname(p)]||'text/plain','Cache-Control':'no-cache'});res.end(data);});
}).listen(port,'127.0.0.1',()=>console.log(`AI Flip Photo: http://127.0.0.1:${port}`));

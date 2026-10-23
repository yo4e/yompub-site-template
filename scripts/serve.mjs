import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep, extname } from 'node:path';
const root=await realpath(fileURLToPath(new URL('../',import.meta.url)));
const port=Number(process.env.PORT??4180);
const types=new Map([['.html','text/html; charset=utf-8'],['.mjs','text/javascript; charset=utf-8'],['.css','text/css; charset=utf-8'],['.json','application/json'],['.md','text/plain; charset=utf-8'],['.png','image/png'],['.jpg','image/jpeg'],['.jpeg','image/jpeg'],['.webp','image/webp']]);
const server=createServer(async(req,res)=>{
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; worker-src 'self'; img-src 'self' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  if(!['GET','HEAD'].includes(req.method??'')){res.writeHead(405).end();return;}
  try {
    const pathname=decodeURIComponent(new URL(req.url??'/','http://localhost').pathname);
    if(pathname.includes('\\')||pathname.includes('\0'))throw new Error('Invalid path');
    const file=await realpath(resolve(root,`.${pathname==='/'?'/index.html':pathname}`));
    if(!file.startsWith(root+sep)||!(await stat(file)).isFile())throw new Error('Outside site');
    const data=await readFile(file);res.writeHead(200,{'Content-Type':types.get(extname(file))??'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);
  }catch{res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`書棚: http://127.0.0.1:${port}/ (Ctrl+C to stop)`));

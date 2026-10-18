const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = Number(process.env.PORT || 8787);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'railops-data.json');
const STAFF_USER = process.env.STAFF_USER || 'staff';
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || 'change-this-password-now';
const initial = {
  trains: [
    {id:'22436',name:'Vande Bharat Express',from:'New Delhi',to:'Varanasi Jn',dep:'06:00',arr:'14:00',days:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],platform:'4',status:'Delayed',delay:18,last:'Prayagraj Jn',next:'Varanasi Jn',progress:72,speed:108},
    {id:'12952',name:'Mumbai Rajdhani Express',from:'New Delhi',to:'Mumbai Central',dep:'16:55',arr:'08:35',days:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],platform:'2',status:'On time',delay:0,last:'Kota Jn',next:'Vadodara Jn',progress:44,speed:121},
    {id:'12002',name:'Shatabdi Express',from:'Bhopal Jn',to:'New Delhi',dep:'15:00',arr:'23:00',days:['Mon','Tue','Wed','Thu','Fri','Sat'],platform:'1',status:'On time',delay:0,last:'Jhansi Jn',next:'Agra Cantt',progress:59,speed:94},
    {id:'12627',name:'Karnataka Express',from:'KSR Bengaluru',to:'New Delhi',dep:'19:20',arr:'10:30',days:['Mon','Wed','Fri','Sun'],platform:'6',status:'Delayed',delay:32,last:'Guntakal Jn',next:'Wadi Jn',progress:37,speed:76}
  ],
  tickets: [
    {pnr:'2849104821',passenger:'Aarav Sharma',train:'22436',date:'2026-10-20',cls:'CC',status:'Confirmed',seat:'C4-24 (LB/W)',age:29,gender:'M'},
    {pnr:'6492018473',passenger:'Meera Iyer',train:'12952',date:'2026-10-21',cls:'2A',status:'Waitlisted',seat:'Not assigned',age:'',gender:''},
    {pnr:'8192049182',passenger:'Kabir Das',train:'12002',date:'2026-10-22',cls:'CC',status:'RAC',seat:'Not assigned',age:'',gender:''},
    {pnr:'7391052846',passenger:'Ananya Rao',train:'12627',date:'2026-10-22',cls:'3A',status:'Confirmed',seat:'B2-21',age:'',gender:''}
  ], alerts: [], staff: [], audit: []
};
let state;
try { state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { state = initial; persist(); }
function persist(){ fs.writeFileSync(DATA_FILE, JSON.stringify(state,null,2)); }
function send(res, code, data, extra={}) { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra}); res.end(JSON.stringify(data)); }
function authorized(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Basic ')) return false;
  try { const [u,p] = Buffer.from(h.slice(6),'base64').toString().split(':'); return u===STAFF_USER && p===STAFF_PASSWORD; } catch { return false; }
}
function needAuth(req,res) {
  if (authorized(req)) return false;
  res.writeHead(401, {'WWW-Authenticate':'Basic realm="RailOps Staff", charset="UTF-8"','Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}); res.end('Staff login required.'); return true;
}
function normalizeBooking(b) {
 const details=Array.isArray(b.passengerDetails)&&b.passengerDetails.length?b.passengerDetails:[{name:b.passengerName||'Passenger details not supplied',seat:(b.seats||[])[0]||'Not assigned'}];
 return details.map(p=>({pnr:String(b.pnr||''),passenger:String(p.name||'Passenger'),train:String(b.trainNo||b.train||''),date:String(b.date||''),cls:String(b.classCode||b.cls||''),status:String(b.status||'Confirmed'),seat:String(p.seat||''),age:p.age??'',gender:p.gender??'',preference:p.preference||'',from:b.from||'',to:b.to||'',quota:b.quota||'',totalPaid:b.totalPaid??''}));
}
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if (req.method==='OPTIONS') { res.writeHead(204); return res.end(); }
 if (url.pathname==='/api/health') return send(res,200,{ok:true,service:'RailOps demo API',note:'Demo only; not an official railway service'});
 if (url.pathname==='/staff') { if(needAuth(req,res)) return; res.writeHead(302,{Location:'/staff.html'}); return res.end(); }
 if (url.pathname==='/staff.html' && needAuth(req,res)) return;
 if (url.pathname==='/api/state') {
   if(needAuth(req,res)) return;
   if(req.method==='GET') return send(res,200,state);
   if(req.method==='POST') { let raw=''; req.on('data',c=>raw+=c); req.on('end',()=>{try{const incoming=JSON.parse(raw||'{}');for(const k of ['trains','tickets','alerts','staff','audit'])if(Array.isArray(incoming[k]))state[k]=incoming[k];persist();send(res,200,{ok:true,updatedAt:new Date().toISOString()});}catch(e){send(res,400,{error:'Invalid JSON'});}}); return; }
 }
 if(url.pathname==='/api/bookings'&&req.method==='POST') { let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{try{const b=JSON.parse(raw||'{}');if(!b.pnr||!b.trainNo)return send(res,400,{error:'PNR and train number required'});const rows=normalizeBooking(b);state.tickets=state.tickets.filter(x=>x.pnr!==String(b.pnr)).concat(rows);persist();send(res,201,{ok:true,pnr:b.pnr,passengers:rows.length});}catch(e){send(res,400,{error:'Invalid JSON'});}}); return; }
 if(req.method==='GET') {
  const routes={'/':'index.html','/index.html':'index.html','/staff.html':'staff.html'};
  const file=routes[url.pathname];
  if(file){ if(file==='staff.html'&&needAuth(req,res))return; const body=fs.readFileSync(path.join(__dirname,file));res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});return res.end(body); }
 }
 return send(res,404,{error:'Not found'});
});
server.listen(PORT,'0.0.0.0',()=>console.log(`RailOps demo listening on port ${PORT}`));

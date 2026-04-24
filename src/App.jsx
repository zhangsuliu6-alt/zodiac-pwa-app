import React, { useEffect, useMemo, useState } from "react";

const ZODIACS = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"];
const NUMBERS = Array.from({ length: 49 }, (_, i) => String(i + 1).padStart(2, "0"));
const TRAD = { 龍:"龙", 馬:"马", 雞:"鸡", 豬:"猪" };
const WINDOW = 30;
const TRAIN_MIN = 12;
const POLL_MS = 30000;
const LATEST_API = "/api/latest";
const HISTORY_API_PREFIX = "/api/history/";

const RED = new Set(["01","02","07","08","12","13","18","19","23","24","29","30","34","35","40","45","46"]);
const BLUE = new Set(["03","04","09","10","14","15","20","25","26","31","36","37","41","42","47","48"]);
const GREEN = new Set(["05","06","11","16","17","21","22","27","28","32","33","38","39","43","44","49"]);
const COLORS = ["红波","蓝波","绿波"];
const SIZES = ["大","小"];
const PARITIES = ["单","双"];

const FALLBACK_ROWS = [
  { expect:"20260424378", openTime:"2026-04-24 18:51:00", openCode:"46,45,01,32,42,07,30", zodiac:"鸡,狗,马,猪,牛,鼠,牛" },
  { expect:"20260424377", openTime:"2026-04-24 18:48:00", openCode:"49,40,46,01,29,41,48", zodiac:"马,兔,鸡,马,虎,虎,羊" },
  { expect:"20260424376", openTime:"2026-04-24 18:45:00", openCode:"16,31,18,36,41,10,30", zodiac:"兔,鼠,牛,羊,虎,鸡,牛" },
  { expect:"20260424375", openTime:"2026-04-24 18:42:00", openCode:"33,09,28,27,19,07,46", zodiac:"狗,狗,兔,龙,鼠,鼠,鸡" },
  { expect:"20260424374", openTime:"2026-04-24 18:39:00", openCode:"29,13,08,39,43,37,26", zodiac:"虎,马,猪,龙,鼠,马,蛇" },
  { expect:"20260424373", openTime:"2026-04-24 18:36:00", openCode:"30,34,18,12,47,19,23", zodiac:"牛,鸡,牛,羊,猴,鼠,猴" },
  { expect:"20260424372", openTime:"2026-04-24 18:33:00", openCode:"19,49,23,04,24,38,47", zodiac:"鼠,马,猴,兔,羊,蛇,猴" },
  { expect:"20260424371", openTime:"2026-04-24 18:30:00", openCode:"22,33,10,27,39,04,38", zodiac:"鸡,狗,鸡,龙,龙,兔,蛇" },
  { expect:"20260424370", openTime:"2026-04-24 18:27:00", openCode:"38,34,48,28,36,31,35", zodiac:"蛇,鸡,羊,兔,羊,鼠,猴" },
  { expect:"20260424369", openTime:"2026-04-24 18:24:00", openCode:"23,16,45,41,14,31,30", zodiac:"猴,兔,狗,虎,蛇,鼠,牛" },
  { expect:"20260424368", openTime:"2026-04-24 18:21:00", openCode:"15,05,11,41,20,48,49", zodiac:"龙,虎,猴,虎,猪,羊,马" },
  { expect:"20260424367", openTime:"2026-04-24 18:18:00", openCode:"47,33,09,11,02,06,29", zodiac:"猴,狗,狗,猴,蛇,牛,虎" },
  { expect:"20260424366", openTime:"2026-04-24 18:15:00", openCode:"46,30,13,12,05,49,18", zodiac:"鸡,牛,马,羊,虎,马,牛" },
  { expect:"20260424365", openTime:"2026-04-24 18:12:00", openCode:"22,02,48,16,32,09,49", zodiac:"鸡,蛇,羊,兔,猪,狗,马" },
  { expect:"20260424364", openTime:"2026-04-24 18:09:00", openCode:"32,45,07,09,37,10,40", zodiac:"猪,狗,鼠,狗,马,鸡,兔" },
  { expect:"20260424363", openTime:"2026-04-24 18:06:00", openCode:"42,23,32,36,10,06,33", zodiac:"牛,猴,猪,羊,鸡,牛,狗" },
  { expect:"20260424362", openTime:"2026-04-24 18:03:00", openCode:"02,11,27,13,45,16,17", zodiac:"蛇,猴,龙,马,狗,兔,虎" },
  { expect:"20260424361", openTime:"2026-04-24 18:00:00", openCode:"28,40,48,16,11,45,03", zodiac:"兔,兔,羊,兔,猴,狗,龙" },
  { expect:"20260424360", openTime:"2026-04-24 17:57:00", openCode:"25,21,03,43,15,37,45", zodiac:"马,狗,龙,鼠,龙,马,狗" },
  { expect:"20260424359", openTime:"2026-04-24 17:54:00", openCode:"07,39,44,04,06,12,38", zodiac:"鼠,龙,猪,兔,牛,羊,蛇" }
];

const PING_MODELS = [
  { id:"freq30", name:"近30期高频", w:{ issue:18, occur:4, recent5:8, recent10:6, special:2, trend:4, follow:2 } },
  { id:"recent10", name:"近10期热肖", w:{ issue:8, occur:3, recent5:18, recent10:14, special:2, trend:10, follow:1 } },
  { id:"steady", name:"稳健热肖", w:{ issue:14, occur:3, recent5:10, recent10:10, special:3, trend:7, follow:3 } },
  { id:"trend", name:"趋势加强", w:{ issue:12, occur:4, recent5:12, recent10:10, special:4, trend:12, follow:2 } },
  { id:"specialWeak", name:"特码弱带动", w:{ issue:8, occur:2, recent5:10, recent10:8, special:8, trend:5, follow:4 } }
];
const CLASS_MODELS = [
  { id:"hot", name:"热度主导", w:{ count:15, recent5:20, recent10:8, streak:6, follow:7, trend:8 } },
  { id:"recent", name:"近期加强", w:{ count:8, recent5:32, recent10:12, streak:10, follow:4, trend:12 } },
  { id:"follow", name:"跟随加强", w:{ count:8, recent5:12, recent10:8, streak:5, follow:24, trend:7 } },
  { id:"stable", name:"稳健均衡", w:{ count:12, recent5:18, recent10:10, streak:8, follow:12, trend:9 } }
];

function simpleZodiac(value){ return String(value||"").trim().split("").map(ch=>TRAD[ch]||ch).join(""); }
function splitItems(value){ return String(value||"").split(/[\s,，、;；|/]+/).map(x=>x.trim()).filter(Boolean); }
function normalizeRecord(row){
  const codeList = splitItems(row.openCode || row.open_code || row.code || row.codes || "").map(n=>String(Number(n)).padStart(2,"0")).filter(n=>NUMBERS.includes(n));
  const zodiacList = splitItems(row.zodiac || row.animals || row.shengxiao || "").map(simpleZodiac).filter(z=>ZODIACS.includes(z));
  return { expect:String(row.expect || row.issue || row.period || row.qihao || ""), openTime:String(row.openTime || row.open_time || row.time || ""), codeList, zodiacList };
}
function parseRows(text){
  const raw = String(text||"").trim(); if(!raw) return [];
  try{ const json = JSON.parse(raw); const arr = Array.isArray(json)?json:Array.isArray(json.data)?json.data:Array.isArray(json.result)?json.result:[]; return arr.map(normalizeRecord).filter(r=>r.codeList.length>=7&&r.zodiacList.length>=7); }catch{}
  return [];
}
function unwrapApiRows(json){ return Array.isArray(json)?json:Array.isArray(json.data)?json.data:Array.isArray(json.result)?json.result:[]; }
function uniqRows(rows){ const map = new Map(); rows.forEach(r=>{ if(r.expect) map.set(r.expect,r); }); return [...map.values()].sort((a,b)=>String(b.expect).localeCompare(String(a.expect))); }
function chronological(rows){ return [...uniqRows(rows)].sort((a,b)=>String(a.expect).localeCompare(String(b.expect))); }
function latestRows(rows,n=WINDOW){ return uniqRows(rows).slice(0,n); }
function nextExpect(expect){ const s=String(expect||""); return /^\d+$/.test(s)?String(Number(s)+1).padStart(s.length,"0"):""; }
function round(n){ return Math.round(n*100)/100; }
function pct(a,b){ return b?Math.round(a/b*100):0; }
function clamp(n,min,max){ return Math.min(max,Math.max(min,n)); }
function ballColor(n){ if(RED.has(n)) return "红波"; if(BLUE.has(n)) return "蓝波"; if(GREEN.has(n)) return "绿波"; return ""; }
function bigSmall(n){ return Number(n)>=25?"大":"小"; }
function oddEven(n){ return Number(n)%2===1?"单":"双"; }
function specialNum(row){ return row?.codeList?.[6] || ""; }
function classOfRow(row,type){ const n=specialNum(row); if(!n)return""; return type==="color"?ballColor(n):type==="size"?bigSmall(n):oddEven(n); }
function baseRatings(models){ return Object.fromEntries(models.map(m=>[m.id,1])); }
function confidence(list){ if(!list||list.length<2)return{level:"低",edge:0}; const edge=round((list[0].score||0)-(list[1].score||0)); return { level: edge>=18?"高":edge>=8?"中":"低", edge}; }

async function fetchLatestRowsFromApi(){ const res=await fetch(LATEST_API,{cache:"no-store"}); if(!res.ok) throw new Error(`最新接口HTTP ${res.status}`); const json=await res.json(); return unwrapApiRows(json).map(normalizeRecord).filter(r=>r.codeList.length>=7&&r.zodiacList.length>=7); }
async function fetchExpect(expect){ const res=await fetch(`${HISTORY_API_PREFIX}${expect}`,{cache:"no-store"}); if(!res.ok) throw new Error(`历史接口HTTP ${res.status}`); const json=await res.json(); return unwrapApiRows(json).map(normalizeRecord).filter(r=>r.codeList.length>=7&&r.zodiacList.length>=7); }
async function fetchLatest30(){ const latest=await fetchLatestRowsFromApi(); if(!latest.length) throw new Error("最新接口没有返回开奖记录"); const e=Number(latest[0].expect); const rows=[...latest]; for(let i=e-1;i>=e-WINDOW+1;i--){ try{ rows.push(...await fetchExpect(i)); }catch{} } return latestRows(rows,WINDOW); }

function scorePingModel(rows,model){
  const latest=latestRows(rows); const chrono=[...latest].reverse(); const w=model.w;
  const stats=Object.fromEntries(ZODIACS.map(z=>[z,{label:z,issue:0,occur:0,recent5:0,recent10:0,special:0,trend:0,follow:0,score:0}]));
  chrono.forEach((row,idx)=>{ const seen=new Set(row.zodiacList); const age=chrono.length-1-idx; seen.forEach(z=>{ if(stats[z]){ stats[z].issue++; if(age<5)stats[z].recent5++; if(age<10)stats[z].recent10++; }}); row.zodiacList.forEach(z=>{if(stats[z])stats[z].occur++;}); const sp=row.zodiacList[6]; if(stats[sp])stats[sp].special++; });
  const half=Math.floor(chrono.length/2), older=chrono.slice(0,half), newer=chrono.slice(half);
  ZODIACS.forEach(z=>{ let old=0,nu=0; older.forEach(r=>{if(r.zodiacList.includes(z))old++;}); newer.forEach(r=>{if(r.zodiacList.includes(z))nu++;}); stats[z].trend=Math.max(0,nu-old); });
  const last=latest[0]?.zodiacList?.[6]||""; if(last) for(let i=1;i<chrono.length;i++){ if(chrono[i-1].zodiacList[6]===last){ new Set(chrono[i].zodiacList).forEach(z=>{if(stats[z])stats[z].follow++;}); }}
  return ZODIACS.map(z=>{ const s=stats[z]; const score=s.issue*w.issue+s.occur*w.occur+s.recent5*w.recent5+s.recent10*w.recent10+s.special*w.special+s.trend*w.trend+s.follow*w.follow; return {...s,score:round(score)}; }).sort((a,b)=>b.score-a.score);
}
function scorePing(rows,ratings){ const scores=Object.fromEntries(ZODIACS.map(z=>[z,0])); PING_MODELS.forEach(model=>{ const list=scorePingModel(rows,model); const max=Math.max(1,list[0]?.score||1); list.forEach((item,idx)=>{ scores[item.label]+=((item.score/max)*100+Math.max(0,12-idx)*3)*(ratings[model.id]||1); }); }); const list=ZODIACS.map(label=>({label,score:round(scores[label])})).sort((a,b)=>b.score-a.score); return {list,pick:list[0]||{label:"-",score:0},confidence:confidence(list)}; }
function scoreClassModel(rows,model,labels,type){
  const latest=latestRows(rows); const chrono=[...latest].reverse(); const w=model.w;
  const stats=Object.fromEntries(labels.map(x=>[x,{label:x,count:0,recent5:0,recent10:0,streak:0,follow:0,trend:0,score:0}]));
  chrono.forEach((row,idx)=>{ const v=classOfRow(row,type); if(!stats[v])return; const age=chrono.length-1-idx; stats[v].count++; if(age<5)stats[v].recent5++; if(age<10)stats[v].recent10++; });
  const latestValue=latest[0]?classOfRow(latest[0],type):""; if(latestValue&&stats[latestValue]) for(const row of latest){ if(classOfRow(row,type)===latestValue)stats[latestValue].streak++; else break; }
  if(latestValue) for(let i=1;i<chrono.length;i++){ if(classOfRow(chrono[i-1],type)===latestValue){ const next=classOfRow(chrono[i],type); if(stats[next])stats[next].follow++; }}
  const half=Math.floor(chrono.length/2), older=chrono.slice(0,half), newer=chrono.slice(half); labels.forEach(label=>{ let old=0,nu=0; older.forEach(r=>{if(classOfRow(r,type)===label)old++;}); newer.forEach(r=>{if(classOfRow(r,type)===label)nu++;}); stats[label].trend=Math.max(0,nu-old); });
  return labels.map(label=>{ const s=stats[label]; const score=s.count*w.count+s.recent5*w.recent5+s.recent10*w.recent10+s.streak*w.streak+s.follow*w.follow+s.trend*w.trend; return {...s,score:round(score)}; }).sort((a,b)=>b.score-a.score);
}
function scoreClass(rows,labels,type,ratings){ const scores=Object.fromEntries(labels.map(x=>[x,0])); CLASS_MODELS.forEach(model=>{ const list=scoreClassModel(rows,model,labels,type); const max=Math.max(1,list[0]?.score||1); list.forEach((item,idx)=>{ scores[item.label]+=((item.score/max)*100+Math.max(0,labels.length-idx)*5)*(ratings[model.id]||1); }); }); const list=labels.map(label=>({label,score:round(scores[label])})).sort((a,b)=>b.score-a.score); return {list,pick:list[0]||{label:"-",score:0},confidence:confidence(list)}; }
function makePrediction(rows,pingRatings,classRatings){ const ping=scorePing(rows,pingRatings); const color=scoreClass(rows,COLORS,"color",classRatings.color); const size=scoreClass(rows,SIZES,"size",classRatings.size); const parity=scoreClass(rows,PARITIES,"parity",classRatings.parity); const latest=uniqRows(rows)[0]; return { expect: latest?nextExpect(latest.expect):"", basedOn: latest?.expect||"", ping:ping.pick.label, color:color.list.slice(0,2).map(x=>x.label), size:size.pick.label, parity:parity.pick.label, byPingModel:Object.fromEntries(PING_MODELS.map(m=>[m.id,scorePingModel(rows,m)[0]?.label||""])), byColorModel:Object.fromEntries(CLASS_MODELS.map(m=>[m.id,scoreClassModel(rows,m,COLORS,"color").slice(0,2).map(x=>x.label)])), bySizeModel:Object.fromEntries(CLASS_MODELS.map(m=>[m.id,scoreClassModel(rows,m,SIZES,"size")[0]?.label||""])), byParityModel:Object.fromEntries(CLASS_MODELS.map(m=>[m.id,scoreClassModel(rows,m,PARITIES,"parity")[0]?.label||""])) }; }
function updateRatings(pred,actual,pingRatings,classRatings){ const newPing={...pingRatings}; const newClass={color:{...classRatings.color},size:{...classRatings.size},parity:{...classRatings.parity}}; const actualSet=new Set(actual.zodiacList); const actualColor=classOfRow(actual,"color"), actualSize=classOfRow(actual,"size"), actualParity=classOfRow(actual,"parity"); PING_MODELS.forEach(m=>{ newPing[m.id]=clamp((newPing[m.id]||1)+(actualSet.has(pred.byPingModel?.[m.id])?0.12:-0.08),0.25,5); }); CLASS_MODELS.forEach(m=>{ const colorPick=pred.byColorModel?.[m.id]||[]; newClass.color[m.id]=clamp((newClass.color[m.id]||1)+(colorPick.includes(actualColor)?0.12:-0.08),0.25,5); newClass.size[m.id]=clamp((newClass.size[m.id]||1)+(pred.bySizeModel?.[m.id]===actualSize?0.1:-0.06),0.25,5); newClass.parity[m.id]=clamp((newClass.parity[m.id]||1)+(pred.byParityModel?.[m.id]===actualParity?0.1:-0.06),0.25,5); }); return {pingRatings:newPing,classRatings:newClass}; }
function trainRatings(rows){ const all=chronological(rows); let pingRatings=baseRatings(PING_MODELS); let classRatings={color:baseRatings(CLASS_MODELS),size:baseRatings(CLASS_MODELS),parity:baseRatings(CLASS_MODELS)}; for(let i=TRAIN_MIN;i<all.length;i++){ const train=all.slice(Math.max(0,i-WINDOW),i); const pred=makePrediction(train,pingRatings,classRatings); const updated=updateRatings(pred,all[i],pingRatings,classRatings); pingRatings=updated.pingRatings; classRatings=updated.classRatings; } return {pingRatings,classRatings}; }
function settledHistory(rows,pingRatings,classRatings){ const all=chronological(rows); const out=[]; for(let i=Math.max(TRAIN_MIN,all.length-10);i<all.length;i++){ const train=all.slice(Math.max(0,i-WINDOW),i); if(train.length<TRAIN_MIN)continue; const actual=all[i]; const pred=makePrediction(train,pingRatings,classRatings); const colors=Array.isArray(pred.color)?pred.color:[pred.color]; const actualColor=classOfRow(actual,"color"), actualSize=classOfRow(actual,"size"), actualParity=classOfRow(actual,"parity"); out.unshift({expect:actual.expect,basedOn:pred.basedOn,ping:pred.ping,colors,size:pred.size,parity:pred.parity,actualNum:specialNum(actual),actualZodiacs:actual.zodiacList,actualColor,actualSize,actualParity,pingHit:new Set(actual.zodiacList).has(pred.ping),colorHit:colors.includes(actualColor),sizeHit:pred.size===actualSize,parityHit:pred.parity===actualParity}); } return out.slice(0,10); }
function historyStats(history){ const total=history.length; const count=key=>history.filter(x=>x[key]).length; return { total, pingRate:pct(count("pingHit"),total), colorRate:pct(count("colorHit"),total), sizeRate:pct(count("sizeHit"),total), parityRate:pct(count("parityHit"),total) }; }
function Badge({children}){ return <span className="badge">{children}</span>; }
function RatingRows({title,models,ratings}){ return <div className="card"><h3>{title}</h3>{models.map(m=><div className="rating" key={m.id}><span>{m.name}</span><div><i style={{width:`${clamp((ratings[m.id]||1)*20,5,100)}%`}} /></div><b>{round(ratings[m.id]||1)}</b></div>)}</div>; }

export default function App(){
  const [records,setRecords]=useState([]); const [importText,setImportText]=useState(""); const [status,setStatus]=useState("正在同步最新30期..."); const [autoRefresh,setAutoRefresh]=useState(true); const [lastCheck,setLastCheck]=useState(""); const [isSyncing,setIsSyncing]=useState(false);
  const trained=useMemo(()=>trainRatings(records),[records]); const recent30=useMemo(()=>latestRows(records,WINDOW),[records]); const prediction=useMemo(()=>makePrediction(recent30,trained.pingRatings,trained.classRatings),[recent30,trained]); const ping=useMemo(()=>scorePing(recent30,trained.pingRatings),[recent30,trained]); const color=useMemo(()=>scoreClass(recent30,COLORS,"color",trained.classRatings.color),[recent30,trained]); const size=useMemo(()=>scoreClass(recent30,SIZES,"size",trained.classRatings.size),[recent30,trained]); const parity=useMemo(()=>scoreClass(recent30,PARITIES,"parity",trained.classRatings.parity),[recent30,trained]); const history=useMemo(()=>settledHistory(records,trained.pingRatings,trained.classRatings),[records,trained]); const stats=useMemo(()=>historyStats(history),[history]);
  useEffect(()=>{ let saved=[]; try{ saved=JSON.parse(localStorage.getItem("zodiac_records_v1")||"[]").map(normalizeRecord); }catch{} setRecords(uniqRows([...saved,...FALLBACK_ROWS.map(normalizeRecord)])); syncLatest30(true); },[]);
  useEffect(()=>{ localStorage.setItem("zodiac_records_v1",JSON.stringify(records)); },[records]);
  useEffect(()=>{ if(!autoRefresh)return; const timer=setInterval(()=>syncLatest30(true),POLL_MS); return()=>clearInterval(timer); },[autoRefresh]);
  async function syncLatest30(silent=false){ if(isSyncing)return; setIsSyncing(true); if(!silent)setStatus("正在同步最新30期..."); try{ const rows=await fetchLatest30(); setRecords(old=>uniqRows([...old,...rows])); setStatus(`已同步最新30期，最新期号：${rows[0]?.expect||"-"}`); setLastCheck(new Date().toLocaleTimeString()); }catch(err){ if(!silent)setStatus(`同步失败：${err.message}。当前使用本地数据。`); }finally{ setIsSyncing(false); }}
  function importRows(){ const rows=parseRows(importText); if(!rows.length){ setStatus("没有识别到有效数据"); return; } setRecords(old=>uniqRows([...old,...rows])); setStatus(`成功导入 ${rows.length} 条；预测已刷新`); }
  function resetLocal(){ localStorage.removeItem("zodiac_records_v1"); setRecords(uniqRows(FALLBACK_ROWS.map(normalizeRecord))); setStatus("已重置本地数据"); syncLatest30(false); }
  return <div className="app"><header><div><span className="pill">🚀 打开即用 · 最新30期</span><h1>平特一肖 + 波色 + 大小单双</h1><p>打开自动同步最新30期，自动生成近10期已结算预测记录，并基于历史滚动训练权重。开奖随机性强，结果仅供参考。</p></div><div className="stats"><div><b>{records.length}</b><span>累计期数</span></div><div><b>{recent30.length}</b><span>固定最新30期</span></div><div><b>{autoRefresh?"开":"关"}</b><span>自动更新</span></div></div></header><main><section className="left"><div className="card"><h2>数据同步</h2><div className="grid2"><button onClick={()=>syncLatest30(false)}>🔄 同步最新30期</button><button onClick={resetLocal}>♻️ 重置本地</button><button onClick={importRows}>导入文本</button><label className="toggle"><input type="checkbox" checked={autoRefresh} onChange={e=>setAutoRefresh(e.target.checked)} />自动更新</label></div><textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder="可粘贴 JSON 数据"/><p className="status">{status}｜最后检查：{lastCheck||"初始化中"}</p></div><div className="card"><h2>最新使用数据</h2><div className="scroll">{recent30.slice(0,12).map(row=><div className="row" key={row.expect}><b>第 {row.expect} 期</b><span>{row.openTime}</span><p>{row.zodiacList.join(" ")}</p><small>{row.codeList.join(" ")}</small></div>)}</div></div></section><section className="right"><div className="card"><div className="head"><h2>🔥 下一期预测</h2><div><Badge>预测期号：{prediction.expect||"-"}</Badge><Badge>基于：{prediction.basedOn||"-"}</Badge></div></div><div className="preds"><div><span>平特一肖</span><strong>{ping.pick.label}</strong><em>信心：{ping.confidence.level}｜分差：{ping.confidence.edge}</em></div><div><span>波色选2</span><strong className="colors">{color.list.slice(0,2).map(x=><i key={x.label}>{x.label}</i>)}</strong><em>信心：{color.confidence.level}</em></div><div><span>大小</span><strong>{size.pick.label}</strong><em>信心：{size.confidence.level}</em></div><div><span>单双</span><strong>{parity.pick.label}</strong><em>信心：{parity.confidence.level}</em></div></div></div><div className="card"><div className="head"><h2>📋 近10期已结算预测记录</h2><div><Badge>肖 {stats.pingRate}%</Badge><Badge>波 {stats.colorRate}%</Badge><Badge>大小 {stats.sizeRate}%</Badge><Badge>单双 {stats.parityRate}%</Badge></div></div><div className="scroll">{history.map(item=><div className="history" key={item.expect}><b>第 {item.expect} 期</b><span>基于 {item.basedOn}</span><p>一肖：{item.ping} {item.pingHit?"✅":"❌"}　波色：{item.colors.join("/")} {item.colorHit?"✅":"❌"}　大小：{item.size} {item.sizeHit?"✅":"❌"}　单双：{item.parity} {item.parityHit?"✅":"❌"}</p><small>实际特码：{item.actualNum} {item.actualColor} {item.actualSize}{item.actualParity}；实际生肖：{item.actualZodiacs.join("/")}</small></div>)}</div></div><div className="weights"><RatingRows title="平特一肖权重" models={PING_MODELS} ratings={trained.pingRatings}/><RatingRows title="波色权重" models={CLASS_MODELS} ratings={trained.classRatings.color}/><RatingRows title="大小权重" models={CLASS_MODELS} ratings={trained.classRatings.size}/><RatingRows title="单双权重" models={CLASS_MODELS} ratings={trained.classRatings.parity}/></div></section></main></div>;
}

// 进阶版逻辑
const YEARS = [1960, 1970, 1980, 1990, 2000, 2010, 2020, 2024];
const DATA_YEAR_MAP = {1960:1960, 1970:1970, 1980:1980, 1990:1990, 2000:2000, 2010:2010, 2020:2020, 2024:2023};
const ENDPOINTS_PRIMARY = {
  population: "https://ourworldindata.org/grapher/population.csv",
  cbr: "https://ourworldindata.org/grapher/crude-birth-rate.csv",
  gdpPc: "https://ourworldindata.org/grapher/gdp-per-capita-worldbank.csv"
};
const ENDPOINTS_FALLBACK = {
  population: "https://ourworldindata.org/grapher/population.csv?download-format=tab",
  cbr: "https://ourworldindata.org/grapher/crude-birth-rate.csv?download-format=tab",
  gdpPc: "https://ourworldindata.org/grapher/gdp-per-capita-worldbank.csv?download-format=tab"
};

// 出生性别概率（自然比例）
const GENDER = { male: 0.512, female: 0.488 };

// 1960-1980 的经典发达国家（强制一等奖）
const CLASSIC_DEV = new Set(["USA","CAN","GBR","FRA","DEU","ITA","ESP","NLD","BEL","LUX","SWE","NOR","FIN","DNK","CHE","AUT","IRL","AUS","NZL","JPN"]);

// 简易中文名映射（缺失回退英文）
const ZH = {"CHN":"中国","IND":"印度","USA":"美国","IDN":"印度尼西亚","PAK":"巴基斯坦","NGA":"尼日利亚","BRA":"巴西","BGD":"孟加拉国","RUS":"俄罗斯",
"MEX":"墨西哥","ETH":"埃塞俄比亚","JPN":"日本","PHL":"菲律宾","EGY":"埃及","VNM":"越南","TUR":"土耳其","IRN":"伊朗","DEU":"德国",
"THA":"泰国","FRA":"法国","GBR":"英国","ITA":"意大利","ZAF":"南非","KOR":"韩国","COL":"哥伦比亚","ESP":"西班牙","ARG":"阿根廷","AUS":"澳大利亚",
"CAN":"加拿大","NLD":"荷兰","SWE":"瑞典","NOR":"挪威","FIN":"芬兰","DNK":"丹麦","CHE":"瑞士","AUT":"奥地利","IRL":"爱尔兰","NZL":"新西兰"};

function thresholdsForYear(year){
  if(year <= 1980) return {A: 20000, B: 8000};
  if(year <= 2000) return {A: 30000, B: 12000};
  if(year <= 2010) return {A: 35000, B: 15000};
  return {A: 38000, B: 17000};
}

function gapScale(year){
  if(year <= 1980) return 1.00;
  if(year <= 2000) return 0.85;
  if(year <= 2010) return 0.75;
  return 0.65;
}

function tierOf(code, year, gdpVal){
  if(year <= 1980 && CLASSIC_DEV.has(code)) return "A";
  const th = thresholdsForYear(year);
  if(!Number.isFinite(gdpVal)) return "C";
  if(gdpVal >= th.A) return "A";
  if(gdpVal >= th.B) return "B";
  return "C";
}

function tierScore(tier, year){
  const g = gapScale(year);
  const baseA = 95, baseB = 78, baseC = 45;
  const avg = 70;
  const adjust = (s)=> avg + (s-avg)*g;
  if(tier==="A") return adjust(baseA);
  if(tier==="B") return adjust(baseB);
  return adjust(baseC);
}

function regionScoreFromPercentile(p, year){
  const g = gapScale(year);
  const minS = 35, maxS = 98;
  const raw = minS + (maxS - minS) * Math.max(0, Math.min(1, p||0));
  return 70 + (raw - 70) * g;
}

function wealthProbFromPercentile(p){ const minP = 0.005, maxP = 0.14; return minP + (maxP-minP)*Math.max(0, Math.min(1,p||0)); }
function wealthScore(isWealthy, p){ return isWealthy ? 100 : (30 + 40 * Math.max(0, Math.min(1, p||0))); }
function finalScore(region, wealth, difficulty){ return region*0.40 + wealth*0.45 + difficulty*0.15; }

function fmtPct(x){ return (x*100).toFixed(2) + "%"; }
function cn(entity, code){ return ZH[code] || entity; }

// 轻量解析：只保留目标年份
function parseFilteredCSV(text){
  const target = new Set(Object.values(DATA_YEAR_MAP));
  const rows = [];
  let i=0, field="", row=[], inQuotes=false, header=null;
  function pushRow(r){
    if(!header){ header=r; return; }
    const idxEntity = header.indexOf("Entity");
    const idxCode   = header.indexOf("Code");
    const idxYear   = header.indexOf("Year");
    const idxValue  = header.length - 1;
    if(r.length < 4) return;
    const code=r[idxCode], year=+r[idxYear], value=r[idxValue];
    if(!code || code.length!==3 || !target.has(year)) return;
    rows.push({entity: r[idxEntity], code, year, value: value===""?null:+value});
  }
  while(i < text.length){
    const c = text[i];
    if(c === '"'){ if(inQuotes && text[i+1] === '"'){ field+='"'; i++; } else inQuotes=!inQuotes; }
    else if(c === ',' && !inQuotes){ row.push(field); field=""; }
    else if((c === '\n' || c === '\r') && !inQuotes){
      row.push(field); field=""; pushRow(row); row=[];
      if(c === '\r' && text[i+1] === '\n'){ i++; }
    }else{ field += c; }
    i++;
  }
  if(field.length || row.length){ row.push(field); pushRow(row); }
  return rows;
}

async function fetchAndBuild(EP){
  const status = document.getElementById("status");
  status.textContent = "正在下载数据……";
  const [popTxt, cbrTxt, gdpTxt] = await Promise.all([
    fetch(EP.population, {cache:"no-cache"}).then(r=>r.text()),
    fetch(EP.cbr, {cache:"no-cache"}).then(r=>r.text()),
    fetch(EP.gdpPc, {cache:"no-cache"}).then(r=>r.text())
  ]);
  const pop = parseFilteredCSV(popTxt);
  const cbr = parseFilteredCSV(cbrTxt);
  const gdp = parseFilteredCSV(gdpTxt);
  const idxPop=new Map(), idxCbr=new Map(), idxGdp=new Map();
  function add(map, rec){ if(!map.has(rec.code)) map.set(rec.code, new Map()); map.get(rec.code).set(rec.year, rec.value); }
  for(const r of pop) add(idxPop, r);
  for(const r of cbr) add(idxCbr, r);
  for(const r of gdp) add(idxGdp, r);

  const distributions={}, gdpPercentilesByYear={};
  for(const y of YEARS){
    const yUse = DATA_YEAR_MAP[y];
    const gvals=[];
    for(const [code,m] of idxGdp.entries()){
      const v=m.get(yUse); if(Number.isFinite(v)) gvals.push(v);
    }
    gvals.sort((a,b)=>a-b);
    function pctOf(val){
      if(!Number.isFinite(val)||gvals.length===0) return 0;
      let lo=0,hi=gvals.length-1,pos=0;
      while(lo<=hi){ const mid=(lo+hi)>>1; if(gvals[mid]<=val){pos=mid; lo=mid+1}else hi=mid-1; }
      return (pos+1)/gvals.length;
    }
    gdpPercentilesByYear[y]={pctOf};

    const list=[];
    for(const [code,m] of idxPop.entries()){
      const p=m.get(yUse);
      const b=idxCbr.get(code)?.get(yUse);
      if(p!=null && b!=null){
        const births=(p*b)/1000;
        if(Number.isFinite(births)&&births>0){
          const entity=pop.find(d=>d.code===code)?.entity || code;
          list.push({code, entity, births});
        }
      }
    }
    const total=list.reduce((s,d)=>s+d.births,0);
    const rows=list.map(d=>({...d, share:d.births/total})).sort((a,b)=>b.share-a.share);
    distributions[y]={totalBirths:total, rows};
  }
  return {distributions, gdpPercentilesByYear, idxGdpObj: serializeMap(idxGdp)};
}

function serializeMap(map){
  const o={};
  for(const [k,v] of map.entries()){
    const inner={};
    for(const [kk,vv] of v.entries()) inner[kk]=vv;
    o[k]=inner;
  }
  return o;
}
function getGDP(obj, code, year){ const yUse=DATA_YEAR_MAP[year]; return obj?.[code]?.[yUse] ?? null; }

async function loadData(){
  try{
    const r = await fetch("data/prebaked.json", {cache:"no-cache"});
    if(r.ok){
      const j = await r.json();
      if(j && j.distributions && j.idxGdpObj) return j;
    }
  }catch{}
  try{ return await fetchAndBuild(ENDPOINTS_PRIMARY); }
  catch(e1){ console.warn("主源失败，切备用", e1); return await fetchAndBuild(ENDPOINTS_FALLBACK); }
}

const history = [];

async function init(){
  const status = document.getElementById("status");
  try{
    const data = await loadData();
    window.__DATA = data;
    status.textContent = "数据就绪 ✅ 请选择年份并开始抽取。";
  }catch(e){
    console.error(e);
    status.textContent = "❌ 数据加载失败。可在仓库放置 data/prebaked.json 以离线使用。";
  }
  document.getElementById("rollOnce").onclick = onRollOnce;
  document.getElementById("rollTen").onclick = onRollTen;
  document.getElementById("clearHistory").onclick = ()=>{ history.length=0; renderHistory(); };
}

function weightedPick(rows){
  const r=Math.random(); let acc=0;
  for(const it of rows){ acc+=it.share; if(r<=acc) return it; }
  return rows[rows.length-1];
}

function onRollOnce(){ const y=+document.getElementById("yearSelect").value; const r=simulateOnce(y); renderOnce(r,y); addHistory(r,y); }
function onRollTen(){
  const y=+document.getElementById("yearSelect").value;
  const rs=[]; for(let i=0;i<10;i++) rs.push(simulateOnce(y));
  renderTen(rs,y); for(const r of rs) addHistory(r,y);
}

function simulateOnce(year){
  const dist=__DATA.distributions[year];
  const pick=weightedPick(dist.rows);
  const entityCN = cn(pick.entity, pick.code);

  const male=Math.random()<GENDER.male; const gender=male?"男":"女"; const genderProb=male?GENDER.male:GENDER.female;

  const gdpVal=getGDP(__DATA.idxGdpObj, pick.code, year);
  const pct=__DATA.gdpPercentilesByYear[year].pctOf(gdpVal);
  const wealthProb=wealthProbFromPercentile(pct);
  const wealthy=Math.random()<wealthProb;

  const t=tierOf(pick.code, year, gdpVal); const tSc=tierScore(t, year);
  const rSc=regionScoreFromPercentile(pct, year);
  const wSc=wealthScore(wealthy, pct);
  const score=Math.round(finalScore(rSc, wSc, tSc));

  const comboProb=pick.share*genderProb*(wealthy?wealthProb:(1-wealthProb));

  let emoji="🙂"; if(score>=85) emoji="🎉🌸✨"; else if(score<=55) emoji="💔🪨😣"; else emoji="👍";

  return { code:pick.code, country:entityCN, share:pick.share, gender, genderProb, wealthy, wealthProb, tier:t, score, comboProb, emoji };
}

function renderOnce(r, year){
  document.getElementById("rCountry").textContent=`${r.country}（${r.code}） | 当年国家投胎概率：${fmtPct(r.share)}`;
  document.getElementById("rGender").textContent=`${r.gender}（概率≈${fmtPct(r.genderProb)}）`;
  document.getElementById("rWealth").textContent=r.wealthy?`富裕（约 ${fmtPct(r.wealthProb)}）`:`一般（富裕概率约 ${fmtPct(r.wealthProb)}）`;
  const label = r.tier==="A"?"一等奖（高收入/发达）":(r.tier==="B"?"二等奖（中等发达）":"三等奖（发展中/欠发达）");
  document.getElementById("rTier").textContent=label;
  const scoreEl=document.getElementById("rScore"); scoreEl.textContent=`${r.score}/100`;
  scoreEl.className=(r.score>=80?"score-good":(r.score<=55?"score-bad":""));
  document.getElementById("rComboProb").textContent=`${fmtPct(r.comboProb)}（= 国家份额 × 性别 × 家庭条件）`;
  document.getElementById("rEmoji").textContent=r.emoji;
  document.getElementById("approxNote").textContent=(year===2024)?"注：2024 年用 2023 年数据近似；已对 1960–1980 的经典发达国家强制提升难度等级。":"已对 1960–1980 的经典发达国家强制提升难度等级。";
  document.getElementById("resultOnce").classList.remove("hidden");
}

function renderTen(list, year){
  const counts=new Map();
  for(const r of list){ const k=`${r.country}（${r.code}）`; counts.set(k,(counts.get(k)||0)+1); }
  const arr=[...counts.entries()].sort((a,b)=>b[1]-a[1]);
  const ul=document.createElement("ul"); for(const [k,v] of arr){ const li=document.createElement("li"); li.textContent=`${k} × ${v} 次`; ul.appendChild(li); }
  const tenDiv=document.getElementById("tenList"); tenDiv.innerHTML=""; tenDiv.appendChild(ul);
  document.getElementById("approxNote10").textContent=(year===2024)?"注：2024 年用 2023 年数据近似；":"";
  document.getElementById("resultTen").classList.remove("hidden");
}

function addHistory(r, year){
  const now=new Date();
  history.unshift({time:now.toLocaleString(),year, country:r.country, code:r.code, gender:r.gender, wealthy:r.wealthy?"富裕":"一般", tier:r.tier, score:r.score, combo:fmtPct(r.comboProb)});
  if(history.length>500) history.pop();
  renderHistory();
}

function renderHistory(){
  const card=document.getElementById("historyCard");
  const tbody=document.querySelector("#historyTable tbody");
  tbody.innerHTML="";
  for(const h of history){
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${h.time}</td><td>${h.year}</td><td>${h.country}（${h.code}）</td><td>${h.gender}</td><td>${h.wealthy}</td><td>${h.tier}</td><td>${h.score}</td><td>${h.combo}</td>`;
    tbody.appendChild(tr);
  }
  card.classList.toggle("hidden", history.length===0);
}

window.addEventListener("DOMContentLoaded", async ()=>{
  try{ await init(); }catch(e){ console.error(e); document.getElementById("status").textContent="❌ 数据加载失败，请刷新重试或使用本地 data/prebaked.json。"; }
});

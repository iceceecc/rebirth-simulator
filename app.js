// ===== v6 直觉加权版核心逻辑 =====
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

const GENDER = { male: 0.512, female: 0.488 };
function fmtPct(x){ return (x*100).toFixed(2) + "%"; }
function cn(entity, code){ return ZH[code] || entity; }

function gapScale(year){
  if(year <= 1980) return 1.00;
  if(year <= 2000) return 0.85;
  if(year <= 2010) return 0.75;
  return 0.65;
}

function difficultyTierByP(p, year, code){
  if(year <= 1980 && (OLD_DEV.has(code) || NEW_DEV.has(code))) return "A";
  if(p >= 0.7) return "A";
  if(p >= 0.4) return "B";
  return "C";
}

// 五维评分
function score_countryOpportunity(p, year, code){
  let CO = 20 + 80 * gapScale(year) * Math.sqrt(Math.max(0, Math.min(1, p||0)));
  if(OLD_DEV.has(code)){
    const bonus = (year<=1980?+15:year<=2000?+10:year<=2015?+6:+4);
    const floor = (year<=1980?80:year<=2000?76:year<=2015?74:72);
    CO = Math.max(CO + bonus, floor);
  }else if(NEW_DEV.has(code)){
    const bonus = (year<=1980?+8:year<=2000?+6:year<=2015?+4:+3);
    const floor = (year<=1980?72:year<=2000?68:year<=2015?66:64);
    CO = Math.max(CO + bonus, floor);
  }
  return Math.max(0, Math.min(100, CO));
}
function wealthProbFromPercentile(p){ const minP = 0.005, maxP = 0.14; return minP + (maxP - minP) * Math.max(0, Math.min(1, p||0)); }
function score_homeWealth(wealthy, p, year, code){
  let HW;
  if(wealthy){
    HW = 92 + 8 * Math.max(0, Math.min(1, p||0));
  }else{
    const base = 30 + 45 * Math.pow(Math.max(0, Math.min(1, p||0)), 0.6);
    const floor_old_non = (year<=1980?70:year<=2000?68:year<=2015?66:64);
    const floor_new_non = (year<=1980?62:year<=2000?60:year<=2015?58:56);
    if(OLD_DEV.has(code)) HW = Math.max(base, floor_old_non);
    else if(NEW_DEV.has(code)) HW = Math.max(base, floor_new_non);
    else HW = base;
    if(HIGH_RISK.has(code)) HW -= 10;
  }
  return Math.max(0, Math.min(100, HW));
}
function score_publicServices(p, code){
  let PS = 40 + 60 * Math.sqrt(Math.max(0, Math.min(1, p||0)));
  if(NORDIC.has(code)) PS += 5;
  return Math.min(100, PS);
}
function score_safetyStability(year, code){
  let SS = 85;
  if(HIGH_RISK.has(code)) SS -= 30;
  else if(MID_RISK.has(code)){
    SS -= (year<=2010 && year>=1990)? 12 : 8;
  }
  if(NORDIC.has(code)) SS += 5;
  return Math.max(0, Math.min(100, SS));
}
function score_socialEnv(p, code){
  let SE = (p>=0.7? 90 : p>=0.4? 75 : 55);
  if(EXTREME_SOCIAL.has(code)) SE -= 10;
  return Math.max(0, Math.min(100, SE));
}
function finalScoreBreakdown(p, wealthy, year, code){
  const CO = score_countryOpportunity(p, year, code);
  const HW = score_homeWealth(wealthy, p, year, code);
  const PS = score_publicServices(p, code);
  const SS = score_safetyStability(year, code);
  const SE = score_socialEnv(p, code);
  const score = Math.round(CO*0.35 + HW*0.35 + PS*0.10 + SS*0.15 + SE*0.05);
  return {CO, HW, PS, SS, SE, score};
}

// 轻量 CSV 解析（仅 8 年）
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
    for(const [code,m] of idxGdp.entries()){ const v=m.get(yUse); if(Number.isFinite(v)) gvals.push(v); }
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
      const p=m.get(yUse); const b=idxCbr.get(code)?.get(yUse);
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
  for(const [k,v] of map.entries()){ const inner={}; for(const [kk,vv] of v.entries()) inner[kk]=vv; o[k]=inner; }
  return o;
}
function getGDP(obj, code, year){ const yUse=DATA_YEAR_MAP[year]; return obj?.[code]?.[yUse] ?? null; }

async function loadData(){
  try{
    const r = await fetch("data/prebaked.json", {cache:"no-cache"});
    if(r.ok){ const j = await r.json(); if(j && j.distributions && j.idxGdpObj) return j; }
  }catch{}
  try{ return await fetchAndBuild(ENDPOINTS_PRIMARY); }
  catch(e1){ console.warn("主源失败，切备用", e1); return await fetchAndBuild(ENDPOINTS_FALLBACK); }
}

// 统计累加器
const agg = { total:0, sumScore:0, diff:{A:0,B:0,C:0}, wealth:{rich:0,non:0}, score:{low:0,mid:0,high:0,top:0} };
function bucketScore(s){ if(s>=90) return "top"; if(s>=80) return "high"; if(s>=60) return "mid"; return "low"; }
function updateAgg(r){ agg.total+=1; agg.sumScore+=r.score; agg.diff[r.tier]+=1; if(r.wealthy) agg.wealth.rich+=1; else agg.wealth.non+=1; agg.score[bucketScore(r.score)]+=1; }
function resetAgg(){ agg.total=0; agg.sumScore=0; agg.diff={A:0,B:0,C:0}; agg.wealth={rich:0,non:0}; agg.score={low:0,mid:0,high:0,top:0}; renderStats(); }

function pct(n, d){ return d? ((n*100/d).toFixed(1)+"%") : "0.0%"; }
function renderStats(){
  const total=agg.total;
  document.getElementById("sTotal").textContent=total;
  document.getElementById("sAvg").textContent= total? (agg.sumScore/total).toFixed(1) : "0.0";
  const tbodyD=document.querySelector("#tblDiff tbody"); tbodyD.innerHTML="";
  [["一等奖A",agg.diff.A],["二等奖B",agg.diff.B],["三等奖C",agg.diff.C]].forEach(([k,v])=>{
    const tr=document.createElement("tr"); tr.innerHTML=`<td>${k}</td><td>${v}</td><td>${pct(v,total)}</td>`; tbodyD.appendChild(tr);
  });
  const tbodyW=document.querySelector("#tblWealth tbody"); tbodyW.innerHTML="";
  [["富裕",agg.wealth.rich],["一般",agg.wealth.non]].forEach(([k,v])=>{
    const tr=document.createElement("tr"); tr.innerHTML=`<td>${k}</td><td>${v}</td><td>${pct(v,total)}</td>`; tbodyW.appendChild(tr);
  });
  const tbodyS=document.querySelector("#tblScore tbody"); tbodyS.innerHTML="";
  [["≤59（低分）",agg.score.low],["60–79（中等）",agg.score.mid],["80–89（较高）",agg.score.high],["≥90（顶尖）",agg.score.top]].forEach(([k,v])=>{
    const tr=document.createElement("tr"); tr.innerHTML=`<td>${k}</td><td>${v}</td><td>${pct(v,total)}</td>`; tbodyS.appendChild(tr);
  });
  document.getElementById("statsCard").classList.toggle("hidden", total===0);
}

// 抽样 & 渲染
function weightedPick(rows){ const r=Math.random(); let acc=0; for(const it of rows){ acc+=it.share; if(r<=acc) return it; } return rows[rows.length-1]; }

function simulateOnce(year){
  const dist=__DATA.distributions[year];
  const pick=weightedPick(dist.rows);
  const entityCN = cn(pick.entity, pick.code);

  const male=Math.random()<GENDER.male; const gender=male?"男":"女"; const genderProb=male?GENDER.male:GENDER.female;

  const gdpVal=getGDP(__DATA.idxGdpObj, pick.code, year);
  const pct = __DATA.gdpPercentilesByYear[year].pctOf(gdpVal);
  const wealthProb=wealthProbFromPercentile(pct);
  const wealthy=Math.random()<wealthProb;

  const brk = finalScoreBreakdown(pct, wealthy, year, pick.code);
  const tier = difficultyTierByP(pct, year, pick.code);

  const comboProb=pick.share*genderProb*(wealthy?wealthProb:(1-wealthProb));
  let emoji="🙂"; if(brk.score>=85) emoji="🎉🌸✨"; else if(brk.score<=55) emoji="💔🪨😣"; else emoji="👍";

  return { code:pick.code, country:entityCN, share:pick.share, gender, genderProb, wealthy, wealthProb, tier, score:brk.score, comboProb, emoji };
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
  document.getElementById("approxNote").textContent=(year===2024)?"注：2024 年用 2023 年数据近似；评分使用直觉加权模型。":"评分使用直觉加权模型。";
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

// 入口
async function init(){
  const status=document.getElementById("status");
  try{
    const data=await loadData(); window.__DATA=data;
    status.textContent="数据就绪 ✅ 请选择年份并开始抽取。";
  }catch(e){
    console.error(e);
    status.textContent="❌ 数据加载失败。可在仓库放置 data/prebaked.json 以离线使用。";
  }
  document.getElementById("rollOnce").onclick = ()=>{
    const y=+document.getElementById("yearSelect").value; const r=simulateOnce(y); renderOnce(r,y); updateAgg(r); renderStats();
  };
  document.getElementById("rollTen").onclick = ()=>{
    const y=+document.getElementById("yearSelect").value; const rs=[]; for(let i=0;i<10;i++) rs.push(simulateOnce(y));
    renderTen(rs,y); for(const r of rs){ updateAgg(r); } renderStats();
  };
  document.getElementById("clearStats").onclick = resetAgg;
}

window.addEventListener("DOMContentLoaded", init);

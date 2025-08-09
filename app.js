// v5.1 直觉加权·修复版
const YEARS = [1960,1970,1980,1990,2000,2010,2020,2024];
const DATA_YEAR_MAP = {1960:1960,1970:1970,1980:1980,1990:1990,2000:2000,2010:2010,2020:2020,2024:2023};

const ENDPOINTS_PRIMARY = {
  population:"https://ourworldindata.org/grapher/population.csv",
  cbr:"https://ourworldindata.org/grapher/crude-birth-rate.csv",
  gdpPc:"https://ourworldindata.org/grapher/gdp-per-capita-worldbank.csv"
};
const ENDPOINTS_FALLBACK = {
  population:"https://ourworldindata.org/grapher/population.csv?download-format=tab",
  cbr:"https://ourworldindata.org/grapher/crude-birth-rate.csv?download-format=tab",
  gdpPc:"https://ourworldindata.org/grapher/gdp-per-capita-worldbank.csv?download-format=tab"
};

// 出生性别概率（自然）
const GENDER = { male:0.512, female:0.488 };

// 中文映射（未命中回退英文）
const ZH = {
  "AFG": "阿富汗",
  "ALB": "阿尔巴尼亚",
  "DZA": "阿尔及利亚",
  "AND": "安道尔",
  "AGO": "安哥拉",
  "ATG": "安提瓜和巴布达",
  "ARG": "阿根廷",
  "ARM": "亚美尼亚",
  "AUS": "澳大利亚",
  "AUT": "奥地利",
  "AZE": "阿塞拜疆",
  "BHS": "巴哈马",
  "BHR": "巴林",
  "BGD": "孟加拉国",
  "BRB": "巴巴多斯",
  "BLR": "白俄罗斯",
  "BEL": "比利时",
  "BLZ": "伯利兹",
  "BEN": "贝宁",
  "BTN": "不丹",
  "BOL": "玻利维亚",
  "BIH": "波斯尼亚和黑塞哥维那",
  "BWA": "博茨瓦纳",
  "BRA": "巴西",
  "BRN": "文莱",
  "BGR": "保加利亚",
  "BFA": "布基纳法索",
  "BDI": "布隆迪",
  "KHM": "柬埔寨",
  "CMR": "喀麦隆",
  "CAN": "加拿大",
  "CPV": "佛得角",
  "CAF": "中非共和国",
  "TCD": "乍得",
  "CHL": "智利",
  "CHN": "中国",
  "COL": "哥伦比亚",
  "COM": "科摩罗",
  "COG": "刚果（布）",
  "COD": "刚果（金）",
  "CRI": "哥斯达黎加",
  "CIV": "科特迪瓦",
  "HRV": "克罗地亚",
  "CUB": "古巴",
  "CYP": "塞浦路斯",
  "CZE": "捷克",
  "DNK": "丹麦",
  "DJI": "吉布提",
  "DMA": "多米尼克",
  "DOM": "多米尼加",
  "ECU": "厄瓜多尔",
  "EGY": "埃及",
  "SLV": "萨尔瓦多",
  "GNQ": "赤道几内亚",
  "ERI": "厄立特里亚",
  "EST": "爱沙尼亚",
  "SWZ": "埃斯瓦蒂尼",
  "ETH": "埃塞俄比亚",
  "FJI": "斐济",
  "FIN": "芬兰",
  "FRA": "法国",
  "GAB": "加蓬",
  "GMB": "冈比亚",
  "GEO": "格鲁吉亚",
  "DEU": "德国",
  "GHA": "加纳",
  "GRC": "希腊",
  "GRD": "格林纳达",
  "GTM": "危地马拉",
  "GIN": "几内亚",
  "GNB": "几内亚比绍",
  "GUY": "圭亚那",
  "HTI": "海地",
  "HND": "洪都拉斯",
  "HUN": "匈牙利",
  "ISL": "冰岛",
  "IND": "印度",
  "IDN": "印度尼西亚",
  "IRN": "伊朗",
  "IRQ": "伊拉克",
  "IRL": "爱尔兰",
  "ISR": "以色列",
  "ITA": "意大利",
  "JAM": "牙买加",
  "JPN": "日本",
  "JOR": "约旦",
  "KAZ": "哈萨克斯坦",
  "KEN": "肯尼亚",
  "KIR": "基里巴斯",
  "KWT": "科威特",
  "KGZ": "吉尔吉斯斯坦",
  "LAO": "老挝",
  "LVA": "拉脱维亚",
  "LBN": "黎巴嫩",
  "LSO": "莱索托",
  "LBR": "利比里亚",
  "LBY": "利比亚",
  "LIE": "列支敦士登",
  "LTU": "立陶宛",
  "LUX": "卢森堡",
  "MDG": "马达加斯加",
  "MWI": "马拉维",
  "MYS": "马来西亚",
  "MDV": "马尔代夫",
  "MLI": "马里",
  "MLT": "马耳他",
  "MRT": "毛里塔尼亚",
  "MUS": "毛里求斯",
  "MEX": "墨西哥",
  "MDA": "摩尔多瓦",
  "MCO": "摩纳哥",
  "MNG": "蒙古",
  "MNE": "黑山",
  "MAR": "摩洛哥",
  "MOZ": "莫桑比克",
  "MMR": "缅甸",
  "NAM": "纳米比亚",
  "NRU": "瑙鲁",
  "NPL": "尼泊尔",
  "NLD": "荷兰",
  "NZL": "新西兰",
  "NIC": "尼加拉瓜",
  "NER": "尼日尔",
  "NGA": "尼日利亚",
  "MKD": "北马其顿",
  "NOR": "挪威",
  "OMN": "阿曼",
  "PAK": "巴基斯坦",
  "PLW": "帕劳",
  "PAN": "巴拿马",
  "PNG": "巴布亚新几内亚",
  "PRY": "巴拉圭",
  "PER": "秘鲁",
  "PHL": "菲律宾",
  "POL": "波兰",
  "PRT": "葡萄牙",
  "QAT": "卡塔尔",
  "ROU": "罗马尼亚",
  "RUS": "俄罗斯",
  "RWA": "卢旺达",
  "KNA": "圣基茨和尼维斯",
  "LCA": "圣卢西亚",
  "VCT": "圣文森特和格林纳丁斯",
  "WSM": "萨摩亚",
  "SMR": "圣马力诺",
  "STP": "圣多美和普林西比",
  "SAU": "沙特阿拉伯",
  "SEN": "塞内加尔",
  "SRB": "塞尔维亚",
  "SYC": "塞舌尔",
  "SLE": "塞拉利昂",
  "SGP": "新加坡",
  "SVK": "斯洛伐克",
  "SVN": "斯洛文尼亚",
  "SLB": "所罗门群岛",
  "SOM": "索马里",
  "ZAF": "南非",
  "KOR": "韩国",
  "SSD": "南苏丹",
  "ESP": "西班牙",
  "LKA": "斯里兰卡",
  "SDN": "苏丹",
  "SUR": "苏里南",
  "SWE": "瑞典",
  "CHE": "瑞士",
  "SYR": "叙利亚",
  "TJK": "塔吉克斯坦",
  "TZA": "坦桑尼亚",
  "THA": "泰国",
  "TLS": "东帝汶",
  "TGO": "多哥",
  "TON": "汤加",
  "TTO": "特立尼达和多巴哥",
  "TUN": "突尼斯",
  "TUR": "土耳其",
  "TKM": "土库曼斯坦",
  "TUV": "图瓦卢",
  "UGA": "乌干达",
  "UKR": "乌克兰",
  "ARE": "阿拉伯联合酋长国",
  "GBR": "英国",
  "USA": "美国",
  "URY": "乌拉圭",
  "UZB": "乌兹别克斯坦",
  "VUT": "瓦努阿图",
  "VAT": "梵蒂冈",
  "VEN": "委内瑞拉",
  "VNM": "越南",
  "YEM": "也门",
  "ZMB": "赞比亚",
  "ZWE": "津巴布韦",
  "HKG": "中国香港",
  "MAC": "中国澳门",
  "TWN": "中国台湾",
  "PSE": "巴勒斯坦",
  "XKX": "科索沃"
};

// 老牌发达 & 新发达
const OLD_GUARD = new Set(["USA","CAN","GBR","IRL","FRA","DEU","NLD","BEL","LUX","CHE","AUT","ITA","ESP","PRT","NOR","SWE","FIN","DNK","ISL","AUS","NZL"]);
const NEW_DEV = new Set(["JPN","KOR","SGP","HKG","TWN","ISR"]);

// 战乱/强扣
const WARTORN_STRONG = new Set(["SYR","YEM","AFG","SSD","SDN","SOM","COD","LBY","IRQ"]);
const CHALLENGE_LIGHT = new Set(["KHM","LAO","MMR","IDN","PHL","TLS","BOL","PRY","PER","ECU","VEN","COL","BRA","ARG","GTM","HND","SLV","NIC"]);

// 阈值与差距收敛（年代越新差距越小）
function thresholdsForYear(year){
  if(year <= 1980) return {A:20000, B:8000};
  if(year <= 2000) return {A:30000, B:12000};
  if(year <= 2010) return {A:35000, B:15000};
  return {A:38000, B:17000};
}
function gapScale(year){
  if(year <= 1980) return 1.00;
  if(year <= 2000) return 0.85;
  if(year <= 2010) return 0.75;
  return 0.65;
}

// 分档与分数
function tierOf(code, year, gdpVal){
  if(year <= 1980 && (OLD_GUARD.has(code) || code==="JPN")) return "A";
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
function wealthProbFromPercentile(p){ const minP=0.005, maxP=0.14; return minP + (maxP-minP)*Math.max(0, Math.min(1,p||0)); }
function wealthScore(isWealthy, p){ return isWealthy ? 100 : (30 + 40 * Math.max(0, Math.min(1,p||0))); }
function finalScore(region, wealth, difficulty){ return region*0.40 + wealth*0.45 + difficulty*0.15; }

function fmtPct(x){ return (x*100).toFixed(2)+"%"; }
function cn(entity, code){ return ZH[code] || entity || code; }

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

// 直觉加成/下限/扣分 —— 所有都带兜底，不会抛错
function eraBonusFactor(year){
  if(year <= 1980) return 1.30;
  if(year <= 2000) return 1.15;
  if(year <= 2015) return 1.08;
  return 1.00;
}
function eraMalusFactor(year){
  if(year <= 1980) return 1.15;
  if(year <= 2000) return 1.08;
  return 1.00;
}

function applyIntuitiveAdjustments(code, year, wealthy, regionSc, wealthSc, tierSc){
  let r = regionSc, w = wealthSc, d = tierSc;
  const b = eraBonusFactor(year), m = eraMalusFactor(year);

  // 老牌发达：更高加成 + 下限
  if(OLD_GUARD.has(code)){
    // 下限（按年代）
    const floorR = (year<=1980)?80:(year<=2000)?78:(year<=2015)?75:72;
    const floorW = (year<=1980)?65:(year<=2000)?62:(year<=2015)?60:58;
    r = Math.max(r, floorR);
    if(!wealthy) w = Math.max(w, floorW);
    // 适度加成
    r = Math.min(100, r * b);
    if(!wealthy) w = Math.min(100, w * (1 + 0.05*(b-1)/0.30)); // 小幅跟随 b
  }

  // 新发达：适度加成 + 下限
  if(NEW_DEV.has(code)){
    const floorR = (year<=1980)?75:(year<=2000)?72:(year<=2015)?70:68;
    const floorW = (year<=1980)?60:(year<=2000)?58:(year<=2015)?56:54;
    r = Math.max(r, floorR);
    if(!wealthy) w = Math.max(w, floorW);
    r = Math.min(100, r * (1 + 0.15*(b-1)/0.30));
  }

  // 战乱强扣
  if(WARTORN_STRONG.has(code)){
    r = Math.max(20, r - 10*m);
    d = Math.max(20, d - 8*m);
    if(!wealthy) w = Math.max(20, w - 6*m);
  }

  // 轻度挑战区
  if(CHALLENGE_LIGHT.has(code)){
    r = Math.max(25, r - 5*m);
    d = Math.max(25, d - 3*m);
  }

  // 确保范围
  r = Math.max(0, Math.min(100, r));
  w = Math.max(0, Math.min(100, w));
  d = Math.max(0, Math.min(100, d));
  return {region:r, wealth:w, diff:d};
}

// 统计累加器
const agg = { total:0, sumScore:0, diff:{A:0,B:0,C:0}, wealth:{rich:0,non:0}, score:{low:0,mid:0,high:0,top:0} };
function bucketScore(s){ if(s>=90) return "top"; if(s>=80) return "high"; if(s>=60) return "mid"; return "low"; }
function updateAgg(r){ agg.total++; agg.sumScore+=r.score; agg.diff[r.tier]++; if(r.wealthy) agg.wealth.rich++; else agg.wealth.non++; agg.score[bucketScore(r.score)]++; }
function resetAgg(){ agg.total=0; agg.sumScore=0; agg.diff={A:0,B:0,C:0}; agg.wealth={rich:0,non:0}; agg.score={low:0,mid:0,high:0,top:0}; renderStats(); }

function fmtProb(p){ try{return (p*100).toFixed(2)+"%";}catch{return "—";} }
function weightedPick(rows){ const r=Math.random(); let acc=0; for(const it of rows){ acc+=it.share; if(r<=acc) return it; } return rows[rows.length-1]; }

function simulateOnce(year){
  const dist = window.__DATA?.distributions?.[year];
  if(!dist || !dist.rows?.length) throw new Error("数据未就绪");
  const pick = weightedPick(dist.rows);
  const countryCN = cn(pick.entity, pick.code);

  // 性别
  const male = Math.random() < GENDER.male;
  const gender = male ? "男" : "女";
  const genderProb = male ? GENDER.male : GENDER.female;

  // 经济百分位与富裕概率
  const gdpVal = getGDP(window.__DATA.idxGdpObj, pick.code, year);
  const pct = window.__DATA.gdpPercentilesByYear[year].pctOf(gdpVal);
  const wealthProb = wealthProbFromPercentile(pct);
  const wealthy = Math.random() < wealthProb;

  // 档位与基础分
  const tier = tierOf(pick.code, year, gdpVal);
  let tierSc = tierScore(tier, year);
  let regionSc = regionScoreFromPercentile(pct, year);
  let wealthSc = wealthScore(wealthy, pct);

  // 应用直觉加权
  const adj = applyIntuitiveAdjustments(pick.code, year, wealthy, regionSc, wealthSc, tierSc);
  regionSc = adj.region; wealthSc = adj.wealth; tierSc = adj.diff;

  // 综合分
  const score = Math.round(finalScore(regionSc, wealthSc, tierSc));

  // 组合概率
  const comboProb = pick.share * genderProb * (wealthy ? wealthProb : (1 - wealthProb));

  // 反馈 emoji
  let emoji="🙂"; if(score>=85) emoji="🎉🌸✨"; else if(score<=55) emoji="💔🪨😣"; else emoji="👍";

  return { code:pick.code, country:countryCN, share:pick.share, gender, genderProb, wealthy, wealthProb, tier, score, comboProb, emoji };
}

function renderOnce(r, year){
  document.getElementById("rCountry").textContent = `${r.country}（${r.code}） | 当年国家投胎概率：${fmtProb(r.share)}`;
  document.getElementById("rGender").textContent = `${r.gender}（概率≈${fmtProb(r.genderProb)}）`;
  document.getElementById("rWealth").textContent = r.wealthy ? `富裕（约 ${fmtProb(r.wealthProb)}）` : `一般（富裕概率约 ${fmtProb(r.wealthProb)}）`;
  const label = r.tier==="A"?"一等奖（高收入/发达）":(r.tier==="B"?"二等奖（中等发达）":"三等奖（发展中/欠发达）");
  document.getElementById("rTier").textContent = label;
  const se = document.getElementById("rScore");
  se.textContent = `${r.score}/100`;
  se.className = (r.score>=80?"score-good":(r.score<=55?"score-bad":""));
  document.getElementById("rComboProb").textContent = `${fmtProb(r.comboProb)}（= 国家份额 × 性别 × 家庭条件）`;
  document.getElementById("rEmoji").textContent = r.emoji;
  document.getElementById("approxNote").textContent = (year===2024) ? "注：2024 年用 2023 年数据近似；已加入直觉加成/下限/扣分。" : "已加入直觉加成/下限/扣分。";
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

function pct(n,d){ return d? ((n*100/d).toFixed(1)+"%"):"0.0%"; }
function renderStats(){
  const card=document.getElementById("statsCard");
  const total=agg.total;
  document.getElementById("sTotal").textContent=total;
  document.getElementById("sAvg").textContent= total? (agg.sumScore/total).toFixed(1) : "0.0";

  const dBody=document.querySelector("#tblDiff tbody"); dBody.innerHTML="";
  [["一等奖A",agg.diff.A],["二等奖B",agg.diff.B],["三等奖C",agg.diff.C]].forEach(([k,v])=>{
    const tr=document.createElement("tr"); tr.innerHTML=`<td>${k}</td><td>${v}</td><td>${pct(v,total)}</td>`; dBody.appendChild(tr);
  });

  const wBody=document.querySelector("#tblWealth tbody"); wBody.innerHTML="";
  [["富裕",agg.wealth.rich],["一般",agg.wealth.non]].forEach(([k,v])=>{
    const tr=document.createElement("tr"); tr.innerHTML=`<td>${k}</td><td>${v}</td><td>${pct(v,total)}</td>`; wBody.appendChild(tr);
  });

  const sBody=document.querySelector("#tblScore tbody"); sBody.innerHTML="";
  [["≤59（低分）",agg.score.low],["60–79（中等）",agg.score.mid],["80–89（较高）",agg.score.high],["≥90（顶尖）",agg.score.top]].forEach(([k,v])=>{
    const tr=document.createElement("tr"); tr.innerHTML=`<td>${k}</td><td>${v}</td><td>${pct(v,total)}</td>`; sBody.appendChild(tr);
  });

  card.classList.toggle("hidden", total===0);
}

// 交互
function safeSimulateOnce(year){
  try{ return simulateOnce(year); }
  catch(e){
    console.error(e);
    const s=document.getElementById("status");
    if(s) s.textContent="❌ 数据未就绪或解析失败，请刷新页面或稍后再试。";
    return null;
  }
}

function onRollOnce(){
  const y=+document.getElementById("yearSelect").value;
  const r=safeSimulateOnce(y); if(!r) return;
  renderOnce(r,y); updateAgg(r); renderStats();
}
function onRollTen(){
  const y=+document.getElementById("yearSelect").value;
  const rs=[]; for(let i=0;i<10;i++){ const r=safeSimulateOnce(y); if(r) rs.push(r); }
  if(rs.length===0) return;
  renderTen(rs,y); for(const r of rs){ updateAgg(r); } renderStats();
}

// 数据加载
async function init(){
  const status=document.getElementById("status");
  try{
    const data=await loadData();
    window.__DATA=data;
    status.textContent="数据就绪 ✅ 请选择年份并开始抽取。";
  }catch(e){
    console.error(e);
    status.textContent="❌ 数据加载失败。可在仓库放置 data/prebaked.json 以离线使用。";
  }
  document.getElementById("rollOnce").onclick=onRollOnce;
  document.getElementById("rollTen").onclick=onRollTen;
  document.getElementById("clearStats").onclick=resetAgg;
}

window.addEventListener("DOMContentLoaded", init);

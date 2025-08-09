// 升级版：仅“投胎一次”；显示性别、富裕概率、难度等级、综合评分与组合概率
// 数据：OWID population / crude-birth-rate / gdp-per-capita-worldbank
// 2024 年使用 2023 年近似
const YEARS = [1960, 1970, 1980, 1990, 2000, 2010, 2020, 2024];
const DATA_YEAR_MAP = {1960:1960, 1970:1970, 1980:1980, 1990:1990, 2000:2000, 2010:2010, 2020:2020, 2024:2023};

const ENDPOINTS = {
  population: "https://ourworldindata.org/grapher/population.csv",
  cbr: "https://ourworldindata.org/grapher/crude-birth-rate.csv",
  gdpPc: "https://ourworldindata.org/grapher/gdp-per-capita-worldbank.csv"
};

// 全局性别概率（出生时男性略多于女性）
const GENDER_PROB = { male: 0.512, female: 0.488 };

// 难度等级（刻板印象近似）：按当年人均 GDP (PPP) 的阈值分档，可自行调整
// 例如 >= 35k: 一等奖；15k~35k: 二等奖；<15k: 三等奖
const DIFFICULTY_THRESHOLDS = { A: 35000, B: 15000 };
const DIFFICULTY_LABELS = {
  A: "一等奖（高收入/发达地区）",
  B: "二等奖（中等发达地区）",
  C: "三等奖（发展中及欠发达地区）"
};
// 可选：手动覆盖某些国家的等级（ISO3: "A"|"B"|"C"）
const DIFFICULTY_OVERRIDES = {
  // "CHN": "C",
};

// 富裕概率映射（基于当年的人均 GDP 百分位）：从 0.5% 到 12% 线性映射
function wealthProbFromPercentile(p) {
  const minP = 0.005;
  const maxP = 0.12;
  return minP + (maxP - minP) * Math.max(0, Math.min(1, p));
}

// 中文名称映射（常见国家优先，缺失时回退英文）
const ZH_NAMES = {
  "CHN":"中国","IND":"印度","USA":"美国","IDN":"印度尼西亚","PAK":"巴基斯坦","NGA":"尼日利亚","BRA":"巴西","BGD":"孟加拉国","RUS":"俄罗斯",
  "MEX":"墨西哥","ETH":"埃塞俄比亚","JPN":"日本","PHL":"菲律宾","EGY":"埃及","VNM":"越南","TUR":"土耳其","IRN":"伊朗","DEU":"德国",
  "THA":"泰国","FRA":"法国","GBR":"英国","ITA":"意大利","ZAF":"南非","TZA":"坦桑尼亚","MMR":"缅甸","KEN":"肯尼亚","KOR":"韩国",
  "COL":"哥伦比亚","ESP":"西班牙","UKR":"乌克兰","SDN":"苏丹","ARG":"阿根廷","DZA":"阿尔及利亚","POL":"波兰","UGA":"乌干达",
  "IRQ":"伊拉克","CAN":"加拿大","MAR":"摩洛哥","AFG":"阿富汗","SAU":"沙特阿拉伯","PER":"秘鲁","MYS":"马来西亚","UZB":"乌兹别克斯坦",
  "YEM":"也门","GHA":"加纳","MOZ":"莫桑比克","NPL":"尼泊尔","AGO":"安哥拉","VEN":"委内瑞拉","AUS":"澳大利亚","MDG":"马达加斯加",
  "CMR":"喀麦隆","CIV":"科特迪瓦","NLD":"荷兰","PRK":"朝鲜","ROU":"罗马尼亚","SOM":"索马里","PRY":"巴拉圭","BOL":"玻利维亚",
  "ZMB":"赞比亚","SWE":"瑞典","HUN":"匈牙利","CZE":"捷克","GRC":"希腊","PRT":"葡萄牙","ISR":"以色列","JOR":"约旦","ARE":"阿联酋",
  "QAT":"卡塔尔","KWT":"科威特","SGP":"新加坡","HKG":"中国香港","TWN":"中国台湾","IRL":"爱尔兰","NOR":"挪威","FIN":"芬兰","DNK":"丹麦",
  "AUT":"奥地利","CHE":"瑞士","BEL":"比利时","LUX":"卢森堡","NZL":"新西兰","CHL":"智利","ECU":"厄瓜多尔","BFA":"布基纳法索",
  "MLI":"马里","NER":"尼日尔","SEN":"塞内加尔","TCD":"乍得","RWA":"卢旺达","SRB":"塞尔维亚","BGR":"保加利亚",
  "BLR":"白俄罗斯","KAZ":"哈萨克斯坦","TKM":"土库曼斯坦","KGZ":"吉尔吉斯斯坦","TJK":"塔吉克斯坦","MNG":"蒙古","LAO":"老挝",
  "KHM":"柬埔寨","BRN":"文莱","LKA":"斯里兰卡","BTN":"不丹","ZWE":"津巴布韦","TUN":"突尼斯","LBY":"利比亚","LBN":"黎巴嫩","PSE":"巴勒斯坦",
  "OMN":"阿曼","BHR":"巴林","ISL":"冰岛","EST":"爱沙尼亚","LVA":"拉脱维亚","LTU":"立陶宛","SVK":"斯洛伐克","SVN":"斯洛文尼亚","HRV":"克罗地亚",
  "ALB":"阿尔巴尼亚","MKD":"北马其顿","MDA":"摩尔多瓦","ARM":"亚美尼亚","AZE":"阿塞拜疆","GEO":"格鲁吉亚",
  "COD":"刚果（金）","COG":"刚果（布）","GAB":"加蓬","CAF":"中非","GNQ":"赤道几内亚","GMB":"冈比亚","GNB":"几内亚比绍","GIN":"几内亚",
  "SLE":"塞拉利昂","LBR":"利比里亚","SSD":"南苏丹","ERI":"厄立特里亚","DJI":"吉布提","BDI":"布隆迪","MWI":"马拉维",
  "NAM":"纳米比亚","BWA":"博茨瓦纳","SWZ":"埃斯瓦蒂尼","LSO":"莱索托","MUS":"毛里求斯","CYP":"塞浦路斯","SYR":"叙利亚",
  "BHS":"巴哈马","CUB":"古巴","DOM":"多米尼加","HTI":"海地","JAM":"牙买加","TTO":"特立尼达和多巴哥",
  "GTM":"危地马拉","HND":"洪都拉斯","SLV":"萨尔瓦多","NIC":"尼加拉瓜","CRI":"哥斯达黎加","PAN":"巴拿马",
  "GUY":"圭亚那","SUR":"苏里南","URY":"乌拉圭"
};

function parseCSV(text){
  const rows = [];
  let i=0, field="", row=[], inQuotes=false;
  while(i < text.length){
    const c = text[i];
    if(c === '"'){
      if(inQuotes && text[i+1] === '"'){ field += '"'; i++; }
      else inQuotes = !inQuotes;
    }else if(c === ',' && !inQuotes){
      row.push(field); field="";
    }else if((c === '\n' || c === '\r') && !inQuotes){
      if(field.length || row.length){ row.push(field); rows.push(row); row=[]; field=""; }
      if(c === '\r' && text[i+1] === '\n'){ i++; }
    }else{
      field += c;
    }
    i++;
  }
  if(field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function tidyOWID(rows){
  const header = rows[0];
  const idxEntity = header.indexOf("Entity");
  const idxCode   = header.indexOf("Code");
  const idxYear   = header.indexOf("Year");
  const idxValue  = header.length - 1;
  const out = [];
  for(let r=1; r<rows.length; r++){
    const row = rows[r];
    if(!row || row.length < 4) continue;
    const code=row[idxCode], year=+row[idxYear], value=row[idxValue];
    if(!code || code.length !== 3) continue;
    const v = value === "" ? null : +value;
    if(!Number.isFinite(year)) continue;
    out.push({entity: row[idxEntity], code, year, value: v});
  }
  return out;
}

function indexify(arr){
  const m = new Map();
  for(const rec of arr){
    if(!m.has(rec.code)) m.set(rec.code, new Map());
    m.get(rec.code).set(rec.year, rec.value);
  }
  return m;
}

async function loadAll(){
  const status = document.getElementById("status");
  status.textContent = "正在从 OWID 下载人口、出生率和人均GDP……";

  try{
    const [popTxt, cbrTxt, gdpTxt] = await Promise.all([
      fetch(ENDPOINTS.population).then(r=>r.text()),
      fetch(ENDPOINTS.cbr).then(r=>r.text()),
      fetch(ENDPOINTS.gdpPc).then(r=>r.text())
    ]);

    const pop = tidyOWID(parseCSV(popTxt));
    const cbr = tidyOWID(parseCSV(cbrTxt));
    const gdp = tidyOWID(parseCSV(gdpTxt));

    const idxPop = indexify(pop);
    const idxCbr = indexify(cbr);
    const idxGdp = indexify(gdp);

    const distributions = {};
    const gdpPercentilesByYear = {};

    for(const y of YEARS){
      const yUse = DATA_YEAR_MAP[y];

      const gdpVals = [];
      for(const [code, mapG] of idxGdp.entries()){
        const val = mapG.get(yUse);
        if(Number.isFinite(val)) gdpVals.push(val);
      }
      gdpVals.sort((a,b)=>a-b);
      function pctOf(val){
        if(!Number.isFinite(val) || gdpVals.length===0) return null;
        let lo=0, hi=gdpVals.length-1, pos=0;
        while(lo<=hi){
          const mid=(lo+hi)>>1;
          if(gdpVals[mid] <= val){ pos=mid; lo=mid+1; } else { hi=mid-1; }
        }
        return (pos+1)/gdpVals.length;
      }
      gdpPercentilesByYear[y] = { pctOf };

      const list = [];
      for(const [code, mapPop] of idxPop.entries()){
        const p = mapPop.get(yUse);
        const bRate = idxCbr.get(code)?.get(yUse);
        if(p != null && bRate != null){
          const births = (p * bRate) / 1000;
          if(Number.isFinite(births) && births>0){
            const entityName = pop.find(d => d.code===code)?.entity || code;
            list.push({code, entity: entityName, births});
          }
        }
      }
      const total = list.reduce((s,d)=>s+d.births, 0);
      const withShare = list.map(d => ({...d, share: d.births/total}))
                            .sort((a,b)=>b.share - a.share);
      distributions[y] = {totalBirths: total, rows: withShare};
    }

    status.textContent = "数据加载完成 ✅ 请选择年份并开始抽取。";

    const yearSelect = document.getElementById("yearSelect");
    document.getElementById("rollOnce").onclick = () => {
      const y = +yearSelect.value;
      drawOnce(distributions, y, {idxGdp, gdpPercentilesByYear});
    };

  }catch(err){
    console.error(err);
    status.textContent = "❌ 数据加载失败。请检查网络或稍后重试。";
  }
}

function weightedPick(rows){
  const r = Math.random();
  let acc = 0;
  for(const item of rows){
    acc += item.share;
    if(r <= acc) return item;
  }
  return rows[rows.length-1];
}

function fmtPct(x){ return (x*100).toFixed(2) + "%"; }

function chineseName(entity, code){
  return ZH_NAMES[code] || entity;
}

function difficultyTier(code, year, idxGdp){
  const yUse = DATA_YEAR_MAP[year];
  if(DIFFICULTY_OVERRIDES[code]) return DIFFICULTY_OVERRIDES[code];
  const g = idxGdp.get(code)?.get(yUse);
  if(!Number.isFinite(g)) return "C";
  if(g >= DIFFICULTY_THRESHOLDS.A) return "A";
  if(g >= DIFFICULTY_THRESHOLDS.B) return "B";
  return "C";
}

// 富裕概率：由当年人均 GDP 的全球百分位映射到 0.5%~12%
function wealthProbFromPercentile(p) {
  const minP = 0.005;
  const maxP = 0.12;
  return minP + (maxP - minP) * Math.max(0, Math.min(1, p));
}

function drawOnce(distributions, year, extras){
  const yUse = DATA_YEAR_MAP[year];
  const dist = distributions[year];
  if(!dist) return;

  const pick = weightedPick(dist.rows);
  const zh = chineseName(pick.entity, pick.code);

  const genderProbMale = 0.512, genderProbFemale = 0.488;
  const isMale = Math.random() < genderProbMale;
  const gender = isMale ? "男" : "女";
  const genderProb = isMale ? genderProbMale : genderProbFemale;

  const gdpVal = extras.idxGdp.get(pick.code)?.get(yUse);
  const pct = extras.gdpPercentilesByYear[year].pctOf(gdpVal);
  const wealthProb = pct==null ? 0.01 : wealthProbFromPercentile(pct);
  const isWealthy = Math.random() < wealthProb;

  const tier = difficultyTier(pick.code, year, extras.idxGdp);
  const tierLabel = {A:"一等奖（高收入/发达地区）",B:"二等奖（中等发达地区）",C:"三等奖（发展中及欠发达地区）"}[tier];

  let base = tier==="A" ? 80 : tier==="B" ? 70 : 60;
  let score = base + (isWealthy ? 15 : 0);
  if(score > 100) score = 100;

  const comboProb = pick.share * genderProb * (isWealthy ? wealthProb : (1 - wealthProb));

  let emoji = "🙂";
  if(score >= 85) emoji = "🎉🌸✨";
  else if(score <= 60) emoji = "💔🪨😣";
  else emoji = "👍";

  document.getElementById("rCountry").textContent = `${zh}（${pick.code}） | 当年国家投胎概率：${fmtPct(pick.share)}`;
  document.getElementById("rGender").textContent = `${gender}（概率≈${fmtPct(genderProb)}）`;
  document.getElementById("rWealth").textContent = isWealthy ? `富裕（约 ${fmtPct(wealthProb)}）` : `一般（富裕概率约 ${fmtPct(wealthProb)}）`;
  document.getElementById("rTier").textContent = tierLabel;
  const scoreEl = document.getElementById("rScore");
  scoreEl.textContent = `${Math.round(score)}/100`;
  scoreEl.className = (score>=80 ? "score-good" : (score<=60 ? "score-bad" : ""));
  document.getElementById("rComboProb").textContent = `${fmtPct(comboProb)}（= 国家份额 × 性别 × 家庭条件）`;
  document.getElementById("rEmoji").textContent = emoji;

  const note = document.getElementById("approxNote");
  note.textContent = (year===2024) ? "注：2024 年暂以 2023 年数据近似计算；富裕概率由当年人均GDP在全球的百分位近似估计。" : "富裕概率由当年人均GDP在全球的百分位近似估计。";

  document.getElementById("resultOnce").classList.remove("hidden");
}

window.addEventListener("DOMContentLoaded", loadAll);

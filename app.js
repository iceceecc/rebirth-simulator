// 数据抓取：使用 Our World in Data 的 CSV（基于 UN WPP 2024）
// population: 人口（人）
// crude-birth-rate: 粗出生率（每千人每年出生数）
// life-expectancy: 预期寿命（岁）
// gdp-per-capita-worldbank: 人均GDP（国际-$，不变价、购买力平价；1990年起）
// 说明：为简化与稳定，2024 年使用 2023 年的数值近似。

const YEARS = [1960, 1970, 1980, 1990, 2000, 2010, 2020, 2024];
const DATA_YEAR_MAP = {1960:1960, 1970:1970, 1980:1980, 1990:1990, 2000:2000, 2010:2010, 2020:2020, 2024:2023};

const ENDPOINTS = {
  population: "https://ourworldindata.org/grapher/population.csv",
  cbr: "https://ourworldindata.org/grapher/crude-birth-rate.csv",
  lifeExp: "https://ourworldindata.org/grapher/life-expectancy.csv",
  gdpPc: "https://ourworldindata.org/grapher/gdp-per-capita-worldbank.csv"
};

// 简易 CSV 解析（处理引号与逗号）
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
      // handle \r\n
      if(c === '\r' && text[i+1] === '\n'){ i++; }
    }else{
      field += c;
    }
    i++;
  }
  if(field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// 将 CSV 行转为对象数组：期望表头为 Entity,Code,Year,Value
function tidyOWID(rows){
  const header = rows[0];
  const idxEntity = header.indexOf("Entity");
  const idxCode   = header.indexOf("Code");
  const idxYear   = header.indexOf("Year");
  // 值列名称可能不同（Population / Crude birth rate / Life expectancy / GDP per capita）——取最后一列
  const idxValue  = header.length - 1;
  const out = [];
  for(let r=1; r<rows.length; r++){
    const row = rows[r];
    if(!row || row.length < 4) continue;
    const code=row[idxCode], year=+row[idxYear], value=row[idxValue];
    // 仅保留国家级（ISO3 代码为 3 字母），排除大洲/世界/聚合（OWID_*）
    if(!code || code.length !== 3) continue;
    const v = value === "" ? null : +value;
    if(!Number.isFinite(year)) continue;
    out.push({entity: row[idxEntity], code, year, value: v});
  }
  return out;
}

// 装载所有数据
async function loadAll(){
  const status = document.getElementById("status");
  status.textContent = "正在从 OWID 下载人口、出生率、寿命与人均GDP数据……";

  try{
    const [popTxt, cbrTxt, lifeTxt, gdpTxt] = await Promise.all([
      fetch(ENDPOINTS.population).then(r=>r.text()),
      fetch(ENDPOINTS.cbr).then(r=>r.text()),
      fetch(ENDPOINTS.lifeExp).then(r=>r.text()),
      fetch(ENDPOINTS.gdpPc).then(r=>r.text()),
    ]);

    const pop = tidyOWID(parseCSV(popTxt));
    const cbr = tidyOWID(parseCSV(cbrTxt));
    const life = tidyOWID(parseCSV(lifeTxt));
    const gdp = tidyOWID(parseCSV(gdpTxt));

    // 建立索引 Map: map[code][year] = value
    function indexify(arr){
      const m = new Map();
      for(const rec of arr){
        if(!m.has(rec.code)) m.set(rec.code, new Map());
        m.get(rec.code).set(rec.year, rec.value);
      }
      return m;
    }
    const idxPop = indexify(pop);
    const idxCbr = indexify(cbr);
    const idxLife = indexify(life);
    const idxGdp = indexify(gdp);

    // 生成每个年份的权重分布：[{code, entity, births, share}...]
    const distributions = {};
    for(const y of YEARS){
      const yUse = DATA_YEAR_MAP[y];
      const list = [];
      for(const [code, mapPop] of idxPop.entries()){
        const p = mapPop.get(yUse);
        const bRate = idxCbr.get(code)?.get(yUse);
        if(p != null && bRate != null){
          const births = (p * bRate) / 1000; // 粗出生率：每千人出生数
          if(Number.isFinite(births) && births>0){
            // 获取名称——取任意表中的 entity 名称（以人口表为主）
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

    // 绑定按钮
    const yearSelect = document.getElementById("yearSelect");
    const btnOnce = document.getElementById("rollOnce");
    const btnTen = document.getElementById("rollTen");

    btnOnce.onclick = () => {
      const y = +yearSelect.value;
      drawOnce(distributions, y, {idxLife, idxGdp});
    };

    btnTen.onclick = () => {
      const y = +yearSelect.value;
      drawTen(distributions, y, {idxLife, idxGdp});
    };

  }catch(err){
    console.error(err);
    status.textContent = "❌ 数据加载失败。请检查网络或稍后重试。";
  }
}

// 从分布中按权重随机抽取一个国家
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
function fmtNum(x){
  if(x==null || !Number.isFinite(x)) return "—";
  if(x >= 1000) return x.toLocaleString(undefined, {maximumFractionDigits:0});
  return x.toFixed(1);
}
function nearestOrNA(map, code, year){
  // 查找该年，或者往前找最近的可用年份
  const m = map.get(code);
  if(!m) return null;
  if(m.has(year) && Number.isFinite(m.get(year))) return m.get(year);
  // 向前找最多回溯 10 年
  for(let k=1;k<=10;k++){
    if(m.has(year-k) && Number.isFinite(m.get(year-k))) return m.get(year-k);
  }
  return null;
}

function drawOnce(distributions, year, extras){
  const yUse = DATA_YEAR_MAP[year];
  const dist = distributions[year];
  if(!dist){ return; }

  const pick = weightedPick(dist.rows);
  const life = nearestOrNA(extras.idxLife, pick.code, yUse);
  const gdp = nearestOrNA(extras.idxGdp, pick.code, yUse);

  document.getElementById("rCountry").textContent = `${pick.entity}（${pick.code}）`;
  document.getElementById("rShare").textContent = fmtPct(pick.share);
  document.getElementById("rLife").textContent = life==null ? "—" : life.toFixed(1);
  document.getElementById("rGDP").textContent = gdp==null ? "—" : fmtNum(gdp);

  const note = document.getElementById("approxNote");
  note.textContent = (year===2024) ? "注：2024 年暂以 2023 年数据近似计算。" : "";

  document.getElementById("resultOnce").classList.remove("hidden");
}

function drawTen(distributions, year, extras){
  const yUse = DATA_YEAR_MAP[year];
  const dist = distributions[year];
  if(!dist){ return; }

  const counts = new Map();
  const samples = [];
  for(let i=0;i<10;i++){
    const pick = weightedPick(dist.rows);
    samples.push(pick);
    const key = `${pick.entity}（${pick.code}）`;
    counts.set(key, (counts.get(key)||0) + 1);
  }

  // 排序：出现次数降序；相同次数按 share 大小降序
  const freqList = [...counts.entries()].map(([k,v])=>{
    const code = k.match(/（([A-Z]{3})）$/)?.[1];
    const row = code ? dist.rows.find(d=>d.code===code) : null;
    return {k, v, share: row?row.share:0};
  }).sort((a,b)=> b.v - a.v || b.share - a.share);

  const tenDiv = document.getElementById("tenList");
  tenDiv.innerHTML = "";
  const ul = document.createElement("ul");
  ul.className = "ten-list";
  for(const item of freqList){
    const li = document.createElement("li");
    li.textContent = `${item.k} × ${item.v} 次`;
    ul.appendChild(li);
  }
  tenDiv.appendChild(ul);

  const note = document.getElementById("approxNote10");
  note.textContent = (year===2024) ? "注：2024 年暂以 2023 年数据近似计算。" : "";

  document.getElementById("resultTen").classList.remove("hidden");
}

window.addEventListener("DOMContentLoaded", loadAll);

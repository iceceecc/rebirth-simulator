# 投胎模拟器 · 加强版（纯前端）

- **改动**：移除预期寿命与“十连抽”；新增 **性别概率**、**富裕概率**、**人生难度等级** 与 **综合评分**（百分制），并显示 **本次组合概率**。
- **玩法**：选择年份（1960/1970/1980/1990/2000/2010/2020/2024），点击「投胎一次」。

---

## 概率与评分如何计算？

1) **国家概率**：以 `人口 × 粗出生率` 估算当年各国新生儿数，按其在当年全球新生儿中的占比抽取。  
2) **性别概率**：使用全球平均自然比例：男 ≈ **51.2%**，女 ≈ **48.8%**。  
3) **富裕概率**：用该国当年 **人均 GDP（PPP）在全球的百分位** 映射到一个富裕概率（线性从 **0.5% → 12%**）。例如当年人均 GDP 处于全球第 80 百分位，则富裕概率约 `0.5% + 0.8*(12%-0.5%) ≈ 9.8%`。  
4) **人生难度分级（刻板印象近似）**：按当年人均 GDP（PPP）阈值分档：  
   - 一等奖（A）：≥ **35,000**  
   - 二等奖（B）：**15,000 ~ 35,000**  
   - 三等奖（C）：< **15,000**  
   你可以在 `app.js` 的 `DIFFICULTY_THRESHOLDS` 和 `DIFFICULTY_OVERRIDES` 里调整或强制某国所属等级。  
5) **综合评分**：`基础分（A=80/B=70/C=60） + 富裕加分（+15）`，上限 100。  
6) **本次组合概率**：`国家份额 × 性别概率 ×（富裕 或 非富裕）`，用于显示这次抽中的 **具体人生组合** 在现实中的大致稀有度。

> 说明：富裕概率与难度分级是**近似建模**，用人均 GDP 作为物质条件 proxy，不等于真实的“富裕人口占比”。你可以把 `wealthProbFromPercentile()` 的范围或映射公式改成你的口味。

---

## 数据来源（通过 Our World in Data 提供的 CSV）
- 人口：<https://ourworldindata.org/grapher/population>  
- 粗出生率：<https://ourworldindata.org/grapher/crude-birth-rate>  
- 人均 GDP（PPP）：<https://ourworldindata.org/grapher/gdp-per-capita-worldbank>  

> 这些数据由 Our World in Data 整理自 **联合国《世界人口展望》（WPP 2024）** 和 **世界银行**，许可为 **CC BY 4.0**。  
> **2024 年**暂用 **2023 年**数据近似。

---

## 部署
纯前端静态页，直接放到 GitHub Pages 即可：
1. 上传 `index.html`、`style.css`、`app.js`、`README.md` 到仓库根目录。
2. Settings → Pages：选择 `Deploy from a branch`，分支 `main`，Folder `/ (root)`。
3. 等 1–2 分钟后访问 `https://<你的账号>.github.io/<你的仓库>/`。

---

## 自定义项（在 app.js 内）
- `GENDER_PROB`：可改为更细的国家级性别比（目前用全球平均）。
- `DIFFICULTY_THRESHOLDS`：改 A/B/C 的人均GDP阈值；`DIFFICULTY_OVERRIDES` 可强制某国分级。
- `wealthProbFromPercentile(p)`：把 0~1 的百分位映射到你想要的富裕概率范围或非线性函数。
- `ZH_NAMES`：补充或修正国家中文名；没命中的会回退英文名。

---

## 许可
- 代码：MIT License  
- 数据：CC BY 4.0（UN WPP/World Bank，经 OWID 整理）

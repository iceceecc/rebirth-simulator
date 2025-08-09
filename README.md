# 投胎模拟器（纯前端，GitHub Pages 可部署）

这个小工具会根据 **当年各国“新生儿数量在全球的占比”** 来抽取“你会投胎到哪里”。
占比由「人口 × 粗出生率」估算得出。你可以选择年份（1960/1970/1980/1990/2000/2010/2020/2024），然后点击「投胎一次」或「投胎十次」。

> **2024 年**暂以 **2023 年**的数据近似计算（因为常用的开放数据源对 2024 的分国年度数据仍在逐步发布中）。

---

## 数据来源（通过 Our World in Data 提供的 CSV，源自联合国 WPP 2024 及世界银行）

- 人口：<https://ourworldindata.org/grapher/population>  
- 粗出生率：<https://ourworldindata.org/grapher/crude-birth-rate>  
- 预期寿命：<https://ourworldindata.org/grapher/life-expectancy>  
- 人均 GDP（PPP，国际-$，1990年起）：<https://ourworldindata.org/grapher/gdp-per-capita-worldbank>

这些数据由 Our World in Data 整理自 **联合国《世界人口展望》（World Population Prospects, 2024 版）** 和 **世界银行** 等来源，许可为 **CC BY 4.0**。

---

## 本地开发与部署

本项目为 **纯前端**，无需任何后端：

1. 直接把仓库内容上传到你的 GitHub 仓库（例如 `rebirth-simulator`）。  
2. 进入仓库 **Settings → Pages**，将 **Source** 设为 `Deploy from a branch`，**Branch** 选 `main`（或 `master`）并保存。  
3. 稍等 1-2 分钟，访问 Pages 提供的链接即可在线使用。

你也可以在本地双击 `index.html` 直接打开（需联网以下载数据）。

---

## 设计与实现要点

- **概率模型**：对选定年份 `y`，对每个国家 `i` 计算 `births_i(y) = population_i(y) × crude_birth_rate_i(y) / 1000`，然后以 `births_i(y)` 占该年全球总新生儿的比例作为抽取权重。  
- **国家筛选**：仅使用具有 3 位 ISO 代码的国家/地区；排除地区聚合（如 `OWID_*`）。  
- **近似说明**：2024 年采用 2023 年数据近似；当某指标缺失时，显示“—”，或回溯近年寻找最近可用值（寿命/GDP）。  
- **隐私与存储**：不记录抽取历史；“十连抽”仅在页面上瞬时显示。

---

## 许可

- 代码：MIT License  
- 数据：CC BY 4.0（联合国 WPP/世界银行，经 Our World in Data 处理与发布）

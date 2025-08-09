# 投胎模拟器 · 进阶版（纯前端）

- 评分重构：**国家40% + 家庭45% + 难度15%**；年代越新差距自动收敛。  
- 修复：**1960–1980** 的美国/西欧/日本/澳新强制为 **一等奖**。  
- 新增：**十连抽** 与 **历史表格**。  
- 移动端优化：只解析 8 年份；支持本地预处理数据 `data/prebaked.json`；远端抓取有主源与备用源。

## 使用
上传 `index.html`、`style.css`、`app.js`、`README.md` 到仓库根目录。可选：上传 `data/prebaked.json`（预处理数据，离线使用）。开启 GitHub Pages 后访问 `https://<你名>.github.io/<仓库>/`。

## 数据
OWID：Population、Crude birth rate、GDP per capita（PPP），源自 UN WPP 及世界银行，CC BY 4.0。2024≈2023。

## 自定义（app.js 内）
- `CLASSIC_DEV`：60–80 年代的发达国家名单。  
- `thresholdsForYear(year)`：各年代 A/B 阈值。  
- `gapScale(year)`：年代差距收敛系数。  
- `wealthProbFromPercentile(p)` / `wealthScore`：富裕概率与分数规则。  
- `ZH`：中文国名映射。

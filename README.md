# 投胎模拟器 · v6 直觉加权版（纯前端）

一套更直观拉开差距的 100 分制：
- **国家机会 35%**（GDP 百分位 + 老牌/新发达加成与下限）
- **家庭起点 35%**（富裕=高分；非富裕=随国家发展给 30–75，下限对发达更友好；战乱有额外扣分）
- **公共服务 10%**（随发展水平；北欧额外 +5）
- **安全稳定 15%**（战乱强扣，中度风险轻扣且随年代收敛；北欧 +5）
- **社会环境 5%**（随发展水平；极端不利国家再扣）

支持「投胎一次」与「十连抽」，底部有**累计统计**（总次数、平均分、难度占比、富裕占比、评分分布）。

## 数据来源
OWID：Population、Crude birth rate、GDP per capita（PPP）。仅解析 8 个年份（1960–2024；2024≈2023）。支持本地 `data/prebaked.json` 优先。

## 部署
把 `index.html`、`style.css`、`config.js`、`app.js`、`README.md` 上传到仓库根目录（覆盖旧版）。打开 GitHub Pages 后访问 `https://<你的用户名>.github.io/<你的仓库>/`。

## 自定义
- 名单在 `config.js`：`OLD_DEV`、`NEW_DEV`、`HIGH_RISK`、`MID_RISK`、`NORDIC`、`EXTREME_SOCIAL` 与 `ZH`（中文国名）。
- 评分在 `app.js` 的 5 个子分函数与 `gapScale(year)`。

## 许可
代码 MIT；数据 CC BY 4.0（UN WPP/World Bank，经 OWID 整理）。

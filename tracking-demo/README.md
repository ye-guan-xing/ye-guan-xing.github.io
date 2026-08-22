# 埋点 Demo（纯本地 console 模拟）

> 教学用最小 demo，**不接任何真实 SDK**、**不装依赖**，双击 `index.html` 就能跑。把三套埋点系统的核心行为，可视化到右侧「埋点事件流」面板。

## 怎么跑

直接用浏览器打开 `index.html`（或 `npx serve .` 起静态服务）。无需 `npm install`。

## 它演示了什么

| 演示项 | 对应文档 | 在 demo 里的表现 |
|---|---|---|
| ① LogTrack（神策+自研） | [三大埋点系统](/p/tracking-systems/) | 每条事件面板里同时出现「神策Sensors」「自研日志」两条 |
| ② $tracker（火山，仅App内） | [三大埋点系统](/p/tracking-systems/) | 勾选「App 内」才真报；不勾显示「火山Rangers(静默)」 |
| ③ $timeTrack（性能） | [三大埋点系统](/p/tracking-systems/) | 启动时报 `appCreated` / `appMounted` |
| A 直接调 LogTrack.track | [埋点的七种写法](/p/tracking-patterns/) | 列表曝光 show |
| B 组件内封装 track | [埋点的七种写法](/p/tracking-patterns/) | `track()` 函数，公共字段写死 |
| C 双系统并行 | [埋点的七种写法](/p/tracking-patterns/) | 「双发演示」按钮，$tracker + LogTrack 同时发 |
| F autoTrack 路由自动 | [埋点的七种写法](/p/tracking-patterns/) | hash 切换自动发 `autoTrack` |
| G 停留时长心跳 | [埋点的七种写法](/p/tracking-patterns/) | 停留 3s 自动 flush；切后台/关页面兜底 |

## 玩法建议

1. 打开页面 → 看右侧已有 `appCreated` / `autoTrack` / 列表 `show`。
2. 点列表项 → 看 `click` 事件，自动进详情页。
3. 在列表页停留 3 秒 → 看心跳 `page`（含 `duration`）。
4. 点「双发演示」→ 同时看到火山（勾选 App 内才生效）和神策+自研。
5. 切换顶部「App 内」开关 → 火山在 静默/生效 间切换。
6. 关掉「神策」或「自研日志」开关 → 对应后端事件流消失。

## 文件说明

| 文件 | 作用 |
|---|---|
| `tracker.js` | 埋点引擎：LogTrack / $tracker / $timeTrack / 心跳 / 事件流面板 |
| `app.js` | 业务演示页：列表/详情路由 + 各写法调用 |
| `index.html` | 页面结构 + 深色样式 + 工具栏开关 |

> 这是教学模拟，真实生产请看 [生产环境推荐实践](/p/tracking-production/)。

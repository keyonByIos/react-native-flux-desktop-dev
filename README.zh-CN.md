# react-native-flux-desktop-dev（中文文档）

> 🛠️ 面向开发者的组件 —— 终端、代码/JSON/差异查看器、日志与资源监控、Markdown 渲染。

![版本](https://img.shields.io/badge/version-0.1.0-blue) ![许可证](https://img.shields.io/badge/license-MIT-green) ![运行时](https://img.shields.io/badge/%E7%BA%AFReact%C2%B7%E5%8E%9F%E7%94%9F%E5%83%8F%E7%B4%A0%C2%B7%E9%9D%9EElectron-ff69b4)

**依赖：** `react-native-flux-desktop`（UI 核心）· `react-native-flux-desktop-chart`（监控曲线）· `react`

---

![代码块 CodeBlock](./assets/code-block.png)

本包是**开发者工具 UI 工具箱**：`CodeBlock` 支持多语言语法高亮，`JsonViewer` / `DiffViewer` 处理数据与差异，`Terminal`（纯渲染）/ `LiveTerminal`（node‑pty）/ `SshTerminal` 提供终端形态，另有 `LogViewer`、`CommandPalette`、`RegexTester`、`CronParser`、`TimeConverter`，以及实时的 `MemMonitor` / `FpsMonitor` 曲线与 `Markdown` 渲染器。

| 代码块 CodeBlock | JSON 树 JsonViewer | 内存监控 MemMonitor |
| :---: | :---: | :---: |
| ![](./assets/code-block.png) | ![](./assets/json-viewer.png) | ![](./assets/mem-monitor.png) |

## 安装

```bash
npm install react-native-flux-desktop react-native-flux-desktop-chart   # peers：UI 核心 + 图表
npm install react-native-flux-desktop-dev
```

## 用法

```tsx
import { CodeBlock, JsonViewer } from 'react-native-flux-desktop-dev';

export default () => (
  <>
    <CodeBlock code="export const hi = () => 'flux';" language="tsx" showLineNumbers />
    <JsonViewer data={{ ok: true, items: [1, 2, 3] }} />
  </>
);
```

## 组件清单

- `Terminal` 终端（纯渲染）· `LiveTerminal` 实时终端（node‑pty）· `SshTerminal` SSH 终端
- `CodeBlock` 代码块 — 多语言高亮 / 行号 / 行高亮 / 复制
- `JsonViewer` JSON 树 · `DiffViewer` 差异对比 · `Markdown` 渲染
- `RegexTester` 正则测试 · `CommandPalette` 命令面板 · `LogViewer` 日志查看器
- `CronParser` Cron 解析（`parseCron` / `nextRuns` / `describeCron`）· `TimeConverter` 时间戳转换（`detectUnit` / `formatZoned` / `relativeTime`）
- `MemMonitor` 内存监控 · `FpsMonitor` / `useWindowFps` 帧率监控

## 说明

- `LiveTerminal` / `SshTerminal` 运行期需原生 pty（`node-pty`），可按需使用；`Terminal` 为纯渲染，无原生依赖。
- 监控类组件（`MemMonitor` / `FpsMonitor`）的曲线复用图表包的迷你图能力。

## 许可证

MIT

> English 版见 [README.md](./README.md)。

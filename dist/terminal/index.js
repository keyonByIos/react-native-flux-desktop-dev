"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Terminal = Terminal;
// Terminal：终端窗口 UI（开发类组件，「开发」分类首个成员）。
// v1 明确「纯渲染」——把一组文本行画成带标题栏 + 等宽正文 + 语义着色 + 光标的终端外观，
// 不含任何真实 PTY / shell / 进程。它正是「实时终端」要接入的渲染层：后续把 node-pty 的字节流
// 经 ANSI 解析喂进 lines 即可成活终端（见对应实现思路）。
//
// 配色刻意用固定终端调色板（GitHub Dark 系），不随主题翻转——终端就该是那块深色屏。
// 等宽取自 paint/fonts 注册的 Flux Mono（Consolas / Menlo / DejaVu Sans Mono 按平台命中）。
// ⚠️ 终端行内文本请保持 ASCII：Flux Mono 不含 CJK/部分符号字形，中文或 ✓ 等会成豆腐块；
//    CJK 混排需另注册一款 CJK 等宽字体（如 Sarasa Mono / Maple Mono NF）作后续增量。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
// 固定终端调色板（不随主题）
const BG = '#0d1117';
const TITLEBAR = '#161b22';
const BORDER = '#30363d';
const C_TEXT = '#c9d1d9';
const C_CMD = '#e6edf3';
const C_PROMPT = '#3fb950';
const KIND_COLOR = {
    cmd: C_CMD,
    out: C_TEXT,
    ok: '#3fb950',
    err: '#f85149',
    warn: '#d29922',
    info: '#58a6ff',
    muted: '#8b949e',
};
function Terminal(props) {
    const { title = 'terminal', lines, promptText = '$', fontSize = 13, showCursor = true, height, style } = props;
    const lineH = Math.round(fontSize * 1.55);
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [
            {
                width: '100%',
                backgroundColor: BG,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: BORDER,
                overflow: 'hidden',
            },
            style,
        ] },
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: {
                flexDirection: 'row',
                alignItems: 'center',
                height: 30,
                paddingHorizontal: 12,
                backgroundColor: TITLEBAR,
                borderBottomWidth: 1,
                borderBottomColor: BORDER,
            } },
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#ff5f57' } }),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#febc2e', marginLeft: 7 } }),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#28c840', marginLeft: 7 } }),
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: {
                    marginLeft: 12,
                    fontSize: fontSize - 1,
                    fontFamily: react_native_flux_desktop_2.MONO_FAMILY,
                    color: '#8b949e',
                }, numberOfLines: 1 }, title)),
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { paddingVertical: 10, paddingHorizontal: 12, height } }, lines.map((ln, i) => {
            const kind = ln.kind || 'out';
            const withPrompt = ln.prompt !== undefined ? ln.prompt : kind === 'cmd';
            const isLast = i === lines.length - 1;
            return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: i, style: { flexDirection: 'row', alignItems: 'center', minHeight: lineH } },
                withPrompt ? (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize, fontFamily: react_native_flux_desktop_2.MONO_FAMILY, color: C_PROMPT, marginRight: 8 } }, promptText)) : null,
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { flex: 1, fontSize, fontFamily: react_native_flux_desktop_2.MONO_FAMILY, lineHeight: lineH, color: KIND_COLOR[kind] } }, ln.text),
                showCursor && isLast ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { width: Math.round(fontSize * 0.6), height: fontSize, backgroundColor: C_TEXT, marginLeft: 1 } })) : null));
        }))));
}
exports.default = Terminal;

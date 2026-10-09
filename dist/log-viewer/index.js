"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogViewer = LogViewer;
// LogViewer：日志查看器（程序员工具）。级别阈值过滤 + 关键词搜索 + 自动滚到底 + 级别计数概览。
// 行按语义级别着色（badge + error/fatal 行底色），等宽正文；纯过滤逻辑在 ./logs（探针覆盖）。
// 滚动：默认非受控（不传 scrollY）→ 滚轮自由滚动；开启「跟随底部」时受控顶到夹取后的真实底部（contentH-height）。
// ⚠️ 勿把 scrollY 常写成 0：受控 scrollY 为数字时每帧钉死，滚轮一动即被拉回（见 scene/node.ts applyScrollSemantics）。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const react_native_flux_desktop_4 = require("react-native-flux-desktop");
const react_native_flux_desktop_5 = require("react-native-flux-desktop");
const screen_1 = require("../terminal/screen");
const logs_1 = require("./logs");
/** Flux Mono 不含 CJK：按宽字符切 run，中文段回退 Flux Sans，避免豆腐块（与 CodeBlock/终端同一策略）。 */
function splitWide(s) {
    const runs = [];
    for (const ch of s) {
        const wide = (0, screen_1.isWide)(ch);
        const last = runs[runs.length - 1];
        if (last && last.wide === wide)
            last.t += ch;
        else
            runs.push({ t: ch, wide });
    }
    return runs;
}
function LogViewer(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const { logs, height = 320, defaultMinLevel = 'trace', toolbar = true, showTime = true, showSource = true, maxRows = 500, fontSize = 12.5, style, } = props;
    const [minLevel, setMinLevel] = react_1.default.useState(defaultMinLevel);
    const [query, setQuery] = react_1.default.useState('');
    const [autoScroll, setAutoScroll] = react_1.default.useState(false);
    const [contentH, setContentH] = react_1.default.useState(0);
    const filtered = react_1.default.useMemo(() => (0, logs_1.filterLogs)(logs, { minLevel, query }), [logs, minLevel, query]);
    const counts = react_1.default.useMemo(() => (0, logs_1.summarize)(logs), [logs]);
    const shown = filtered.slice(0, maxRows);
    const LEVEL_COLOR = {
        trace: token.colorTextQuaternary,
        debug: token.colorTextTertiary,
        info: token.colorInfo ?? token.colorPrimary,
        warn: token.colorWarning ?? token.colorPrimary,
        error: token.colorError,
        fatal: token.colorError,
    };
    const lineH = Math.round(fontSize * 1.7);
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [
            {
                borderRadius: token.borderRadiusLG,
                borderWidth: 1,
                borderColor: token.colorBorderSecondary,
                backgroundColor: token.colorBgContainer,
                overflow: 'hidden',
            },
            style,
        ] },
        toolbar ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: token.marginSM, paddingHorizontal: token.paddingSM, paddingVertical: token.paddingXS, borderBottomWidth: 1, borderBottomColor: token.colorBorderSecondary, flexWrap: 'wrap' } },
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', gap: 4, alignItems: 'center' } }, logs_1.ALL_LEVELS.map((lv) => {
                const activeIdx = logs_1.ALL_LEVELS.indexOf(minLevel);
                const on = logs_1.ALL_LEVELS.indexOf(lv) >= activeIdx;
                return (react_1.default.createElement(react_native_flux_desktop_1.Pressable, { key: lv, onPress: () => setMinLevel(lv), style: { cursor: 'pointer' } },
                    react_1.default.createElement(react_native_flux_desktop_1.Text, { style: {
                            fontSize: token.fontSizeSM,
                            fontFamily: react_native_flux_desktop_5.MONO_FAMILY,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: token.borderRadiusSM,
                            color: on ? LEVEL_COLOR[lv] : token.colorTextQuaternary,
                            backgroundColor: on ? `${LEVEL_COLOR[lv]}1F` : 'transparent',
                            fontWeight: lv === minLevel ? '700' : 'normal',
                            opacity: on ? 1 : 0.55,
                        } }, lv.toUpperCase())));
            })),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flex: 1 } }),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { width: 180 } },
                react_1.default.createElement(react_native_flux_desktop_3.Input, { value: query, onChange: setQuery, size: "small", placeholder: "\u641C\u7D22 message / source", allowClear: true, prefix: react_1.default.createElement(react_native_flux_desktop_4.Icon, { name: "search", size: 12, color: token.colorTextTertiary }) })),
            react_1.default.createElement(react_native_flux_desktop_1.Pressable, { onPress: () => setAutoScroll((v) => !v), style: { cursor: 'pointer' } },
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: autoScroll ? token.colorPrimary : token.colorTextTertiary } }, autoScroll ? '⏬ 跟随底部' : '⏸ 暂停跟随')))) : null,
        toolbar ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', gap: token.marginSM, paddingHorizontal: token.paddingSM, paddingTop: 6, flexWrap: 'wrap' } },
            logs_1.ALL_LEVELS.filter((lv) => counts[lv] > 0).map((lv) => (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: lv, style: { fontSize: token.fontSizeSM, fontFamily: react_native_flux_desktop_5.MONO_FAMILY, color: LEVEL_COLOR[lv] } },
                lv,
                " ",
                counts[lv]))),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flex: 1 } }),
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextTertiary } }, filtered.length === shown.length ? `${shown.length} 行` : `${shown.length}/${filtered.length} 行（截断）`))) : null,
        react_1.default.createElement(react_native_flux_desktop_1.ScrollView, { scrollY: autoScroll ? Math.max(0, contentH - height) : undefined, style: { height } },
            react_1.default.createElement(react_native_flux_desktop_1.View, { onLayout: (e) => setContentH(e.nativeEvent.layout.h), style: { paddingVertical: 6, paddingHorizontal: token.paddingSM } }, shown.length === 0 ? (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize, color: token.colorTextTertiary, padding: token.paddingXS } }, "\u65E0\u5339\u914D\u65E5\u5FD7")) : (shown.map((l, i) => {
                const strong = l.level === 'error' || l.level === 'fatal';
                return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: i, style: {
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        minHeight: lineH,
                        paddingVertical: 1,
                        paddingHorizontal: 4,
                        borderRadius: token.borderRadiusSM,
                        backgroundColor: strong ? `${LEVEL_COLOR[l.level]}14` : 'transparent',
                    } },
                    showTime ? (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize, fontFamily: react_native_flux_desktop_5.MONO_FAMILY, color: token.colorTextQuaternary, minWidth: 82, flexShrink: 0, marginRight: token.marginSM } }, l.time ?? '')) : null,
                    react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize, fontFamily: react_native_flux_desktop_5.MONO_FAMILY, color: LEVEL_COLOR[l.level], width: 46, flexShrink: 0, fontWeight: strong ? '700' : 'normal' } }, l.level.toUpperCase()),
                    showSource ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { width: 96, flexShrink: 0, flexDirection: 'row', overflow: 'hidden' } }, splitWide(l.source ?? '').map((r, m) => (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: m, style: { fontSize, fontFamily: r.wide ? react_native_flux_desktop_5.SANS_FAMILY : react_native_flux_desktop_5.MONO_FAMILY, color: token.colorTextSecondary } }, r.t))))) : null,
                    react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' } }, splitWide(l.message ?? '').map((r, m) => (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: m, preserveTrailingSpace: true, style: { fontSize, fontFamily: r.wide ? react_native_flux_desktop_5.SANS_FAMILY : react_native_flux_desktop_5.MONO_FAMILY, lineHeight: lineH, color: strong ? token.colorText : token.colorTextSecondary } }, r.t))))));
            }))))));
}
exports.default = LogViewer;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiffViewer = DiffViewer;
// DiffViewer：行级差异对比。unified（单栏）+ split（双栏）两模式；增/删语义底色，行号对齐，折叠未变区。
// diff 计算见同目录 ./algorithm（LCS 纯函数）。颜色全走语义 token → 明暗主题自适应。
// 等宽 'Flux Mono'；行文本可能含 CJK，回退 'Flux Sans' 避免豆腐块（与 CodeBlock/JsonViewer 同策略）。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const screen_1 = require("../terminal/screen");
const algorithm_1 = require("../diff/algorithm");
function DiffViewer(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const { oldText, newText, variant = 'unified', title, context = 3, showLineNumbers = true, fontSize = 13, style, } = props;
    const rows = react_1.default.useMemo(() => {
        const full = (0, algorithm_1.diffLines)(oldText, newText);
        return (0, algorithm_1.foldContext)(full, context);
    }, [oldText, newText, context]);
    const stat = react_1.default.useMemo(() => (0, algorithm_1.diffStat)((0, algorithm_1.diffLines)(oldText, newText)), [oldText, newText]);
    const lineH = Math.round(fontSize * 1.6);
    const maxNum = rows.reduce((a, r) => Math.max(a, r.aNum ?? 0, r.bNum ?? 0), 0);
    const digits = Math.max(2, String(maxNum).length);
    const gutterW = digits * Math.round(fontSize * 0.62) + 10;
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [
            {
                borderRadius: token.borderRadiusLG,
                borderWidth: token.lineWidth,
                borderColor: token.colorBorderSecondary,
                backgroundColor: token.colorFillQuaternary,
                overflow: 'hidden',
            },
            style,
        ] },
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: token.paddingSM,
                paddingVertical: token.paddingXXS,
                backgroundColor: token.colorFillTertiary,
                borderBottomWidth: token.lineWidth,
                borderBottomColor: token.colorBorderSecondary,
            } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextSecondary, fontFamily: react_native_flux_desktop_3.MONO_FAMILY } }, title),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', gap: token.marginXS } },
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorSuccess } },
                    "+",
                    stat.added),
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorError } },
                    "\u2212",
                    stat.removed))),
        variant === 'unified'
            ? react_1.default.createElement(UnifiedView, { rows: rows, lineH: lineH, fontSize: fontSize, gutterW: gutterW, showLineNumbers: showLineNumbers, token: token })
            : react_1.default.createElement(SplitView, { rows: rows, lineH: lineH, fontSize: fontSize, gutterW: gutterW, showLineNumbers: showLineNumbers, token: token })));
}
/** 单栏：每行 [旧号][新号] 前缀 文本，按类型上底色。 */
function UnifiedView(props) {
    const { rows, lineH, fontSize, gutterW, showLineNumbers, token } = props;
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { paddingVertical: token.paddingXXS } }, rows.map((r, i) => {
        if (r.type === 'skip')
            return react_1.default.createElement(SkipBar, { key: i, text: r.text, lineH: lineH, fontSize: fontSize, token: token });
        const bg = r.type === 'add' ? token.colorSuccessBg : r.type === 'del' ? token.colorErrorBg : 'transparent';
        const sign = r.type === 'add' ? '+' : r.type === 'del' ? '−' : ' ';
        const signColor = r.type === 'add' ? token.colorSuccess : r.type === 'del' ? token.colorError : token.colorTextTertiary;
        return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: i, style: { flexDirection: 'row', backgroundColor: bg, minHeight: lineH } },
            showLineNumbers ? (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(Gutter, { w: gutterW, t: r.aNum == null ? '' : String(r.aNum), lineH: lineH, fontSize: fontSize, token: token }),
                react_1.default.createElement(Gutter, { w: gutterW, t: r.bNum == null ? '' : String(r.bNum), lineH: lineH, fontSize: fontSize, token: token }))) : null,
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { width: fontSize + 8, textAlign: 'center', fontSize, lineHeight: lineH, fontFamily: react_native_flux_desktop_3.MONO_FAMILY, color: signColor } }, sign),
            react_1.default.createElement(CodeText, { t: r.text, lineH: lineH, fontSize: fontSize, token: token })));
    })));
}
/** 双栏：左列（旧：del+ctx）、右列（新：add+ctx）逐行对齐；一侧无内容时补空白。 */
function SplitView(props) {
    const { rows, lineH, fontSize, gutterW, showLineNumbers, token } = props;
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { paddingVertical: token.paddingXXS } }, rows.map((r, i) => {
        if (r.type === 'skip')
            return react_1.default.createElement(SkipBar, { key: i, text: r.text, lineH: lineH, fontSize: fontSize, token: token });
        const leftHas = r.type === 'del' || r.type === 'ctx';
        const rightHas = r.type === 'add' || r.type === 'ctx';
        const leftBg = r.type === 'del' ? token.colorErrorBg : 'transparent';
        const rightBg = r.type === 'add' ? token.colorSuccessBg : 'transparent';
        return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: i, style: { flexDirection: 'row' } },
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flex: 1, flexDirection: 'row', backgroundColor: leftBg, minHeight: lineH, borderRightWidth: token.lineWidth, borderRightColor: token.colorBorderSecondary } },
                showLineNumbers ? react_1.default.createElement(Gutter, { w: gutterW, t: leftHas && r.aNum != null ? String(r.aNum) : '', lineH: lineH, fontSize: fontSize, token: token }) : null,
                leftHas ? react_1.default.createElement(CodeText, { t: r.text, lineH: lineH, fontSize: fontSize, token: token }) : react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flex: 1 } })),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flex: 1, flexDirection: 'row', backgroundColor: rightBg, minHeight: lineH } },
                showLineNumbers ? react_1.default.createElement(Gutter, { w: gutterW, t: rightHas && r.bNum != null ? String(r.bNum) : '', lineH: lineH, fontSize: fontSize, token: token }) : null,
                rightHas ? react_1.default.createElement(CodeText, { t: r.text, lineH: lineH, fontSize: fontSize, token: token }) : react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flex: 1 } }))));
    })));
}
/** 折叠分隔条：居中「⋯ N 行未改动 ⋯」。 */
function SkipBar(props) {
    const { text, lineH, fontSize, token } = props;
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { height: lineH + 4, justifyContent: 'center', alignItems: 'center', backgroundColor: token.colorFillQuaternary } },
        react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: fontSize - 1, color: token.colorTextQuaternary } },
            "\u00B7\u00B7\u00B7 ",
            text,
            " \u884C\u672A\u6539\u52A8 \u00B7\u00B7\u00B7")));
}
/** 行号槽：右对齐、灰字、等宽。 */
function Gutter(props) {
    const { w, t, lineH, fontSize, token } = props;
    return (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { width: w, textAlign: 'right', paddingHorizontal: 4, fontSize, lineHeight: lineH, fontFamily: react_native_flux_desktop_3.MONO_FAMILY, color: token.colorTextQuaternary, backgroundColor: token.colorFillQuaternary } }, t));
}
/** 行内容：等宽铺满剩余宽度，保留前导空格；含 CJK 回退无衬线。 */
function CodeText(props) {
    const { t, lineH, fontSize, token } = props;
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', overflow: 'hidden' } }, t.length === 0 ? (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize, lineHeight: lineH, fontFamily: react_native_flux_desktop_3.MONO_FAMILY } }, " ")) : (splitWide(t).map((r, m) => (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: m, preserveTrailingSpace: true, style: { fontSize, lineHeight: lineH, fontFamily: r.wide ? react_native_flux_desktop_3.SANS_FAMILY : react_native_flux_desktop_3.MONO_FAMILY, color: token.colorText } }, r.t))))));
}
/** 按「等宽可渲染 / CJK 宽字符」把一段文本切成 run（与 CodeBlock 同）。 */
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
exports.default = DiffViewer;

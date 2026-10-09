"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonViewer = JsonViewer;
// JsonViewer：JSON 树查看器。递归渲染对象/数组，可折叠节点 + 类型着色 + 数组长度标 + 复制。
// 面向程序员工具（接口响应预览、配置检视）。颜色全部映射语义 token → 明暗主题自适应。
// 等宽字体 'Flux Mono'；字符串值可能含 CJK，回退 'Flux Sans' 避免豆腐块（与 CodeBlock 同策略）。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const react_native_flux_desktop_4 = require("react-native-flux-desktop");
const screen_1 = require("../terminal/screen");
const isCollapsible = (v) => typeof v === 'object' && v !== null;
/** 收集所有「应默认展开」的节点路径（depth < maxDepth 的可折叠节点）。 */
function collectExpanded(v, depth, maxDepth, path, out) {
    if (!isCollapsible(v))
        return;
    if (Array.isArray(v)) {
        v.forEach((item, i) => {
            const cp = `${path}.${i}`;
            if (depth < maxDepth)
                out[cp] = true;
            collectExpanded(item, depth + 1, maxDepth, cp, out);
        });
    }
    else {
        Object.keys(v).forEach((k) => {
            const cp = `${path}.${k}`;
            if (depth < maxDepth)
                out[cp] = true;
            collectExpanded(v[k], depth + 1, maxDepth, cp, out);
        });
    }
}
function JsonViewer(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const { data, title, defaultExpandedDepth = 2, copyable = true, fontSize = 13, style } = props;
    const initial = react_1.default.useMemo(() => {
        const map = { '': true };
        collectExpanded(data, 0, defaultExpandedDepth, '', map);
        return map;
    }, [data, defaultExpandedDepth]);
    const [expanded, setExpanded] = react_1.default.useState(initial);
    react_1.default.useEffect(() => { setExpanded(initial); }, [initial]);
    const toggle = (p) => setExpanded((prev) => ({ ...prev, [p]: !prev[p] }));
    const text = JSON.stringify(data, null, 2);
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
        title != null || copyable ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: token.paddingSM,
                paddingVertical: token.paddingXXS,
                backgroundColor: token.colorFillTertiary,
                borderBottomWidth: token.lineWidth,
                borderBottomColor: token.colorBorderSecondary,
            } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextSecondary, fontFamily: react_native_flux_desktop_4.MONO_FAMILY } }, title),
            copyable ? react_1.default.createElement(CopyButton, { text: text }) : null)) : null,
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { paddingVertical: token.paddingXS } },
            react_1.default.createElement(JsonNode, { value: data, nodeKey: null, path: "", depth: 0, expanded: expanded, toggle: toggle, fontSize: fontSize, token: token, isLast: false }))));
}
/** 单个节点行（含其展开后的子节点）。 */
function JsonNode(props) {
    const { value, nodeKey, path, depth, expanded, toggle, fontSize, token, isLast } = props;
    const lineH = Math.round(fontSize * 1.7);
    const indent = depth * 16;
    const keyLabel = nodeKey != null ? (react_1.default.createElement(Mono, { t: `"${nodeKey}"`, color: token.colorPrimary, fontSize: fontSize, lineH: lineH })) : null;
    const colon = nodeKey != null ? react_1.default.createElement(Mono, { t: ": ", color: token.colorTextSecondary, fontSize: fontSize, lineH: lineH }) : null;
    // 基本类型：单行
    if (!isCollapsible(value)) {
        return (react_1.default.createElement(Row, { indent: indent, lineH: lineH },
            keyLabel,
            colon,
            react_1.default.createElement(Primitive, { value: value, fontSize: fontSize, lineH: lineH, token: token }),
            !isLast ? react_1.default.createElement(Mono, { t: ",", color: token.colorTextSecondary, fontSize: fontSize, lineH: lineH }) : null));
    }
    // 可折叠：对象 / 数组
    const isOpen = !!expanded[path];
    const isArray = Array.isArray(value);
    const entries = isArray
        ? value.map((v, i) => [String(i), v])
        : Object.keys(value).map((k) => [k, value[k]]);
    const open = isArray ? '[' : '{';
    const close = isArray ? ']' : '}';
    const count = entries.length;
    if (count === 0) {
        return (react_1.default.createElement(Row, { indent: indent, lineH: lineH },
            keyLabel,
            colon,
            react_1.default.createElement(Mono, { t: open + close, color: token.colorTextSecondary, fontSize: fontSize, lineH: lineH }),
            !isLast ? react_1.default.createElement(Mono, { t: ",", color: token.colorTextSecondary, fontSize: fontSize, lineH: lineH }) : null));
    }
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(Row, { indent: indent, lineH: lineH },
            react_1.default.createElement(Toggle, { open: isOpen, onPress: () => toggle(path), fontSize: fontSize, lineH: lineH, token: token }),
            keyLabel,
            colon,
            react_1.default.createElement(Mono, { t: open, color: token.colorTextSecondary, fontSize: fontSize, lineH: lineH }),
            isOpen ? null : (react_1.default.createElement(Mono, { t: ` ${count} ${isArray ? 'items' : 'keys'} `, color: token.colorTextQuaternary, fontSize: fontSize, lineH: lineH })),
            !isOpen ? react_1.default.createElement(Mono, { t: close, color: token.colorTextSecondary, fontSize: fontSize, lineH: lineH }) : null,
            !isOpen && !isLast ? react_1.default.createElement(Mono, { t: ",", color: token.colorTextSecondary, fontSize: fontSize, lineH: lineH }) : null),
        isOpen ? (react_1.default.createElement(react_1.default.Fragment, null,
            entries.map(([k, v], i) => (react_1.default.createElement(JsonNode, { key: `${path}.${k}`, value: v, nodeKey: isArray ? null : k, path: `${path}.${k}`, depth: depth + 1, expanded: expanded, toggle: toggle, fontSize: fontSize, token: token, isLast: i === entries.length - 1 }))),
            react_1.default.createElement(Row, { indent: indent, lineH: lineH },
                react_1.default.createElement(Mono, { t: close, color: token.colorTextSecondary, fontSize: fontSize, lineH: lineH }),
                !isLast ? react_1.default.createElement(Mono, { t: ",", color: token.colorTextSecondary, fontSize: fontSize, lineH: lineH }) : null))) : null));
}
/** 基本类型值：按类型着色（string 绿 / number 黄 / boolean 红 / null 灰）。 */
function Primitive(props) {
    const { value, fontSize, lineH, token } = props;
    if (typeof value === 'string') {
        return react_1.default.createElement(Mono, { t: JSON.stringify(value), color: token.colorSuccess, fontSize: fontSize, lineH: lineH });
    }
    if (typeof value === 'number') {
        return react_1.default.createElement(Mono, { t: String(value), color: token.colorWarning, fontSize: fontSize, lineH: lineH });
    }
    if (typeof value === 'boolean') {
        return react_1.default.createElement(Mono, { t: String(value), color: token.colorError, fontSize: fontSize, lineH: lineH });
    }
    if (value === null || value === undefined) {
        return react_1.default.createElement(Mono, { t: "null", color: token.colorTextQuaternary, fontSize: fontSize, lineH: lineH });
    }
    return react_1.default.createElement(Mono, { t: String(value), color: token.colorText, fontSize: fontSize, lineH: lineH });
}
/** 折叠 / 展开切换小方块（+ / −，纯 ASCII 无缺字风险）。 */
function Toggle(props) {
    const { open, onPress, fontSize, lineH, token } = props;
    return (react_1.default.createElement(react_native_flux_desktop_1.Pressable, { onPress: onPress, style: {
            width: 15,
            height: lineH,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 4,
            cursor: 'pointer',
        } },
        react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: fontSize - 1, lineHeight: lineH, fontFamily: react_native_flux_desktop_4.MONO_FAMILY, color: token.colorTextTertiary } }, open ? '−' : '+')));
}
/** 一行：缩进 + 内容横向排布。 */
function Row(props) {
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', paddingLeft: props.indent + 6, minHeight: props.lineH } }, props.children));
}
/** 等宽文本；含 CJK 时回退无衬线避免豆腐块。 */
function Mono(props) {
    const { t, color, fontSize, lineH } = props;
    return (react_1.default.createElement(react_1.default.Fragment, null, splitWide(t).map((r, m) => (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: m, preserveTrailingSpace: true, style: { fontSize, lineHeight: lineH, fontFamily: r.wide ? react_native_flux_desktop_4.SANS_FAMILY : react_native_flux_desktop_4.MONO_FAMILY, color } }, r.t)))));
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
/** 复制按钮：点击写剪贴板 + 2s「已复制」回执。 */
function CopyButton(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const [copied, setCopied] = react_1.default.useState(false);
    const timer = react_1.default.useRef(null);
    react_1.default.useEffect(() => () => { if (timer.current)
        clearTimeout(timer.current); }, []);
    return (react_1.default.createElement(react_native_flux_desktop_1.Pressable, { onPress: () => {
            (0, react_native_flux_desktop_3.writeClipboard)(props.text);
            setCopied(true);
            if (timer.current)
                clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 2000);
        }, style: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: token.borderRadiusSM, cursor: 'pointer' } },
        react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: copied ? token.colorSuccess : token.colorTextTertiary } }, copied ? '已复制' : '复制')));
}
exports.default = JsonViewer;

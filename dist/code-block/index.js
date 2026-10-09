"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeBlock = CodeBlock;
// CodeBlock：只读代码块，带轻量语法高亮 + 行号 + 复制。面向文档 / 程序员工具场景。
// 高亮来自同目录 tokenize（零第三方依赖），颜色全部映射到语义 token → 明暗主题自适应。
// 等宽字体用 'Flux Mono'（registerFonts 注册系统真实等宽体）；注意等宽体不含 CJK，中文注释会缺字，代码内容建议以 ASCII 为主。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const react_native_flux_desktop_4 = require("react-native-flux-desktop");
const react_native_flux_desktop_5 = require("react-native-flux-desktop");
const screen_1 = require("../terminal/screen");
const tokenize_1 = require("../highlight/tokenize");
const react_native_flux_desktop_6 = require("react-native-flux-desktop");
// 语法高亮调色板：向参考配色靠拢（关键字紫 / 函数黄 / 数字橙 / JSX 标签粉红 / 属性青色斜体），
// 分 light / dark 两套硬编码 hex（语义 token 无紫/青/黄，凑不出该风格），按当前主题亮度选型。
const SYNTAX_DARK = {
    keyword: '#c586c0', func: '#dcdcaa', number: '#d19a66', string: '#98c379',
    boolean: '#56b6c2', jsxTag: '#e06c75', jsxAttr: '#9cdcfe', comment: '#7f8b95', punct: '#8a91b3',
};
const SYNTAX_LIGHT = {
    keyword: '#a626a4', func: '#986801', number: '#b76b01', string: '#50a14f',
    boolean: '#0184bc', jsxTag: '#e45649', jsxAttr: '#4078f2', comment: '#a0a1a7', punct: '#676e95',
};
function CodeBlock(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const { code, language = 'js', title, showLineNumbers = true, copyable = true, wrap = true, fontSize = 13, maxHeight, startLine = 1, highlightLines, style, } = props;
    const [msgApi, msgHolder] = (0, react_native_flux_desktop_4.useMessage)();
    const lines = react_1.default.useMemo(() => (0, tokenize_1.tokenize)(code, language), [code, language]);
    const lineH = Math.round(fontSize * 1.65);
    const digits = String(lines.length).length;
    const gutterW = digits * Math.round(fontSize * 0.62) + 12;
    const isDark = (0, react_native_flux_desktop_6.isDarkTheme)(token);
    const pal = isDark ? SYNTAX_DARK : SYNTAX_LIGHT;
    const colorOf = (k) => {
        switch (k) {
            case 'comment':
                return pal.comment;
            case 'string':
                return pal.string;
            case 'number':
                return pal.number;
            case 'keyword':
                return pal.keyword;
            case 'boolean':
                return pal.boolean;
            case 'func':
                return pal.func;
            case 'jsxTag':
                return pal.jsxTag;
            case 'jsxAttr':
                return pal.jsxAttr;
            case 'punct':
                return pal.punct;
            default:
                return token.colorText;
        }
    };
    const hlSet = react_1.default.useMemo(() => new Set(highlightLines ?? []), [highlightLines]);
    const body = (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { paddingVertical: token.paddingXS } }, lines.map((toks, i) => {
        const lineNum = i + startLine;
        const isHl = hlSet.has(lineNum);
        return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: i, style: { flexDirection: 'row', alignItems: 'flex-start', minHeight: lineH, backgroundColor: isHl ? token.colorPrimaryBg + '33' : 'transparent' } },
            showLineNumbers ? (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: {
                    width: gutterW,
                    textAlign: 'right',
                    paddingRight: 8,
                    fontSize,
                    lineHeight: lineH,
                    fontFamily: react_native_flux_desktop_5.MONO_FAMILY,
                    color: token.colorTextQuaternary,
                } }, lineNum)) : null,
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flex: 1, flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', overflow: 'hidden' } }, toks.length === 0 ? (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize, lineHeight: lineH, fontFamily: react_native_flux_desktop_5.MONO_FAMILY, color: token.colorText } }, " ")) : (toks.flatMap((tk, j) => {
                const color = colorOf(tk.k);
                const italic = tk.k === 'comment' || tk.k === 'jsxAttr' ? 'italic' : 'normal';
                return splitWide(tk.t).map((r, m) => (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: `${j}-${m}`, preserveTrailingSpace: true, style: { fontSize, lineHeight: lineH, fontFamily: r.wide ? react_native_flux_desktop_5.SANS_FAMILY : react_native_flux_desktop_5.MONO_FAMILY, color, fontStyle: italic } }, r.t)));
            })))));
    })));
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
        title != null || language || copyable ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: token.paddingSM,
                paddingVertical: token.paddingXXS,
                backgroundColor: token.colorFillTertiary,
                borderBottomWidth: token.lineWidth,
                borderBottomColor: token.colorBorderSecondary,
            } },
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', alignItems: 'center', gap: token.marginXS } },
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextSecondary, fontFamily: react_native_flux_desktop_5.MONO_FAMILY } }, title),
                language ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { paddingHorizontal: 6, borderRadius: token.borderRadiusSM, backgroundColor: token.colorFillSecondary } },
                    react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: 10, lineHeight: 16, color: token.colorTextTertiary, fontFamily: react_native_flux_desktop_5.MONO_FAMILY } }, language))) : null),
            copyable ? react_1.default.createElement(CopyButton, { text: code, api: msgApi }) : null)) : null,
        maxHeight ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { maxHeight, overflow: 'hidden' } }, body)) : (body),
        msgHolder));
}
/** 按「等宽可渲染 / CJK 宽字符」把一段文本切成 run：Flux Mono 不含 CJK，中文段回退 Flux Sans，避免豆腐块（与终端同一策略）。 */
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
/** 复制按钮：点击写剪贴板 + message success「已复制」提示 + 2s 内联回执 */
function CopyButton(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const [copied, setCopied] = react_1.default.useState(false);
    const timer = react_1.default.useRef(null);
    react_1.default.useEffect(() => () => { if (timer.current)
        clearTimeout(timer.current); }, []);
    return (react_1.default.createElement(react_native_flux_desktop_1.Pressable, { onPress: () => {
            if ((0, react_native_flux_desktop_3.writeClipboard)(props.text)) {
                props.api.success('已复制');
                setCopied(true);
                if (timer.current)
                    clearTimeout(timer.current);
                timer.current = setTimeout(() => setCopied(false), 2000);
            }
            else {
                props.api.error('复制失败');
            }
        }, style: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: token.borderRadiusSM, cursor: 'pointer' } },
        react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: copied ? token.colorSuccess : token.colorTextTertiary } }, copied ? '已复制' : '复制')));
}
exports.default = CodeBlock;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegexTester = RegexTester;
// RegexTester：正则测试器（程序员工具）。模式 + flags + 测试文本实时求值，命中区间高亮、
// 捕获组列表（编号 + 命名）、替换预览。非法正则 / 零宽匹配 / 巨量命中均有护栏。
// 高亮沿用 Highlight 的「View(row+wrap) 包兄弟 Text」范式（本栈 Text 不可嵌套）。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const react_native_flux_desktop_4 = require("react-native-flux-desktop");
const MAX_MATCH = 2000;
function extractGroups(m) {
    const out = [];
    for (let i = 1; i < m.length; i++) {
        out.push({ key: String(i), value: m[i] === undefined ? '' : String(m[i]) });
    }
    if (m.groups) {
        Object.keys(m.groups).forEach((k) => {
            const v = m.groups[k];
            out.push({ key: k, value: v === undefined ? '' : String(v) });
        });
    }
    return out;
}
/** 求值：返回命中区间 + 错误信息。global 关闭时只取首个；零宽匹配手动前进防死循环。 */
function evaluate(text, pattern, flags) {
    if (pattern === '')
        return { matches: [], error: null, truncated: false };
    let re;
    try {
        re = new RegExp(pattern, flags);
    }
    catch (e) {
        return { matches: [], error: e.message, truncated: false };
    }
    const matches = [];
    const global = flags.includes('g');
    let m;
    let guard = 0;
    for (;;) {
        m = re.exec(text);
        if (m === null)
            break;
        matches.push({ start: m.index, end: m.index + m[0].length, text: m[0], groups: extractGroups(m) });
        if (!global)
            break;
        if (m[0].length === 0)
            re.lastIndex += 1;
        if (matches.length >= MAX_MATCH)
            return { matches, error: null, truncated: true };
        if (++guard > MAX_MATCH * 2)
            break;
    }
    return { matches, error: null, truncated: false };
}
/** 按命中区间把文本切成 plain/hit 片段（跳过零宽命中，避免空块）。 */
function splitMatches(text, matches) {
    const spans = matches.filter((mm) => mm.end > mm.start);
    if (spans.length === 0)
        return [{ t: text, hit: false, idx: -1 }];
    const pieces = [];
    let cursor = 0;
    spans.forEach((mm, k) => {
        if (mm.start > cursor)
            pieces.push({ t: text.slice(cursor, mm.start), hit: false, idx: -1 });
        pieces.push({ t: text.slice(mm.start, mm.end), hit: true, idx: k });
        cursor = mm.end;
    });
    if (cursor < text.length)
        pieces.push({ t: text.slice(cursor), hit: false, idx: -1 });
    return pieces;
}
function doReplace(text, pattern, flags, replacement) {
    if (pattern === '')
        return null;
    try {
        return text.replace(new RegExp(pattern, flags), replacement);
    }
    catch {
        return null;
    }
}
function RegexTester(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const { defaultPattern = '', defaultText = '', defaultFlags = 'g', defaultReplacement = '', showReplace = true, style, } = props;
    const [pattern, setPattern] = react_1.default.useState(defaultPattern);
    const [text, setText] = react_1.default.useState(defaultText);
    const [gOn, setGOn] = react_1.default.useState(defaultFlags.includes('g'));
    const [iOn, setIOn] = react_1.default.useState(defaultFlags.includes('i'));
    const [mOn, setMOn] = react_1.default.useState(defaultFlags.includes('m'));
    const [replacement, setReplacement] = react_1.default.useState(defaultReplacement);
    const flags = `${gOn ? 'g' : ''}${iOn ? 'i' : ''}${mOn ? 'm' : ''}`;
    const { matches, error, truncated } = react_1.default.useMemo(() => evaluate(text, pattern, flags), [text, pattern, flags]);
    const pieces = react_1.default.useMemo(() => splitMatches(text, matches), [text, matches]);
    const replaced = react_1.default.useMemo(() => (showReplace ? doReplace(text, pattern, flags, replacement) : null), [showReplace, text, pattern, flags, replacement]);
    const boxBg = token.colorFillQuaternary;
    const base = { fontSize: token.fontSize, lineHeight: Math.round(token.fontSize * 1.7) };
    // 相邻命中交替两档底色，便于肉眼区分边界
    const hitBg = (idx) => (idx % 2 === 0 ? `${token.colorPrimary}33` : `${token.colorPrimary}1F`);
    const labelStyle = { fontSize: token.fontSizeSM, color: token.colorTextTertiary, marginBottom: 4 };
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [{ gap: token.marginSM }, style] },
        react_1.default.createElement(react_native_flux_desktop_1.View, null,
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: labelStyle }, "\u6B63\u5219\u8868\u8FBE\u5F0F"),
            react_1.default.createElement(react_native_flux_desktop_3.Input, { value: pattern, onChange: setPattern, placeholder: "\u4F8B\u5982\uFF1A(\\\\w+)@(\\\\w+)\\\\.com", style: { backgroundColor: boxBg } }),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', gap: token.marginLG, marginTop: token.marginXS } },
                react_1.default.createElement(react_native_flux_desktop_3.Checkbox, { checked: gOn, onChange: setGOn, label: "g \u5168\u5C40" }),
                react_1.default.createElement(react_native_flux_desktop_3.Checkbox, { checked: iOn, onChange: setIOn, label: "i \u5FFD\u7565\u5927\u5C0F\u5199" }),
                react_1.default.createElement(react_native_flux_desktop_3.Checkbox, { checked: mOn, onChange: setMOn, label: "m \u591A\u884C" }))),
        react_1.default.createElement(react_native_flux_desktop_1.View, null,
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: labelStyle }, "\u6D4B\u8BD5\u6587\u672C"),
            react_1.default.createElement(react_native_flux_desktop_3.TextArea, { value: text, onChange: setText, rows: 4, placeholder: "\u8F93\u5165\u5F85\u5339\u914D\u7684\u6587\u672C\u2026", style: { backgroundColor: boxBg } })),
        error ? (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorError } },
            "\u26A0 ",
            error)) : (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: matches.length ? token.colorSuccess : token.colorTextTertiary } }, pattern === '' ? '输入正则开始匹配' : `匹配 ${matches.length} 处${truncated ? '（已截断，仅显示前 ' + MAX_MATCH + ' 处）' : ''}`)),
        !error && matches.length > 0 ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { backgroundColor: boxBg, borderRadius: token.borderRadius, padding: token.paddingSM } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { ...labelStyle, marginBottom: token.marginXS } }, "\u547D\u4E2D\u9AD8\u4EAE"),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start' } }, pieces.map((p, i) => p.hit ? (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: i, preserveTrailingSpace: true, style: { ...base, fontFamily: react_native_flux_desktop_4.MONO_FAMILY, color: token.colorPrimary, fontWeight: '600', backgroundColor: hitBg(p.idx), borderRadius: token.borderRadiusSM } }, p.t)) : (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: i, preserveTrailingSpace: true, style: { ...base, fontFamily: react_native_flux_desktop_4.SANS_FAMILY, color: token.colorText } }, p.t)))))) : null,
        !error && matches.length > 0 && matches.some((mm) => mm.groups.length > 0) ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { backgroundColor: boxBg, borderRadius: token.borderRadius, padding: token.paddingSM } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { ...labelStyle, marginBottom: token.marginXS } }, "\u6355\u83B7\u7EC4"),
            matches.slice(0, 50).map((mm, mi) => (react_1.default.createElement(react_native_flux_desktop_1.View, { key: `g${mi}`, style: { marginBottom: token.marginXS } },
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextSecondary, fontFamily: react_native_flux_desktop_4.MONO_FAMILY } }, `#${mi + 1}  ${mm.text.length > 40 ? mm.text.slice(0, 40) + '…' : mm.text}`),
                mm.groups.map((grp, gi) => (react_1.default.createElement(react_native_flux_desktop_1.View, { key: `gi${gi}`, style: { flexDirection: 'row', paddingLeft: token.paddingXS } },
                    react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextTertiary, fontFamily: react_native_flux_desktop_4.MONO_FAMILY, width: 60 } }, `$${grp.key}`),
                    react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorPrimary, fontFamily: react_native_flux_desktop_4.MONO_FAMILY } }, grp.value === '' ? '（空）' : grp.value))))))))) : null,
        showReplace ? (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(react_native_flux_desktop_3.Divider, { style: { marginVertical: token.marginXXS } }),
            react_1.default.createElement(react_native_flux_desktop_1.View, null,
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: labelStyle }, '替换为（支持 $1 / $<name> 引用）'),
                react_1.default.createElement(react_native_flux_desktop_3.Input, { value: replacement, onChange: setReplacement, placeholder: "\u66FF\u6362\u4E32\u2026", style: { backgroundColor: boxBg } })),
            replaced != null && pattern !== '' ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { backgroundColor: boxBg, borderRadius: token.borderRadius, padding: token.paddingSM } },
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { ...labelStyle, marginBottom: token.marginXS } }, "\u66FF\u6362\u7ED3\u679C"),
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { ...base, fontFamily: react_native_flux_desktop_4.SANS_FAMILY, color: token.colorText } }, replaced))) : null)) : null));
}
exports.default = RegexTester;

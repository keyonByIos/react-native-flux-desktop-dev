"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandPalette = CommandPalette;
// CommandPalette：命令面板（⌘K 式）。查询 Input + fzf 模糊排序 + ↑↓/Enter 键盘导航 + 命中高亮。
// 键盘链路：Input 的 onKeyDown 逃生口抢 ↑↓（列表导航），Enter 走 onPressEnter 执行当前项；鼠标悬停/点击同步。
// 分组：group 变化处插小标题；hint 右对齐（快捷键提示）；keywords 参与匹配但不显示。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const react_native_flux_desktop_4 = require("react-native-flux-desktop");
const fuzzy_1 = require("./fuzzy");
/** label 与 keywords 各自模糊匹配取高分（keywords 轻罚，同等条件 label 优先）。 */
function rank(query, items) {
    const out = [];
    for (const item of items) {
        const rl = (0, fuzzy_1.fuzzyMatch)(query, item.label);
        const rk = item.keywords ? (0, fuzzy_1.fuzzyMatch)(query, item.keywords) : null;
        const sl = rl ? rl.score : Number.NEGATIVE_INFINITY;
        const sk = rk ? rk.score - 2 : Number.NEGATIVE_INFINITY;
        if (rl && sl >= sk)
            out.push({ item, indices: rl.indices, score: sl });
        else if (rk && sk > sl)
            out.push({ item, indices: [], score: sk });
    }
    out.sort((a, b) => b.score - a.score);
    return out;
}
/** 命中高亮：label 按码点拆段，命中段主色加粗（本栈 Text 不可嵌套 → View row 包兄弟 Text）。 */
function Highlighted(props) {
    const cps = Array.from(props.label);
    const hitSet = new Set(props.indices);
    const runs = [];
    cps.forEach((c, i) => {
        const on = hitSet.has(i);
        const last = runs[runs.length - 1];
        if (last && last.on === on)
            last.text += c;
        else
            runs.push({ text: c, on });
    });
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', flexWrap: 'wrap', flex: 1 } }, runs.map((r, i) => (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: i, style: { fontSize: 13, color: r.on ? props.hit : props.base, fontWeight: r.on ? '600' : 'normal' } }, r.text)))));
}
function CommandPalette(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const { items, placeholder = '输入命令…', maxResults = 8, emptyText = '无匹配命令', autoFocus, onSelect, style } = props;
    const [query, setQuery] = react_1.default.useState('');
    const [active, setActive] = react_1.default.useState(0);
    const ranked = react_1.default.useMemo(() => rank(query, items).slice(0, maxResults), [query, items, maxResults]);
    // 结果集变化时把高亮夹回范围内（查询词每变一次都回顶更直觉）
    react_1.default.useEffect(() => {
        setActive(0);
    }, [query]);
    const fire = (i) => {
        const r = ranked[i];
        if (!r)
            return;
        onSelect && onSelect(r.item);
        setQuery('');
    };
    const onKeyDown = (key, _mods) => {
        if (ranked.length === 0)
            return false;
        if (key === 'ArrowUp') {
            setActive((a) => (a - 1 + ranked.length) % ranked.length);
            return true;
        }
        if (key === 'ArrowDown') {
            setActive((a) => (a + 1) % ranked.length);
            return true;
        }
        if (key === 'Escape') {
            setQuery('');
            return true;
        }
        return false; // 其余键（含 Enter/编辑键）交回 Input 默认行为
    };
    let lastGroup;
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [
            {
                borderRadius: token.borderRadiusLG,
                borderWidth: 1,
                borderColor: token.colorBorderSecondary,
                backgroundColor: token.colorBgContainer,
                padding: token.paddingXS,
                gap: token.marginXXS,
            },
            style,
        ] },
        react_1.default.createElement(react_native_flux_desktop_3.Input, { value: query, onChange: setQuery, onPressEnter: () => fire(active), onKeyDown: onKeyDown, autoFocus: autoFocus, placeholder: placeholder, prefix: react_1.default.createElement(react_native_flux_desktop_4.Icon, { name: "search", size: 14, color: token.colorTextTertiary }), allowClear: true }),
        ranked.length === 0 ? (query ? (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: 12, color: token.colorTextTertiary, padding: token.paddingXS } }, emptyText)) : null) : (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { gap: 1 } },
            ranked.map((r, i) => {
                const header = r.item.group && r.item.group !== lastGroup ? r.item.group : null;
                lastGroup = r.item.group;
                const isActive = i === active;
                return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: r.item.id },
                    header ? (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: 11, color: token.colorTextQuaternary, marginTop: token.marginXS, marginBottom: 2, paddingHorizontal: 8, textTransform: 'uppercase' } }, header)) : null,
                    react_1.default.createElement(react_native_flux_desktop_1.Pressable, { onPress: () => fire(i), onMouseEnter: () => setActive(i), style: {
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: token.marginSM,
                            paddingHorizontal: 8,
                            paddingVertical: 6,
                            borderRadius: token.borderRadiusSM,
                            backgroundColor: isActive ? token.colorFillSecondary : 'transparent',
                        } },
                        react_1.default.createElement(Highlighted, { label: r.item.label, indices: r.indices, base: token.colorText, hit: token.colorPrimary }),
                        r.item.hint ? react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: 11, color: token.colorTextTertiary, flexShrink: 0 } }, r.item.hint) : null)));
            }),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', gap: token.marginSM, paddingHorizontal: 8, paddingTop: 4 } },
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: 10, color: token.colorTextQuaternary } }, "\u2191\u2193 \u9009\u62E9"),
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: 10, color: token.colorTextQuaternary } }, "Enter \u6267\u884C"),
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: 10, color: token.colorTextQuaternary } }, "Esc \u6E05\u7A7A"))))));
}
exports.default = CommandPalette;

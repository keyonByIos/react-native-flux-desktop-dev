"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronParser = CronParser;
// CronParser：Cron 表达式解析器（程序员工具）。输入 5 段 cron → 合法性 + 中文描述 + 五字段分解 + 未来 N 次触发时刻。
// 解析/求值算法在 ./cron（纯函数，已探针验证），本组件只做输入框 + 结果呈现。常用宏一键填充。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const react_native_flux_desktop_4 = require("react-native-flux-desktop");
const cron_1 = require("./cron");
const FIELD_LABELS = [
    { key: 'minute', name: '分钟', hint: '0-59' },
    { key: 'hour', name: '小时', hint: '0-23' },
    { key: 'dom', name: '日', hint: '1-31' },
    { key: 'month', name: '月', hint: '1-12' },
    { key: 'dow', name: '星期', hint: '0-7' },
];
const PRESETS = [
    { label: '每分钟', expr: '* * * * *' },
    { label: '每 5 分钟', expr: '*/5 * * * *' },
    { label: '每小时', expr: '0 * * * *' },
    { label: '每天零点', expr: '@daily' },
    { label: '每周一 9 点', expr: '0 9 * * 1' },
    { label: '每月 1 号', expr: '0 0 1 * *' },
    { label: '工作日 9-18', expr: '0 9-18 * * 1-5' },
    { label: '每年 1 月', expr: '0 0 1 1 *' },
];
const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
function fieldSummary(f, key) {
    const vals = f[key];
    const full = key === 'minute' ? 60 : key === 'hour' ? 24 : key === 'dom' ? 31 : key === 'month' ? 12 : 7;
    if (vals.length === full)
        return '*  every';
    return vals.length <= 6 ? vals.join(' ') : `${vals.length} 项`;
}
function CronParser(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const { defaultValue = '*/15 9-18 * * 1-5', previewCount = 5, style } = props;
    const [expr, setExpr] = react_1.default.useState(defaultValue);
    const parsed = react_1.default.useMemo(() => {
        try {
            return { fields: (0, cron_1.parseCron)(expr), error: null };
        }
        catch (e) {
            return { fields: null, error: e.message };
        }
    }, [expr]);
    const desc = react_1.default.useMemo(() => {
        try {
            return parsed.fields ? (0, cron_1.describeCron)(expr) : '';
        }
        catch {
            return '';
        }
    }, [expr, parsed.fields]);
    const runs = react_1.default.useMemo(() => {
        try {
            return parsed.fields ? (0, cron_1.nextRuns)(expr, new Date(), previewCount) : [];
        }
        catch {
            return [];
        }
    }, [expr, parsed.fields, previewCount]);
    const boxBg = token.colorFillQuaternary;
    const labelStyle = { fontSize: token.fontSizeSM, color: token.colorTextTertiary, marginBottom: 4 };
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [{ gap: token.marginSM }, style] },
        react_1.default.createElement(react_native_flux_desktop_1.View, null,
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: labelStyle }, "Cron \u8868\u8FBE\u5F0F\uFF08\u5206 \u65F6 \u65E5 \u6708 \u5468\uFF09"),
            react_1.default.createElement(react_native_flux_desktop_3.Input, { value: expr, onChange: setExpr, placeholder: "\u4F8B\u5982\uFF1A0 9 * * 1-5", style: { backgroundColor: boxBg } })),
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: token.marginXS } }, PRESETS.map((p) => {
            const on = expr === p.expr;
            return (react_1.default.createElement(react_native_flux_desktop_1.Pressable, { key: p.expr, onPress: () => setExpr(p.expr), style: {
                    paddingHorizontal: token.paddingSM,
                    paddingVertical: token.paddingXXS ?? 2,
                    borderRadius: token.borderRadiusSM,
                    backgroundColor: on ? `${token.colorPrimary}22` : boxBg,
                    borderWidth: 1,
                    borderColor: on ? token.colorPrimary : 'transparent',
                } },
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: on ? token.colorPrimary : token.colorTextSecondary } }, p.label)));
        })),
        parsed.error ? (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSize, color: token.colorError } },
            "\u26A0 ",
            parsed.error)) : (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { backgroundColor: boxBg, borderRadius: token.borderRadius, padding: token.paddingSM, gap: 2 } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorSuccess } }, "\u2713 \u5408\u6CD5\u8868\u8FBE\u5F0F"),
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSize, color: token.colorText } }, desc))),
        parsed.fields ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', gap: token.marginXS } }, FIELD_LABELS.map((fl) => (react_1.default.createElement(react_native_flux_desktop_1.View, { key: fl.key, style: { flex: 1, backgroundColor: boxBg, borderRadius: token.borderRadiusSM, padding: token.paddingXS, alignItems: 'center', gap: 2 } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextSecondary } }, fl.name),
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorPrimary, fontFamily: react_native_flux_desktop_4.MONO_FAMILY }, numberOfLines: 1 }, fieldSummary(parsed.fields, fl.key)),
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextQuaternary } }, fl.hint)))))) : null,
        parsed.fields && runs.length > 0 ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { backgroundColor: boxBg, borderRadius: token.borderRadius, padding: token.paddingSM } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { ...labelStyle, marginBottom: token.marginXS } },
                "\u672A\u6765 ",
                runs.length,
                " \u6B21\u89E6\u53D1"),
            runs.map((d, i) => (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: i, style: { fontSize: token.fontSizeSM, color: i === 0 ? token.colorPrimary : token.colorTextSecondary, fontFamily: react_native_flux_desktop_4.MONO_FAMILY, marginBottom: 2 } }, `${i + 1}.  ${fmtDate(d)}`))))) : null));
}
exports.default = CronParser;

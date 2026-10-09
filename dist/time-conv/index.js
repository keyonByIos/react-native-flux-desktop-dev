"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeConverter = TimeConverter;
// TimeConverter：时间戳 / 日期双向转换器（程序员工具）。
// 上半：Unix 时间戳（自动识别秒/毫秒）→ 秒 / 毫秒 / UTC / 指定时区 / ISO / 相对时间。
// 下半：日历时间字符串 → 秒 / 毫秒时间戳。含实时「此刻」时钟 + 常用时区切换。
// 算法在 ./timeconv（纯函数，已探针验证）。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const react_native_flux_desktop_4 = require("react-native-flux-desktop");
const timeconv_1 = require("./timeconv");
const TZ_PRESETS = ['Asia/Shanghai', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
function nowDateStr(ms, tz) {
    const p = parseParts(ms, tz);
    return `${p.y}-${pad2(p.mo)}-${pad2(p.d)} ${pad2(p.h)}:${pad2(p.mi)}:${pad2(p.s)}`;
}
function parseParts(ms, tz) {
    // 复用 formatZoned 的拆解（去掉周X）
    const full = (0, timeconv_1.formatZoned)(ms, tz); // 'YYYY-MM-DD HH:mm:ss 周X'
    const [datePart, timePart] = full.split(' ');
    const [y, mo, d] = datePart.split('-').map(Number);
    const [h, mi, s] = timePart.split(':').map(Number);
    return { y, mo, d, h, mi, s };
}
function TimeConverter(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const appTz = (0, react_native_flux_desktop_2.useTimezone)();
    const { defaultStamp, defaultDate, liveClock = true, style } = props;
    const [tz, setTz] = react_1.default.useState(appTz || 'Asia/Shanghai');
    const [stamp, setStamp] = react_1.default.useState(defaultStamp ?? String(Math.floor(Date.now() / 1000)));
    const [dateStr, setDateStr] = react_1.default.useState(defaultDate ?? nowDateStr(Date.now(), appTz || 'Asia/Shanghai'));
    const [now, setNow] = react_1.default.useState(Date.now());
    react_1.default.useEffect(() => {
        if (!liveClock)
            return undefined;
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, [liveClock]);
    const boxBg = token.colorFillQuaternary;
    const labelStyle = { fontSize: token.fontSizeSM, color: token.colorTextTertiary };
    const info = (0, timeconv_1.fromTimestamp)(Number(stamp.trim()));
    const parsedDate = (0, timeconv_1.parseToMs)(dateStr, tz);
    const row = (label, value, mono = true, accent = false) => (react_1.default.createElement(react_native_flux_desktop_1.View, { key: label, style: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: token.marginSM } },
        react_1.default.createElement(react_native_flux_desktop_1.Text, { style: [labelStyle, { width: 72 }] }, label),
        react_1.default.createElement(react_native_flux_desktop_1.Text, { style: {
                flex: 1,
                fontSize: token.fontSize,
                color: accent ? token.colorPrimary : token.colorText,
                fontFamily: mono ? react_native_flux_desktop_4.MONO_FAMILY : undefined,
            }, selectable: true, numberOfLines: 1 }, value)));
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [{ gap: token.marginMD }, style] },
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { backgroundColor: boxBg, borderRadius: token.borderRadius, padding: token.padding, gap: token.marginXS } },
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } },
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: labelStyle },
                    "\u6B64\u523B\uFF08",
                    tz,
                    "\uFF09"),
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextSecondary, fontFamily: react_native_flux_desktop_4.MONO_FAMILY } }, `${Math.floor(now / 1000)}  /  ${now}`)),
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeLG, color: token.colorText } }, (0, timeconv_1.formatZoned)(now, tz)),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', flexWrap: 'wrap', gap: token.marginXS } }, TZ_PRESETS.map((z) => {
                const on = z === tz;
                return (react_1.default.createElement(react_native_flux_desktop_1.Pressable, { key: z, onPress: () => setTz(z), style: {
                        paddingHorizontal: token.paddingSM,
                        paddingVertical: 2,
                        borderRadius: token.borderRadiusSM,
                        backgroundColor: on ? `${token.colorPrimary}22` : token.colorFillSecondary,
                        borderWidth: 1,
                        borderColor: on ? token.colorPrimary : 'transparent',
                    } },
                    react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: on ? token.colorPrimary : token.colorTextSecondary } }, z === 'Asia/Shanghai' ? '上海' : z === 'UTC' ? 'UTC' : z === 'America/New_York' ? '纽约' : z === 'Europe/London' ? '伦敦' : z === 'Asia/Tokyo' ? '东京' : z)));
            }))),
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { gap: token.marginXS } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSize, color: token.colorTextSecondary, fontWeight: '600' } }, "\u65F6\u95F4\u6233 \u2192 \u65E5\u671F"),
            react_1.default.createElement(react_native_flux_desktop_3.Input, { value: stamp, onChange: setStamp, placeholder: "Unix \u65F6\u95F4\u6233\uFF08\u79D2\u6216\u6BEB\u79D2\uFF0C\u81EA\u52A8\u8BC6\u522B\uFF09", style: { backgroundColor: boxBg } }),
            info ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { backgroundColor: boxBg, borderRadius: token.borderRadius, padding: token.padding } },
                row('单位', info.unit === 'ms' ? '毫秒 (ms)' : '秒 (s)', false, true),
                row('秒', String(info.sec)),
                row('毫秒', String(info.ms)),
                row('UTC', (0, timeconv_1.formatZoned)(info.ms, 'UTC'), false),
                row((0, timeconv_1.tzOffsetLabel)(info.ms, tz), (0, timeconv_1.formatZoned)(info.ms, tz), false),
                row('ISO', new Date(info.ms).toISOString()),
                row('相对', (0, timeconv_1.relativeTime)(info.ms, now), false))) : (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSize, color: token.colorError } }, "\u26A0 \u65E0\u6548\u65F6\u95F4\u6233"))),
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { gap: token.marginXS } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSize, color: token.colorTextSecondary, fontWeight: '600' } },
                "\u65E5\u671F \u2192 \u65F6\u95F4\u6233\uFF08",
                tz,
                "\uFF09"),
            react_1.default.createElement(react_native_flux_desktop_3.Input, { value: dateStr, onChange: setDateStr, placeholder: "YYYY-MM-DD HH:mm:ss", style: { backgroundColor: boxBg } }),
            parsedDate != null ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { backgroundColor: boxBg, borderRadius: token.borderRadius, padding: token.padding } },
                row('秒', String(Math.floor(parsedDate / 1000)), true, true),
                row('毫秒', String(parsedDate)),
                row('ISO', new Date(parsedDate).toISOString()),
                row('校验', (0, timeconv_1.formatZoned)(parsedDate, tz), false))) : (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSize, color: token.colorError } }, "\u26A0 \u65E0\u6CD5\u89E3\u6790\uFF08\u7528 YYYY-MM-DD HH:mm:ss\uFF09")))));
}
exports.default = TimeConverter;

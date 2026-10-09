"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectUnit = detectUnit;
exports.fromTimestamp = fromTimestamp;
exports.parseToMs = parseToMs;
exports.tzOffsetLabel = tzOffsetLabel;
exports.formatZoned = formatZoned;
exports.relativeTime = relativeTime;
// 时间戳 / 日期转换核心算法（纯函数，无渲染依赖，便于探针验证）。
// 复用 src/utils/timezone 的 Intl 时区拆解，做「Unix 时间戳 ↔ 日历时间」双向转换 + 相对时间。
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
/** 秒 / 毫秒启发式判定：|n| ≥ 1e11 视为毫秒（当前秒级 ~1.7e9，毫秒级 ~1.7e12）。 */
function detectUnit(n) {
    return Math.abs(n) >= 1e11 ? 'ms' : 's';
}
/** 由数字时间戳（自动判单位）得标准化信息；非有限值返回 null。 */
function fromTimestamp(n) {
    if (!Number.isFinite(n))
        return null;
    const unit = detectUnit(n);
    const ms = unit === 'ms' ? n : Math.round(n * 1000);
    const sec = unit === 'ms' ? Math.floor(n / 1000) : Math.trunc(n);
    return { ms, sec, unit };
}
/**
 * 解析日历时间字符串为毫秒时间戳。
 * 支持 'YYYY-MM-DD'、'YYYY-MM-DD HH:mm:ss'、'YYYY-MM-DDTHH:mm:ss'（按 tz 视为墙上时间），
 * 以及带 Z / 显式偏移的 ISO（走 Date.parse）。非法返回 null。
 */
function parseToMs(input, tz) {
    const s = String(input).trim();
    if (!s)
        return null;
    // 带时区标记的 ISO：直接 Date.parse
    if (/Z$|[+-]\d{2}:?\d{2}$/.test(s)) {
        const t = Date.parse(s);
        return Number.isFinite(t) ? t : null;
    }
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/.exec(s);
    if (!m)
        return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const h = m[4] ? Number(m[4]) : 0;
    const mi = m[5] ? Number(m[5]) : 0;
    const se = m[6] ? Number(m[6]) : 0;
    if (mo < 0 || mo > 11 || d < 1 || d > 31 || h > 23 || mi > 59 || se > 59)
        return null;
    const date = (0, react_native_flux_desktop_1.zonedTimeToUtc)(y, mo, d, h, mi, se, tz);
    const t = date.getTime();
    return Number.isFinite(t) ? t : null;
}
const pad2 = (n) => (n < 10 ? `0${n}` : `${n}`);
/** 指定时区在某时刻相对 UTC 的偏移标签，如 '+08:00' / '-05:00' / '+05:30'。 */
function tzOffsetLabel(ms, tz) {
    const p = (0, react_native_flux_desktop_1.getZonedParts)(new Date(ms), tz);
    const asUTC = Date.UTC(p.year, p.month, p.day, p.hour, p.minute, p.second);
    // 秒级偏移（含半小时/刻钟时区）
    let offMin = Math.round((asUTC - Math.floor(ms / 1000) * 1000) / 60000);
    if (offMin === 0)
        return '+00:00';
    const sign = offMin < 0 ? '-' : '+';
    offMin = Math.abs(offMin);
    return `${sign}${pad2(Math.floor(offMin / 60))}:${pad2(offMin % 60)}`;
}
const WEEKDAY_CN = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
/** 按指定时区格式化 'YYYY-MM-DD HH:mm:ss 周X'。 */
function formatZoned(ms, tz) {
    const p = (0, react_native_flux_desktop_1.getZonedParts)(new Date(ms), tz);
    return `${p.year}-${pad2(p.month + 1)}-${pad2(p.day)} ${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)} ${WEEKDAY_CN[p.weekday]}`;
}
/** 相对时间（中文）：now 与目标时刻的差，过去「…前」/ 未来「…后」。 */
function relativeTime(ms, nowMs) {
    let diff = (nowMs - ms) / 1000; // 正=过去
    const future = diff < 0;
    diff = Math.abs(diff);
    let text;
    if (diff < 3)
        text = '刚刚';
    else if (diff < 60)
        text = `${Math.floor(diff)} 秒`;
    else if (diff < 3600)
        text = `${Math.floor(diff / 60)} 分钟`;
    else if (diff < 86400)
        text = `${Math.floor(diff / 3600)} 小时`;
    else if (diff < 2592000)
        text = `${Math.floor(diff / 86400)} 天`;
    else if (diff < 31536000)
        text = `${Math.floor(diff / 2592000)} 个月`;
    else
        text = `${Math.floor(diff / 31536000)} 年`;
    if (text === '刚刚')
        return text;
    return future ? `${text}后` : `${text}前`;
}

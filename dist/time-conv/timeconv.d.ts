export interface StampInfo {
    /** 毫秒时间戳 */
    ms: number;
    /** 秒时间戳 */
    sec: number;
    /** 探测到的输入单位 */
    unit: 's' | 'ms';
}
/** 秒 / 毫秒启发式判定：|n| ≥ 1e11 视为毫秒（当前秒级 ~1.7e9，毫秒级 ~1.7e12）。 */
export declare function detectUnit(n: number): 's' | 'ms';
/** 由数字时间戳（自动判单位）得标准化信息；非有限值返回 null。 */
export declare function fromTimestamp(n: number): StampInfo | null;
/**
 * 解析日历时间字符串为毫秒时间戳。
 * 支持 'YYYY-MM-DD'、'YYYY-MM-DD HH:mm:ss'、'YYYY-MM-DDTHH:mm:ss'（按 tz 视为墙上时间），
 * 以及带 Z / 显式偏移的 ISO（走 Date.parse）。非法返回 null。
 */
export declare function parseToMs(input: string, tz: string): number | null;
/** 指定时区在某时刻相对 UTC 的偏移标签，如 '+08:00' / '-05:00' / '+05:30'。 */
export declare function tzOffsetLabel(ms: number, tz: string): string;
/** 按指定时区格式化 'YYYY-MM-DD HH:mm:ss 周X'。 */
export declare function formatZoned(ms: number, tz: string): string;
/** 相对时间（中文）：now 与目标时刻的差，过去「…前」/ 未来「…后」。 */
export declare function relativeTime(ms: number, nowMs: number): string;

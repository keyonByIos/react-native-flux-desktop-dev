export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
/** 级别严重度序（越大越严重），用于「≥ 阈值」过滤 */
export declare const LEVEL_RANK: Record<LogLevel, number>;
export declare const ALL_LEVELS: LogLevel[];
export interface LogEntry {
    /** 时间戳字符串（调用方格式化好，组件不解析） */
    time?: string;
    level: LogLevel;
    /** 来源模块 / 服务名 */
    source?: string;
    message: string;
}
export interface LogFilter {
    /** 最低显示级别（默认 trace = 全显示） */
    minLevel?: LogLevel;
    /** 关键词（对 message + source 做大小写不敏感子串匹配；空则不过滤） */
    query?: string;
}
/** 按级别阈值 + 关键词过滤，保持原顺序。未知级别按 info 兜底。 */
export declare function filterLogs(logs: LogEntry[], filter?: LogFilter): LogEntry[];
/** 各级别计数（含 0），用于工具栏概览。 */
export declare function summarize(logs: LogEntry[]): Record<LogLevel, number>;

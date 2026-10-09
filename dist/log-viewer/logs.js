"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_LEVELS = exports.LEVEL_RANK = void 0;
exports.filterLogs = filterLogs;
exports.summarize = summarize;
/** 级别严重度序（越大越严重），用于「≥ 阈值」过滤 */
exports.LEVEL_RANK = { trace: 0, debug: 1, info: 2, warn: 3, error: 4, fatal: 5 };
exports.ALL_LEVELS = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
/** 按级别阈值 + 关键词过滤，保持原顺序。未知级别按 info 兜底。 */
function filterLogs(logs, filter = {}) {
    const min = filter.minLevel ?? 'trace';
    const minRank = exports.LEVEL_RANK[min] ?? 0;
    const q = (filter.query ?? '').trim().toLowerCase();
    return logs.filter((l) => {
        const rank = exports.LEVEL_RANK[l.level] ?? exports.LEVEL_RANK.info;
        if (rank < minRank)
            return false;
        if (q === '')
            return true;
        return l.message.toLowerCase().includes(q) || (l.source ?? '').toLowerCase().includes(q);
    });
}
/** 各级别计数（含 0），用于工具栏概览。 */
function summarize(logs) {
    const out = { trace: 0, debug: 0, info: 0, warn: 0, error: 0, fatal: 0 };
    for (const l of logs)
        out[l.level] = (out[l.level] ?? 0) + 1;
    return out;
}

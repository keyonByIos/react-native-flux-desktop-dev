"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diffLines = diffLines;
exports.foldContext = foldContext;
exports.diffStat = diffStat;
const splitLines = (s) => {
    if (s === '')
        return [];
    const norm = s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const parts = norm.split('\n');
    // 末尾换行会产生一个空串尾元素：若原文以 \n 结尾则丢弃该幻影行
    if (parts.length > 1 && parts[parts.length - 1] === '')
        parts.pop();
    return parts;
};
/** 计算两个文本的行级 LCS diff，返回逐行编辑脚本（含全部上下文行）。 */
function diffLines(oldText, newText) {
    const a = splitLines(oldText);
    const b = splitLines(newText);
    const n = a.length;
    const m = b.length;
    // LCS 长度表：dp[i][j] = a[i..] 与 b[j..] 的最长公共子序列长度
    const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) {
        for (let j = m - 1; j >= 0; j--) {
            dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }
    const rows = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (a[i] === b[j]) {
            rows.push({ type: 'ctx', aNum: i + 1, bNum: j + 1, text: a[i] });
            i++;
            j++;
        }
        else if (dp[i + 1][j] >= dp[i][j + 1]) {
            rows.push({ type: 'del', aNum: i + 1, bNum: null, text: a[i] });
            i++;
        }
        else {
            rows.push({ type: 'add', aNum: null, bNum: j + 1, text: b[j] });
            j++;
        }
    }
    while (i < n) {
        rows.push({ type: 'del', aNum: i + 1, bNum: null, text: a[i] });
        i++;
    }
    while (j < m) {
        rows.push({ type: 'add', aNum: null, bNum: j + 1, text: b[j] });
        j++;
    }
    return rows;
}
/** 折叠超长未变区：连续 ctx 超过 2×context 时，只保留首尾各 context 行，中间以 skip 分隔（记被折叠行数）。 */
function foldContext(rows, context = 3) {
    if (context <= 0)
        return rows;
    const out = [];
    let i = 0;
    const isCtx = (r) => r.type === 'ctx';
    while (i < rows.length) {
        if (!isCtx(rows[i])) {
            out.push(rows[i]);
            i++;
            continue;
        }
        // 收集一段连续 ctx
        let k = i;
        while (k < rows.length && isCtx(rows[k]))
            k++;
        const runLen = k - i;
        if (runLen <= 2 * context + 1) {
            for (let t = i; t < k; t++)
                out.push(rows[t]);
        }
        else {
            for (let t = i; t < i + context; t++)
                out.push(rows[t]);
            out.push({ type: 'skip', aNum: null, bNum: null, text: String(runLen - 2 * context) });
            for (let t = k - context; t < k; t++)
                out.push(rows[t]);
        }
        i = k;
    }
    return out;
}
/** 统计增删行数。 */
function diffStat(rows) {
    let added = 0;
    let removed = 0;
    for (const r of rows) {
        if (r.type === 'add')
            added++;
        else if (r.type === 'del')
            removed++;
    }
    return { added, removed };
}

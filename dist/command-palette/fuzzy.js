"use strict";
// fzf 式模糊匹配：子序列命中 + 打分（行首/分隔符后/驼峰边界/连续加成，跳字罚分）。纯函数，探针验证。
// 命令面板（CommandPalette）用；DP 求「最优对齐」而非贪心首匹配——贪心会把分高的对齐机会让给坏位置。
Object.defineProperty(exports, "__esModule", { value: true });
exports.fuzzyMatch = fuzzyMatch;
exports.rankItems = rankItems;
const SEPARATOR = /[\s\-_./:,#&()[\]{}]/;
/** query 是否命中 target（子序列）；不命中返回 null。大小写不敏感，indices 按原始码点位。 */
function fuzzyMatch(query, target) {
    const q = Array.from(query.trim().toLowerCase());
    const t = Array.from(target);
    const tl = t.map((c) => c.toLowerCase());
    const n = q.length;
    const m = tl.length;
    if (n === 0)
        return { score: 0, indices: [] };
    if (n > m)
        return null;
    const NEG = Number.NEGATIVE_INFINITY;
    // 单字符落位分：基础 1 + 行首 8 / 分隔符后 6 / 驼峰边界 5 + 连续 4
    const charScore = (j, consec) => {
        let s = 1;
        if (j === 0)
            s += 8;
        else {
            const pc = tl[j - 1];
            if (SEPARATOR.test(pc))
                s += 6;
            else if (/[a-z0-9]/.test(pc) && /[A-Z]/.test(t[j]))
                s += 5;
        }
        if (consec)
            s += 4;
        return s;
    };
    // dp[i][j]：q[0..i] 对齐且 q[i] 恰好落在 t[j] 的最优分；prev 回溯路径
    const dp = Array.from({ length: n }, () => Array.from({ length: m }, () => NEG));
    const prev = Array.from({ length: n }, () => Array.from({ length: m }, () => -1));
    for (let j = 0; j < m; j++) {
        if (tl[j] === q[0])
            dp[0][j] = charScore(j, false) - Math.floor(j / 3); // 起始越靠后轻罚
    }
    for (let i = 1; i < n; i++) {
        for (let j = i; j < m; j++) {
            if (tl[j] !== q[i])
                continue;
            let best = NEG;
            let bestK = -1;
            for (let k = 0; k < j; k++) {
                if (dp[i - 1][k] === NEG)
                    continue;
                const gap = j - k - 1;
                const cand = dp[i - 1][k] + charScore(j, gap === 0) - gap; // 每跳一个字符罚 1
                if (cand > best) {
                    best = cand;
                    bestK = k;
                }
            }
            dp[i][j] = best;
            prev[i][j] = bestK;
        }
    }
    let bestScore = NEG;
    let bestJ = -1;
    for (let j = n - 1; j < m; j++) {
        if (dp[n - 1][j] > bestScore) {
            bestScore = dp[n - 1][j];
            bestJ = j;
        }
    }
    if (bestJ === -1 || bestScore === NEG)
        return null;
    const indices = [];
    for (let i = n - 1, j = bestJ; i >= 0 && j >= 0; i--) {
        indices.unshift(j);
        j = prev[i][j];
    }
    // 连续子串命中额外奖励（明显强于分散子序列）
    if (tl.join('').includes(q.join('')))
        bestScore += 10;
    return { score: bestScore, indices };
}
/** 对候选集打分排序（score 降序、同分按原序）；query 空则原样返回。附带每条的命中下标。 */
function rankItems(query, items, textOf) {
    if (!query.trim())
        return items.map((item) => ({ item, score: 0, indices: [] }));
    const out = [];
    for (const item of items) {
        const r = fuzzyMatch(query, textOf(item));
        if (r)
            out.push({ item, score: r.score, indices: r.indices });
    }
    out.sort((a, b) => b.score - a.score);
    return out;
}

"use strict";
// Cron 解析原语：把 5 段（分 时 日 月 周）cron 表达式解析为允许值集合，并据此求「未来 N 次触发时刻」+ 中文描述。
// 纯函数、无渲染关切，便于探针验证。支持 * 、a、a-b、a-b/n、*/n、逗号列表，月/周支持 3 字母名（JAN/SUN…）。
// 周字段 0 或 7 = 周日（归一到 0..6）。日/周「同时受限」时按 OR（cron 惯例），否则按 AND。
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCron = parseCron;
exports.nextRun = nextRun;
exports.nextRuns = nextRuns;
exports.describeCron = describeCron;
exports.isValidCron = isValidCron;
const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DOW_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MACROS = {
    '@yearly': '0 0 1 1 *',
    '@annually': '0 0 1 1 *',
    '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * 0',
    '@daily': '0 0 * * *',
    '@midnight': '0 0 * * *',
    '@hourly': '0 * * * *',
};
function nameToNum(tok, names, base) {
    const up = tok.toUpperCase();
    const i = names.indexOf(up);
    return i >= 0 ? String(i + base) : tok;
}
/** 解析单个字段为升序去重的允许值数组。非法抛 Error（带字段名）。 */
function parseField(field, min, max, names, base = 0) {
    const set = new Set();
    const tokens = field.split(',');
    for (const raw of tokens) {
        const tok = raw.trim();
        if (tok === '')
            throw new Error(`空字段片段 "${raw}"`);
        let step = 1;
        let range = tok;
        const slash = tok.split('/');
        if (slash.length === 2) {
            range = slash[0];
            step = parseInt(slash[1], 10);
            if (!Number.isFinite(step) || step <= 0)
                throw new Error(`非法步长 /${slash[1]}`);
        }
        else if (slash.length > 2) {
            throw new Error(`非法片段 "${tok}"`);
        }
        let lo;
        let hi;
        let star = false;
        if (range === '*') {
            lo = min;
            hi = max;
            star = true;
        }
        else if (range.includes('-')) {
            const [a, b] = range.split('-');
            lo = parseInt(names ? nameToNum(a, names, base) : a, 10);
            hi = parseInt(names ? nameToNum(b, names, base) : b, 10);
            if (!Number.isFinite(lo) || !Number.isFinite(hi))
                throw new Error(`非法范围 "${range}"`);
        }
        else {
            const v = parseInt(names ? nameToNum(range, names, base) : range, 10);
            if (!Number.isFinite(v))
                throw new Error(`非法值 "${range}"`);
            // 单值 + 步长：从该值步进到 max（cron 语义 a/n）
            lo = v;
            hi = slash.length === 2 ? max : v;
        }
        // 周字段：7 → 0（周日）
        const norm = (x) => (names === DOW_NAMES && x === 7 ? 0 : x);
        lo = norm(lo);
        hi = norm(hi);
        if (lo < min || hi > max || lo > hi) {
            // 允许 dow 环绕？标准 cron 不支持跨周环绕范围，视为非法
            throw new Error(`值越界 [${lo},${hi}]∉[${min},${max}]`);
        }
        if (star && step === 1) {
            for (let v = lo; v <= hi; v++)
                set.add(v);
        }
        else {
            for (let v = lo; v <= hi; v += step)
                set.add(v);
        }
    }
    return Array.from(set).sort((a, b) => a - b);
}
function isStarField(field) {
    return field.trim() === '*';
}
/** 解析整条表达式（先做宏替换）。非法抛 Error。 */
function parseCron(expr) {
    let e = (expr ?? '').trim();
    if (e === '')
        throw new Error('表达式为空');
    if (e.startsWith('@')) {
        const m = MACROS[e.toLowerCase()];
        if (!m)
            throw new Error(`未知宏 ${e}`);
        e = m;
    }
    const parts = e.split(/\s+/);
    if (parts.length !== 5)
        throw new Error(`需要 5 段字段，实为 ${parts.length}`);
    const [mi, ho, dom, mo, dow] = parts;
    return {
        minute: parseField(mi, 0, 59),
        hour: parseField(ho, 0, 23),
        dom: parseField(dom, 1, 31),
        month: parseField(mo, 1, 12, MONTH_NAMES, 1),
        dow: parseField(dow, 0, 6, DOW_NAMES, 0),
        domStar: isStarField(dom),
        dowStar: isStarField(dow),
    };
}
function dayMatches(f, date) {
    const domOk = f.dom.includes(date.getDate());
    const dowOk = f.dow.includes(date.getDay());
    if (!f.domStar && !f.dowStar)
        return domOk || dowOk; // 双受限 → OR
    return domOk && dowOk; // 否则 AND（* 侧恒真）
}
/** 从 from（不含）起求下一个触发时刻；找不到（超 guard 天）返回 null。 */
function nextRun(f, from, guardDays = 366 * 5) {
    const d = new Date(from.getTime());
    d.setSeconds(0, 0);
    d.setMinutes(d.getMinutes() + 1); // 严格晚于 from
    const monthSet = new Set(f.month);
    const hourSet = new Set(f.hour);
    const minuteSet = new Set(f.minute);
    const limit = from.getTime() + guardDays * 86400000;
    while (d.getTime() < limit) {
        if (!monthSet.has(d.getMonth() + 1)) {
            // 跳到下月 1 日 00:00
            d.setMonth(d.getMonth() + 1, 1);
            d.setHours(0, 0, 0, 0);
            continue;
        }
        if (!dayMatches(f, d)) {
            d.setDate(d.getDate() + 1);
            d.setHours(0, 0, 0, 0);
            continue;
        }
        if (!hourSet.has(d.getHours())) {
            d.setHours(d.getHours() + 1, 0, 0, 0);
            continue;
        }
        if (!minuteSet.has(d.getMinutes())) {
            d.setMinutes(d.getMinutes() + 1, 0, 0);
            continue;
        }
        return new Date(d.getTime());
    }
    return null;
}
/** 未来 count 次触发时刻（最多 200，护栏）。 */
function nextRuns(expr, from, count = 5) {
    const f = parseCron(expr);
    const out = [];
    let cur = from;
    const n = Math.max(1, Math.min(200, count));
    for (let i = 0; i < n; i++) {
        const nx = nextRun(f, cur);
        if (!nx)
            break;
        out.push(nx);
        cur = nx;
    }
    return out;
}
/** 中文可读描述（尽力而为，覆盖常见模式）。 */
function describeCron(expr) {
    const f = parseCron(expr);
    const dowCn = ['日', '一', '二', '三', '四', '五', '六'];
    const pad2 = (n) => String(n).padStart(2, '0');
    // 日粒度
    let dayPart;
    if (!f.domStar && !f.dowStar)
        dayPart = `每月 ${f.dom.join('、')} 号 或 每周${f.dow.map((d) => dowCn[d]).join('、')}`;
    else if (!f.domStar)
        dayPart = `每月 ${f.dom.join('、')} 号`;
    else if (!f.dowStar)
        dayPart = `每周${f.dow.map((d) => dowCn[d]).join('、')}`;
    else
        dayPart = '每天';
    const monthPart = f.month.length < 12 ? f.month.map((m) => `${m} 月`).join('、') : '';
    // 时刻
    const hourStr = f.hour.length === 24 ? '每小时' : f.hour.map((h) => `${h} 时`).join('、');
    const minStr = f.minute.map((m) => pad2(m)).join('、');
    let timePart;
    if (f.minute.length === 60 && f.hour.length === 24)
        timePart = '每分钟';
    else if (f.minute.length === 60)
        timePart = `${hourStr}内 每分钟`;
    else if (f.hour.length === 24)
        timePart = `每小时第 ${minStr} 分`;
    else if (f.hour.length === 1 && f.minute.length === 1)
        timePart = `${pad2(f.hour[0])}:${pad2(f.minute[0])}`;
    else
        timePart = `${hourStr}的 ${minStr} 分`;
    return `${monthPart}${monthPart ? '的 ' : ''}${dayPart} ${timePart}`;
}
function isValidCron(expr) {
    try {
        parseCron(expr);
        return true;
    }
    catch {
        return false;
    }
}

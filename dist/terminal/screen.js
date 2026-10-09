"use strict";
// 最小 VT 网格屏引擎（纯逻辑，无渲染依赖）：供 LiveTerminal(node-pty) 与 SshTerminal(ssh2) 共用。
//
// 为什么是「网格屏」而非「行缓冲」：交互式 shell（PSReadLine / bash / 远端 login shell）常用绝对光标
// 定位(ESC[r;cH)+ 覆盖重写整行 + 补空格来重绘/擦除/取历史。行缓冲剥掉定位序列就会光标错位、backspace
// 失效。网格屏维护 cols×rows 的 cell 缓冲 + 光标，忠实执行这些序列，故打字/退格/历史/长输出滚动都正确。
//
// 支持的最小 CSI 子集：CUU/CUD/CUF/CUB、CUP/HVP、CHA、VPA、ED、EL、插删行(L/M)、删改字符(P/X/@)、
// save/restore cursor(s/u)、SGR(m：前景/背景色、粗体、下划线，含 16/256/truecolor)、私有模式(忽略)、
// OSC(忽略)，外加 \r\n\b\t\f 与自动换行、超出屏高时滚动入 scrollback。
// 宽字符（CJK）占 2 列，续格写 ch='\u0000' 标记，序列化出口统一剔除。
Object.defineProperty(exports, "__esModule", { value: true });
exports.Screen = void 0;
exports.isWide = isWide;
exports.rowText = rowText;
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
/** 是否 CJK/宽字符（等宽字体缺字，需回退 sans；且占 2 列显示宽度） */
function isWide(ch) {
    const c = ch.codePointAt(0) || 0;
    return ((c >= 0x2e80 && c <= 0xa4cf) ||
        (c >= 0xac00 && c <= 0xd7a3) ||
        (c >= 0xf900 && c <= 0xfaff) ||
        (c >= 0xfe30 && c <= 0xfe4f) ||
        (c >= 0xff00 && c <= 0xff65) ||
        (c >= 0x2000 && c <= 0x206f));
}
// —— 调色板：VS Code 深色终端默认 16 色（目录亮蓝、可执行亮绿，贴近常见 ssh/ls 观感）——
const BASE16 = [
    '#000000', '#cd3131', '#0dbc79', '#e5e510', '#2472c8', '#bc3fbc', '#11a8cd', '#e5e5e5',
    '#666666', '#f14c4c', '#23d18b', '#f5f543', '#3b8eea', '#d670d6', '#29b8db', '#ffffff',
];
const hex2 = (n) => clamp(n, 0, 255).toString(16).padStart(2, '0');
const rgb = (r, g, b) => '#' + hex2(r) + hex2(g) + hex2(b);
/** 256 色索引 → CSS 颜色（0-15 基础，16-235 6×6×6 立方，236-255 灰阶） */
function ansi256(n) {
    if (n < 16)
        return BASE16[n];
    if (n >= 232) {
        const g = 8 + (n - 232) * 10;
        return rgb(g, g, g);
    }
    const i = n - 16;
    const conv = (x) => (x === 0 ? 0 : 55 + x * 40);
    return rgb(conv(Math.floor(i / 36) % 6), conv(Math.floor(i / 6) % 6), conv(i % 6));
}
/** 基础 8 色（30-37/40-47）：粗体时提升到亮色组（贴合多数终端 ls 的 1;34 亮蓝目录） */
function baseColor(idx, bold) {
    return BASE16[idx + (bold ? 8 : 0)];
}
/**
 * 最小 VT 网格屏：cols×rows 的 Cell 缓冲 + 光标 (cx,cy) + 落笔样式 pen，解释字节流并忠实落位。
 * 超出屏高的行滚入 scrollback（可回看）。
 */
class Screen {
    constructor(cols, rows) {
        this.cx = 0;
        this.cy = 0;
        this.scrollback = [];
        this.maxScrollback = 400;
        this.savedCx = 0;
        this.savedCy = 0;
        // 当前落笔样式（SGR 状态）
        this.pen = {
            fg: null,
            bg: null,
            bold: false,
            ul: false,
        };
        this.cols = Math.max(1, cols);
        this.rows = Math.max(1, rows);
        this.grid = [];
        for (let r = 0; r < this.rows; r++)
            this.grid.push([]);
    }
    feed(chunk) {
        let i = 0;
        while (i < chunk.length) {
            const code = chunk.charCodeAt(i);
            if (code === 0x1b) {
                i = this.parseEscape(chunk, i);
                continue;
            }
            if (code === 0x0a) {
                this.lineFeed();
            }
            else if (code === 0x0d) {
                this.cx = 0;
            }
            else if (code === 0x08) {
                if (this.cx > 0)
                    this.cx--;
            }
            else if (code === 0x09) {
                this.cx = Math.min(this.cols - 1, (Math.floor(this.cx / 8) + 1) * 8);
            }
            else if (code === 0x0c) {
                this.lineFeed();
            }
            else if (code < 0x20 || code === 0x7f) {
                // 其它控制字符 / DEL：忽略
            }
            else {
                this.putc(chunk[i]);
            }
            i++;
        }
    }
    /** 写一个可打印字符到光标处并前移；宽字符占 2 列，触边自动换行 */
    putc(ch) {
        const w = isWide(ch) ? 2 : 1;
        if (this.cx + w > this.cols) {
            this.cx = 0;
            this.lineFeed();
        }
        const row = this.grid[this.cy];
        while (row.length < this.cx)
            row.push(this.blank());
        row[this.cx] = { ch, fg: this.pen.fg, bg: this.pen.bg, bold: this.pen.bold, ul: this.pen.ul };
        if (w === 2)
            row[this.cx + 1] = { ch: '\u0000', fg: this.pen.fg, bg: this.pen.bg, bold: this.pen.bold, ul: this.pen.ul }; // 续格标记
        this.cx += w;
    }
    blank() {
        return { ch: ' ', fg: null, bg: null, bold: false, ul: false };
    }
    lineFeed() {
        if (this.cy >= this.rows - 1)
            this.scrollUp();
        else
            this.cy++;
    }
    scrollUp() {
        const popped = this.grid.shift();
        this.scrollback.push(popped);
        if (this.scrollback.length > this.maxScrollback)
            this.scrollback.shift();
        this.grid.push([]);
    }
    /** 从 ESC 起解析一条转义序列，返回序列结束后的下标（下一个待处理字符） */
    parseEscape(s, i) {
        const next = s[i + 1];
        if (next === '[')
            return this.parseCSI(s, i + 2);
        if (next === ']') {
            // OSC：吃到 BEL 或 ST(ESC \)
            let j = i + 2;
            while (j < s.length) {
                if (s.charCodeAt(j) === 0x07)
                    return j + 1;
                if (s[j] === '\x1b' && s[j + 1] === '\\')
                    return j + 2;
                j++;
            }
            return j;
        }
        if (next === '(' || next === ')' || next === '#' || next === '%')
            return i + 3; // 字符集选择：ESC ( X
        return i + 2; // ESC + 单字符（= > 7 8 等）
    }
    /** 解析 CSI：从参数起始下标 p 吃到 final 字节(@-~)，派发后返回其后下标 */
    parseCSI(s, p) {
        let j = p;
        let priv = '';
        if (s[j] === '?' || s[j] === '>' || s[j] === '=' || s[j] === '!') {
            priv = s[j];
            j++;
        }
        const numStr = [];
        let cur = '';
        while (j < s.length) {
            const c = s.charCodeAt(j);
            if (c >= 0x30 && c <= 0x39) {
                cur += s[j];
                j++;
            }
            else if (c === 0x3b) {
                numStr.push(cur);
                cur = '';
                j++;
            }
            else if (c >= 0x20 && c <= 0x2f) {
                // 中间字节（如 < = 等），跳过
                j++;
            }
            else
                break;
        }
        numStr.push(cur);
        const final = s[j];
        const idx = j + 1; // final 之后
        const n = (k, d = 1) => {
            const v = parseInt(numStr[k] ?? '', 10);
            return Number.isNaN(v) ? d : v;
        };
        if (priv)
            return idx; // 私有模式(含 ?25 光标显隐 / ?1004 焦点上报)：已消费，忽略
        switch (final) {
            case 'A':
                this.cy = clamp(this.cy - n(0), 0, this.rows - 1);
                break;
            case 'B':
                this.cy = clamp(this.cy + n(0), 0, this.rows - 1);
                break;
            case 'C':
                this.cx = clamp(this.cx + n(0), 0, this.cols - 1);
                break;
            case 'D':
                this.cx = clamp(this.cx - n(0), 0, this.cols - 1);
                break;
            case 'E':
                this.cy = clamp(this.cy + n(0), 0, this.rows - 1);
                this.cx = 0;
                break;
            case 'F':
                this.cy = clamp(this.cy - n(0), 0, this.rows - 1);
                this.cx = 0;
                break;
            case 'G':
            case '`':
                this.cx = clamp(n(0) - 1, 0, this.cols - 1);
                break;
            case 'd':
                this.cy = clamp(n(0) - 1, 0, this.rows - 1);
                break;
            case 'H':
            case 'f':
                this.cy = clamp(n(0) - 1, 0, this.rows - 1);
                this.cx = clamp(n(1) - 1, 0, this.cols - 1);
                break;
            case 'J':
                this.eraseDisplay(n(0, 0));
                break;
            case 'K':
                this.eraseLine(n(0, 0));
                break;
            case 'L': {
                const cnt = n(0);
                for (let k = 0; k < cnt; k++) {
                    this.grid.splice(this.cy, 0, []);
                    this.grid.pop();
                }
                break;
            }
            case 'M': {
                const cnt = n(0);
                for (let k = 0; k < cnt; k++) {
                    this.grid.splice(this.cy, 1);
                    this.grid.push([]);
                }
                break;
            }
            case 'P': {
                const row = this.grid[this.cy];
                row.splice(this.cx, n(0));
                break;
            }
            case 'X': {
                const row = this.grid[this.cy];
                for (let k = this.cx; k < Math.min(this.cols, this.cx + n(0)); k++)
                    row[k] = this.blank();
                break;
            }
            case '@': {
                const row = this.grid[this.cy];
                for (let k = 0; k < n(0); k++)
                    row.splice(this.cx, 0, this.blank());
                break;
            }
            case 's':
                this.savedCx = this.cx;
                this.savedCy = this.cy;
                break;
            case 'u':
                this.cx = this.savedCx;
                this.cy = this.savedCy;
                break;
            case 'm':
                this.applySGR(numStr);
                break;
            default:
                break; // c/h/l/n/r/S/T 等：忽略
        }
        return idx;
    }
    /** 应用一条 SGR（CSI ... m）：更新落笔样式 pen。支持 0/1/4/22/24、30-37/90-97、40-47/100-107、38/48;5;n、38/48;2;r;g;b、39/49 */
    applySGR(params) {
        const p = params.map((x) => (x === '' ? 0 : parseInt(x, 10) || 0));
        if (p.length === 0)
            p.push(0);
        let k = 0;
        while (k < p.length) {
            const c = p[k];
            if (c === 0) {
                this.pen = { fg: null, bg: null, bold: false, ul: false };
            }
            else if (c === 1) {
                this.pen.bold = true;
            }
            else if (c === 4) {
                this.pen.ul = true;
            }
            else if (c === 22) {
                this.pen.bold = false;
            }
            else if (c === 24) {
                this.pen.ul = false;
            }
            else if (c === 39) {
                this.pen.fg = null;
            }
            else if (c === 49) {
                this.pen.bg = null;
            }
            else if (c >= 30 && c <= 37) {
                this.pen.fg = baseColor(c - 30, this.pen.bold);
            }
            else if (c >= 90 && c <= 97) {
                this.pen.fg = BASE16[c - 90 + 8];
            }
            else if (c >= 40 && c <= 47) {
                this.pen.bg = baseColor(c - 40, false);
            }
            else if (c >= 100 && c <= 107) {
                this.pen.bg = BASE16[c - 100 + 8];
            }
            else if (c === 38 || c === 48) {
                const isFg = c === 38;
                if (p[k + 1] === 5) {
                    const col = ansi256(p[k + 2] ?? 0);
                    if (isFg)
                        this.pen.fg = col;
                    else
                        this.pen.bg = col;
                    k += 2;
                }
                else if (p[k + 1] === 2) {
                    const col = rgb(p[k + 2] ?? 0, p[k + 3] ?? 0, p[k + 4] ?? 0);
                    if (isFg)
                        this.pen.fg = col;
                    else
                        this.pen.bg = col;
                    k += 4;
                }
            }
            k++;
        }
    }
    eraseLine(mode) {
        const row = this.grid[this.cy];
        if (mode === 0)
            for (let k = this.cx; k < row.length; k++)
                row[k] = this.blank();
        else if (mode === 1)
            for (let k = 0; k <= Math.min(this.cx, row.length - 1); k++)
                row[k] = this.blank();
        else
            this.grid[this.cy] = [];
    }
    eraseDisplay(mode) {
        if (mode === 0) {
            this.eraseLine(0);
            for (let r = this.cy + 1; r < this.rows; r++)
                this.grid[r] = [];
        }
        else if (mode === 1) {
            this.eraseLine(1);
            for (let r = 0; r < this.cy; r++)
                this.grid[r] = [];
        }
        else if (mode === 2 || mode === 3) {
            for (let r = 0; r < this.rows; r++)
                this.grid[r] = [];
        }
    }
    /** 当前屏各行（Cell[]，去尾空白单元） */
    screenLines() {
        return this.grid.map(trimRow);
    }
    /** scrollback + 当前屏，供渲染；返回总行数与光标在其中的行号/码点列 */
    view() {
        const lines = [...this.scrollback.map(trimRow), ...this.screenLines()];
        // cursorCol 必须是码点列：cell 列里 CJK 占 2（含续格 \u0000），渲染行已剥续格，两坐标系需换算
        const rawRow = this.grid[this.cy] || [];
        let col = 0;
        for (let c = 0; c < this.cx && c < rawRow.length; c++)
            if (rawRow[c].ch !== '\u0000')
                col++;
        return { lines, cursorRow: this.scrollback.length + this.cy, cursorCol: col };
    }
}
exports.Screen = Screen;
/** 去掉行尾「无样式的空格」单元（含续格不参与，渲染时另行剔除 \u0000） */
function trimRow(row) {
    let end = row.length;
    while (end > 0 && row[end - 1].ch === ' ' && !row[end - 1].fg && !row[end - 1].bg && !row[end - 1].bold)
        end--;
    return row.slice(0, end);
}
/** Cell 行 → 纯文本（剔除续格标记），供需要字符串的场合（测试/标题等） */
function rowText(row) {
    return row
        .map((c) => c.ch)
        .join('')
        .replace(/\u0000/g, '')
        .replace(/\s+$/, '');
}
exports.default = Screen;

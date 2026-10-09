"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Markdown = Markdown;
// MARKDOWN：轻量 Markdown 渲染器。零第三方依赖，解析常见 MD 语法并映射到本栈组件渲染。
// 支持：标题(h1-h6) / 粗体 / 斜体 / 行内代码 / 链接 / 无序列表 / 有序列表 / 代码块(fenced) / 引用块 / 分割线 / 表格(GFM) / 段落。
// 面向文档展示、README 预览、AI 对话消息渲染。颜色全走 token，明暗自适应。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const screen_1 = require("../terminal/screen");
const code_block_1 = require("../code-block");
/** 拆 run：Flux Mono 不含 CJK，宽字符段回退 Flux Sans，避免豆腐块（与 CodeBlock 同策略）。 */
function splitWideRuns(s) {
    const runs = [];
    for (const ch of s) {
        const wide = (0, screen_1.isWide)(ch);
        const last = runs[runs.length - 1];
        if (last && last.wide === wide)
            last.t += ch;
        else
            runs.push({ t: ch, wide });
    }
    return runs;
}
/** 把一段文本按「CJK 单字 / 拉丁词（含尾随空格）」切成可独立换行的单元。
 *  用于行内混排（粗体标签 + 后接长文本）：长文本若作为单个原子 Text，未折行宽度 > 容器宽时，
 *  flexWrap 会把整段挤到下一行、致前面的短标签孤行。切成小单元后首单元能与标签同处一行、自然折行。 */
function splitWrapUnits(s) {
    const units = [];
    let pendingSpace = false;
    let word = '';
    const flushWord = () => {
        if (word) {
            units.push((pendingSpace ? ' ' : '') + word);
            word = '';
            pendingSpace = false;
        }
    };
    for (const ch of s) {
        if (ch === ' ') {
            flushWord();
            pendingSpace = true;
        }
        else if ((0, screen_1.isWide)(ch)) {
            flushWord();
            // 空格作为本单元首字符（首部不被行末裁剪），保留与前一单元的空格
            units.push((pendingSpace ? ' ' : '') + ch);
            pendingSpace = false;
        }
        else {
            word += ch;
        }
    }
    flushWord();
    return units;
}
function parseInline(src) {
    const tokens = [];
    let i = 0;
    let buf = '';
    while (i < src.length) {
        // **bold**
        if (src[i] === '*' && src[i + 1] === '*') {
            const end = src.indexOf('**', i + 2);
            if (end > 0) {
                if (buf) {
                    tokens.push({ type: 'text', value: buf });
                    buf = '';
                }
                tokens.push({ type: 'bold', value: src.slice(i + 2, end) });
                i = end + 2;
                continue;
            }
        }
        // *italic*
        if (src[i] === '*' && src[i + 1] !== '*') {
            const end = src.indexOf('*', i + 1);
            if (end > 0) {
                if (buf) {
                    tokens.push({ type: 'text', value: buf });
                    buf = '';
                }
                tokens.push({ type: 'italic', value: src.slice(i + 1, end) });
                i = end + 1;
                continue;
            }
        }
        // `code`
        if (src[i] === '`') {
            const end = src.indexOf('`', i + 1);
            if (end > 0) {
                if (buf) {
                    tokens.push({ type: 'text', value: buf });
                    buf = '';
                }
                tokens.push({ type: 'code', value: src.slice(i + 1, end) });
                i = end + 1;
                continue;
            }
        }
        // [text](href)
        if (src[i] === '[') {
            const closeBracket = src.indexOf(']', i + 1);
            if (closeBracket > 0 && src[closeBracket + 1] === '(') {
                const closeParen = src.indexOf(')', closeBracket + 2);
                if (closeParen > 0) {
                    if (buf) {
                        tokens.push({ type: 'text', value: buf });
                        buf = '';
                    }
                    tokens.push({ type: 'link', text: src.slice(i + 1, closeBracket), href: src.slice(closeBracket + 2, closeParen) });
                    i = closeParen + 1;
                    continue;
                }
            }
        }
        buf += src[i];
        i++;
    }
    if (buf)
        tokens.push({ type: 'text', value: buf });
    return tokens;
}
/** GFM 表格分隔行：|---|:--:|--:| */
const isTableSep = (l) => /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/.test(l);
/** 拆表格行：去首尾管道后按 | 切格 */
function splitRow(l) {
    let s = l.trim();
    if (s.startsWith('|'))
        s = s.slice(1);
    if (s.endsWith('|'))
        s = s.slice(0, -1);
    return s.split('|').map((c) => c.trim());
}
function parseBlocks(md) {
    const lines = md.replace(/\r\n?/g, '\n').split('\n');
    const blocks = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        // fenced code block
        if (line.startsWith('```')) {
            const lang = line.slice(3).trim() || '';
            const codeLines = [];
            i++;
            while (i < lines.length && !lines[i].startsWith('```')) {
                codeLines.push(lines[i]);
                i++;
            }
            i++; // skip closing ```
            blocks.push({ type: 'code', lang, code: codeLines.join('\n') });
            continue;
        }
        // heading
        const hm = /^(#{1,6})\s+(.+)/.exec(line);
        if (hm) {
            blocks.push({ type: 'heading', level: hm[1].length, text: hm[2] });
            i++;
            continue;
        }
        // hr
        if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
            blocks.push({ type: 'hr' });
            i++;
            continue;
        }
        // blockquote
        if (line.startsWith('>')) {
            const qlines = [];
            while (i < lines.length && lines[i].startsWith('>')) {
                qlines.push(lines[i].slice(1).trimStart());
                i++;
            }
            blocks.push({ type: 'blockquote', text: qlines.join('\n') });
            continue;
        }
        // unordered list
        if (/^\s*[-*+]\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*[-*+]\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*[-*+]\s/, ''));
                i++;
            }
            blocks.push({ type: 'ul', items });
            continue;
        }
        // ordered list
        if (/^\s*\d+\.\s/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*\d+\.\s/.test(lines[i])) {
                items.push(lines[i].replace(/^\s*\d+\.\s/, ''));
                i++;
            }
            blocks.push({ type: 'ol', items });
            continue;
        }
        // table（GFM 管道语法：表头行 + |---| 分隔行 + 数据行）
        if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
            const header = splitRow(line);
            const align = splitRow(lines[i + 1]).map((c) => c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : 'left');
            i += 2;
            const rows = [];
            while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
                rows.push(splitRow(lines[i]));
                i++;
            }
            blocks.push({ type: 'table', header, align, rows });
            continue;
        }
        // empty line
        if (line.trim() === '') {
            i++;
            continue;
        }
        // paragraph (collect until empty or new block)
        const plines = [];
        while (i < lines.length && lines[i].trim() !== '' && !lines[i].startsWith('#') && !lines[i].startsWith('```') && !lines[i].startsWith('>') && !/^\s*[-*+]\s/.test(lines[i]) && !/^\s*\d+\.\s/.test(lines[i]) && !/^(-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i].trim())) {
            plines.push(lines[i]);
            i++;
        }
        if (plines.length)
            blocks.push({ type: 'paragraph', text: plines.join(' ') });
        else
            i++; // safety
    }
    return blocks;
}
// --- 渲染 ---
function Markdown(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const { content, defaultCodeLang = 'js', style } = props;
    const blocks = react_1.default.useMemo(() => parseBlocks(content), [content]);
    const renderInline = (text, baseStyle) => {
        const fs = baseStyle?.fontSize ?? token.fontSize;
        const lh = Math.round(fs * 1.6);
        // 行内代码 chip：比正文 lh 更紧 + 小竖内边距 → 收成紧凑胶囊，配合容器 alignItems:'center' 居中于文字行
        const codeLh = Math.round((fs - 1) * 1.3);
        const inls = parseInline(text);
        return inls.map((t, i) => {
            switch (t.type) {
                case 'bold':
                    return react_1.default.createElement(react_native_flux_desktop_1.Text, { key: i, style: { ...baseStyle, fontSize: fs, lineHeight: lh, fontWeight: '700', color: token.colorText } }, t.value);
                case 'italic':
                    return react_1.default.createElement(react_native_flux_desktop_1.Text, { key: i, style: { ...baseStyle, fontSize: fs, lineHeight: lh, fontStyle: 'italic', color: token.colorText } }, t.value);
                case 'code': {
                    // 行内代码可能含 CJK：逐 run 选字体，首尾 run 才加左右内边距，避免多段拼接处空隙
                    const runs = splitWideRuns(t.value);
                    return runs.map((r, m) => (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: `${i}-${m}`, style: {
                            fontSize: fs - 1,
                            lineHeight: codeLh,
                            paddingVertical: 1,
                            fontFamily: r.wide ? react_native_flux_desktop_3.SANS_FAMILY : react_native_flux_desktop_3.MONO_FAMILY,
                            backgroundColor: token.colorFillSecondary,
                            borderRadius: 3,
                            paddingLeft: m === 0 ? 3 : 0,
                            paddingRight: m === runs.length - 1 ? 3 : 0,
                            color: token.colorError,
                        } }, r.t)));
                }
                case 'link':
                    return react_1.default.createElement(react_native_flux_desktop_1.Text, { key: i, style: { ...baseStyle, fontSize: fs, lineHeight: lh, color: token.colorPrimary, textDecorationLine: 'underline' } }, t.text);
                default: {
                    // 单一 token（整段纯文本）：一个 Text 内部已能自适应折行，无需拆分（省节点）。
                    // 多 token 混排：把普通文本切成可换行小单元，避免长文本原子块把前面的短标签挤成孤行。
                    if (inls.length <= 1) {
                        return react_1.default.createElement(react_native_flux_desktop_1.Text, { key: i, style: { ...baseStyle, fontSize: fs, lineHeight: lh, color: token.colorText } }, t.value);
                    }
                    return splitWrapUnits(t.value).map((u, m) => (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: `${i}-${m}`, style: { ...baseStyle, fontSize: fs, lineHeight: lh, color: token.colorText } }, u)));
                }
            }
        });
    };
    const headingSize = (level) => {
        const sizes = [token.fontSizeXL + 6, token.fontSizeXL + 2, token.fontSizeLG + 2, token.fontSizeLG, token.fontSize, token.fontSizeSM];
        return sizes[Math.min(level - 1, 5)];
    };
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [{ gap: token.marginXS }, style] }, blocks.map((blk, idx) => {
        switch (blk.type) {
            case 'heading':
                return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: idx, style: { marginTop: blk.level <= 2 ? token.margin : token.marginXS, marginBottom: token.marginXXS, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end' } }, renderInline(blk.text, { fontSize: headingSize(blk.level), fontWeight: (blk.level <= 3 ? '700' : '600'), color: token.colorText })));
            case 'paragraph':
                return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: idx, style: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' } }, renderInline(blk.text)));
            case 'code':
                return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: idx, style: { marginVertical: token.marginXS } },
                    react_1.default.createElement(code_block_1.CodeBlock, { code: blk.code, language: blk.lang || defaultCodeLang, showLineNumbers: false, fontSize: 12 })));
            case 'blockquote':
                return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: idx, style: { borderLeftWidth: 3, borderLeftColor: token.colorPrimary, paddingLeft: token.padding, marginVertical: token.marginXS, backgroundColor: token.colorFillQuaternary, borderRadius: token.borderRadius } },
                    react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' } }, renderInline(blk.text, { fontStyle: 'italic', color: token.colorTextSecondary }))));
            case 'ul':
                return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: idx, style: { gap: token.marginXXS, paddingVertical: token.marginXXS } }, blk.items.map((item, j) => (react_1.default.createElement(react_native_flux_desktop_1.View, { key: j, style: { flexDirection: 'row', alignItems: 'flex-start' } },
                    react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSize, lineHeight: Math.round(token.fontSize * 1.6), color: token.colorPrimary, width: 16 } }, "\u2022"),
                    react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' } }, renderInline(item)))))));
            case 'ol':
                return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: idx, style: { gap: token.marginXXS, paddingVertical: token.marginXXS } }, blk.items.map((item, j) => (react_1.default.createElement(react_native_flux_desktop_1.View, { key: j, style: { flexDirection: 'row', alignItems: 'flex-start' } },
                    react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSize, lineHeight: Math.round(token.fontSize * 1.6), color: token.colorPrimary, width: 20 } },
                        j + 1,
                        "."),
                    react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' } }, renderInline(item)))))));
            case 'table':
                return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: idx, style: {
                        marginVertical: token.marginXS,
                        borderWidth: token.lineWidth,
                        borderColor: token.colorBorderSecondary,
                        borderRadius: token.borderRadiusLG,
                        overflow: 'hidden',
                    } },
                    react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', backgroundColor: token.colorFillTertiary, paddingVertical: token.paddingXXS + 2, paddingHorizontal: token.paddingXS, borderBottomWidth: token.lineWidth, borderBottomColor: token.colorBorderSecondary } }, blk.header.map((cell, j) => (react_1.default.createElement(react_native_flux_desktop_1.View, { key: j, style: { flex: 1, alignItems: blk.align[j] === 'center' ? 'center' : blk.align[j] === 'right' ? 'flex-end' : 'flex-start', paddingVertical: token.paddingXXS } },
                        react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSize, fontWeight: '600', color: token.colorText } }, cell))))),
                    blk.rows.map((row, r) => (react_1.default.createElement(react_native_flux_desktop_1.View, { key: r, style: { flexDirection: 'row', paddingVertical: token.paddingXXS, paddingHorizontal: token.paddingXS, borderBottomWidth: r < blk.rows.length - 1 ? token.lineWidth : 0, borderBottomColor: token.colorSplit } }, row.map((cell, j) => (react_1.default.createElement(react_native_flux_desktop_1.View, { key: j, style: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: blk.align[j] === 'center' ? 'center' : blk.align[j] === 'right' ? 'flex-end' : 'flex-start', justifyContent: blk.align[j] === 'center' ? 'center' : blk.align[j] === 'right' ? 'flex-end' : 'flex-start', paddingVertical: token.paddingXXS } }, renderInline(cell)))))))));
            case 'hr':
                return react_1.default.createElement(react_native_flux_desktop_1.View, { key: idx, style: { height: token.lineWidth, backgroundColor: token.colorBorderSecondary, marginVertical: token.margin } });
            default:
                return null;
        }
    })));
}
exports.default = Markdown;

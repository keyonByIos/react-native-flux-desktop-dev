"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEY_SEQ = exports.T_PROMPT = exports.T_TEXT = exports.T_BORDER = exports.T_TITLEBAR = exports.T_BG = void 0;
exports.TerminalView = TerminalView;
// 终端呈现层 + 输入接线（共享）：给定一个 Screen 实例与 write 回调，渲染成终端窗口并接管键盘/IME。
// LiveTerminal(node-pty) 与 SshTerminal(ssh2) 各自负责后端，把数据喂进 Screen、把键盘字节经 write 送出。
//
// 关键点（踩坑沉淀，勿回退）：
// - 根节点必须 intrinsic 'view' + ref:boxRef（View 是函数组件不转发 ref → boxRef 为 null → __input 挂不上 → 焦点/键盘全断）。
// - 正文非受控 intrinsic 'scrollview'：命令式 scrollY=maxScroll 跟随底部（不传 scrollY prop 避免每帧钉死），
//   style 只给 paddingHorizontal，勿加 paddingVertical（否则 maxScroll 少算致末行被裁）。
// - 光标用定宽实心块 View 插在码点列间（勿用反色空格，textLayout 裁行尾空白致零宽不可见）。
// - 逐 cell 按 (字体宽窄 + 前景/背景 + 粗体 + 下划线) 合并成 run 分段渲染：ASCII→Flux Mono（等宽对齐），
//   CJK→Flux Sans（含中文）；SGR 颜色由 Screen 落进 cell，这里还原成 ls/ssh 的彩色输出。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const react_native_flux_desktop_4 = require("react-native-flux-desktop");
const screen_1 = require("./screen");
// 固定终端调色板（GitHub Dark 系，不随主题翻转）
exports.T_BG = '#0d1117';
exports.T_TITLEBAR = '#161b22';
exports.T_BORDER = '#30363d';
exports.T_TEXT = '#c9d1d9';
exports.T_PROMPT = '#3fb950';
/** 命名键 → 终端输入字节（VT 常用控制码） */
exports.KEY_SEQ = {
    Enter: '\r',
    Tab: '\t',
    Escape: '\x1b',
    Backspace: '\x7f',
    Delete: '\x1b[3~',
    Insert: '\x1b[2~',
    ArrowUp: '\x1b[A',
    ArrowDown: '\x1b[B',
    ArrowRight: '\x1b[C',
    ArrowLeft: '\x1b[D',
    Home: '\x1b[H',
    End: '\x1b[F',
    PageUp: '\x1b[5~',
    PageDown: '\x1b[6~',
};
/** Cell 行 → runs：剔除续格 \u0000，按 (宽窄,fg,bg,bold,ul) 合并相邻同样式单元 */
function lineToRuns(cells) {
    const runs = [];
    for (const c of cells) {
        if (c.ch === '\u0000')
            continue; // 宽字符续格，跳过
        const wide = (0, screen_1.isWide)(c.ch);
        const last = runs[runs.length - 1];
        if (last && last.wide === wide && last.fg === c.fg && last.bg === c.bg && last.bold === c.bold && last.ul === c.ul) {
            last.s += c.ch;
        }
        else {
            runs.push({ s: c.ch, wide, fg: c.fg, bg: c.bg, bold: c.bold, ul: c.ul });
        }
    }
    return runs;
}
/** 渲染一组 runs（每段按样式选字体/颜色/粗体/下划线/背景）。
 *  preserveTrailingSpace：终端等宽单元的空格必须占真实宽度，否则 run 尾部/纯空白 run 被 textLayout 塌成 0 宽（如 "ssh  " 黄色 run 里的两空格消失→"sshr"）。 */
function renderRuns(runs, fontSize, lineH) {
    if (runs.length === 0)
        return [react_1.default.createElement(react_native_flux_desktop_1.Text, { key: "_", preserveTrailingSpace: true, style: { fontSize, lineHeight: lineH, color: exports.T_TEXT, fontFamily: react_native_flux_desktop_2.MONO_FAMILY } }, " ")];
    return runs.map((r, i) => {
        const style = {
            fontSize,
            lineHeight: lineH,
            color: r.fg || exports.T_TEXT,
            fontFamily: r.wide ? react_native_flux_desktop_2.SANS_FAMILY : react_native_flux_desktop_2.MONO_FAMILY,
        };
        if (r.bold)
            style.fontWeight = 'bold';
        if (r.ul)
            style.textDecorationLine = 'underline';
        if (r.bg)
            style.backgroundColor = r.bg;
        return (react_1.default.createElement(react_native_flux_desktop_1.Text, { key: i, preserveTrailingSpace: true, style: style }, r.s));
    });
}
/** 终端一行（无光标） */
function TermLine({ cells, fontSize, lineH }) {
    return react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row' } }, renderRuns(lineToRuns(cells), fontSize, lineH));
}
/** 光标行：在光标码点列处插一个定宽实心块（块光标）。不用「反色空格」——textLayout 会裁行尾空白致零宽不可见。 */
function CursorLine({ cells, col, fontSize, lineH }) {
    const charW = Math.round(fontSize * 0.6); // 等宽单格近似宽度（与块光标同宽，保证视觉一致）
    const before = [];
    const after = [];
    let seen = 0;
    for (const c of cells) {
        if (c.ch === '\u0000') {
            // 续格跟随其主字符的分组：简单起见按当前归属追加
            (seen <= col ? before : after).push(c);
            continue;
        }
        if (seen < col)
            before.push(c);
        else
            after.push(c);
        seen++;
    }
    // 带样式/内部的空格已由 preserveTrailingSpace 正常显宽；此处只补被 trimRow 真裁掉、buffer 里根本没有的无样式尾部空格
    const missing = Math.max(0, col - seen);
    const spacers = [];
    for (let i = 0; i < missing; i++)
        spacers.push(react_1.default.createElement(react_native_flux_desktop_1.View, { key: 'sp' + i, style: { width: charW, height: fontSize } }));
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', alignItems: 'center' } },
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row' } }, renderRuns(lineToRuns(before), fontSize, lineH)),
        spacers,
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { width: charW, height: fontSize, backgroundColor: exports.T_PROMPT } }),
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row' } }, renderRuns(lineToRuns(after), fontSize, lineH))));
}
/** 终端窗口呈现 + 输入接管。父组件在数据变化时重渲染本组件即可（内部非 memo，随父更新）。 */
function TerminalView(props) {
    const { screen, write, cols, rows, title, autoFocus = true, statusText, style } = props;
    const boxRef = react_1.default.useRef(null);
    const scrollRef = react_1.default.useRef(null);
    const composingRef = react_1.default.useRef(false);
    const followRef = react_1.default.useRef(true); // 是否钉底跟随（用户上翻则暂停）
    const [focused, setFocused] = react_1.default.useState(false);
    const fontSize = 13;
    const lineH = Math.round(fontSize * 1.55);
    const bodyH = rows * lineH;
    // 编辑控制器：把键盘/IME 事件转成后端输入字节。复用 host 的聚焦分发（node.__input）。
    const controller = react_1.default.useMemo(() => ({
        insertText: (text) => {
            write(text);
        },
        deleteBackward: () => write('\x7f'),
        deleteForward: () => write('\x1b[3~'),
        onKeyDown: (key, mods) => {
            if (mods.ctrl && key.length === 1) {
                const c = key.toUpperCase().charCodeAt(0);
                if (c >= 65 && c <= 90)
                    write(String.fromCharCode(c - 64)); // Ctrl+A..Z → 0x01..0x1A
                return true;
            }
            const seq = exports.KEY_SEQ[key];
            if (seq) {
                write(seq);
                return true;
            }
            return false;
        },
        setComposition: (text) => {
            composingRef.current = !!text;
        },
        isComposing: () => composingRef.current,
        focus: () => setFocused(true),
        blur: () => setFocused(false),
        placeCaret: () => {
            /* 终端无点击落位 */
        },
    }), 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);
    // 挂 __input 到根场景节点：点击即可聚焦打字。autoFocus 首挂载聚焦。
    react_1.default.useEffect(() => {
        const node = boxRef.current;
        if (!node)
            return;
        node.__input = controller;
        if (autoFocus)
            (0, react_native_flux_desktop_4.setActiveEditable)(node);
        return () => {
            (0, react_native_flux_desktop_4.forgetEditable)(node);
            if (node.__input === controller)
                node.__input = undefined;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [controller, autoFocus]);
    // 跟随底部：非受控 scrollview，命令式把 scrollY 顶到最大（不传 scrollY prop，避免每帧被钉死）。
    const view = screen.view();
    const maxScroll = Math.max(0, view.lines.length * lineH - bodyH);
    react_1.default.useEffect(() => {
        if (followRef.current && scrollRef.current) {
            scrollRef.current.scrollY = maxScroll;
            (0, react_native_flux_desktop_3.scheduleFrame)();
        }
    });
    const titleText = title + (statusText ? '  ' + statusText : focused ? '  [ready]' : '  [click to type]');
    // 根节点用 intrinsic 'view' + ref 直挂场景节点（View 是函数组件不转发 ref），
    // 否则 boxRef.current 为 null → __input 挂不上 → 焦点/键盘全断。
    return react_1.default.createElement('view', {
        ref: boxRef,
        style: [
            { width: '100%', backgroundColor: exports.T_BG, borderRadius: 8, borderWidth: 1, borderColor: exports.T_BORDER, overflow: 'hidden', cursor: 'text' },
            style,
        ],
    }, 
    // 标题栏：红绿灯 + 标题（走等宽字体，必须 ASCII）
    react_1.default.createElement(react_native_flux_desktop_1.View, { key: "bar", style: {
            flexDirection: 'row',
            alignItems: 'center',
            height: 30,
            paddingHorizontal: 12,
            backgroundColor: exports.T_TITLEBAR,
            borderBottomWidth: 1,
            borderBottomColor: exports.T_BORDER,
        } },
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#ff5f57' } }),
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#febc2e', marginLeft: 7 } }),
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { width: 11, height: 11, borderRadius: 6, backgroundColor: '#28c840', marginLeft: 7 } }),
        react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { marginLeft: 12, fontSize: fontSize - 1, fontFamily: react_native_flux_desktop_2.MONO_FAMILY, color: '#8b949e' }, numberOfLines: 1 }, titleText)), 
    // 正文：非受控 scrollview（可滚轮上翻历史），内容 = scrollback + 当前屏，逐行等宽
    react_1.default.createElement('scrollview', {
        key: 'body',
        ref: scrollRef,
        style: { height: bodyH, paddingHorizontal: 12 },
        onScroll: (e) => {
            const off = e.nativeEvent.contentOffset.y;
            const contentH = e.nativeEvent.contentSize.height;
            followRef.current = off + bodyH >= contentH - 2;
        },
    }, view.lines.map((cells, i) => {
        const isCursor = focused && i === view.cursorRow;
        return (react_1.default.createElement(react_native_flux_desktop_1.View, { key: i, style: { flexDirection: 'row', height: lineH, alignItems: 'center' } }, isCursor ? (react_1.default.createElement(CursorLine, { cells: cells, col: view.cursorCol, fontSize: fontSize, lineH: lineH })) : (react_1.default.createElement(TermLine, { cells: cells, fontSize: fontSize, lineH: lineH }))));
    })));
}
exports.default = TerminalView;

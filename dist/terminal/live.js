"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TerminalView = exports.Screen = void 0;
exports.LiveTerminal = LiveTerminal;
// LiveTerminal：可交互实时终端（本地 shell 版）。
// 链路：node-pty 起真实 shell（Windows=ConPTY+powershell，unix=bash）→ 字节流经共享 VT 网格屏（Screen）
//       解析 → 交 TerminalView 渲染；键盘经 TerminalView 的 EditableController 转成字节回写 pty。
//
// 引擎与渲染均在 ./screen（VT 网格屏）与 ./view（TerminalView 呈现 + 输入接线），与 SshTerminal 共用。
// 依赖策略：node-pty 为可选 devDependency，运行时懒 require；缺失（如生产 --omit=dev）即降级为提示，绝不崩。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const screen_1 = require("./screen");
Object.defineProperty(exports, "Screen", { enumerable: true, get: function () { return screen_1.Screen; } });
const view_1 = require("./view");
var view_2 = require("./view");
Object.defineProperty(exports, "TerminalView", { enumerable: true, get: function () { return view_2.TerminalView; } });
function LiveTerminal(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const { title = 'node-pty', shell = process.platform === 'win32' ? 'powershell.exe' : 'bash', shellArgs, cols = 80, rows = 16, command, autoFocus = true, style, } = props;
    const procRef = react_1.default.useRef(null);
    const screenRef = react_1.default.useRef(new screen_1.Screen(cols, rows));
    const dirtyRef = react_1.default.useRef(false);
    const flushRef = react_1.default.useRef(null);
    const [, force] = react_1.default.useReducer((x) => x + 1, 0);
    const [err, setErr] = react_1.default.useState(null);
    // 合并重绘：pty 高频 onData 时，每帧最多触发一次 React 重渲染
    const markDirty = () => {
        dirtyRef.current = true;
        if (flushRef.current != null)
            return;
        flushRef.current = setTimeout(() => {
            flushRef.current = null;
            if (dirtyRef.current) {
                dirtyRef.current = false;
                force();
                (0, react_native_flux_desktop_3.scheduleFrame)();
            }
        }, 16);
    };
    react_1.default.useEffect(() => {
        let pty;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            pty = require('node-pty');
        }
        catch {
            setErr('未安装 node-pty（可选 devDependency）。生产 --omit=dev 会抛弃它 —— 实时终端不可用。');
            return;
        }
        const args = shellArgs ||
            (shell === 'powershell.exe'
                ? ['-NoLogo', '-NoExit', '-Command', '[Console]::OutputEncoding=[Console]::InputEncoding=[Text.Encoding]::UTF8;chcp 65001|Out-Null']
                : []);
        let proc;
        try {
            proc = pty.spawn(shell, args, {
                name: 'xterm-256color',
                cols,
                rows,
                cwd: process.cwd(),
                env: process.env,
            });
        }
        catch (e) {
            setErr('node-pty 启动失败：' + (e?.message || String(e)));
            return;
        }
        procRef.current = proc;
        proc.onData((d) => {
            screenRef.current.feed(d);
            markDirty();
        });
        proc.onExit(() => {
            procRef.current = null;
        });
        if (command) {
            setTimeout(() => {
                try {
                    proc.write(command + '\r');
                }
                catch {
                    /* 已退出 */
                }
            }, 350);
        }
        return () => {
            if (flushRef.current != null)
                clearTimeout(flushRef.current);
            try {
                proc.kill();
            }
            catch {
                /* noop */
            }
            procRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const write = (s) => {
        try {
            procRef.current?.write(s);
        }
        catch {
            /* ignore */
        }
    };
    if (err) {
        return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: {
                width: '100%',
                padding: token.paddingSM,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: token.colorBorder,
                backgroundColor: token.colorFillQuaternary,
            } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSize, color: token.colorError } }, "\u5B9E\u65F6\u7EC8\u7AEF\u4E0D\u53EF\u7528"),
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextSecondary, marginTop: 4 } }, err)));
    }
    return (react_1.default.createElement(view_1.TerminalView, { screen: screenRef.current, write: write, cols: cols, rows: rows, title: title, autoFocus: autoFocus, style: style }));
}
exports.default = LiveTerminal;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SshTerminal = SshTerminal;
// SshTerminal：通过 ssh2 连接远程主机的交互式终端（开发类组件）。
// 表单填 host/port/account/psw → 点「连接 SSH」→ ssh2 开一个 shell channel（xterm-256color），
// 远端字节流经共享 VT 网格屏（Screen，含 SGR 配色）解析 → TerminalView 渲染；键盘字节经 write 回写 channel。
//
// 与 LiveTerminal 共用 ./screen + ./view，仅后端不同（node-pty 本地 shell vs ssh2 远程 shell）。
// 依赖策略：ssh2 为可选 devDependency，连接时懒 require；缺失即降级为提示，绝不崩。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const react_native_flux_desktop_4 = require("react-native-flux-desktop");
const screen_1 = require("./screen");
const view_1 = require("./view");
function SshTerminal(props) {
    const { token } = (0, react_native_flux_desktop_3.useToken)();
    const { defaultHost = '47.242.206.79', defaultPort = 22, defaultUser = 'root', cols = 80, rows = 16, title = 'ssh', style, } = props;
    const [host, setHost] = react_1.default.useState(defaultHost);
    const [port, setPort] = react_1.default.useState(String(defaultPort));
    const [user, setUser] = react_1.default.useState(defaultUser);
    const [password, setPassword] = react_1.default.useState('');
    const [status, setStatus] = react_1.default.useState('idle');
    const [errMsg, setErrMsg] = react_1.default.useState('');
    const connRef = react_1.default.useRef(null);
    const streamRef = react_1.default.useRef(null);
    const screenRef = react_1.default.useRef(new screen_1.Screen(cols, rows));
    const dirtyRef = react_1.default.useRef(false);
    const flushRef = react_1.default.useRef(null);
    const [, force] = react_1.default.useReducer((x) => x + 1, 0);
    const markDirty = () => {
        dirtyRef.current = true;
        if (flushRef.current != null)
            return;
        flushRef.current = setTimeout(() => {
            flushRef.current = null;
            if (dirtyRef.current) {
                dirtyRef.current = false;
                force();
                (0, react_native_flux_desktop_4.scheduleFrame)();
            }
        }, 16);
    };
    const teardown = () => {
        try {
            streamRef.current?.end();
        }
        catch {
            /* noop */
        }
        try {
            connRef.current?.end();
        }
        catch {
            /* noop */
        }
        streamRef.current = null;
        connRef.current = null;
    };
    react_1.default.useEffect(() => () => teardown(), []);
    const disconnect = () => {
        teardown();
        setStatus('idle');
    };
    const connect = () => {
        if (status === 'connecting')
            return;
        if (status === 'connected') {
            disconnect();
            return;
        }
        if (!password) {
            setStatus('error');
            setErrMsg('密码不能为空');
            return;
        }
        let SSH;
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            SSH = require('ssh2');
        }
        catch {
            setStatus('error');
            setErrMsg('未安装 ssh2（可选 devDependency）。生产 --omit=dev 会抛弃它 —— SSH 终端不可用。');
            return;
        }
        setErrMsg('');
        setStatus('connecting');
        const conn = new SSH.Client();
        connRef.current = conn;
        conn.on('ready', () => {
            conn.shell({ term: 'xterm-256color', cols, rows }, (err, stream) => {
                if (err) {
                    setStatus('error');
                    setErrMsg('开启 shell 失败：' + err.message);
                    try {
                        conn.end();
                    }
                    catch {
                        /* noop */
                    }
                    return;
                }
                streamRef.current = stream;
                stream.on('data', (d) => {
                    screenRef.current.feed(d.toString('utf8'));
                    markDirty();
                });
                stream.on('close', () => {
                    streamRef.current = null;
                    setStatus('idle');
                });
                setStatus('connected');
            });
        });
        conn.on('error', (e) => {
            setStatus('error');
            setErrMsg('连接失败：' + (e?.message || String(e)));
            connRef.current = null;
        });
        conn.on('close', () => {
            if (connRef.current === conn) {
                connRef.current = null;
                streamRef.current = null;
                setStatus((s) => (s === 'connected' ? 'idle' : s));
            }
        });
        try {
            conn.connect({ host: host.trim(), port: Number(port) || 22, username: user.trim(), password, readyTimeout: 15000 });
        }
        catch (e) {
            setStatus('error');
            setErrMsg('连接异常：' + (e?.message || String(e)));
        }
    };
    const write = (s) => {
        try {
            streamRef.current?.write(s);
        }
        catch {
            /* ignore */
        }
    };
    const labelStyle = { fontSize: token.fontSizeSM, color: token.colorTextSecondary, marginBottom: 3 };
    const fieldStyle = { width: 150 };
    const statusText = status === 'connected' ? undefined : status === 'connecting' ? '[connecting...]' : status === 'error' ? '[error]' : '[not connected]';
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [{ width: '100%', gap: token.marginXS }, style] },
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-end', gap: token.marginXS } },
            react_1.default.createElement(react_native_flux_desktop_1.View, null,
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: labelStyle }, "Host"),
                react_1.default.createElement(react_native_flux_desktop_2.Input, { style: fieldStyle, value: host, onChange: setHost, placeholder: "host", disabled: status !== 'idle' && status !== 'error' })),
            react_1.default.createElement(react_native_flux_desktop_1.View, null,
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: labelStyle }, "Port"),
                react_1.default.createElement(react_native_flux_desktop_2.Input, { style: { width: 80 }, value: port, onChange: setPort, placeholder: "22", disabled: status !== 'idle' && status !== 'error' })),
            react_1.default.createElement(react_native_flux_desktop_1.View, null,
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: labelStyle }, "Account"),
                react_1.default.createElement(react_native_flux_desktop_2.Input, { style: { width: 100 }, value: user, onChange: setUser, placeholder: "root", disabled: status !== 'idle' && status !== 'error' })),
            react_1.default.createElement(react_native_flux_desktop_1.View, null,
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: labelStyle }, "Password"),
                react_1.default.createElement(react_native_flux_desktop_2.Input, { style: { width: 150 }, value: password, onChange: setPassword, placeholder: "(not null)", disabled: status !== 'idle' && status !== 'error', onPressEnter: connect })),
            react_1.default.createElement(react_native_flux_desktop_2.Button, { type: status === 'connected' ? 'default' : 'primary', loading: status === 'connecting', onPress: connect }, status === 'connected' ? '断开' : '连接 SSH')),
        status === 'error' && !!errMsg && (react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorError } }, errMsg)),
        react_1.default.createElement(view_1.TerminalView, { screen: screenRef.current, write: write, cols: cols, rows: rows, title: `${host || 'ssh'} · ${user || '?'}`, statusText: statusText, autoFocus: false })));
}
exports.default = SshTerminal;

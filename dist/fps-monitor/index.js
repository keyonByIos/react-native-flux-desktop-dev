"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWindowFps = useWindowFps;
exports.FpsMonitor = FpsMonitor;
// FpsMonitor：实时帧率监控（开发组件）。轮询 Application.getFps() 展示「当前窗口」每秒实际上屏帧数。
// 数据来源是 WindowHost 对「实际上屏帧」的 ~0.5s 滚动窗口计量（renderFrame 只在有帧被调度时运行，
// 故空闲时读数归零、不虚高 60）。组件自带采样、趋势线、逐窗列表，无外部依赖。
// 用法（主窗展示）：<FpsMonitor floating /> 或放进顶栏 <FpsMonitor />。程序化取数用 useWindowFps()。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_chart_1 = require("react-native-flux-desktop-chart");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
/** 帧率历史 hook：每 intervalMs 采一次 Application.getFps(windowId)，返回 { fps, history }。 */
function useWindowFps(intervalMs = 500, windowId, maxPoints = 40) {
    const [fps, setFps] = react_1.default.useState(0);
    const [history, setHistory] = react_1.default.useState([]);
    react_1.default.useEffect(() => {
        const tick = () => {
            const v = react_native_flux_desktop_3.Application.getFps(windowId);
            setFps(v);
            setHistory((h) => {
                const nh = h.length >= maxPoints ? h.slice(h.length - maxPoints + 1) : h.slice();
                nh.push(v);
                return nh;
            });
        };
        tick();
        const t = setInterval(tick, Math.max(100, intervalMs));
        return () => clearInterval(t);
    }, [intervalMs, windowId, maxPoints]);
    return { fps, history };
}
function FpsWindowList(props) {
    const { token } = props;
    const [rows, setRows] = react_1.default.useState([]);
    react_1.default.useEffect(() => {
        const tick = () => setRows(react_native_flux_desktop_3.Application.fpsSnapshot());
        tick();
        const t = setInterval(tick, 500);
        return () => clearInterval(t);
    }, []);
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { paddingTop: token.paddingXXS } }, rows.map((r) => (react_1.default.createElement(react_native_flux_desktop_1.View, { key: r.id, style: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 } },
        react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextSecondary }, numberOfLines: 1 },
            "#",
            r.id,
            " ",
            r.title || '(无标题)'),
        react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, fontVariant: ['tabular-nums'], color: token.colorText } }, r.fps))))));
}
function FpsMonitor(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const { intervalMs = 500, windowId, maxPoints = 40, showChart = true, showAll = false, floating = false, good = 55, warn = 30, label = 'FPS', height, style } = props;
    const { fps, history } = useWindowFps(intervalMs, windowId, maxPoints);
    // 徽章高度默认对齐 Segmented 等控件的 controlHeight（padding 在盒内不叠加，故直接给定高 + 内容垂直居中）
    const pillH = height ?? token.controlHeight;
    const color = fps === 0 ? token.colorTextTertiary : fps >= good ? token.colorSuccess : fps >= warn ? token.colorWarning : token.colorError;
    const spark = showChart && maxPoints > 0 && history.length > 1 ? history.map((v) => ({ value: v })) : null;
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [
            floating && { position: 'absolute', right: token.margin, bottom: token.margin, zIndex: 9999 },
            { flexDirection: 'row', alignItems: 'center', gap: token.marginXS },
            style,
        ] },
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: {
                flexDirection: 'row', alignItems: 'center', gap: token.marginXXS,
                height: pillH, paddingHorizontal: token.paddingXS,
                borderRadius: token.borderRadius,
                backgroundColor: token.colorFillTertiary,
            } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextSecondary } }, label),
            react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, fontVariant: ['tabular-nums'], color } }, fps === 0 ? '—' : fps)),
        spark ? react_1.default.createElement(react_native_flux_desktop_chart_1.SparklineChart, { data: spark, width: 120, height: 28, smooth: false, tooltip: false, color: color }) : null,
        showAll ? react_1.default.createElement(FpsWindowList, { token: token }) : null));
}

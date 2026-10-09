"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemMonitor = MemMonitor;
// MemMonitor：进程内存实时监控面板（开发组件）。1s 采样 process.memoryUsage()，
// RSS/Heap/External 三条迷你走势线 + 数值明细 + 峰值；另遍历 Application.windows() 逐窗展示
// 各自渲染面（双缓冲 framebuffer）/尺寸/dpr/节点数 + 按节点占比摊算的堆估算；floating 模式悬浮父容器右下角（zIndex 浮层）。
// GC 按钮需 `node --expose-gc` 启动，否则置灰。数据自采自绘，无外部依赖。
const react_1 = __importDefault(require("react"));
const react_native_flux_desktop_1 = require("react-native-flux-desktop");
const react_native_flux_desktop_2 = require("react-native-flux-desktop");
const react_native_flux_desktop_3 = require("react-native-flux-desktop");
const react_native_flux_desktop_4 = require("react-native-flux-desktop");
const react_native_flux_desktop_chart_1 = require("react-native-flux-desktop-chart");
const react_native_flux_desktop_5 = require("react-native-flux-desktop");
const MB = 1024 * 1024;
const f1 = (n) => n.toFixed(1);
function fmtUp(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m >= 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}m` : `${m}m${String(sec).padStart(2, '0')}s`;
}
/** 一行指标：标签 + 当前值/峰值 + 走势线 */
function MetricRow(p) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    // SparklineChart 对空 data 无防御（Math.min()=Infinity 派生 NaN 崩），首个采样到达前补一个 0 点
    const safe = p.data.length ? p.data : [0];
    const cur = safe[safe.length - 1];
    const peak = Math.max(...safe);
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { marginBottom: token.marginXS } },
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: token.marginXS } },
            react_1.default.createElement(react_native_flux_desktop_1.Text, { numberOfLines: 1, style: { flex: 1, fontSize: token.fontSizeSM, color: token.colorTextSecondary } }, p.label),
            react_1.default.createElement(react_native_flux_desktop_1.Text, { numberOfLines: 1, style: { flexShrink: 0, fontSize: token.fontSizeSM, color: token.colorTextTertiary } },
                f1(cur),
                p.unit,
                " \u00B7 \u5CF0 ",
                f1(peak),
                p.unit)),
        react_1.default.createElement(react_native_flux_desktop_chart_1.SparklineChart, { data: safe.map((v) => ({ v })), yField: "v", type: "area", width: 268, height: 34, color: p.color, endDot: true, animation: false, tooltip: false, style: { marginTop: 2 } })));
}
function MemMonitor(props) {
    const { token } = (0, react_native_flux_desktop_2.useToken)();
    const { intervalMs = 1000, maxPoints = 120, defaultOpen = true, floating = false, dropdown = false, warnMB = 300, style } = props;
    const [samples, setSamples] = react_1.default.useState([]);
    const [detail, setDetail] = react_1.default.useState({ rss: 0, heap: 0, heapT: 0, ext: 0, ab: 0, up: 0, imgC: 0 });
    const [wins, setWins] = react_1.default.useState([]);
    const [open, setOpen] = react_1.default.useState(defaultOpen);
    const gcAvail = react_native_flux_desktop_5.systemStats.gcAvailable();
    react_1.default.useEffect(() => {
        const tick = () => {
            const snap = react_native_flux_desktop_5.systemStats.snapshot();
            const m = snap.memoryMB;
            setSamples((s) => [...s, { rss: m.rss, heap: m.heapUsed, ext: m.external, img: snap.imageCache.bytes / MB }].slice(-maxPoints));
            setDetail({
                rss: m.rss,
                heap: m.heapUsed,
                heapT: m.heapTotal,
                ext: m.external,
                ab: m.arrayBuffers,
                up: snap.uptimeSec,
                imgC: snap.imageCache.count,
            });
            setWins(snap.windows);
        };
        tick();
        const t = setInterval(tick, intervalMs);
        return () => clearInterval(t);
    }, [intervalMs, maxPoints]);
    const warn = detail.rss >= warnMB;
    const fg = warn ? token.colorError : token.colorText;
    const pillStyle = {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: token.paddingSM,
        paddingVertical: token.paddingXXS,
        borderRadius: token.borderRadiusLG,
        borderWidth: token.lineWidth,
        borderStyle: 'solid',
        borderColor: token.colorBorderSecondary,
        backgroundColor: token.colorBgElevated,
        cursor: 'pointer',
    };
    const panelStyle = {
        width: 300,
        padding: token.paddingSM,
        borderRadius: token.borderRadiusLG,
        borderWidth: token.lineWidth,
        borderStyle: 'solid',
        borderColor: token.colorBorderSecondary,
        backgroundColor: token.colorBgElevated,
    };
    const floatStyle = floating
        ? { position: 'absolute', right: token.margin, bottom: token.margin, zIndex: 1080 }
        : {};
    // 迷你胶囊触发器：图标 + RSS 数字，点击在展开/收起间切换
    const pill = (react_1.default.createElement(react_native_flux_desktop_1.Pressable, { onPress: () => setOpen((o) => !o), style: pillStyle },
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { marginRight: token.marginXXS } },
            react_1.default.createElement(react_native_flux_desktop_3.Icon, { name: "dashboard", size: token.fontSize, color: warn ? token.colorError : token.colorPrimary })),
        react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: fg } },
            "MEM ",
            f1(detail.rss),
            "MB")));
    const detailRow = (k, v) => (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: token.marginXS } },
        react_1.default.createElement(react_native_flux_desktop_1.Text, { numberOfLines: 1, style: { flex: 1, fontSize: token.fontSizeSM, color: token.colorTextTertiary } }, k),
        react_1.default.createElement(react_native_flux_desktop_1.Text, { numberOfLines: 1, style: { flexShrink: 0, fontSize: token.fontSizeSM, color: token.colorTextSecondary } }, v)));
    // 展开面板内容（走势 + 明细 + 操作），供就地/下拉两态复用
    const panelBody = (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: token.marginXS } },
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', alignItems: 'center' } },
                react_1.default.createElement(react_native_flux_desktop_1.View, { style: { marginRight: token.marginXXS } },
                    react_1.default.createElement(react_native_flux_desktop_3.Icon, { name: "dashboard", size: token.fontSize, color: warn ? token.colorError : token.colorPrimary })),
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, fontWeight: '600', color: token.colorText } }, "\u5185\u5B58\u76D1\u63A7")),
            react_1.default.createElement(react_native_flux_desktop_1.Pressable, { onPress: () => setOpen(false), style: { cursor: 'pointer', padding: 2 } },
                react_1.default.createElement(react_native_flux_desktop_3.Icon, { name: "minus", size: token.fontSizeSM, color: token.colorTextTertiary }))),
        react_1.default.createElement(MetricRow, { label: "RSS \u5E38\u9A7B\u96C6", color: warn ? token.colorError : token.colorWarning, data: samples.map((s) => s.rss), unit: "MB" }),
        react_1.default.createElement(MetricRow, { label: "Heap V8 \u5806", color: token.colorPrimary, data: samples.map((s) => s.heap), unit: "MB" }),
        react_1.default.createElement(MetricRow, { label: "External \u539F\u751F\u4FA7", color: token.colorSuccess, data: samples.map((s) => s.ext), unit: "MB" }),
        react_1.default.createElement(MetricRow, { label: "Image \u56FE\u7247\u7F13\u5B58", color: token.colorInfo, data: samples.map((s) => s.img), unit: "MB" }),
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { gap: 2, marginTop: token.marginXXS, paddingTop: token.marginXXS, borderTopWidth: token.lineWidth, borderTopColor: token.colorSplit, borderStyle: 'solid' } },
            detailRow('heapTotal（V8 预留）', `${f1(detail.heapT)} MB`),
            detailRow('arrayBuffers', `${f1(detail.ab)} MB`),
            detailRow('uptime', fmtUp(detail.up)),
            detailRow('采样', `${samples.length}/${maxPoints} @ ${(intervalMs / 1000).toFixed(1)}s`),
            detailRow('图片缓存', `${detail.imgC} 张 · 上限 ${(react_native_flux_desktop_5.systemStats.imageCache().maxBytes / MB).toFixed(0)} MB`)),
        wins.length > 0 && (react_1.default.createElement(react_native_flux_desktop_1.View, { style: { gap: 4, marginTop: token.marginXXS, paddingTop: token.marginXXS, borderTopWidth: token.lineWidth, borderTopColor: token.colorSplit, borderStyle: 'solid' } },
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' } },
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextSecondary } },
                    "\u7A97\u53E3 ",
                    wins.length),
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextTertiary } },
                    "\u9762\u5408\u8BA1 ",
                    f1(wins.reduce((a, w) => a + w.surfaceMB, 0)),
                    " MB")),
            wins.map((w, i) => (react_1.default.createElement(react_native_flux_desktop_1.View, { key: i, style: { gap: 1 } },
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorText } }, w.title),
                react_1.default.createElement(react_native_flux_desktop_1.Text, { style: { fontSize: token.fontSizeSM, color: token.colorTextTertiary } },
                    Math.round(w.w),
                    "\u00D7",
                    Math.round(w.h),
                    "@",
                    w.dpr,
                    " \u00B7 \u9762 ",
                    f1(w.surfaceMB),
                    " \u00B7 \u8282\u70B9 ",
                    w.nodes,
                    " \u00B7 \u5806\u2248 ",
                    f1(w.heapShareMB),
                    " MB")))))),
        react_1.default.createElement(react_native_flux_desktop_1.View, { style: { flexDirection: 'row', marginTop: token.marginXS } },
            react_1.default.createElement(react_native_flux_desktop_4.Button, { size: "small", onClick: () => {
                    react_native_flux_desktop_5.systemStats.gc();
                } }, gcAvail ? 'GC' : 'GC（需 --expose-gc）'),
            react_1.default.createElement(react_native_flux_desktop_1.View, { style: { marginLeft: token.marginXS } },
                react_1.default.createElement(react_native_flux_desktop_4.Button, { size: "small", onClick: () => setSamples([]) }, "\u6E05\u7A7A\u5386\u53F2")))));
    // 下拉模式：胶囊留在文档流内做触发器，展开面板绝对浮于其正下方（顶栏等窄条用，展开不撑坏行高）
    if (dropdown) {
        return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [{ position: 'relative' }, style] },
            pill,
            open ? (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [panelStyle, { position: 'absolute', top: '100%', right: 0, marginTop: token.marginXS, zIndex: 1100 }] }, panelBody)) : null));
    }
    // 收起态：仅小胶囊（floating 时锚父容器右下角）
    if (!open) {
        return react_1.default.createElement(react_native_flux_desktop_1.View, { style: [floatStyle, style] }, pill);
    }
    // 展开态：面板就地/悬浮渲染
    return (react_1.default.createElement(react_native_flux_desktop_1.View, { style: [panelStyle, floatStyle, style] }, panelBody));
}
exports.default = MemMonitor;

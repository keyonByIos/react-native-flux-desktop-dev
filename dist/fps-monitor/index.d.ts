import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
export interface FpsMonitorProps {
    /** 采样间隔 ms，默认 500 */
    intervalMs?: number;
    /** 目标窗口 id；缺省 = 主窗（Application.getFps 语义） */
    windowId?: number;
    /** 趋势历史点数（窗口时长 = maxPoints × intervalMs），默认 40；设 0 关趋势线 */
    maxPoints?: number;
    /** 是否显示趋势图（SparklineChart），默认 true；false 则只留 FPS 数值徽章 */
    showChart?: boolean;
    /** 展开逐窗帧率列表（调 Application.fpsSnapshot），默认 false */
    showAll?: boolean;
    /** 悬浮于父容器右下角（absolute + zIndex 浮层）；放在 Window 根末尾即悬浮窗口右下角 */
    floating?: boolean;
    /** 良好阈值：FPS >= good 显绿，默认 55 */
    good?: number;
    /** 警戒阈值：warn <= FPS < good 显黄，低于 warn 显红，默认 30 */
    warn?: number;
    /** 标签前缀，默认 'FPS' */
    label?: string;
    /** 徽章高度，默认 = token.controlHeight（与 Segmented 等控件同高） */
    height?: number;
    style?: StyleProp<ViewStyle>;
}
/** 帧率历史 hook：每 intervalMs 采一次 Application.getFps(windowId)，返回 { fps, history }。 */
export declare function useWindowFps(intervalMs?: number, windowId?: number, maxPoints?: number): {
    fps: number;
    history: number[];
};
export declare function FpsMonitor(props: FpsMonitorProps): React.ReactElement;

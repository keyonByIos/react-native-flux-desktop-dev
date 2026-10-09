import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
import { type LogEntry, type LogLevel } from './logs';
export interface LogViewerProps {
    logs: LogEntry[];
    /** 可视高度（px），默认 320 */
    height?: number;
    /** 初始最低级别 */
    defaultMinLevel?: LogLevel;
    /** 是否显示工具栏（级别 chips + 搜索 + 自动滚），默认 true */
    toolbar?: boolean;
    /** 是否显示时间戳列，默认 true */
    showTime?: boolean;
    /** 是否显示来源列，默认 true */
    showSource?: boolean;
    /** 最多渲染行数（护栏，超出截断并提示），默认 500 */
    maxRows?: number;
    fontSize?: number;
    style?: StyleProp<ViewStyle>;
}
export declare function LogViewer(props: LogViewerProps): React.ReactElement;
export default LogViewer;

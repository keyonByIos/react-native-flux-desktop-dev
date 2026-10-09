import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
export interface MemMonitorProps {
    /** 采样间隔 ms，默认 1000 */
    intervalMs?: number;
    /** 历史点数（窗口时长 = maxPoints × intervalMs），默认 120 */
    maxPoints?: number;
    /** 初始展开，默认 true */
    defaultOpen?: boolean;
    /** 悬浮于父容器右下角（absolute + zIndex 浮层）；放在 Window 根末尾即悬浮窗口右下角 */
    floating?: boolean;
    /** 下拉模式：胶囊触发器留在文档流内，展开面板绝对浮于其正下方（顶栏等窄条用，展开不撑坏行高） */
    dropdown?: boolean;
    /** RSS 警戒阈值 MB，超过数值转红；默认 300 */
    warnMB?: number;
    style?: StyleProp<ViewStyle>;
}
export declare function MemMonitor(props: MemMonitorProps): React.ReactElement;
export default MemMonitor;

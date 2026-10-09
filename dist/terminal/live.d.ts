import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
import { Screen } from './screen';
export { Screen };
export { TerminalView } from './view';
export interface LiveTerminalProps {
    /** 标题栏文案 */
    title?: string;
    /** 启动的 shell；默认 Windows=powershell.exe，其余=bash */
    shell?: string;
    /** shell 参数 */
    shellArgs?: string[];
    /** 逻辑列数/行数（决定 pty 尺寸与视口），默认 80×16 */
    cols?: number;
    rows?: number;
    /** 打开后自动执行的一条命令（演示/抓帧用；发送时行尾自动加 \\r） */
    command?: string;
    /** 挂载即聚焦（可直接打字），默认 true */
    autoFocus?: boolean;
    style?: StyleProp<ViewStyle>;
}
export declare function LiveTerminal(props: LiveTerminalProps): React.ReactElement;
export default LiveTerminal;

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
export interface SshTerminalProps {
    /** 默认主机（表单初值） */
    defaultHost?: string;
    /** 默认端口（表单初值，22） */
    defaultPort?: number;
    /** 默认账号（表单初值，root） */
    defaultUser?: string;
    /** 逻辑列数/行数（决定 shell 尺寸与视口），默认 80×16 */
    cols?: number;
    rows?: number;
    title?: string;
    style?: StyleProp<ViewStyle>;
}
export declare function SshTerminal(props: SshTerminalProps): React.ReactElement;
export default SshTerminal;

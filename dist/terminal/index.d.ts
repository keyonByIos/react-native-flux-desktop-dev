import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
/** 行语义：cmd=命令输入行 out=普通输出 ok/err/warn/info=状态 muted=次要 */
export type TermKind = 'cmd' | 'out' | 'ok' | 'err' | 'warn' | 'info' | 'muted';
export interface TermLine {
    /** 行文本（cmd 行不含提示符，由 promptText 自动前置） */
    text: string;
    /** 语义着色，默认 out */
    kind?: TermKind;
    /** 覆盖是否前置提示符：cmd 默认 true，其余默认 false */
    prompt?: boolean;
}
export interface TerminalProps {
    /** 标题栏文案 */
    title?: string;
    /** 终端内容行 */
    lines: TermLine[];
    /** 提示符字符（cmd 行前置），默认 '$'（用纯 ASCII，避免等宽字体缺字变豆腐） */
    promptText?: string;
    /** 字号（px），默认 13 */
    fontSize?: number;
    /** 是否在末行末尾画光标块，默认 true */
    showCursor?: boolean;
    /** 固定高度（px）；不给则自适应内容 */
    height?: number;
    style?: StyleProp<ViewStyle>;
}
export declare function Terminal(props: TerminalProps): React.ReactElement;
export default Terminal;

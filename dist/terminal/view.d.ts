import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native-flux-desktop';
import { Screen } from './screen';
export declare const T_BG = "#0d1117";
export declare const T_TITLEBAR = "#161b22";
export declare const T_BORDER = "#30363d";
export declare const T_TEXT = "#c9d1d9";
export declare const T_PROMPT = "#3fb950";
/** 命名键 → 终端输入字节（VT 常用控制码） */
export declare const KEY_SEQ: Record<string, string>;
export interface TerminalViewProps {
    /** 共享的 VT 网格屏实例（父组件持有 ref，后端 feed 数据；本组件只读渲染） */
    screen: Screen;
    /** 把键盘/IME 产生的字节送往后端（pty.write / ssh stream.write） */
    write: (s: string) => void;
    cols: number;
    rows: number;
    /** 标题栏文案（走等宽字体，建议 ASCII） */
    title: string;
    /** 挂载即聚焦（可直接打字），默认 true */
    autoFocus?: boolean;
    /** 覆盖 ready 提示（如 [connected] / [connecting...]）；不传则用 focused 推断 */
    statusText?: string;
    style?: StyleProp<ViewStyle>;
}
/** 终端窗口呈现 + 输入接管。父组件在数据变化时重渲染本组件即可（内部非 memo，随父更新）。 */
export declare function TerminalView(props: TerminalViewProps): React.ReactElement;
export default TerminalView;

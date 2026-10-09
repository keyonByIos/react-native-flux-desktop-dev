import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
export interface DiffViewerProps {
    /** 旧文本 */
    oldText: string;
    /** 新文本 */
    newText: string;
    /** 布局：unified 单栏 / split 双栏（默认 unified） */
    variant?: 'unified' | 'split';
    /** 头部文件名 / 标题 */
    title?: string;
    /** 未变区折叠上下文行数（连续未变 > 2×context 时折叠；0 关闭折叠，默认 3） */
    context?: number;
    /** 行号栏（默认开） */
    showLineNumbers?: boolean;
    fontSize?: number;
    style?: StyleProp<ViewStyle>;
}
export declare function DiffViewer(props: DiffViewerProps): React.ReactElement;
export default DiffViewer;

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
export interface JsonViewerProps {
    /** 待展示的数据（对象 / 数组 / 基本类型均可） */
    data: unknown;
    /** 左上角标题 */
    title?: string;
    /** 初始展开深度：<=该层级的对象/数组默认展开，更深的折叠（默认 2） */
    defaultExpandedDepth?: number;
    /** 右上角复制整份 JSON（默认开） */
    copyable?: boolean;
    fontSize?: number;
    style?: StyleProp<ViewStyle>;
}
export declare function JsonViewer(props: JsonViewerProps): React.ReactElement;
export default JsonViewer;

import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
export interface CodeBlockProps {
    code: string;
    /** 语言：js/ts/json/python/bash/css/go/rust/java/c/cpp/php/ruby/sql/yaml/html/xml（默认 js） */
    language?: string;
    /** 左上角文件名 / 标题 */
    title?: React.ReactNode;
    /** 行号（默认开） */
    showLineNumbers?: boolean;
    /** 右上角复制按钮（默认开） */
    copyable?: boolean;
    /** 软换行（默认开）；false 则每行单行裁剪 */
    wrap?: boolean;
    fontSize?: number;
    /** 限定最大高并内部纵向滚动 */
    maxHeight?: number;
    /** 行号起始偏移（默认 1） */
    startLine?: number;
    /** 高亮行号数组（1-based，对应实际行号） */
    highlightLines?: number[];
    style?: StyleProp<ViewStyle>;
}
export declare function CodeBlock(props: CodeBlockProps): React.ReactElement;
export default CodeBlock;

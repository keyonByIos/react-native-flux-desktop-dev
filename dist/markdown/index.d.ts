import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
export interface MarkdownProps {
    content: string;
    /** 代码块默认语言（当 ``` 未标注时使用） */
    defaultCodeLang?: string;
    style?: StyleProp<ViewStyle>;
}
export declare function Markdown(props: MarkdownProps): React.ReactElement;
export default Markdown;

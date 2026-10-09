import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
export interface RegexTesterProps {
    /** 初始模式 */
    defaultPattern?: string;
    /** 初始测试文本 */
    defaultText?: string;
    /** 初始 flags（默认 'g'） */
    defaultFlags?: string;
    /** 初始替换串 */
    defaultReplacement?: string;
    /** 是否显示替换区（默认 true） */
    showReplace?: boolean;
    style?: StyleProp<ViewStyle>;
}
export declare function RegexTester(props: RegexTesterProps): React.ReactElement;
export default RegexTester;

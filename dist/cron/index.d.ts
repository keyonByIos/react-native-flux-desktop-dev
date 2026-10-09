import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
export interface CronParserProps {
    /** 初始表达式 */
    defaultValue?: string;
    /** 预览未来触发次数（默认 5） */
    previewCount?: number;
    style?: StyleProp<ViewStyle>;
}
export declare function CronParser(props: CronParserProps): React.ReactElement;
export default CronParser;

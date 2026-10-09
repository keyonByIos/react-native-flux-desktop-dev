import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
export interface TimeConverterProps {
    /** 初始时间戳（缺省取当前秒级） */
    defaultStamp?: string;
    /** 初始日期串（用于「日期→时间戳」，缺省取当前本地时间） */
    defaultDate?: string;
    /** 是否显示实时时钟（默认 true） */
    liveClock?: boolean;
    style?: StyleProp<ViewStyle>;
}
export declare function TimeConverter(props: TimeConverterProps): React.ReactElement;
export default TimeConverter;

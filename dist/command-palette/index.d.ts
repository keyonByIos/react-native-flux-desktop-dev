import React from 'react';
import { StyleProp, ViewStyle } from 'react-native-flux-desktop';
export interface CommandItem {
    id: string;
    label: string;
    /** 右侧提示（快捷键 / 说明），弱化色 */
    hint?: string;
    /** 分组名；相邻不同组时插小标题 */
    group?: string;
    /** 附加搜索词（不显示、参与模糊匹配） */
    keywords?: string;
}
export interface CommandPaletteProps {
    items: CommandItem[];
    placeholder?: string;
    /** 最多展示候选数 */
    maxResults?: number;
    emptyText?: string;
    autoFocus?: boolean;
    onSelect?: (item: CommandItem) => void;
    style?: StyleProp<ViewStyle>;
}
export declare function CommandPalette(props: CommandPaletteProps): React.ReactElement;
export default CommandPalette;

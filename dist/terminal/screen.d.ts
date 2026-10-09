/** 是否 CJK/宽字符（等宽字体缺字，需回退 sans；且占 2 列显示宽度） */
export declare function isWide(ch: string): boolean;
/** 一个网格单元：字符 + 落笔时的样式（颜色为已解析的 CSS 串，null=终端默认） */
export interface Cell {
    ch: string;
    fg: string | null;
    bg: string | null;
    bold: boolean;
    ul: boolean;
}
/**
 * 最小 VT 网格屏：cols×rows 的 Cell 缓冲 + 光标 (cx,cy) + 落笔样式 pen，解释字节流并忠实落位。
 * 超出屏高的行滚入 scrollback（可回看）。
 */
export declare class Screen {
    readonly cols: number;
    readonly rows: number;
    cx: number;
    cy: number;
    private grid;
    private scrollback;
    private readonly maxScrollback;
    private savedCx;
    private savedCy;
    private pen;
    constructor(cols: number, rows: number);
    feed(chunk: string): void;
    /** 写一个可打印字符到光标处并前移；宽字符占 2 列，触边自动换行 */
    private putc;
    private blank;
    private lineFeed;
    private scrollUp;
    /** 从 ESC 起解析一条转义序列，返回序列结束后的下标（下一个待处理字符） */
    private parseEscape;
    /** 解析 CSI：从参数起始下标 p 吃到 final 字节(@-~)，派发后返回其后下标 */
    private parseCSI;
    /** 应用一条 SGR（CSI ... m）：更新落笔样式 pen。支持 0/1/4/22/24、30-37/90-97、40-47/100-107、38/48;5;n、38/48;2;r;g;b、39/49 */
    private applySGR;
    private eraseLine;
    private eraseDisplay;
    /** 当前屏各行（Cell[]，去尾空白单元） */
    screenLines(): Cell[][];
    /** scrollback + 当前屏，供渲染；返回总行数与光标在其中的行号/码点列 */
    view(): {
        lines: Cell[][];
        cursorRow: number;
        cursorCol: number;
    };
}
/** Cell 行 → 纯文本（剔除续格标记），供需要字符串的场合（测试/标题等） */
export declare function rowText(row: Cell[]): string;
export default Screen;

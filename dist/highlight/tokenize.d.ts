export type TokType = 'comment' | 'string' | 'number' | 'keyword' | 'boolean' | 'func' | 'punct' | 'ident' | 'plain' | 'jsxTag' | 'jsxAttr';
export interface Tok {
    t: string;
    k: TokType;
}
/** JSX 上下文帧：'tag'=处于标签头（收集属性），'expr'=处于 {} 表达式（braces 计嵌套层数） */
export interface JsxFrame {
    kind: 'tag' | 'expr';
    expectName?: boolean;
    braces?: number;
}
/** 跨行状态：块注释是否未闭合；JSX（js/tsx）上下文栈是否跨行未闭合 */
export interface ScanState {
    inBlock: boolean;
    /** JSX 标签/表达式上下文栈，跨行保留以支持多行属性列表与嵌套 JSX */
    jsxStack?: JsxFrame[];
}
/** 分词一行；state 会被就地更新（块注释跨行）。 */
export declare function tokenizeLine(line: string, lang: string, state: ScanState): Tok[];
/** 分词整段代码，返回每行的 token 数组。 */
export declare function tokenize(code: string, lang?: string): Tok[][];
export default tokenize;

export type DiffType = 'add' | 'del' | 'ctx' | 'skip';
export interface DiffRow {
    type: DiffType;
    /** 旧文件行号（1-based）；add / skip 为 null */
    aNum: number | null;
    /** 新文件行号（1-based）；del / skip 为 null */
    bNum: number | null;
    text: string;
}
/** 计算两个文本的行级 LCS diff，返回逐行编辑脚本（含全部上下文行）。 */
export declare function diffLines(oldText: string, newText: string): DiffRow[];
/** 折叠超长未变区：连续 ctx 超过 2×context 时，只保留首尾各 context 行，中间以 skip 分隔（记被折叠行数）。 */
export declare function foldContext(rows: DiffRow[], context?: number): DiffRow[];
/** 统计增删行数。 */
export declare function diffStat(rows: DiffRow[]): {
    added: number;
    removed: number;
};

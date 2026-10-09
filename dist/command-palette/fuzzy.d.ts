export interface FuzzyResult {
    /** 分值越大越匹配 */
    score: number;
    /** 命中的目标码点下标（升序），供高亮 */
    indices: number[];
}
/** query 是否命中 target（子序列）；不命中返回 null。大小写不敏感，indices 按原始码点位。 */
export declare function fuzzyMatch(query: string, target: string): FuzzyResult | null;
/** 对候选集打分排序（score 降序、同分按原序）；query 空则原样返回。附带每条的命中下标。 */
export declare function rankItems<T>(query: string, items: T[], textOf: (item: T) => string): {
    item: T;
    score: number;
    indices: number[];
}[];

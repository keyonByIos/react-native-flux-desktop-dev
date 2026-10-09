export interface CronFields {
    minute: number[];
    hour: number[];
    dom: number[];
    month: number[];
    dow: number[];
    domStar: boolean;
    dowStar: boolean;
}
/** 解析整条表达式（先做宏替换）。非法抛 Error。 */
export declare function parseCron(expr: string): CronFields;
/** 从 from（不含）起求下一个触发时刻；找不到（超 guard 天）返回 null。 */
export declare function nextRun(f: CronFields, from: Date, guardDays?: number): Date | null;
/** 未来 count 次触发时刻（最多 200，护栏）。 */
export declare function nextRuns(expr: string, from: Date, count?: number): Date[];
/** 中文可读描述（尽力而为，覆盖常见模式）。 */
export declare function describeCron(expr: string): string;
export declare function isValidCron(expr: string): boolean;

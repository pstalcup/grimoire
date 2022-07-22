import { Quest, Task } from "./task";
export declare function getTasks<A extends string, T extends Task<A> = Task<A>>(quests: Quest<T>[], implicitAfter?: boolean): T[];
export declare function orderByRoute<A extends string, T extends Task<A> = Task<A>>(tasks: T[], routing: string[], ignore_missing_tasks?: boolean): T[];

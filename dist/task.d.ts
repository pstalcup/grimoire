import { Familiar, Item, Location } from "kolmafia";
import { StringProperty } from "libram/dist/propertyTypes";
import { CombatStrategy } from "./combat";
export declare type Quest<T> = {
    name: string;
    tasks: T[];
};
export interface OutfitSpec {
    equip?: Item[];
    modifier?: string;
    familiar?: Familiar;
    avoid?: Item[];
    skipDefaults?: boolean;
}
export declare type AcquireItem = {
    item: Item;
    num?: number;
    price?: number;
    useful?: () => boolean;
    optional?: boolean;
    get?: () => void;
};
export declare type Task<A extends string = never> = {
    name: string;
    after?: string[];
    ready?: () => boolean;
    completed: () => boolean;
    prepare?: () => void;
    do: Location | (() => void);
    post?: () => void;
    acquire?: AcquireItem[];
    choices?: {
        [id: number]: number | (() => number);
    };
    limit?: Limit;
    outfit?: OutfitSpec | (() => OutfitSpec);
    combat?: CombatStrategy<A>;
};
export declare type Limit = {
    tries?: number;
    turns?: number;
    soft?: number;
    message?: string;
};
/**
 * Returns the state of a quest as a numeric value as follows:
 *   "unstarted" => -1
 *   "started" => 0
 *   "stepNUM" => NUM
 *   "finished" => 999
 */
export declare function step(questName: StringProperty): number;

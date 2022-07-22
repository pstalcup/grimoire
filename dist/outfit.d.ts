import { Familiar, Item, Slot } from "kolmafia";
export declare class Outfit {
    equips: Map<Slot, Item>;
    accessories: Item[];
    skipDefaults: boolean;
    familiar?: Familiar;
    modifier?: string;
    avoid?: Item[];
    private equipItem;
    private equipFamiliar;
    equip(item?: Item | Familiar | (Item | Familiar)[]): boolean;
    canEquip(item?: Item | Familiar | (Item | Familiar)[]): boolean;
    dress(): void;
}

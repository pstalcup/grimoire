import { Item, Monster, Skill } from "kolmafia";
import { Macro } from "libram";
function undelay(macro) {
    if (macro instanceof Macro)
        return macro;
    else
        return macro();
}
/**
 * The strategy to use for combat for a task, which indicates what to do
 * for each monster.
 *
 * There are two ways to specify in a task what to do for a given monster:
 *   1. Provide a macro directly through .macro(macro, ...monsters)
 *   2. Provide an action through .action(action, ...monsters)
 *
 * An action is a strategy for dealing with a monster that is not fully
 * defined in the task. The possible actions are set with the type parameter A.
 *
 * For example, a task may want to banish a monster but not necessarily know or
 * care which banisher is used. Instead, it is best for the engine to determine
 * which banisher to use on the monster. To facilitate this, "banish" can be
 * defined as an action, e.g. with CombatStrategy<"banish">;
 *
 * Each action can be resolved by the engine by:
 *   1. Providing a default macro for the action through ActionDefaults<A>,
 *      which can be done through combat_defaults in Engine options, or
 *   2. Providing a CombatResource for the action through CombatResources<A>.
 *      This is typically done in Engine.customize() by checking if a given
 *      action is requested by the task with combat.can(.), and then providing
 *      an appropriate resource with resources.provide(.).
 *
 * A monster may have both a macro and an action defined, and a macro or action
 * can be specified to be done on all monsters. The order of combat is then:
 * 1. The macro given in .startingMacro().
 * 2. The monster-specific macro(s) from .macro().
 * 3. The monster-specific action from .action().
 * 4. The general macro(s) from .macro().
 * 5. The general action from .action().
 */
export class CombatStrategy {
    constructor() {
        this.macros = new Map();
        this.actions = new Map();
    }
    /**
     * Add a macro to perform for this monster. If multiple macros are given
     * for the same monster, they are concatinated.
     *
     * @param macro The macro to perform.
     * @param monsters Which monsters to use the macro on. If not given, add the
     *  macro as a general macro.
     * @param prepend If true, add the macro before all previous macros for
     *    the same monster.
     * @returns this
     */
    macro(macro, monsters, prepend) {
        var _a, _b;
        if (monsters === undefined) {
            if (this.default_macro === undefined)
                this.default_macro = [];
            if (prepend)
                this.default_macro.unshift(macro);
            else
                this.default_macro.push(macro);
        }
        else {
            if (monsters instanceof Monster)
                monsters = [monsters];
            for (const monster of monsters) {
                if (!this.macros.has(monster))
                    this.macros.set(monster, []);
                if (prepend)
                    (_a = this.macros.get(monster)) === null || _a === void 0 ? void 0 : _a.unshift(macro);
                else
                    (_b = this.macros.get(monster)) === null || _b === void 0 ? void 0 : _b.push(macro);
            }
        }
        return this;
    }
    /**
     * Add a macro to perform at the start of combat.
     * @param macro The macro to perform.
     * @returns this
     */
    startingMacro(macro) {
        this.starting_macro = macro;
        return this;
    }
    /**
     * Add an action to perform for this monster. Only one action can be set for
     * each monster; any previous actions are overwritten.
     *
     * @param action The action to perform.
     * @param monsters Which monsters to use the action on. If not given, set the
     *  action as the general action for all monsters.
     * @returns this
     */
    action(action, monsters) {
        if (monsters === undefined) {
            this.default_action = action;
        }
        else if (monsters instanceof Monster) {
            this.actions.set(monsters, action);
        }
        else {
            for (const monster of monsters) {
                this.actions.set(monster, action);
            }
        }
        return this;
    }
    /**
     * Check if the provided action was requested for any monsters, or for the
     * general action.
     */
    can(action) {
        if (action === this.default_action)
            return true;
        return Array.from(this.actions.values()).includes(action);
    }
    /**
     * Return the general action (if it exists).
     */
    getDefaultAction() {
        return this.default_action;
    }
    /**
     * Return all monsters where the provided action was requested.
     */
    where(action) {
        return Array.from(this.actions.keys()).filter((key) => this.actions.get(key) === action);
    }
    /**
     * Return the requested action (if it exists) for the provided monster.
     */
    currentStrategy(monster) {
        var _a;
        return (_a = this.actions.get(monster)) !== null && _a !== void 0 ? _a : this.default_action;
    }
    /**
     * Perform a deep copy of this combat strategy.
     */
    clone() {
        const result = { ...this };
        if (result.default_macro)
            result.default_macro = [...result.default_macro];
        for (const pair of this.macros)
            result.macros.set(pair[0], [...pair[1]]);
        for (const pair of this.actions)
            result.actions.set(pair[0], pair[1]);
        return result;
    }
    /**
     * Compile this combat strategy into a complete macro.
     *
     * @param resources The resources to use to fulfil actions.
     * @param defaults Macros to perform for each action without a resource.
     * @param location The adventuring location, if known.
     * @returns The compiled macro.
     */
    compile(resources, defaults, location) {
        var _a, _b;
        const result = new Macro();
        // If there is macro precursor, do it now
        if (this.starting_macro) {
            result.step(undelay(this.starting_macro));
        }
        // Perform any monster-specific macros (these may or may not end the fight)
        const monster_macros = new CompressedMacro();
        this.macros.forEach((value, key) => {
            monster_macros.add(key, new Macro().step(...value.map(undelay)));
        });
        result.step(monster_macros.compile());
        // Perform any monster-specific actions
        const monster_actions = new CompressedMacro();
        this.actions.forEach((action, key) => {
            var _a, _b;
            const macro = (_a = resources.getMacro(action)) !== null && _a !== void 0 ? _a : (_b = defaults === null || defaults === void 0 ? void 0 : defaults[action]) === null || _b === void 0 ? void 0 : _b.call(defaults, key);
            if (macro)
                monster_actions.add(key, new Macro().step(macro));
        });
        result.step(monster_actions.compile());
        // Perform the non-monster specific macro
        if (this.default_macro)
            result.step(...this.default_macro.map(undelay));
        // Perform the non-monster specific action
        if (this.default_action) {
            const macro = (_a = resources.getMacro(this.default_action)) !== null && _a !== void 0 ? _a : (_b = defaults === null || defaults === void 0 ? void 0 : defaults[this.default_action]) === null || _b === void 0 ? void 0 : _b.call(defaults, location);
            if (macro)
                result.step(macro);
        }
        return result;
    }
    /**
     * For advanced users, this method will generate a fluent API for requesting
     * actions. That is, it allows you to do
     *   combat.banish(monster1).kill(monster2)
     * instead of
     *   combat.action("banish", monster1).action("kill", monster2)
     *
     * Example usage:
     *   const myActions = ["kill", "banish"] as const;
     *   class MyCombatStrategy extends CombatStrategy.withActions(myActions) {}
     *
     *   const foo: MyCombatStrategy = new MyCombatStrategy();
     *   const bar: MyCombatStrategy = foo.banish($monster`crate`).kill($monster`tumbleweed`);
     */
    static withActions(actions) {
        class CombatStrategyWithActions extends this {
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const proto = CombatStrategyWithActions.prototype;
        for (const action of actions) {
            proto[action] = function (monsters) {
                return this.action(action, monsters);
            };
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return CombatStrategyWithActions;
    }
}
/**
 * A class to build a macro that combines if statements (keyed on monster) with
 * identical body into a single if statement, to avoid the 37-action limit.
 * Ex: [if x; A; if y; B; if z; A;] will turn into [if x || z; A; if y; B]
 */
class CompressedMacro {
    constructor() {
        this.components = new Map();
    }
    /**
     * Set the macro for a given monster (replacing any previous macros).
     */
    add(monster, macro) {
        var _a;
        const macro_text = macro.toString();
        if (macro_text.length === 0)
            return;
        if (!this.components.has(macro_text))
            this.components.set(macro_text, [monster]);
        else
            (_a = this.components.get(macro_text)) === null || _a === void 0 ? void 0 : _a.push(monster);
    }
    /**
     * Compile the compressed form of the macro.
     */
    compile() {
        let result = new Macro();
        this.components.forEach((monsters, macro) => {
            const condition = monsters.map((mon) => `monsterid ${mon.id}`).join(" || ");
            result = result.if_(condition, macro);
        });
        return result;
    }
}
/**
 * A class for providing resources to fulfil combat actions.
 */
export class CombatResources {
    constructor() {
        this.resources = new Map();
    }
    /**
     * Use the provided resource to fulfil the provided action.
     * (If the resource is undefined, this does nothing).
     */
    provide(action, resource) {
        if (resource === undefined)
            return;
        this.resources.set(action, resource);
    }
    /**
     * Return true if the provided action has a resource provided.
     */
    has(action) {
        return this.resources.has(action);
    }
    /**
     * Return all provided combat resources.
     */
    all() {
        return Array.from(this.resources.values());
    }
    /**
     * Get the macro provided by the resource for this action, or undefined if
     * no resource was provided.
     */
    getMacro(action) {
        const resource = this.resources.get(action);
        if (resource === undefined)
            return undefined;
        if (resource.do instanceof Item)
            return new Macro().item(resource.do);
        if (resource.do instanceof Skill)
            return new Macro().skill(resource.do);
        return resource.do;
    }
}

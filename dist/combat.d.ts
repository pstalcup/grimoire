import { Item, Location, Monster, Skill } from "kolmafia";
import { Macro } from "libram";
/**
 * A macro, or something that can become a macro.
 * The function will be called after the outfit has been equipped,
 * but before any task-specific preparation.
 */
export declare type DelayedMacro = Macro | (() => Macro);
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
export declare class CombatStrategy<A extends string = never> {
    private starting_macro?;
    private default_macro?;
    private macros;
    private default_action?;
    private actions;
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
    macro(macro: DelayedMacro, monsters?: Monster[] | Monster, prepend?: boolean): this;
    /**
     * Add a macro to perform at the start of combat.
     * @param macro The macro to perform.
     * @returns this
     */
    startingMacro(macro: DelayedMacro): this;
    /**
     * Add an action to perform for this monster. Only one action can be set for
     * each monster; any previous actions are overwritten.
     *
     * @param action The action to perform.
     * @param monsters Which monsters to use the action on. If not given, set the
     *  action as the general action for all monsters.
     * @returns this
     */
    action(action: A, monsters?: Monster[] | Monster): this;
    /**
     * Check if the provided action was requested for any monsters, or for the
     * general action.
     */
    can(action: A): boolean;
    /**
     * Return the general action (if it exists).
     */
    getDefaultAction(): A | undefined;
    /**
     * Return all monsters where the provided action was requested.
     */
    where(action: A): Monster[];
    /**
     * Return the requested action (if it exists) for the provided monster.
     */
    currentStrategy(monster: Monster): A | undefined;
    /**
     * Perform a deep copy of this combat strategy.
     */
    clone(): this;
    /**
     * Compile this combat strategy into a complete macro.
     *
     * @param resources The resources to use to fulfil actions.
     * @param defaults Macros to perform for each action without a resource.
     * @param location The adventuring location, if known.
     * @returns The compiled macro.
     */
    compile(resources: CombatResources<A>, defaults: ActionDefaults<A> | undefined, location: Location | undefined): Macro;
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
    static withActions<A extends string>(actions: readonly A[]): Constructor<CombatStrategyWith<A>>;
}
/**
 * Get the default macro for each defined action.
 */
export declare type ActionDefaults<A extends string> = Record<A, (target: Monster | Location | undefined) => Macro>;
/**
 * Type voodoo to support CombatStrategy.withActions
 */
declare type Constructor<T> = new () => T;
export declare type CombatStrategyWith<A extends string> = {
    [k in A as k extends keyof CombatStrategy<A> ? never : k]: (monsters?: Monster[] | Monster) => CombatStrategyWith<A>;
} & CombatStrategy<A>;
/**
 * An interface specifying a resource to be used for fulfilling an action.
 */
export interface CombatResource {
    prepare?: () => void;
    do: Item | Skill | Macro;
}
/**
 * A class for providing resources to fulfil combat actions.
 */
export declare class CombatResources<A extends string> {
    private resources;
    /**
     * Use the provided resource to fulfil the provided action.
     * (If the resource is undefined, this does nothing).
     */
    provide(action: A, resource: CombatResource | undefined): void;
    /**
     * Return true if the provided action has a resource provided.
     */
    has(action: A): boolean;
    /**
     * Return all provided combat resources.
     */
    all(): CombatResource[];
    /**
     * Get the macro provided by the resource for this action, or undefined if
     * no resource was provided.
     */
    getMacro(action: A): Macro | undefined;
}
export {};

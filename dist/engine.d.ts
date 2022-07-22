import { Task } from "./task";
import { PropertiesManager } from "libram";
import { Outfit } from "./outfit";
import { ActionDefaults, CombatResources, CombatStrategy } from "./combat";
export declare class EngineOptions<A extends string = never> {
    combat_defaults?: ActionDefaults<A>;
}
export declare class Engine<A extends string = never, T extends Task<A> = Task<A>> {
    tasks: T[];
    options: EngineOptions<A>;
    attempts: {
        [task_name: string]: number;
    };
    propertyManager: PropertiesManager;
    tasks_by_name: Map<string, T>;
    /**
     * Create the engine.
     * @param tasks A list of tasks for looking up task dependencies.
     * @param options Basic configuration of the engine.
     */
    constructor(tasks: T[], options?: EngineOptions<A>);
    /**
     * Check if the given task is available at this moment.
     * @returns true if all dependencies are complete and the task is ready.
     *  Note that dependencies are not checked transitively. That is, if
     *  A depends on B which depends on C, then A is ready if B is complete
     *  (regardless of if C is complete or not).
     */
    available(task: T): boolean;
    /**
     * Perform all steps to execute the provided task.
     * This is the main entry point for the Engine.
     * @param task The current executing task.
     */
    execute(task: T): void;
    /**
     * Acquire all items for the task.
     * @param task The current executing task.
     */
    acquireItems(task: T): void;
    /**
     * Create an outfit for the task with all required equipment.
     * @param task The current executing task.
     */
    createOutfit(task: T): Outfit;
    /**
     * Equip the outfit for the task.
     * @param task The current executing task.
     * @param outfit The outfit for the task, possibly augmented by the engine.
     */
    dress(task: T, outfit: Outfit): void;
    /**
     * Perform any engine-specific customization for the outfit and combat plan.
     *
     * This is a natural method to override in order to:
     *   * Enable the use of any resources in the outfit or combat (e.g., allocate banishers).
     *   * Equip a default outfit.
     *   * Determine additional monster macros at a global level (e.g., use flyers).
     * @param task The current executing task.
     * @param outfit The outfit for the task.
     * @param combat The combat strategy so far for the task.
     * @param resources The combat resources assigned so far for the task.
     */
    customize(task: T, outfit: Outfit, combat: CombatStrategy<A>, resources: CombatResources<A>): void;
    /**
     * Set the choice settings for the task.
     * @param task The current executing task.
     * @param manager The property manager to use.
     */
    setChoices(task: T, manager: PropertiesManager): void;
    /**
     * Do any task-specific preparation.
     * @param task The current executing task.
     */
    prepare(task: T): void;
    /**
     * Actually perform the task.
     * @param task The current executing task.
     */
    do(task: T): void;
    /**
     * Check if the task.do should be immediately repeated without any prep.
     *
     * By default, this is only used to repeat a task if we hit one of:
     *   1. Halloweener dog noncombats,
     *   2. June cleaver noncombats, or
     *   3. Lil' Doctor™ bag noncombt.
     * @param task The current executing task.
     * @returns True if the task should be immediately repeated.
     */
    shouldRepeatAdv(task: T): boolean;
    /**
     * Do any task-specific wrapup activities.
     * @param task The current executing task.
     */
    post(task: T): void;
    /**
     * Mark that an attempt was made on the current task.
     * @param task The current executing task.
     */
    markAttempt(task: T): void;
    /**
     * Check if the task has passed any of its internal limits.
     * @param task The task to check.
     * @throws An error if any of the internal limits have been passed.
     */
    checkLimits(task: T): void;
    /**
     * Initialize properties for the script.
     * @param manager The properties manager to use.
     */
    initPropertiesManager(manager: PropertiesManager): void;
}
export declare const wanderingNCs: Set<string>;
/**
 * Return true if the last adv was one of:
 *   1. Halloweener dog noncombats,
 *   2. June cleaver noncombats, or
 *   3. Lil' Doctor™ bag noncombt.
 */
export declare function lastEncounterWasWanderingNC(): boolean;

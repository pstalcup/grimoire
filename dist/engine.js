import { get, PropertiesManager } from "libram";
import { adv1, buy, choiceFollowsFight, equippedAmount, inMultiFight, itemAmount, Location, retrieveItem, runChoice, runCombat, } from "kolmafia";
import { Outfit } from "./outfit";
import { CombatResources, CombatStrategy } from "./combat";
export class EngineOptions {
}
export class Engine {
    /**
     * Create the engine.
     * @param tasks A list of tasks for looking up task dependencies.
     * @param options Basic configuration of the engine.
     */
    constructor(tasks, options) {
        this.attempts = {};
        this.propertyManager = new PropertiesManager();
        this.tasks_by_name = new Map();
        this.tasks = tasks;
        this.options = options !== null && options !== void 0 ? options : {};
        for (const task of tasks) {
            this.tasks_by_name.set(task.name, task);
        }
        this.initPropertiesManager(this.propertyManager);
    }
    /**
     * Check if the given task is available at this moment.
     * @returns true if all dependencies are complete and the task is ready.
     *  Note that dependencies are not checked transitively. That is, if
     *  A depends on B which depends on C, then A is ready if B is complete
     *  (regardless of if C is complete or not).
     */
    available(task) {
        var _a;
        for (const after of (_a = task.after) !== null && _a !== void 0 ? _a : []) {
            const after_task = this.tasks_by_name.get(after);
            if (after_task === undefined)
                throw `Unknown task dependency ${after} on ${task.name}`;
            if (!after_task.completed())
                return false;
        }
        if (task.ready && !task.ready())
            return false;
        if (task.completed())
            return false;
        return true;
    }
    /**
     * Perform all steps to execute the provided task.
     * This is the main entry point for the Engine.
     * @param task The current executing task.
     */
    execute(task) {
        var _a, _b, _c;
        // Acquire any items first, possibly for later execution steps.
        this.acquireItems(task);
        // Prepare the outfit, with resources.
        const task_combat = (_a = task.combat) !== null && _a !== void 0 ? _a : new CombatStrategy();
        const outfit = this.createOutfit(task);
        const task_resources = new CombatResources();
        this.customize(task, outfit, task_combat, task_resources);
        this.dress(task, outfit);
        // Prepare combat and choices
        const macro = task_combat.compile(task_resources, (_b = this.options) === null || _b === void 0 ? void 0 : _b.combat_defaults, task.do instanceof Location ? task.do : undefined);
        macro.save();
        this.setChoices(task, this.propertyManager);
        // Actually perform the task
        for (const resource of task_resources.all())
            (_c = resource.prepare) === null || _c === void 0 ? void 0 : _c.call(resource);
        this.prepare(task);
        this.do(task);
        while (this.shouldRepeatAdv(task))
            this.do(task);
        this.post(task);
        // Mark that we tried the task, and apply limits
        this.markAttempt(task);
        if (!task.completed())
            this.checkLimits(task);
    }
    /**
     * Acquire all items for the task.
     * @param task The current executing task.
     */
    acquireItems(task) {
        var _a;
        for (const to_get of task.acquire || []) {
            const num_needed = (_a = to_get.num) !== null && _a !== void 0 ? _a : 1;
            const num_have = itemAmount(to_get.item) + equippedAmount(to_get.item);
            if (num_needed <= num_have)
                continue;
            if (to_get.useful !== undefined && !to_get.useful())
                continue;
            if (to_get.get) {
                to_get.get();
            }
            else if (to_get.price !== undefined) {
                buy(to_get.item, num_needed - num_have, to_get.price);
            }
            else {
                retrieveItem(to_get.item, num_needed);
            }
            if (itemAmount(to_get.item) + equippedAmount(to_get.item) < num_needed && !to_get.optional) {
                throw `Task ${task.name} was unable to acquire ${num_needed} ${to_get.item}`;
            }
        }
    }
    /**
     * Create an outfit for the task with all required equipment.
     * @param task The current executing task.
     */
    createOutfit(task) {
        var _a, _b;
        const spec = typeof task.outfit === "function" ? task.outfit() : task.outfit;
        const outfit = new Outfit();
        for (const item of (_a = spec === null || spec === void 0 ? void 0 : spec.equip) !== null && _a !== void 0 ? _a : [])
            outfit.equip(item);
        if (spec === null || spec === void 0 ? void 0 : spec.familiar)
            outfit.equip(spec.familiar);
        outfit.avoid = spec === null || spec === void 0 ? void 0 : spec.avoid;
        outfit.skipDefaults = (_b = spec === null || spec === void 0 ? void 0 : spec.skipDefaults) !== null && _b !== void 0 ? _b : false;
        return outfit;
    }
    /**
     * Equip the outfit for the task.
     * @param task The current executing task.
     * @param outfit The outfit for the task, possibly augmented by the engine.
     */
    dress(task, outfit) {
        outfit.dress();
    }
    /* eslint-disable @typescript-eslint/no-unused-vars */
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
    customize(task, outfit, combat, resources) {
        // do nothing by default
    }
    /* eslint-enable @typescript-eslint/no-unused-vars */
    /**
     * Set the choice settings for the task.
     * @param task The current executing task.
     * @param manager The property manager to use.
     */
    setChoices(task, manager) {
        const choices = {};
        for (const choice_id_str in task.choices) {
            const choice_id = parseInt(choice_id_str);
            const choice = task.choices[choice_id];
            if (typeof choice === "number")
                choices[choice_id] = choice;
            else
                choices[choice_id] = choice();
        }
        manager.setChoices(choices);
    }
    /**
     * Do any task-specific preparation.
     * @param task The current executing task.
     */
    prepare(task) {
        var _a;
        (_a = task.prepare) === null || _a === void 0 ? void 0 : _a.call(task);
    }
    /**
     * Actually perform the task.
     * @param task The current executing task.
     */
    do(task) {
        if (typeof task.do === "function") {
            task.do();
        }
        else {
            adv1(task.do, 0, "");
        }
        runCombat();
        while (inMultiFight())
            runCombat();
        if (choiceFollowsFight())
            runChoice(-1);
    }
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
    shouldRepeatAdv(task) {
        return task.do instanceof Location && lastEncounterWasWanderingNC();
    }
    /**
     * Do any task-specific wrapup activities.
     * @param task The current executing task.
     */
    post(task) {
        var _a;
        (_a = task.post) === null || _a === void 0 ? void 0 : _a.call(task);
    }
    /**
     * Mark that an attempt was made on the current task.
     * @param task The current executing task.
     */
    markAttempt(task) {
        if (!(task.name in this.attempts))
            this.attempts[task.name] = 0;
        this.attempts[task.name]++;
    }
    /**
     * Check if the task has passed any of its internal limits.
     * @param task The task to check.
     * @throws An error if any of the internal limits have been passed.
     */
    checkLimits(task) {
        if (!task.limit)
            return;
        const failureMessage = task.limit.message ? ` ${task.limit.message}` : "";
        if (task.limit.tries && this.attempts[task.name] >= task.limit.tries)
            throw `Task ${task.name} did not complete within ${task.limit.tries} attempts. Please check what went wrong.${failureMessage}`;
        if (task.limit.soft && this.attempts[task.name] >= task.limit.soft)
            throw `Task ${task.name} did not complete within ${task.limit.soft} attempts. Please check what went wrong (you may just be unlucky).${failureMessage}`;
        if (task.limit.turns && task.do instanceof Location && task.do.turnsSpent >= task.limit.turns)
            throw `Task ${task.name} did not complete within ${task.limit.turns} turns. Please check what went wrong.${failureMessage}`;
    }
    /**
     * Initialize properties for the script.
     * @param manager The properties manager to use.
     */
    initPropertiesManager(manager) {
        // Properties adapted from garbo
        manager.set({
            logPreferenceChange: true,
            logPreferenceChangeFilter: [
                ...new Set([
                    ...get("logPreferenceChangeFilter").split(","),
                    "libram_savedMacro",
                    "maximizerMRUList",
                    "testudinalTeachings",
                    "_lastCombatStarted",
                ]),
            ]
                .sort()
                .filter((a) => a)
                .join(","),
            battleAction: "custom combat script",
            autoSatisfyWithMall: true,
            autoSatisfyWithNPCs: true,
            autoSatisfyWithCoinmasters: true,
            autoSatisfyWithStash: false,
            dontStopForCounters: true,
            maximizerFoldables: true,
            hpAutoRecovery: "0.0",
            hpAutoRecoveryTarget: "0.0",
            mpAutoRecovery: "0.0",
            mpAutoRecoveryTarget: "0.0",
            afterAdventureScript: "",
            betweenBattleScript: "",
            choiceAdventureScript: "",
            familiarScript: "",
            currentMood: "apathetic",
            autoTuxedo: true,
            autoPinkyRing: true,
            autoGarish: true,
            allowNonMoodBurning: false,
            allowSummonBurning: true,
            libramSkillsSoftcore: "none",
        });
    }
}
export const wanderingNCs = new Set([
    "Wooof! Wooooooof!",
    "Playing Fetch*",
    "A Pound of Cure",
    "Aunts not Ants",
    "Bath Time",
    "Beware of Aligator",
    "Delicious Sprouts",
    "Hypnotic Master",
    "Lost and Found",
    "Poetic Justice",
    "Summer Days",
    "Teacher's Pet",
]);
/**
 * Return true if the last adv was one of:
 *   1. Halloweener dog noncombats,
 *   2. June cleaver noncombats, or
 *   3. Lil' Doctor™ bag noncombt.
 */
export function lastEncounterWasWanderingNC() {
    return wanderingNCs.has(get("lastEncounter"));
}

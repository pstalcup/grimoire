export function getTasks(quests, implicitAfter = false) {
    var _a, _b;
    const result = [];
    for (const quest of quests) {
        for (const task of quest.tasks) {
            // Include quest name in task names and dependencies (unless dependency quest is given)
            task.name = `${quest.name}/${task.name}`;
            task.after = (_a = task.after) === null || _a === void 0 ? void 0 : _a.map((after) => after.includes("/") ? after : `${quest.name}/${after}`);
            // Include previous task as a dependency
            if (implicitAfter && task.after === undefined && result.length > 0)
                task.after = [result[result.length - 1].name];
            result.push(task);
        }
    }
    // Verify the dependency names of all tasks
    const names = new Set();
    for (const task of result)
        names.add(task.name);
    for (const task of result) {
        for (const after of (_b = task.after) !== null && _b !== void 0 ? _b : []) {
            if (!names.has(after)) {
                throw `Unknown task dependency ${after} of ${task.name}`;
            }
        }
    }
    return result;
}
export function orderByRoute(tasks, routing, ignore_missing_tasks) {
    const priorities = new Map();
    for (const task of tasks) {
        priorities.set(task.name, [1000, task]);
    }
    // Prioritize the routing list of tasks first
    function setPriorityRecursive(task, priority) {
        var _a;
        const old_priority = priorities.get(task);
        if (old_priority === undefined) {
            if (ignore_missing_tasks)
                return;
            throw `Unknown routing task ${task}`;
        }
        if (old_priority[0] <= priority)
            return;
        priorities.set(task, [priority, old_priority[1]]);
        for (const requirement of (_a = old_priority[1].after) !== null && _a !== void 0 ? _a : []) {
            setPriorityRecursive(requirement, priority - 0.01);
        }
    }
    for (let i = 0; i < routing.length; i++) {
        setPriorityRecursive(routing[i], i);
    }
    // Sort all tasks by priority.
    // Since this sort is stable, we default to earlier tasks.
    const result = tasks.slice();
    result.sort((a, b) => (priorities.get(a.name) || [1000])[0] - (priorities.get(b.name) || [1000])[0]);
    return result;
}

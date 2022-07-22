import { printHtml } from "kolmafia";
import { get } from "libram";
export class Args {
    static custom(spec, parser, valueHelpName) {
        if ("default" in spec && spec.options) {
            if (!spec.options.map((option) => option[0]).includes(spec.default)) {
                throw `Invalid default value ${spec.default}`;
            }
        }
        return {
            ...spec,
            valueHelpName: valueHelpName,
            parser: parser,
        };
    }
    static string(spec) {
        return this.custom(spec, (value) => value, "TEXT");
    }
    static number(spec) {
        return this.custom(spec, (value) => (isNaN(Number(value)) ? undefined : Number(value)), "NUMBER");
    }
    static boolean(spec) {
        return this.custom(spec, (value) => {
            if (value.toLowerCase() === "true")
                return true;
            if (value.toLowerCase() === "false")
                return false;
            return undefined;
        }, "BOOLEAN");
    }
    static flag(spec) {
        return this.custom(spec, (value) => {
            if (value.toLowerCase() === "true")
                return true;
            if (value.toLowerCase() === "false")
                return false;
            return undefined;
        }, "FLAG");
    }
    /**
     * Create a set of input arguments for a script.
     * @param scriptName Prefix for property names; often the name of the script.
     * @param scriptHelp Brief description of this script, for the help message.
     * @param args A JS object specifying the script arguments. Its values should
     *    be {@link Arg} objects (created by Args.string, Args.number, or others).
     * @returns An object which can hold parsed argument values. The keys of this
     *    object are identical to the keys in 'args'.
     */
    static create(scriptName, scriptHelp, args) {
        var _a, _b;
        for (const k in args) {
            if (k === "help" || args[k].key === "help")
                throw `help is a reserved argument name`;
        }
        const argsWithHelp = {
            ...args,
            help: this.flag({ help: "Show this message and exit.", setting: "" }),
        };
        const res = {
            [specSymbol]: argsWithHelp,
            [scriptSymbol]: scriptName,
            [scriptHelpSymbol]: scriptHelp,
        };
        // Fill the default values for each argument.
        for (const k in argsWithHelp) {
            const v = argsWithHelp[k];
            if ("default" in v)
                res[k] = v["default"];
            else
                res[k] = undefined;
        }
        // Parse values from settings.
        for (const k in argsWithHelp) {
            const setting = (_a = argsWithHelp[k].setting) !== null && _a !== void 0 ? _a : `${scriptName}_${(_b = argsWithHelp[k].key) !== null && _b !== void 0 ? _b : k}`;
            if (setting === "")
                continue; // no setting
            const value_str = get(setting, "");
            if (value_str === "")
                continue;
            res[k] = parseAndValidate(argsWithHelp[k], `Setting ${setting}`, value_str);
        }
        return res;
    }
    /**
     * Parse the command line input into the provided script arguments.
     * @param args An object to hold the parsed argument values, from Args.create(*).
     * @param command The command line input.
     */
    static fill(args, command) {
        var _a, _b, _c;
        if (command === undefined || command === "")
            return;
        const spec = args[specSymbol];
        const keys = new Set();
        const flags = new Set();
        for (const k in spec) {
            if (spec[k].valueHelpName === "FLAG")
                flags.add((_a = spec[k].key) !== null && _a !== void 0 ? _a : k);
            else
                keys.add((_b = spec[k].key) !== null && _b !== void 0 ? _b : k);
        }
        // Parse new argments from the command line
        const parsed = new CommandParser(command, keys, flags).parse();
        for (const k in spec) {
            const key = (_c = spec[k].key) !== null && _c !== void 0 ? _c : k;
            const value_str = parsed.get(key);
            if (value_str === undefined)
                continue;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            args[k] = parseAndValidate(spec[k], `Argument ${key}`, value_str);
        }
    }
    /**
     * Parse command line input into a new set of script arguments.
     * @param scriptName Prefix to use in property names; typically the name of the script.
     * @param scriptHelp Brief description of this script, for the help message.
     * @param spec An object specifying the script arguments.
     * @param command The command line input.
     */
    static parse(scriptName, scriptHelp, spec, command) {
        const args = this.create(scriptName, scriptHelp, spec);
        this.fill(args, command);
        return args;
    }
    /**
     * Print a description of the script arguments to the CLI.
     * @param args An object of parsed arguments, from Args.create(*).
     * @param maxOptionsToDisplay If given, do not list more than this many options for each arg.
     */
    static showHelp(args, maxOptionsToDisplay) {
        var _a, _b, _c, _d, _e;
        const spec = args[specSymbol];
        const scriptName = args[scriptSymbol];
        const scriptHelp = args[scriptHelpSymbol];
        printHtml(`${scriptHelp}`);
        printHtml(`<font color='blue'><b>Options:</b></font>`);
        for (const k in spec) {
            const arg = spec[k];
            if (arg.hidden)
                continue;
            const nameText = `<font color='blue'>${(_a = arg.key) !== null && _a !== void 0 ? _a : k}</font>`;
            const valueText = arg.valueHelpName === "FLAG" ? "" : `<font color='purple'>${arg.valueHelpName}</font>`;
            const helpText = (_b = arg.help) !== null && _b !== void 0 ? _b : "";
            const defaultText = "default" in arg ? `<font color='#888888'>[default: ${arg.default}]</font>` : "";
            const settingText = arg.setting === ""
                ? ""
                : `<font color='#888888'>[setting: ${(_c = arg.setting) !== null && _c !== void 0 ? _c : `${scriptName}_${(_d = arg.key) !== null && _d !== void 0 ? _d : k}`}]</font>`;
            printHtml(`&nbsp;&nbsp;${[nameText, valueText, "-", helpText, defaultText, settingText].join(" ")}`);
            const valueOptions = (_e = arg.options) !== null && _e !== void 0 ? _e : [];
            if (valueOptions.length < (maxOptionsToDisplay !== null && maxOptionsToDisplay !== void 0 ? maxOptionsToDisplay : Number.MAX_VALUE)) {
                for (const option of valueOptions) {
                    if (option.length === 1) {
                        printHtml(`&nbsp;&nbsp;&nbsp;&nbsp;<font color='blue'>${nameText}</font> ${option[0]}`);
                    }
                    else {
                        printHtml(`&nbsp;&nbsp;&nbsp;&nbsp;<font color='blue'>${nameText}</font> ${option[0]} - ${option[1]}`);
                    }
                }
            }
        }
    }
}
/**
 * Metadata for the parsed arguments.
 *
 * This information is hidden within the parsed argument object so that it
 * is invisible to the user but available to fill(*) and showHelp(*).
 */
const specSymbol = Symbol("spec");
const scriptSymbol = Symbol("script");
const scriptHelpSymbol = Symbol("scriptHelp");
/**
 * Parse a string into a value for a given argument, throwing if the parsing fails.
 * @param arg An argument that takes values in T.
 * @param source A description of where this value came from, for the error message.
 * @param value The value to parse.
 * @returns the parsed value.
 */
function parseAndValidate(arg, source, value) {
    const parsed_value = arg.parser(value);
    if (parsed_value === undefined)
        throw `${source} could not parse value: ${value}`;
    const options = arg.options;
    if (options) {
        if (!options.map((option) => option[0]).includes(parsed_value)) {
            throw `${source} received invalid value: ${value}`;
        }
    }
    return parsed_value;
}
/**
 * A parser to extract key/value pairs from a command line input.
 * @member command The command line input.
 * @member keys The set of valid keys that can appear.
 * @member flags The set of valid flags that can appear.
 * @member index An internal marker for the progress of the parser over the input.
 */
class CommandParser {
    constructor(command, keys, flags) {
        this.command = command;
        this.index = 0;
        this.keys = keys;
        this.flags = flags;
    }
    /**
     * Perform the parsing of (key, value) pairs.
     * @returns The set of extracted (key, value) pairs.
     */
    parse() {
        this.index = 0; // reset the parser
        const result = new Map();
        while (!this.finished()) {
            // A flag F may appear as !F to be parsed as false.
            let parsing_negative_flag = false;
            if (this.peek() === "!") {
                parsing_negative_flag = true;
                this.consume(["!"]);
            }
            const key = this.parseKey();
            if (result.has(key)) {
                throw `Duplicate key: ${key}`;
            }
            if (this.flags.has(key)) {
                // The key corresponds to a flag.
                // Parse [key] as true and ![key] as false.
                result.set(key, parsing_negative_flag ? "false" : "true");
                if (this.peek() === "=")
                    throw `Flag ${key} cannot be assigned a value`;
                if (!this.finished())
                    this.consume([" "]);
            }
            else {
                // Parse [key]=[value] or [key] [value]
                this.consume(["=", " "]);
                const value = this.parseValue();
                if (!this.finished())
                    this.consume([" "]);
                result.set(key, value);
            }
        }
        return result;
    }
    /**
     * @returns True if the entire command has been parsed.
     */
    finished() {
        return this.index >= this.command.length;
    }
    /**
     * @returns The next character to parse, if it exists.
     */
    peek() {
        if (this.index >= this.command.length)
            return undefined;
        return this.command.charAt(this.index);
    }
    /**
     * Advance the internal marker over the next expected character.
     * Throws an error on unexpected characters.
     *
     * @param allowed Characters that are expected.
     */
    consume(allowed) {
        var _a;
        if (this.finished())
            throw `Expected ${allowed}`;
        if (allowed.includes((_a = this.peek()) !== null && _a !== void 0 ? _a : "")) {
            this.index += 1;
        }
    }
    /**
     * Find the next occurance of one of the provided characters, or the end of
     * the string if the characters never appear again.
     *
     * @param searchValue The characters to locate.
     */
    findNext(searchValue) {
        let result = this.command.length;
        for (const value of searchValue) {
            const index = this.command.indexOf(value, this.index);
            if (index !== -1 && index < result)
                result = index;
        }
        return result;
    }
    /**
     * Starting from the internal marker, parse a single key.
     * This also advances the internal marker.
     *
     * @returns The next key.
     */
    parseKey() {
        const keyEnd = this.findNext(["=", " "]);
        const key = this.command.substring(this.index, keyEnd);
        this.index = keyEnd;
        if (!this.keys.has(key) && !this.flags.has(key)) {
            throw `Unknown key: ${key}`;
        }
        return key;
    }
    /**
     * Starting from the internal marker, parse a single value.
     * This also advances the internal marker.
     *
     * Values are a single word or enclosed in matching quotes, i.e. one of:
     *    "[^"]*"
     *    '[^']*"
     *    [^'"][^ ]*
     *
     * @returns The next value.
     */
    parseValue() {
        var _a, _b;
        let valueEnder = " ";
        const quotes = ["'", '"'];
        if (quotes.includes((_a = this.peek()) !== null && _a !== void 0 ? _a : "")) {
            valueEnder = (_b = this.peek()) !== null && _b !== void 0 ? _b : ""; // The value is everything until the next quote
            this.consume([valueEnder]); // Consume opening quote
        }
        const valueEnd = this.findNext([valueEnder]);
        const value = this.command.substring(this.index, valueEnd);
        if (valueEnder !== " " && valueEnd === this.command.length) {
            throw `No closing ${valueEnder} found for ${valueEnder}${value}`;
        }
        // Consume the value (and closing quote)
        this.index = valueEnd;
        if (valueEnder !== " ")
            this.consume([valueEnder]);
        return value;
    }
}

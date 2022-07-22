/**
 * Specification for an argument that takes values in T.
 * @member key The key to use when parsing this argument.
 * @member help Description for the help text.
 * @member options An array of allowable values for this argument.
 *    Each entry has an optional description for the help text as well.
 * @member setting A setting to use for this argument. If not given,
 *    ${script name}_${argument name} is used; set to "" for no setting.
 *    A value in this setting is used as the new default for this argument,
 *    and can be overridden by a command line argument.
 * @member hidden If true, do not display this option in the help text.
 * @member default A default value to use if no value is provided.
 *    Note that 'default' is effectively optional, as all methods that take
 *    an ArgSpec allow for 'default' to be omitted. But it is typed as
 *    non-optional here to enable cool type inference voodoo.
 */
interface ArgSpec<T> {
    key?: Exclude<string, "help">;
    help?: string;
    options?: [T, string?][];
    setting?: string;
    hidden?: boolean;
    default: T;
}
/**
 * Allow the default argument to be optional, in a way that allows for cool type inference.
 */
declare type ArgSpecNoDefault<T> = Omit<ArgSpec<T>, "default">;
export declare class Args {
    /**
     * Create an argument for a custom type.
     * @param spec Specification for this argument.
     * @param parser A function to parse a string value into the proper type.
     * @param valueName The name of this type, for the help text.
     * @returns An argument.
     */
    static custom<T>(spec: ArgSpec<T>, parser: Parser<T>, valueName: string): Arg<T>;
    static custom<T>(spec: ArgSpecNoDefault<T>, parser: Parser<T>, valueHelpName: string): ArgNoDefault<T>;
    /**
     * Create a string argument.
     * @param spec Specification for this argument. See {@link ArgSpec} for details.
     */
    static string(spec: ArgSpec<string>): Arg<string>;
    static string(spec: ArgSpecNoDefault<string>): ArgNoDefault<string>;
    /**
     * Create a number argument.
     * @param spec Specification for this argument. See {@link ArgSpec} for details.
     */
    static number(spec: ArgSpec<number>): Arg<number>;
    static number(spec: ArgSpecNoDefault<number>): ArgNoDefault<number>;
    /**
     * Create a boolean argument.
     * @param spec Specification for this argument. See {@link ArgSpec} for details.
     */
    static boolean(spec: ArgSpec<boolean>): Arg<boolean>;
    static boolean(spec: ArgSpecNoDefault<boolean>): ArgNoDefault<boolean>;
    /**
     * Create a flag.
     * @param spec Specification for this argument. See {@link ArgSpec} for details.
     */
    static flag(spec: ArgSpec<boolean>): Arg<boolean>;
    static flag(spec: ArgSpecNoDefault<boolean>): ArgNoDefault<boolean>;
    /**
     * Create a set of input arguments for a script.
     * @param scriptName Prefix for property names; often the name of the script.
     * @param scriptHelp Brief description of this script, for the help message.
     * @param args A JS object specifying the script arguments. Its values should
     *    be {@link Arg} objects (created by Args.string, Args.number, or others).
     * @returns An object which can hold parsed argument values. The keys of this
     *    object are identical to the keys in 'args'.
     */
    static create<T extends ArgMap>(scriptName: string, scriptHelp: string, args: T): ParsedArgs<T> & {
        help: boolean;
    };
    /**
     * Parse the command line input into the provided script arguments.
     * @param args An object to hold the parsed argument values, from Args.create(*).
     * @param command The command line input.
     */
    static fill<T extends ArgMap>(args: ParsedArgs<T>, command: string | undefined): void;
    /**
     * Parse command line input into a new set of script arguments.
     * @param scriptName Prefix to use in property names; typically the name of the script.
     * @param scriptHelp Brief description of this script, for the help message.
     * @param spec An object specifying the script arguments.
     * @param command The command line input.
     */
    static parse<T extends ArgMap>(scriptName: string, scriptHelp: string, spec: T, command: string): ParsedArgs<T>;
    /**
     * Print a description of the script arguments to the CLI.
     * @param args An object of parsed arguments, from Args.create(*).
     * @param maxOptionsToDisplay If given, do not list more than this many options for each arg.
     */
    static showHelp<T extends ArgMap>(args: ParsedArgs<T>, maxOptionsToDisplay?: number): void;
}
/**
 * A parser that can transform a string value into the desired type.
 * It may return undefined if given an invalid value.
 */
declare type Parser<T> = (value: string) => T | undefined;
/**
 * An argument that takes values in T.
 * @member parser The parser to use to built T values.
 * @member valueHelpName The string name of T, e.g. NUMBER.
 */
interface Arg<T> extends ArgSpec<T> {
    parser: Parser<T>;
    valueHelpName: string;
}
/**
 * Allow the default argument to be optional, in a way that allows for cool type inference.
 */
declare type ArgNoDefault<T> = Omit<Arg<T>, "default">;
/**
 * Metadata for the parsed arguments.
 *
 * This information is hidden within the parsed argument object so that it
 * is invisible to the user but available to fill(*) and showHelp(*).
 */
declare const specSymbol: unique symbol;
declare const scriptSymbol: unique symbol;
declare const scriptHelpSymbol: unique symbol;
declare type ArgMetadata<T extends ArgMap> = {
    [specSymbol]: T;
    [scriptSymbol]: string;
    [scriptHelpSymbol]: string;
};
/**
 * Construct the object type for the parsed arguments with typescript voodoo.
 *
 * The keys for the parsed argument object match the keys from the argument
 * specifications. That is, for each (key: spec) pair in the argument spec
 * object, there is a (key: value) in the parsed argument object.
 *
 * If spec has type Arg<T> (i.e., has a default), then value has type T.
 * If spec has type ArgNoDefault<T>, the value has type T | undefined.
 *
 * Finally, there are hidden keys in ArgMetadata for fill(*) and showHelp(*).
 */
declare type ArgMap = {
    [key: string]: Arg<unknown> | ArgNoDefault<unknown>;
};
declare type ParsedArgs<T extends ArgMap> = {
    [k in keyof T]: T[k] extends Arg<unknown> ? Exclude<ReturnType<T[k]["parser"]>, undefined> : ReturnType<T[k]["parser"]>;
} & ArgMetadata<T>;
export {};

declare module 'neodoc' {
    export interface ParsedArguments {
        [key: string]: string | string[] | boolean;
    }

    export function run(
        usage: string,
        options?: {
            allowUnknown?: boolean,
            argv?: string[],
            dontExit?: boolean,
            env?: { [key: string]: string },
            helpFlags?: string[],
            laxPlacement?: boolean,
            optionsFirst?: boolean,
            repeatableOptions?: boolean,
            requireFlags?: boolean,
            smartOptions?: boolean,
            stopAt?: string[],
            transforms?: {
                postsolve?: ((spec: any) => any)[],
                presolve?: ((spec: any) => any)[],
            },
            version?: string,
            versionFlags?: string[],
        },
    ): ParsedArguments;
}

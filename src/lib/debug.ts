let debugFlag = false;
let nesting = 0;

// Set this to true if you want to enable debugging.
export function debug(newState?: boolean) {
    if (newState !== undefined) {
        debugFlag = newState;
    }

    return debugFlag;
}

export function debugLog(...args: any[]) {
    if (debugFlag) {
        console.log('    '.repeat(nesting), ...args);
    }
}

export function debugNesting(change: number) {
    nesting += change;
}

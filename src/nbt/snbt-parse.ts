import { SnbtData } from './snbt-data';

interface TokenParser {
    pattern: RegExp;
    callback: (
        offset: number,
        snbtData: SnbtData,
        match: RegExpMatchArray
    ) => number;
}

function testParsers(
    snbtData: SnbtData,
    str: string,
    tokenParsers: TokenParser[],
    pos: number
) {
    for (const { pattern, callback } of tokenParsers) {
        const match = str.match(pattern);

        if (match) {
            return callback(pos, snbtData, match);
        }
    }

    return false;
}

const tokenParsers: TokenParser[] = [
    {
        // Remove whitespace between tokens
        pattern: /^\s+/,
        callback: (_pos, _snbtData, matches) => {
            return matches[0].length;
        },
    },
    {
        // Colon separating name and value for compounds
        pattern: /^:/,
        callback: (pos, snbtData) => {
            snbtData.addToken(pos, 'COLON', ':');

            return 1;
        },
    },
    {
        // Comma to separate lists and compounds
        pattern: /^,/,
        callback: (pos, snbtData) => {
            snbtData.addToken(pos, 'COMMA', ',');

            return 1;
        },
    },
    {
        // Byte array start
        pattern: /^\[\s*[bB]\s*;/,
        callback: (pos, snbtData) => {
            snbtData.addToken(pos, 'BYTE_ARRAY_START', '[');

            return 3;
        },
    },
    {
        // Int array start
        pattern: /^\[\s*[iI]\s*;/,
        callback: (pos, snbtData) => {
            snbtData.addToken(pos, 'INT_ARRAY_START', '[');

            return 3;
        },
    },
    {
        // Long array start
        pattern: /^\[\s*[lL]\s*;/,
        callback: (pos, snbtData) => {
            snbtData.addToken(pos, 'LONG_ARRAY_START', '[');

            return 3;
        },
    },
    {
        // Compound start
        pattern: /^\{/,
        callback: (pos, snbtData) => {
            snbtData.addToken(pos, 'COMPOUND_START', '{');

            return 1;
        },
    },
    {
        // Compound end
        pattern: /^\}/,
        callback: (pos, snbtData) => {
            snbtData.addToken(pos, 'COMPOUND_END', '}');

            return 1;
        },
    },
    {
        // List start
        pattern: /^\[/,
        callback: (pos, snbtData) => {
            snbtData.addToken(pos, 'LIST_START', '[');

            return 1;
        },
    },
    {
        // List end
        pattern: /^\]/,
        callback: (pos, snbtData) => {
            snbtData.addToken(pos, 'LIST_END', ']');

            return 1;
        },
    },
    {
        // Boolean - this will get converted to a byte
        pattern: anchorPattern('([tT][rR][uU][eE]|[fF][aA][lL][sS][eE])'),
        callback: (pos, snbtData, matches) => {
            snbtData.addToken(
                pos,
                'BYTE',
                matches[0].toLowerCase() === 'true' ? '1' : '0'
            );

            return matches[0].length;
        },
    },
    {
        // Byte
        pattern: anchorPattern('[-+]?[0-9]+[bB]'),
        callback: (pos, snbtData, matches) => {
            snbtData.addToken(pos, 'BYTE', matches[0]);

            return matches[0].length;
        },
    },
    {
        // Double - there's another without the D later
        pattern: anchorPattern('[-+]?[0-9.]+[dD]'),
        callback: (pos, snbtData, matches) => {
            snbtData.addToken(pos, 'DOUBLE', matches[0]);

            return matches[0].length;
        },
    },
    {
        // Float
        pattern: anchorPattern('[-+]?[0-9.]+[fF]'),
        callback: (pos, snbtData, matches) => {
            snbtData.addToken(pos, 'FLOAT', matches[0]);

            return matches[0].length;
        },
    },
    {
        // Long
        pattern: anchorPattern('[-+]?[0-9]+[lL]'),
        callback: (pos, snbtData, matches) => {
            snbtData.addToken(pos, 'LONG', matches[0]);

            return matches[0].length;
        },
    },
    {
        // Short
        pattern: anchorPattern('[-+]?[0-9]+[sS]'),
        callback: (pos, snbtData, matches) => {
            snbtData.addToken(pos, 'SHORT', matches[0]);

            return matches[0].length;
        },
    },
    {
        // Double - this must come after other suffixed number types but before
        // Int
        pattern: anchorPattern('[-+]?[0-9.]+'),
        callback: (pos, snbtData, matches) => {
            snbtData.addToken(pos, 'DOUBLE', matches[0]);

            return matches[0].length;
        },
    },
    {
        // Int - this must come after all other number types
        pattern: anchorPattern('[-+]?[0-9]+'),
        callback: (pos, snbtData, matches) => {
            snbtData.addToken(pos, 'INT', matches[0]);

            return matches[0].length;
        },
    },
    {
        // String - single or double quotes
        pattern: /^([\"'])(?:\\.|.)*?\1/,
        callback: (pos, snbtData, matches) => {
            const chunk = JSON.parse(`"${matches[0].slice(1, -1)}"`);
            snbtData.addToken(pos, 'STRING', chunk);

            return matches[0].length;
        },
    },
    {
        // String - not quoted and all else failed
        pattern: anchorPattern('^[-0-9a-zA-Z_.+]+'),
        callback: (pos, snbtData, matches) => {
            snbtData.addToken(pos, 'STRING', matches[0]);

            return matches[0].length;
        },
    },
];

// Creates a regular expression that will start at the beginning of the string
// and conclude with an "end of token" marker at the end.
function anchorPattern(pattern: string) {
    return new RegExp(`^${pattern}\s*(?:$|,|}|]|:)`);
}

export function snbtParse(snbt: string) {
    const snbtData = new SnbtData();
    let pos = 0;

    while (pos < snbt.length) {
        const increment = testParsers(
            snbtData,
            snbt.slice(pos),
            tokenParsers,
            pos
        );

        if (!increment) {
            throw new Error(`Unexpected token at position ${pos}`);
        }

        pos += increment;
    }

    return snbtData;
}

import debug from 'debug';
import { SnbtData, SnbtTokenType } from './snbt-data';

const debugLog = debug('snbt:parse');

interface TokenParser {
    type: SnbtTokenType;
    pattern: RegExp;
    callback: (
        offset: number,
        type: SnbtTokenType,
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
    for (const { type, pattern, callback } of tokenParsers) {
        const match = str.match(pattern);

        if (match) {
            debugLog(`Matched ${type} at position ${pos}: ${match[0]}`);

            return callback(pos, type, snbtData, match);
        }
    }

    return false;
}

const tokenParsers: TokenParser[] = [
    {
        type: 'WHITESPACE',
        pattern: /^\s+/,
        callback: (_pos, _type, _snbtData, matches) => {
            return matches[0].length;
        },
    },
    {
        type: 'COLON',
        pattern: /^:/,
        callback: (pos, type, snbtData) => {
            snbtData.addToken(pos, type, ':');

            return 1;
        },
    },
    {
        type: 'COMMA',
        pattern: /^,/,
        callback: (pos, type, snbtData) => {
            snbtData.addToken(pos, type, ',');

            return 1;
        },
    },
    {
        type: 'BYTE_ARRAY_START',
        pattern: /^\[\s*[bB]\s*;/,
        callback: (pos, type, snbtData) => {
            snbtData.addToken(pos, type, '[');

            return 3;
        },
    },
    {
        type: 'INT_ARRAY_START',
        pattern: /^\[\s*[iI]\s*;/,
        callback: (pos, type, snbtData) => {
            snbtData.addToken(pos, type, '[');

            return 3;
        },
    },
    {
        type: 'LONG_ARRAY_START',
        pattern: /^\[\s*[lL]\s*;/,
        callback: (pos, type, snbtData) => {
            snbtData.addToken(pos, type, '[');

            return 3;
        },
    },
    {
        type: 'COMPOUND_START',
        pattern: /^\{/,
        callback: (pos, type, snbtData) => {
            snbtData.addToken(pos, type, '{');

            return 1;
        },
    },
    {
        type: 'COMPOUND_END',
        pattern: /^\}/,
        callback: (pos, type, snbtData) => {
            snbtData.addToken(pos, type, '}');

            return 1;
        },
    },
    {
        type: 'LIST_START',
        pattern: /^\[/,
        callback: (pos, type, snbtData) => {
            snbtData.addToken(pos, type, '[');

            return 1;
        },
    },
    {
        type: 'LIST_END',
        pattern: /^\]/,
        callback: (pos, type, snbtData) => {
            snbtData.addToken(pos, type, ']');

            return 1;
        },
    },
    {
        // Byte - true / false converts to 1 / 0
        type: 'BYTE',
        pattern: anchorPattern('([tT][rR][uU][eE]|[fF][aA][lL][sS][eE])'),
        callback: (pos, type, snbtData, matches) => {
            snbtData.addToken(
                pos,
                type,
                matches[0].toLowerCase() === 'true' ? '1' : '0'
            );

            return matches[0].length;
        },
    },
    {
        // Byte - number with a suffix
        type: 'BYTE',
        pattern: anchorPattern('[-+]?[0-9]+[bB]'),
        callback: (pos, type, snbtData, matches) => {
            snbtData.addToken(pos, type, matches[0]);

            return matches[0].length;
        },
    },
    {
        // Double - there's another without the D later
        type: 'DOUBLE',
        pattern: anchorPattern('[-+]?[0-9.]+[dD]'),
        callback: (pos, type, snbtData, matches) => {
            snbtData.addToken(pos, type, matches[0]);

            return matches[0].length;
        },
    },
    {
        type: 'FLOAT',
        pattern: anchorPattern('[-+]?[0-9.]+[fF]'),
        callback: (pos, type, snbtData, matches) => {
            snbtData.addToken(pos, type, matches[0]);

            return matches[0].length;
        },
    },
    {
        type: 'LONG',
        pattern: anchorPattern('[-+]?[0-9]+[lL]'),
        callback: (pos, type, snbtData, matches) => {
            snbtData.addToken(pos, type, matches[0]);

            return matches[0].length;
        },
    },
    {
        type: 'SHORT',
        pattern: anchorPattern('[-+]?[0-9]+[sS]'),
        callback: (pos, type, snbtData, matches) => {
            snbtData.addToken(pos, type, matches[0]);

            return matches[0].length;
        },
    },
    {
        // Double - this must come after other suffixed number types but before
        // Int's matcher
        type: 'DOUBLE',
        pattern: anchorPattern('[-+]?[0-9.]+'),
        callback: (pos, type, snbtData, matches) => {
            snbtData.addToken(pos, type, matches[0]);

            return matches[0].length;
        },
    },
    {
        // Int - this must come after all other number types
        type: 'INT',
        pattern: anchorPattern('[-+]?[0-9]+'),
        callback: (pos, type, snbtData, matches) => {
            snbtData.addToken(pos, type, matches[0]);

            return matches[0].length;
        },
    },
    {
        // String - single or double quotes
        type: 'STRING',
        pattern: /^([\"'])(?:\\.|.)*?\1/,
        callback: (pos, type, snbtData, matches) => {
            const chunk = JSON.parse(`"${matches[0].slice(1, -1)}"`);
            snbtData.addToken(pos, type, chunk);

            return matches[0].length;
        },
    },
    {
        // String - not quoted and all else failed
        type: 'STRING',
        pattern: anchorPattern('^[-0-9a-zA-Z_.+]+'),
        callback: (pos, type, snbtData, matches) => {
            snbtData.addToken(pos, type, matches[0]);

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

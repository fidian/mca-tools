import { NbtBase } from '../nbt/nbt-base.js';
import { NbtByteArray } from '../nbt/nbt-byte-array.js';
import { NbtByte } from '../nbt/nbt-byte.js';
import { NbtCompound } from '../nbt/nbt-compound.js';
import { NbtDouble } from '../nbt/nbt-double.js';
import { NbtFloat } from '../nbt/nbt-float.js';
import { NbtIntArray } from '../nbt/nbt-int-array.js';
import { NbtInt } from '../nbt/nbt-int.js';
import { NbtList } from '../nbt/nbt-list.js';
import { NbtLongArray } from '../nbt/nbt-long-array.js';
import { NbtLong } from '../nbt/nbt-long.js';
import { NbtShort } from '../nbt/nbt-short.js';
import { NbtString } from '../nbt/nbt-string.js';
import { SnbtData, SnbtToken } from './snbt-data.js';

export const fromSnbtData: {
    [key: string]: (token: SnbtToken, snbtData: SnbtData) => NbtBase<any>;
} = {
    BYTE: snbtToNbtByte,
    BYTE_ARRAY_START: snbtToNbtByteArray,
    COMPOUND_START: snbtToNbtCompound,
    DOUBLE: snbtToNbtDouble,
    FLOAT: snbtToNbtFloat,
    INT: snbtToNbtInt,
    INT_ARRAY_START: snbtToNbtIntArray,
    LIST_START: snbtToNbtList,
    LONG: snbtToNbtLong,
    LONG_ARRAY_START: snbtToNbtLongArray,
    SHORT: snbtToNbtShort,
    STRING: snbtToNbtString,
};

export function snbtToNbt(snbtData: SnbtData): NbtBase<any> {
    const token = snbtData.token();
    const processor = fromSnbtData[token.type];

    if (processor) {
        return processor(token, snbtData);
    }

    throw new Error(`Invalid, non-matching token ${snbtData.showToken(token)}`);
}

function snbtToNbtByte(token: SnbtToken): NbtByte {
    return new NbtByte(parseInt(token.content || ''));
}

function snbtToNbtByteArray(
    _token: SnbtToken,
    snbtData: SnbtData
): NbtByteArray {
    const bytes: number[] = [];
    let token = snbtData.token();

    while (token && token.type === 'BYTE') {
        bytes.push(parseInt(token.content || ''));

        try {
            token = snbtData.token();
        } catch (err) {
            throw new Error(
                `${err} - Unexpected end of SNBT data while parsing byte array`
            );
        }

        if (token.type !== 'COMMA') {
            throw new Error(
                `Expecting a comma but found ${snbtData.showToken(token)}`
            );
        }

        token = snbtData.token();
    }

    return new NbtByteArray(bytes);
}

function snbtToNbtCompound(_token: SnbtToken, snbtData: SnbtData): NbtCompound {
    const data: NbtBase<any>[] = [];
    let token = snbtData.token();

    while (token && token.type !== 'COMPOUND_END') {
        if (token.type !== 'STRING') {
            throw new Error(
                `Expecting a string but found ${snbtData.showToken(token)}`
            );
        }

        const name = token.content;
        let colon;

        try {
            colon = snbtData.token();
        } catch (err) {
            throw new Error(
                `${err} - Unexpected end of SNBT data while looking for colon`
            );
        }

        if (colon.type !== 'COLON') {
            throw new Error(
                `Expecting a colon but found ${snbtData.showToken(colon)}`
            );
        }

        const nbt = snbtToNbt(snbtData);
        nbt.name = name;
        data.push(nbt);
        token = snbtData.token();

        if (token && token.type === 'COMMA') {
            try {
                token = snbtData.token();
            } catch (err) {
                throw new Error(
                    `${err} - Unexpected end of SNBT data while looking for token after comma`
                );
            }
        }
    }

    return new NbtCompound(data);
}

function snbtToNbtDouble(token: SnbtToken): NbtDouble {
    return new NbtDouble(parseFloat(token.content.slice(0, -1) || ''));
}

function snbtToNbtFloat(token: SnbtToken): NbtFloat {
    return new NbtFloat(parseFloat(token.content || ''));
}

function snbtToNbtInt(token: SnbtToken): NbtInt {
    return new NbtInt(parseInt(token.content || ''));
}

function snbtToNbtIntArray(_token: SnbtToken, snbtData: SnbtData): NbtIntArray {
    const ints: number[] = [];
    let token = snbtData.token();

    // The fallback double parser can be used for integers too.
    while (token && (token.type === 'INT' || token.type === 'DOUBLE')) {
        ints.push(parseInt(token.content || ''));

        try {
            token = snbtData.token();
        } catch (err) {
            throw new Error(
                `${err} - Unexpected end of SNBT data while parsing int array`
            );
        }

        // If we see a comma, we expect another number after it. If not, we
        // expect the end of the array.
        if (token.type === 'COMMA') {
            token = snbtData.token();
        }
    }

    return new NbtIntArray(ints);
}

function snbtToNbtList(_token: SnbtToken, snbtData: SnbtData): NbtList<any> {
    const list: NbtBase<any>[] = [];
    let token;

    try {
        token = snbtData.token();
    } catch (err) {
        throw new Error(
            `${err} - Unexpected end of SNBT data while parsing list at beginning`
        );
    }

    while (token.type !== 'LIST_END') {
        snbtData.step(-1);
        let nbt;

        try {
            nbt = snbtToNbt(snbtData);
        } catch (err) {
            throw new Error(`${err} - Error parsing list element`);
        }

        list.push(nbt);
        token = snbtData.token();

        if (token.type === 'COMMA') {
            try {
                token = snbtData.token();
            } catch (err) {
                throw new Error(
                    `${err} - Unexpected end of SNBT data while looking for comma or end of list`
                );
            }
        } else if (token.type !== 'LIST_END') {
            throw new Error(
                `Expecting a comma or list end but found ${snbtData.showToken(token)}`
            );
        }
    }

    if (!list.length) {
        throw new Error(
            'Empty list not allowed in SNBT because the type cannot be inferred'
        );
    }

    const firstType = list[0].type;

    for (let i = 1; i < list.length; i++) {
        if (list[i].type !== firstType) {
            throw new Error(
                `List contains mixed types: ${firstType} and ${list[i].type}`
            );
        }
    }

    return new NbtList(list, firstType);
}

function snbtToNbtLong(token: SnbtToken): NbtLong {
    return new NbtLong(BigInt(token.content.slice(0, -1) || ''));
}

function snbtToNbtLongArray(
    _token: SnbtToken,
    snbtData: SnbtData
): NbtLongArray {
    const longs: bigint[] = [];
    let token = snbtData.token();

    while (token && token.type === 'LONG') {
        longs.push(BigInt(token.content.slice(0, -1) || ''));

        try {
            token = snbtData.token();
        } catch (err) {
            throw new Error(
                `${err} - Unexpected end of SNBT data while parsing long array`
            );
        }

        if (token.type !== 'COMMA') {
            throw new Error(
                `Expecting a comma but found ${snbtData.showToken(token)}`
            );
        }

        token = snbtData.token();
    }

    return new NbtLongArray(longs);
}

function snbtToNbtShort(token: SnbtToken): NbtShort {
    return new NbtShort(parseInt(token.content || ''));
}

function snbtToNbtString(token: SnbtToken): NbtString {
    return new NbtString(token.content);
}

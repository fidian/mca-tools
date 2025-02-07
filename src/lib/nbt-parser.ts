import { BinaryData } from './binary-data';
import { NbtBase } from '../tags/nbt-base';
import { NbtByte } from '../tags/nbt-byte';
import { NbtDouble } from '../tags/nbt-double';
import { NbtEnd } from '../tags/nbt-end';
import { NbtFloat } from '../tags/nbt-float';
import { NbtInt } from '../tags/nbt-int';
import { NbtLong } from '../tags/nbt-long';
import { NbtShort } from '../tags/nbt-short';
import { NbtString } from '../tags/nbt-string';
import { NbtByteArray } from '../tags/nbt-byte-array';
import { NbtCompound } from '../tags/nbt-compound';
import { NbtIntArray } from '../tags/nbt-int-array';
import { NbtList } from '../tags/nbt-list';
import { NbtLongArray } from '../tags/nbt-long-array';

export enum NbtTagType {
    END = 0,
    BYTE = 1,
    SHORT = 2,
    INT = 3,
    LONG = 4,
    FLOAT = 5,
    DOUBLE = 6,
    BYTE_ARRAY = 7,
    STRING = 8,
    LIST = 9,
    COMPOUND = 10,
    INT_ARRAY = 11,
    LONG_ARRAY = 12,
}

export const fromBinaryData: { [key: number]: (bd: BinaryData, name?: string) => NbtBase<any> } = {
    [NbtTagType.BYTE_ARRAY]: NbtByteArray.fromBinaryData,
    [NbtTagType.BYTE]: NbtByte.fromBinaryData,
    [NbtTagType.COMPOUND]: NbtCompound.fromBinaryData,
    [NbtTagType.DOUBLE]: NbtDouble.fromBinaryData,
    [NbtTagType.END]: NbtEnd.fromBinaryData,
    [NbtTagType.FLOAT]: NbtFloat.fromBinaryData,
    [NbtTagType.INT_ARRAY]: NbtIntArray.fromBinaryData,
    [NbtTagType.INT]: NbtInt.fromBinaryData,
    [NbtTagType.LIST]: NbtList.fromBinaryData,
    [NbtTagType.LONG_ARRAY]: NbtLongArray.fromBinaryData,
    [NbtTagType.LONG]: NbtLong.fromBinaryData,
    [NbtTagType.SHORT]: NbtShort.fromBinaryData,
    [NbtTagType.STRING]: NbtString.fromBinaryData,
};

export function nbtParser(data: ArrayBufferLike): NbtBase<any> {
    const bd = new BinaryData(data);
    bd.seek(0);

    return getTag(bd);
}

export function getTag(bd: BinaryData): NbtBase<any> {
    const type = bd.getByte();
    const reader = fromBinaryData[type];

    if (!reader) {
        throw new Error(`Invalid NBT tag ID ${type}`);
    }

    return reader(bd);
}

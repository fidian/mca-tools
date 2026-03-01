import { BinaryData } from '../lib/binary-data.js';
import { NbtBase } from '../nbt/nbt-base.js';
import { NbtByte } from '../nbt/nbt-byte.js';
import { NbtByteArray } from '../nbt/nbt-byte-array.js';
import { NbtCompound } from '../nbt/nbt-compound.js';
import { NbtDouble } from '../nbt/nbt-double.js';
import { NbtEnd } from '../nbt/nbt-end.js';
import { NbtFloat } from '../nbt/nbt-float.js';
import { NbtInt } from '../nbt/nbt-int.js';
import { NbtIntArray } from '../nbt/nbt-int-array.js';
import { NbtList } from '../nbt/nbt-list.js';
import { NbtLong } from '../nbt/nbt-long.js';
import { NbtLongArray } from '../nbt/nbt-long-array.js';
import { NbtShort } from '../nbt/nbt-short.js';
import { NbtString } from '../nbt/nbt-string.js';
import { NbtTagType } from '../nbt/nbt-tag-type.js';
import { snbtParse } from './snbt-parse.js';
import { snbtToNbt } from './snbt-to-nbt.js';

export const fromBinaryData: {
    [key: number]: (bd: BinaryData, name?: string) => NbtBase<any>;
} = {
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

export class Nbt {
    static fromBuffer(data: ArrayBufferLike): NbtBase<any> {
        const bd = new BinaryData(data);
        bd.seek(0);

        return Nbt.getTag(bd);
    }

    static fromSnbt(snbt: string): NbtBase<any> {
        const snbtData = snbtParse(snbt);
        const token = snbtToNbt(snbtData);

        if (snbtData.remainingLength()) {
            const nextToken = snbtData.token();
            throw new Error(
                `Extra, unparsed SNBT tokens leftover starting with ${nextToken.type}, "${nextToken.content}" at position ${snbtData.currentPosition()}`
            );
        }

        return token;
    }

    static getTag(bd: BinaryData): NbtBase<any> {
        const type = bd.getByte();
        const reader = fromBinaryData[type];

        if (!reader) {
            throw new Error(`Invalid NBT tag ID ${type}`);
        }

        return reader(bd);
    }
}

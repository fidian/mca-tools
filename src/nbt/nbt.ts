import { BinaryData } from '../lib/binary-data';
import { NbtBase } from '../nbt/nbt-base';
import { NbtByte } from '../nbt/nbt-byte';
import { NbtByteArray } from '../nbt/nbt-byte-array';
import { NbtCompound } from '../nbt/nbt-compound';
import { NbtDouble } from '../nbt/nbt-double';
import { NbtEnd } from '../nbt/nbt-end';
import { NbtFloat } from '../nbt/nbt-float';
import { NbtInt } from '../nbt/nbt-int';
import { NbtIntArray } from '../nbt/nbt-int-array';
import { NbtList } from '../nbt/nbt-list';
import { NbtLong } from '../nbt/nbt-long';
import { NbtLongArray } from '../nbt/nbt-long-array';
import { NbtShort } from '../nbt/nbt-short';
import { NbtString } from '../nbt/nbt-string';
import { NbtTagType } from '../nbt/nbt-tag-type';
import { snbtParse } from './snbt-parse';
import { snbtToNbt } from './snbt-to-nbt';

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

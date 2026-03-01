import debug from 'debug';
import { BinaryData } from '../lib/binary-data.js';
import { NbtBase } from './nbt-base.js';
import { NbtTagType } from './nbt-tag-type.js';

const debugLogFromBinaryData = debug('nbt:byte-array:from-binary-data');

export class NbtByteArray extends NbtBase<number[]> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtByteArray {
        name ??= NbtByteArray.readName(bd);
        const data: number[] = [];
        const length = bd.getInt();
        debugLogFromBinaryData('BYTE_ARRAY, name %s, length %d', name, length);

        for (let i = 0; i < length; i++) {
            data.push(bd.getByte());
        }

        debugLogFromBinaryData('BYTE_ARRAY, data %o', name, length, data);

        return new NbtByteArray(data, name);
    }

    constructor(data: number[], name?: string) {
        super(NbtTagType.BYTE_ARRAY, data, name);
    }

    toObject() {
        return {
            type: this.type,
            byteArray: this.data,
        };
    }

    toSnbt() {
        return `[B;${this.data.map((v) => `${v}b`).join(',')}]`;
    }
}

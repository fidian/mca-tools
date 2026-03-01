import debug from 'debug';
import { BinaryData } from '../lib/binary-data.js';
import { NbtBase } from './nbt-base.js';
import { NbtTagType } from './nbt-tag-type.js';

const debugLogFromBinaryData = debug('nbt:int-array:from-binary-data');

export class NbtIntArray extends NbtBase<number[]> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtIntArray {
        name ??= NbtIntArray.readName(bd);
        const data: number[] = [];
        const length = bd.getInt();
        debugLogFromBinaryData('INT_ARRAY, name %s, length %d', name, length);

        for (let i = 0; i < length; i++) {
            data.push(bd.getInt());
        }

        debugLogFromBinaryData('INT_ARRAY, name %s, data %o', name, data);

        return new NbtIntArray(data, name);
    }

    constructor(data: number[], name?: string) {
        super(NbtTagType.INT_ARRAY, data, name);
    }

    toObject() {
        return {
            type: this.type,
            intArray: this.data,
        };
    }

    toSnbt() {
        return `[I;${this.data.join(', ')}]`;
    }
}

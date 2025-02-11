import debug from 'debug';
import { BinaryData } from '../lib/binary-data';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt-tag-type';

const debugLogFromBinaryData = debug('nbt:long-array:from-binary-data');

export class NbtLongArray extends NbtBase<bigint[]> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtLongArray {
        name ??= NbtLongArray.readName(bd);
        const data: bigint[] = [];
        const length = bd.getInt();
        debugLogFromBinaryData(`LONG_ARRAY, name ${name}, length ${length}`);

        for (let i = 0; i < length; i++) {
            // This needs to be able to be converted back to a bit stream in
            // BitData. See BitData.fromLongArrayTag().
            data.push(bd.getInt64LE());
        }

        debugLogFromBinaryData(`LONG_ARRAY, name ${name}, data ${data}`);

        return new NbtLongArray(data, name);
    }

    constructor(data: bigint[], name?: string) {
        super(NbtTagType.LONG_ARRAY, data, name);
    }

    toObject() {
        return {
            type: this.type,
            longArray: this.data.map((v) => v.toString()),
        };
    }

    toSnbt() {
        return `[L;${this.data.map((v) => v.toString()).join(', ')}]`;
    }
}

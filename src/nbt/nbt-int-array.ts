import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt';

export class NbtIntArray extends NbtBase<number[]> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtIntArray {
        name ??= NbtIntArray.readName(bd);
        const data: number[] = [];
        const length = bd.getInt();
        debugLog(`INT_ARRAY, name ${name}, length ${length}`);

        for (let i = 0; i < length; i++) {
            data.push(bd.getInt());
        }

        debugLog(`INT_ARRAY, name ${name}, data ${data}`);

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

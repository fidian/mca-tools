import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt';

export class NbtByteArray extends NbtBase<number[]> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtByteArray {
        name ??= NbtByteArray.readName(bd);
        const data: number[] = [];
        const length = bd.getInt();
        debugLog(`BYTE_ARRAY, name ${name}, length ${length}`);

        for (let i = 0; i < length; i++) {
            data.push(bd.getByte());
        }

        debugLog(`BYTE_ARRAY, data ${data}`);

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

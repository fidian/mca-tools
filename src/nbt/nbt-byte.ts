import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt';

export class NbtByte extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtByte {
        name ??= NbtByte.readName(bd);
        const data = bd.getByte();
        debugLog(`BYTE, name ${name}, data ${data}`);

        return new NbtByte(data, name);
    }

    constructor(data: number, name?: string) {
        super(NbtTagType.BYTE, data, name);
    }

    toObject() {
        return {
            type: this.type,
            byte: this.data,
        };
    }

    toSnbt() {
        return `${this.data}b`;
    }
}

import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt';

export class NbtShort extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtShort {
        name ??= NbtShort.readName(bd);
        const data = bd.getShort();
        debugLog(`SHORT, name ${name}, data ${data}`);

        return new NbtShort(data, name);
    }

    constructor(data: number, name?: string) {
        super(NbtTagType.SHORT, data, name);
    }

    toObject() {
        return {
            type: this.type,
            short: this.data,
        };
    }

    toSnbt() {
        return `${this.data}s`;
    }
}

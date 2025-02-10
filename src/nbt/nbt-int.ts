import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt';

export class NbtInt extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtInt {
        name ??= NbtInt.readName(bd);
        const data = bd.getInt();
        debugLog(`INT, name ${name}, data ${data}`);

        return new NbtInt(data, name);
    }

    constructor(data: number, name?: string) {
        super(NbtTagType.INT, data, name);
    }

    toObject() {
        return {
            type: this.type,
            int: this.data,
        };
    }

    toSnbt() {
        return `${this.data}`;
    }
}

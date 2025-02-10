import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt';

export class NbtFloat extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtFloat {
        name ??= NbtFloat.readName(bd);
        const data = bd.getFloat();
        debugLog(`FLOAT, name ${name}, data ${data}`);

        return new NbtFloat(data, name);
    }

    constructor(data: number, name?: string) {
        super(NbtTagType.FLOAT, data, name);
    }

    toObject() {
        return {
            type: this.type,
            float: this.data,
        };
    }

    toSnbt() {
        return `${this.data}f`;
    }
}

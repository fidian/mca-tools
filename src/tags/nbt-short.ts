import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from '../lib/nbt-parser';

export class NbtShort extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtShort {
        name ??= NbtShort.readName(bd);
        const data = bd.getShort();
        debugLog(`SHORT, name ${name}, data ${data}`);

        return new NbtShort(NbtTagType.SHORT, name, data);
    }

    toJson() {
        return [
            this.name,
            {
                type: this.type,
                short: this.data,
            },
        ];
    }
}

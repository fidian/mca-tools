import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from '../lib/nbt-parser';

export class NbtInt extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtInt {
        name ??= NbtInt.readName(bd);
        const data = bd.getInt();
        debugLog(`INT, name ${name}, data ${data}`);

        return new NbtInt(NbtTagType.INT, name, data);
    }

    toJson() {
        return [
            this.name,
            {
                type: this.type,
                int: this.data,
            },
        ];
    }
}

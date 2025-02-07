import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from '../lib/nbt-parser';

export class NbtDouble extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtDouble {
        name ??= NbtDouble.readName(bd);
        const data = bd.getDouble();
        debugLog(`DOUBLE, name ${name}, data ${data}`);

        return new NbtDouble(NbtTagType.DOUBLE, name, data);
    }

    toJson() {
        return [
            this.name,
            {
                type: this.type,
                double: this.data,
            },
        ];
    }
}

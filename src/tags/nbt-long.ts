import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from '../lib/nbt-parser';

export class NbtLong extends NbtBase<bigint> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtLong {
        name ??= NbtLong.readName(bd);
        const data = bd.getInt64();
        debugLog(`LONG, name ${name}, data ${data}`);

        return new NbtLong(NbtTagType.LONG, name, data);
    }

    toJson() {
        return [
            this.name,
            {
                type: this.type,
                long: this.data.toString(),
            },
        ];
    }
}

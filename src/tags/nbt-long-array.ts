import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from '../lib/nbt-parser';

export class NbtLongArray extends NbtBase<bigint[]> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtLongArray {
        name ??= NbtLongArray.readName(bd);
        const data: bigint[] = [];
        const length = bd.getInt();
        debugLog(`LONG_ARRAY, name ${name}, length ${length}`);

        for (let i = 0; i < length; i++) {
            data.push(bd.getInt64());
        }

        debugLog(`LONG_ARRAY, name ${name}, data ${data}`);

        return new NbtLongArray(NbtTagType.INT_ARRAY, name, data);
    }

    toJson() {
        return [
            this.name,
            {
                type: this.type,
                longArray: this.data.map((v) => v.toString()),
            },
        ];
    }
}

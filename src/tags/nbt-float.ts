import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from '../lib/nbt-parser';

export class NbtFloat extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtFloat {
        name ??= NbtFloat.readName(bd);
        const data = bd.getFloat();
        debugLog(`FLOAT, name ${name}, data ${data}`);

        return new NbtFloat(NbtTagType.FLOAT, name, data);
    }

    toJson() {
        return [
            this.name,
            {
                type: this.type,
                float: this.data,
            },
        ];
    }
}

import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from '../lib/nbt-parser';

export class NbtString extends NbtBase<string> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtString {
        name ??= NbtString.readName(bd);
        const length = bd.getUShort();
        const data = bd.getString(length);
        debugLog(`STRING, name ${name}, length ${length}, data ${data}`);

        return new NbtString(NbtTagType.STRING, name, data);
    }

    toJson() {
        return [
            this.name,
            {
                type: this.type,
                string: this.data,
            },
        ];
    }
}

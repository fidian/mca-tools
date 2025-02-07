import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from '../lib/nbt-parser';

export class NbtByte extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtByte {
        name ??= NbtByte.readName(bd);
        const data = bd.getByte();
        debugLog(`BYTE, name ${name}, data ${data}`);

        return new NbtByte(NbtTagType.BYTE, name, data);
    }

    toJson() {
        return [
            this.name,
            {
                type: this.type,
                byte: this.data,
            },
        ];
    }
}

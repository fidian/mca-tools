import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from '../lib/nbt-parser';

export class NbtByteArray extends NbtBase<number[]> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtByteArray {
        name ??= NbtByteArray.readName(bd);
        const data: number[] = [];
        const length = bd.getInt();
        debugLog(`BYTE_ARRAY, name ${name}, length ${length}`);

        for (let i = 0; i < length; i++) {
            data.push(bd.getByte());
        }

        debugLog(`BYTE_ARRAY, data ${data}`);

        return new NbtByteArray(NbtTagType.BYTE_ARRAY, name, data);
    }

    toJson() {
        return [
            this.name,
            {
                type: this.type,
                byteArray: this.data,
            },
        ];
    }
}

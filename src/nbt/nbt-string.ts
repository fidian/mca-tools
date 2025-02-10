import { BinaryData } from '../lib/binary-data';
import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt';

export class NbtString extends NbtBase<string> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtString {
        name ??= NbtString.readName(bd);
        const length = bd.getUShort();
        const data = bd.getString(length);
        debugLog(`STRING, name ${name}, length ${length}, data ${data}`);

        return new NbtString(data, name);
    }

    constructor(data: string, name?: string) {
        super(NbtTagType.STRING, data, name);
    }

    toObject() {
        return {
            type: this.type,
            string: this.data,
        };
    }

    toSnbt() {
        // This always works but doesn't always produce the shortest string
        return JSON.stringify(this.data);
    }
}

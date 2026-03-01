import debug from 'debug';
import { BinaryData } from '../lib/binary-data.js';
import { NbtBase } from './nbt-base.js';
import { NbtTagType } from './nbt-tag-type.js';

const debugLogFromBinaryData = debug('nbt:byte:from-binary-data');

export class NbtByte extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtByte {
        name ??= NbtByte.readName(bd);
        const data = bd.getByte();
        debugLogFromBinaryData(`BYTE, name ${name}, data ${data}`);

        return new NbtByte(data, name);
    }

    constructor(data: number, name?: string) {
        super(NbtTagType.BYTE, data, name);
    }

    toObject() {
        return {
            type: this.type,
            byte: this.data,
        };
    }

    toSnbt() {
        return `${this.data}b`;
    }
}

import debug from 'debug';
import { BinaryData } from '../lib/binary-data.js';
import { NbtBase } from './nbt-base.js';
import { NbtTagType } from './nbt-tag-type.js';

const debugLogFromBinaryData = debug('nbt:short:from-binary-data');

export class NbtShort extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtShort {
        name ??= NbtShort.readName(bd);
        const data = bd.getShort();
        debugLogFromBinaryData(`SHORT, name ${name}, data ${data}`);

        return new NbtShort(data, name);
    }

    constructor(data: number, name?: string) {
        super(NbtTagType.SHORT, data, name);
    }

    toObject() {
        return {
            type: this.type,
            short: this.data,
        };
    }

    toSnbt() {
        return `${this.data}s`;
    }
}

import debug from 'debug';
import { BinaryData } from '../lib/binary-data.js';
import { NbtBase } from './nbt-base.js';
import { NbtTagType } from './nbt-tag-type.js';

const debugLogFromBinaryData = debug('nbt:int:from-binary-data');

export class NbtInt extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtInt {
        name ??= NbtInt.readName(bd);
        const data = bd.getInt();
        debugLogFromBinaryData(`INT, name ${name}, data ${data}`);

        return new NbtInt(data, name);
    }

    constructor(data: number, name?: string) {
        super(NbtTagType.INT, data, name);
    }

    toObject() {
        return {
            type: this.type,
            int: this.data,
        };
    }

    toSnbt() {
        return `${this.data}`;
    }
}

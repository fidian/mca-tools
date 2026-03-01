import debug from 'debug';
import { BinaryData } from '../lib/binary-data.js';
import { NbtBase } from './nbt-base.js';
import { NbtTagType } from './nbt-tag-type.js';

const debugLogFromBinaryData = debug('nbt:double:from-binary-data');

export class NbtDouble extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtDouble {
        name ??= NbtDouble.readName(bd);
        const data = bd.getDouble();
        debugLogFromBinaryData(`DOUBLE, name ${name}, data ${data}`);

        return new NbtDouble(data, name);
    }

    constructor(data: number, name?: string) {
        super(NbtTagType.DOUBLE, data, name);
    }

    toObject() {
        return {
            type: this.type,
            double: this.data,
        };
    }

    toSnbt() {
        return `${this.data}d`;
    }
}

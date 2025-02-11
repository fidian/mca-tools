import debug from 'debug';
import { BinaryData } from '../lib/binary-data';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt';

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

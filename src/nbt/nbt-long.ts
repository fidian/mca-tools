import debug from 'debug';
import { BinaryData } from '../lib/binary-data';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt';

const debugLogFromBinaryData = debug('nbt:long:from-binary-data');

export class NbtLong extends NbtBase<bigint> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtLong {
        name ??= NbtLong.readName(bd);
        const data = bd.getInt64LE();
        debugLogFromBinaryData(`LONG, name ${name}, data ${data}`);

        return new NbtLong(data, name);
    }

    constructor(data: bigint, name?: string) {
        super(NbtTagType.LONG, data, name);
    }

    toObject() {
        return {
            type: this.type,
            long: this.data.toString(),
        };
    }

    toSnbt() {
        return `${this.data}l`;
    }
}

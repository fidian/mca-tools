import debug from 'debug';
import { BinaryData } from '../lib/binary-data.js';
import { NbtBase } from './nbt-base.js';
import { NbtTagType } from './nbt-tag-type.js';

const debugLogFromBinaryData = debug('nbt:float:from-binary-data');

export class NbtFloat extends NbtBase<number> {
    static fromBinaryData(bd: BinaryData, name?: string): NbtFloat {
        name ??= NbtFloat.readName(bd);
        const data = bd.getFloat();
        debugLogFromBinaryData('FLOAT, name %s, data %d', name, data);

        return new NbtFloat(data, name);
    }

    constructor(data: number, name?: string) {
        super(NbtTagType.FLOAT, data, name);
    }

    toObject() {
        return {
            type: this.type,
            float: this.data,
        };
    }

    toSnbt() {
        return `${this.data}f`;
    }
}

import debug from 'debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt';

const debugLogFromBinaryData = debug('nbt:end:from-binary-data');

export class NbtEnd extends NbtBase<null> {
    static fromBinaryData(): NbtEnd {
        debugLogFromBinaryData('END');

        return new NbtEnd();
    }

    constructor() {
        super(NbtTagType.END, null, '');
    }

    toObject() {
        return {
            type: this.type,
        };
    }

    toSnbt(): string {
        throw new Error('END tag cannot be converted to SNBT');
    }
}

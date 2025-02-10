import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt';

export class NbtEnd extends NbtBase<null> {
    static fromBinaryData(): NbtEnd {
        debugLog('END');

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

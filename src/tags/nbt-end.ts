import { debugLog } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { NbtTagType } from '../lib/nbt-parser';

export class NbtEnd extends NbtBase<null> {
    static fromBinaryData(): NbtEnd {
        debugLog('END');

        return new NbtEnd();
    }

    constructor() {
        super(NbtTagType.END, '', null);
    }

    toJson() {
        return {
            type: this.type,
        };
    }
}

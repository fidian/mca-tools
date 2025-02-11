import { BinaryData } from '../lib/binary-data';
import { NbtTagType } from './nbt-tag-type';

export abstract class NbtBase<T> {
    static readName(bd: BinaryData) {
        const nameLength = bd.getUShort();

        return bd.getString(nameLength);
    }

    constructor(
        public type: NbtTagType,
        public data: T,
        public name = '',
    ) {}

    /**
     * Search for a child by path. Use '/' as separators.
     *
     * nbt.findChild('Level/Sections/0/BlockStates')
     */
    findChild<T extends NbtBase<any>>(_path: string): T | undefined {
        // By default, most elements do not have children.
        return;
    }

    isCompound(_name?: string): boolean {
        return false;
    }

    isList(_subtype?: NbtTagType): boolean {
        return false;
    }

    abstract toObject(): any;

    abstract toSnbt(): string;
}

import { BinaryData } from '../lib/binary-data';
import { debugLog, debugNesting } from '../lib/debug';
import { fromBinaryData, NbtTagType } from './nbt';
import { NbtBase } from './nbt-base';

export class NbtList<T extends NbtBase<any>> extends NbtBase<T[]> {
    static fromBinaryData<SOURCE extends NbtBase<any>>(
        bd: BinaryData,
        name?: string
    ): NbtList<SOURCE> {
        name ??= NbtList.readName(bd);
        const subtype = bd.getByte();
        const length = bd.getInt();
        const data: SOURCE[] = [];
        debugLog(`LIST, name ${name}, subtype ${subtype}, length ${length}`);
        const reader = fromBinaryData[subtype];
        debugNesting(1);

        if (!reader) {
            throw new Error(`Invalid NBT tag type ${subtype} for list tag`);
        }

        while (data.length < length) {
            // All list items are unnamed
            data.push(reader(bd, '') as SOURCE);
        }

        debugNesting(-1);
        debugLog(`LIST, name ${name}, element count ${data.length}`);

        return new NbtList<SOURCE>(data, subtype, name);
    }

    subtype: NbtTagType;

    constructor(
        data: T[],
        subtype: NbtTagType,
        name?: string,
    ) {
        super(NbtTagType.LIST, data, name);
        this.subtype = subtype;
    }

    override findChild<RESULT extends NbtBase<any>>(
        path: string
    ): RESULT | undefined {
        if (this.subtype !== NbtTagType.COMPOUND) {
            return;
        }

        const pathSegments = path.split('/');
        const currentSegment = pathSegments.shift();

        if (!currentSegment) {
            return;
        }

        const index = parseInt(currentSegment, 10);

        if (isNaN(index)) {
            return;
        }

        const result = this.data[index];

        if (!result) {
            return;
        }

        if (pathSegments.length) {
            return result.findChild<RESULT>(pathSegments.join('/'));
        }

        return result as unknown as RESULT;
    }

    override isList(subtype?: NbtTagType) {
        if (subtype !== undefined && this.subtype !== subtype) {
            return false;
        }

        return true;
    }

    toObject() {
        return {
            type: this.type,
            subtype: this.subtype,
            list: this.data.map((v) => v.toObject()),
        };
    }

    toSnbt() {
        return this.data.map((v) => v.toSnbt()).join(',');
    }
}

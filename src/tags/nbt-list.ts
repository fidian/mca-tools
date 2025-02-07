import { BinaryData } from '../lib/binary-data';
import { debugLog, debugNesting } from '../lib/debug';
import { fromBinaryData, NbtTagType } from '../lib/nbt-parser';
import { NbtBase } from './nbt-base';

export class NbtList<T extends NbtBase<any>> extends NbtBase<T[]> {
    static fromBinaryData<SOURCE extends NbtBase<any>>(
        bd: BinaryData,
        name?: string
    ): NbtList<SOURCE> {
        name ??= NbtList.readName(bd);
        const subType = bd.getByte();
        const length = bd.getInt();
        const data: SOURCE[] = [];
        debugLog(`LIST, name ${name}, subType ${subType}, length ${length}`);
        const reader = fromBinaryData[subType];
        debugNesting(1);

        if (!reader) {
            throw new Error(`Invalid NBT tag type ${subType} for list tag`);
        }

        while (data.length < length) {
            // All list items are unnamed
            data.push(reader(bd, '') as SOURCE);
        }

        debugNesting(-1);
        debugLog(`LIST, name ${name}, element count ${data.length}`);

        return new NbtList<SOURCE>(NbtTagType.LIST, name, data, subType);
    }

    subType: NbtTagType;

    constructor(
        type: NbtTagType,
        name: string,
        data: T[],
        subType: NbtTagType
    ) {
        super(type, name, data);
        this.subType = subType;
    }

    override findChild<RESULT extends NbtBase<any>>(
        path: string
    ): RESULT | undefined {
        if (this.subType !== NbtTagType.COMPOUND) {
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

    override isList(subType?: NbtTagType) {
        if (subType !== undefined && this.subType !== subType) {
            return false;
        }

        return true;
    }

    toJson() {
        return [
            this.name,
            {
                type: this.type,
                subType: this.subType,
                list: this.data.map((v) => v.toJson()),
            },
        ];
    }
}

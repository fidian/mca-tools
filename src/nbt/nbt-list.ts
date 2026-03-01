import debug from 'debug';
import { BinaryData } from '../lib/binary-data.js';
import { fromBinaryData } from './nbt.js';
import { NbtBase } from './nbt-base.js';
import { NbtTagType } from './nbt-tag-type.js';

const debugLogFromBinaryData = debug('nbt:list:from-binary-data');
const debugLogFindChild = debug('nbt:list:find-child');

export class NbtList<T extends NbtBase<any>> extends NbtBase<T[]> {
    static fromBinaryData<SOURCE extends NbtBase<any>>(
        bd: BinaryData,
        name?: string
    ): NbtList<SOURCE> {
        name ??= NbtList.readName(bd);
        const subtype = bd.getByte();
        const length = bd.getInt();
        const data: SOURCE[] = [];
        debugLogFromBinaryData(
            `LIST, name ${name}, subtype ${subtype}, length ${length}, start`
        );
        const reader = fromBinaryData[subtype];

        if (!reader) {
            throw new Error(`Invalid NBT tag type ${subtype} for list tag`);
        }

        while (data.length < length) {
            // All list items are unnamed
            data.push(reader(bd, '') as SOURCE);
        }

        debugLogFromBinaryData(
            `LIST, name ${name}, subtype ${subtype}, element count ${data.length}, end`
        );

        return new NbtList<SOURCE>(data, subtype, name);
    }

    subtype: NbtTagType;

    constructor(data: T[], subtype: NbtTagType, name?: string) {
        super(NbtTagType.LIST, data, name);
        this.subtype = subtype;
    }

    override findChild<RESULT extends NbtBase<any>>(
        path: string
    ): RESULT | undefined {
        const pathSegments = path.split('/');
        const currentSegment = pathSegments.shift();

        if (!currentSegment) {
            return;
        }

        const index = parseInt(currentSegment, 10);

        if (isNaN(index)) {
            debugLogFindChild('LIST, name %s, subtype %s, path %s, segment %s, not a number', this.name, this.subtype, path, currentSegment);

            return;
        }

        const result = this.data[index];

        if (!result) {
            debugLogFindChild('LIST, name %s, subtype %s, path %s, segment %s, no child found at index %d', this.name, this.subtype, path, currentSegment, index);

            return;
        }

        if (pathSegments.length) {
            debugLogFindChild('LIST, name %s, subtype %s, path %s, segment %s, recurse', this.name, this.subtype, path, currentSegment);

            return result.findChild<RESULT>(pathSegments.join('/'));
        }

        debugLogFindChild('LIST, name %s, subtype %s, path %s, segment %s, found', this.name, this.subtype, path, currentSegment);

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

import debug from 'debug';
import { BinaryData } from '../lib/binary-data';
import { fromBinaryData } from './nbt';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt-tag-type';

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
        if (this.subtype !== NbtTagType.COMPOUND) {
            debugLogFindChild(
                `LIST, name ${this.name}, subtype ${this.subtype}, path ${path}, not compound`
            );
            return;
        }

        const pathSegments = path.split('/');
        const currentSegment = pathSegments.shift();

        if (!currentSegment) {
            return;
        }

        const index = parseInt(currentSegment, 10);

        if (isNaN(index)) {
            debugLogFindChild(`LIST, name ${this.name}, subtype ${this.subtype}, path ${path}, segment ${currentSegment}, not a number`);

            return;
        }

        const result = this.data[index];

        if (!result) {
            debugLogFindChild(`LIST, name ${this.name}, subtype ${this.subtype}, path ${path}, segment ${currentSegment}, no child found at index ${index}`);

            return;
        }

        if (pathSegments.length) {
            debugLogFindChild(`LIST, name ${this.name}, subtype ${this.subtype}, path ${path}, segment ${currentSegment}, recurse`);

            return result.findChild<RESULT>(pathSegments.join('/'));
        }

        debugLogFindChild(`LIST, name ${this.name}, subtype ${this.subtype}, path ${path}, segment ${currentSegment}, found`);

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

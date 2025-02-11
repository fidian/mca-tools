import debug from 'debug';
import { BinaryData } from '../lib/binary-data';
import { Nbt } from './nbt';
import { NbtBase } from './nbt-base';
import { NbtTagType } from './nbt-tag-type';

const debugLogFromBinaryData = debug('nbt:compound:from-binary-data');
const debugLogFindChild = debug('nbt:compound:find-child');

export class NbtCompound extends NbtBase<NbtBase<any>[]> {
    static fromBinaryData<T>(bd: BinaryData, name?: string): NbtCompound {
        name ??= NbtCompound.readName(bd);
        const data: NbtBase<T>[] = [];
        debugLogFromBinaryData(`COMPOUND, name ${name}, starting`);

        // Careful - this does not store the END tag
        let tag = Nbt.getTag(bd);
        debugLogFromBinaryData(
            `COMPOUND, name ${name}, tag ${tag.type} was retrieved`
        );

        while (tag && tag.type !== NbtTagType.END) {
            data.push(tag);
            tag = Nbt.getTag(bd);
            debugLogFromBinaryData(
                `COMPOUND, name ${name}, tag ${tag.type} was retrieved`
            );
        }

        debugLogFromBinaryData(`COMPOUND, name ${name}, finished`);

        return new NbtCompound(data, name);
    }

    constructor(data: NbtBase<any>[], name?: string) {
        super(NbtTagType.COMPOUND, data, name);
    }

    override findChild<RESULT extends NbtBase<any>>(path: string) {
        const pathSegments = path.split('/');
        const currentSegment = pathSegments.shift();
        const result = this.data.find((item) => item.name === currentSegment);
        debugLogFindChild(
            `COMPOUND, name ${this.name}, path ${path}, found? ${!!result}`
        );

        if (!result) {
            return;
        }

        if (pathSegments.length) {
            return result.findChild<RESULT>(pathSegments.join('/'));
        }

        return result as RESULT;
    }

    override isCompound(name?: string) {
        if (name !== undefined && this.name !== name) {
            return false;
        }

        return true;
    }

    toObject() {
        const compound: Record<string, any> = {};

        for (const item of this.data) {
            const name = item.name;

            if (compound[name]) {
                console.error('Corrupt chunk - duplicate key found', name);
            }

            compound[name] = item.toObject();
        }

        return {
            type: this.type,
            compound,
        };
    }

    toSnbt() {
        const compound: string[] = [];

        for (const item of this.data) {
            const itemSnbt = item.toSnbt();
            compound.push(`${item.name}:${itemSnbt}`);
        }

        return `{${compound.join(',')}}`;
    }
}

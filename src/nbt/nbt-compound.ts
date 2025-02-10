import { BinaryData } from '../lib/binary-data';
import { debugLog, debugNesting } from '../lib/debug';
import { Nbt, NbtTagType } from './nbt';
import { NbtBase } from './nbt-base';

export class NbtCompound extends NbtBase<NbtBase<any>[]> {
    static fromBinaryData<T>(bd: BinaryData, name?: string): NbtCompound {
        name ??= NbtCompound.readName(bd);
        const data: NbtBase<T>[] = [];
        debugLog(`COMPOUND, name ${name}`);

        // Careful - this does not store the END tag
        debugNesting(1);
        let tag = Nbt.getTag(bd);
        debugNesting(-1);
        debugLog(`COMPOUND, name ${name}, tag ${tag.type} was retrieved`);

        while (tag && tag.type !== NbtTagType.END) {
            data.push(tag);
            debugNesting(1);
            tag = Nbt.getTag(bd);
            debugNesting(-1);
            debugLog(`COMPOUND, name ${name}, tag ${tag.type} was retrieved`);
        }

        return new NbtCompound(data, name);
    }

    constructor(data: NbtBase<any>[], name?: string) {
        super(NbtTagType.COMPOUND, data, name);
    }

    override findChild<RESULT extends NbtBase<any>>(path: string) {
        const pathSegments = path.split('/');
        const currentSegment = pathSegments.shift();
        const result = this.data.find((item) => item.name === currentSegment);

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

        return [
            this.name,
            {
                type: this.type,
                compound,
            },
        ];
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

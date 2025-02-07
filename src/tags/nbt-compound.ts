import { BinaryData } from '../lib/binary-data';
import { debugLog, debugNesting } from '../lib/debug';
import { NbtBase } from './nbt-base';
import { getTag, NbtTagType } from '../lib/nbt-parser';

export class NbtCompound extends NbtBase<NbtBase<any>[]> {
    static fromBinaryData<T>(bd: BinaryData, name?: string): NbtCompound {
        name ??= NbtCompound.readName(bd);
        const data: NbtBase<T>[] = [];
        debugLog(`COMPOUND, name ${name}`);

        // Careful - this does not store the END tag
        debugNesting(1);
        let tag = getTag(bd);
        debugNesting(-1);
        debugLog(`COMPOUND, name ${name}, tag ${tag.type} was retrieved`);

        while (tag && tag.type !== NbtTagType.END) {
            data.push(tag);
            debugNesting(1);
            tag = getTag(bd);
            debugNesting(-1);
            debugLog(`COMPOUND, name ${name}, tag ${tag.type} was retrieved`);
        }

        return new NbtCompound(NbtTagType.COMPOUND, name, data);
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

    toJson() {
        const compound: Record<string, any> = {};

        for (const item of this.data) {
            const [name, json] = item.toJson();

            if (compound[name]) {
                console.error('Corrupt chunk - duplicate key found', name);
            }

            compound[name] = json;
        }

        return [
            this.name,
            {
                type: this.type,
                compound,
            },
        ];
    }
}

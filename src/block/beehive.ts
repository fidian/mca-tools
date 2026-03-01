import { Coords3d } from '../types/coords.js';
import { HasEntityData } from './has-entity-data.js';
import { NbtCompound } from '../nbt/nbt-compound.js';
import { NbtIntArray } from '../nbt/nbt-int-array.js';
import { NbtList } from '../nbt/nbt-list.js';

export class Beehive extends HasEntityData {
    bees(): NbtList<NbtCompound> | undefined {
        return this.entityData.findChild<NbtList<NbtCompound>>('bees');
    }

    flowerPos(): Coords3d | undefined {
        return this.entityData.findChild<NbtIntArray>('flower_pos')?.data as
            | Coords3d
            | undefined;
    }
}

import { Coords3d } from '../types/coords';
import { HasEntityData } from './has-entity-data';
import { NbtCompound } from '../nbt/nbt-compound';
import { NbtIntArray } from '../nbt/nbt-int-array';
import { NbtList } from '../nbt/nbt-list';

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

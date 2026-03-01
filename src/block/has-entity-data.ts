import { Generic } from './generic.js';
import { Coords3d } from '../types/coords.js';
import { NbtCompound } from '../nbt/nbt-compound.js';

export class HasEntityData extends Generic {
    override entityData: NbtCompound;

    constructor(
        name: string,
        coords: Coords3d,
        entityData?: NbtCompound
    ) {
        if (!entityData) {
            throw new Error('Block is supposed to have entity data');
        }

        super(name, coords, entityData);
        this.entityData = entityData;
    }
}

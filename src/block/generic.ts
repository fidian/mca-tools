import { Coords3d } from '../types/coords.js';
import { NbtCompound } from '../nbt/nbt-compound.js';

export class Generic {
    constructor(
        public name: string,
        public coords: Coords3d,
        public entityData?: NbtCompound
    ) {}

    components(): NbtCompound | undefined {
        return this.entityData?.findChild<NbtCompound>('components');
    }
}

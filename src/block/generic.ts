import { Coords3d } from '../types/coords';
import { NbtCompound } from '../nbt/nbt-compound';

export class Generic {
    constructor(
        public name: string,
        public coords: Coords3d,
        public entityData?: NbtCompound
    ) {}
}

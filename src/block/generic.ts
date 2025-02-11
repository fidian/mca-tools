import { Coords3d } from '../types/coords';
import { NbtCompound } from '../nbt/nbt-compound';

export class Generic {
    readonly type: string = 'GENERIC';

    constructor(
        public name: string,
        public coords: Coords3d,
        public entityData?: NbtCompound
    ) {}
}

import { Coords3d } from '../types/coords';
import { NbtCompound } from '../nbt/nbt-compound';

export class GenericBlock {
    constructor(public id: string, public coords: Coords3d, public entityData?: NbtCompound) {
    }
}

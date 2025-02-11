import { Generic } from './generic';
import { Coords3d } from '../types/coords';
import { NbtCompound } from '../nbt/nbt-compound';
import { Sign } from './sign';

export class Block {
    static create(name: string, coords: Coords3d, entityData?: NbtCompound): Generic {
        if (Block.isSign(name)) {
            return new Sign(name, coords, entityData);
        }

        return new Generic(name, coords, entityData);
    }

    static isSign(name: string): boolean {
        return !!name.match(/^minecraft:.+_sign$/);
    }
}

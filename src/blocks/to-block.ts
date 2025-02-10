import { GenericBlock } from './generic-block';
import { Coords3d } from '../types/coords';
import { NbtCompound } from '../nbt/nbt-compound';
import { SignBlock } from './sign-block';

export function toBlock(id: string, coords: Coords3d, entityData?: NbtCompound): GenericBlock {
    if (id.match(/^minecraft:.+_sign$/)) {
        return new SignBlock(id, coords, entityData);
    }

    return new GenericBlock(id, coords, entityData);
}

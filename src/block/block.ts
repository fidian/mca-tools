import { Banner } from './banner';
import { Coords3d } from '../types/coords';
import { Generic } from './generic';
import { NbtCompound } from '../nbt/nbt-compound';
import { Sign } from './sign';

export type BlockInstance = Generic | Banner | Sign;

export class Block {
    static create(name: string, coords: Coords3d, entityData?: NbtCompound): Generic {
        if (Block.isBanner(name)) {
            return new Banner(name, coords, entityData);
        }

        if (Block.isSign(name)) {
            return new Sign(name, coords, entityData);
        }

        return new Generic(name, coords, entityData);
    }

    static isBanner(name: string): boolean {
        return !!name.match(/^minecraft:.+_banner$/);
    }

    static isSign(name: string): boolean {
        return !!name.match(/^minecraft:.+_sign$/);
    }
}

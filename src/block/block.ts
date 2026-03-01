import { Banner } from './banner.js';
import { Barrel } from './barrel.js';
import { Beacon } from './beacon.js';
import { Bed } from './bed.js';
import { Beehive } from './beehive.js';
import { Bell } from './bell.js';
import { Coords3d } from '../types/coords.js';
import { Generic } from './generic.js';
import { NbtCompound } from '../nbt/nbt-compound.js';
import { Sign } from './sign.js';

export type BlockInstance = Banner | Barrel | Beacon | Bed | Beehive | Bell | Generic | Sign;

export class Block {
    static blockConstructor = new Map<(name: string) => boolean, typeof Generic>([
        [Block.isBanner, Banner],
        [Block.isBarrel, Barrel],
        [Block.isBeacon, Beacon],
        [Block.isBed, Bed],
        [Block.isBeehive, Beehive],
        [Block.isBell, Bell],
        [Block.isSign, Sign]
    ]);

    static create(name: string, coords: Coords3d, entityData?: NbtCompound): Generic {
        for (const [isBlock, blockConstructor] of Block.blockConstructor) {
            if (isBlock(name)) {
                return new blockConstructor(name, coords, entityData);
            }
        }

        return new Generic(name, coords, entityData);
    }

    static isBanner(name: string): boolean {
        return !!name.match(/^minecraft:.+_banner$/);
    }

    static isBarrel(name: string): boolean {
        return name === 'minecraft:barrel';
    }

    static isBeacon(name: string): boolean {
        return name === 'minecraft:beacon';
    }

    static isBed(name: string): boolean {
        return !!name.match(/^minecraft:.+_bed$/);
    }

    static isBeehive(name: string): boolean {
        return name === 'minecraft:beehive' || name === 'minecraft:bee_nest';
    }

    static isBell(name: string): boolean {
        return name === 'minecraft:bell';
    }

    static isSign(name: string): boolean {
        return !!name.match(/^minecraft:.+_sign$/);
    }
}

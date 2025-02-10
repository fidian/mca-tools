import { BitData } from './bit-data';
import { Coords3d } from '../types/coords';
import { NbtCompound } from '../nbt/nbt-compound';
import { NbtList } from '../nbt/nbt-list';
import { NbtLongArray } from '../nbt/nbt-long-array';

const BLOCKS_PER_CHUNK = 16 * 16 * 16;

function parseBlockData(
    blocks: number[],
    bitData: BitData,
    paletteMap: Map<number, string>
) {
    let bitsRead = 0;
    let blockIdsRead = 0;
    const bitsNeededForPalette = Math.max(
        4,
        Math.ceil(Math.log2(paletteMap.size || 1))
    );

    while (bitData.remainingLength() > 0) {
        while (bitsRead + bitsNeededForPalette <= 64) {
            const blockId = bitData.getBits(bitsNeededForPalette);

            if (!paletteMap.has(blockId)) {
                throw new Error(
                    `Block ID ${blockId} not found in palette when reading index ${blockIdsRead}`
                );
            }

            blocks.push(blockId);
            bitsRead += bitsNeededForPalette;
            blockIdsRead += 1;
        }

        if (bitsRead < 64) {
            // These extra bits can have any values. They are not
            // initialized before writing to disk.
            bitData.getBits(64 - bitsRead);
        }

        bitsRead = 0;
    }

    return blocks;
}

export class BlockData {
    static fromPaletteBlockStates(
        dataVersion: number,
        palette: NbtList<NbtCompound>,
        blockStates?: NbtLongArray
    ) {
        // Convert the palette values to a map
        const paletteSize = palette.data.length;
        const paletteMap = new Map<number, string>();

        if (dataVersion < 0) {
            throw new Error('Data version is required to read block data');
        }

        for (let i = 0; i < paletteSize; i++) {
            const name = palette.data[i].findChild('Name');

            if (name) {
                paletteMap.set(i, name.data);
            } else {
                throw new Error(`Palette entry ${i} does not have a name`);
            }
        }

        const blocks: number[] = [];

        if (blockStates) {
            const bitData = BitData.fromLongArrayTag(blockStates);
            parseBlockData(blocks, bitData, paletteMap);
        }

        // Fill the rest of the blocks with the first element in the palette.
        // The documentation says that a chunk could be filled with just the
        // first index in the palette and not have any block data.
        while (blocks.length < BLOCKS_PER_CHUNK) {
            blocks.push(0);
        }

        // Safety
        while (blocks.length > BLOCKS_PER_CHUNK) {
            blocks.pop();
        }

        return new BlockData(paletteMap, blocks);
    }

    constructor(
        public paletteMap: Map<number, string>,
        public blocks: number[]
    ) {}

    chunkCoordinatesToIndex([x, y, z]: Coords3d) {
        return (y << 8) | (z << 4) | x;
    }

    findBlocksById(id: string): number[] {
        const number = Array.from(this.paletteMap.keys()).find(
            (key) => this.paletteMap.get(key) === id
        );
        const result = [];

        for (let i = 0; i < this.blocks.length; i++) {
            if (this.blocks[i] === number) {
                result.push(i);
            }
        }

        return result;
    }

    getBlockByIndex(index: number) {
        const blockId = this.blocks[index];
        const blockName = this.paletteMap.get(blockId);

        if (!blockName) {
            throw new Error(
                `Block ID ${blockId} not found in palette when reading index ${index}`
            );
        }

        return blockName;
    }

    getBlockByChunkCoordinates(coordinates: Coords3d) {
        const index = this.chunkCoordinatesToIndex(coordinates);

        return this.getBlockByIndex(index);
    }

    indexToChunkCoordinates(index: number): Coords3d {
        const x = index & 0xf;
        const y = (index >> 8) & 0xf;
        const z = (index >> 4) & 0xf;

        return [x, y, z];
    }

    toArray() {
        let errors: any[] = [];

        const result = this.blocks.map((block, index) => {
            const blockId = this.paletteMap.get(block);

            if (!blockId) {
                errors.push({
                    index,
                    chunkCoordinates: this.indexToChunkCoordinates(index),
                    block,
                    blockId,
                    paletteLength: this.paletteMap.size,
                    palette: Array.from(this.paletteMap.values()),
                });
            }

            return {
                chunkCoordinates: this.indexToChunkCoordinates(index),
                blockId,
            };
        });

        if (errors.length) {
            throw new Error(JSON.stringify(errors));
        }

        return result;
    }
}

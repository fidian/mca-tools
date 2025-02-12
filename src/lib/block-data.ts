import debug from 'debug';
import { BitData } from './bit-data';
import { Coords3d } from '../types/coords';
import { NbtCompound } from '../nbt/nbt-compound';
import { NbtList } from '../nbt/nbt-list';
import { NbtLongArray } from '../nbt/nbt-long-array';
import { NbtString } from '../nbt/nbt-string';

const BLOCKS_PER_CHUNK = 16 * 16 * 16;
const debugLog = debug('block-data');

function parseBlockData(
    blockIds: number[],
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
                    `Block ID ${blockId}, index ${blockIdsRead} not found in palette when reading index ${blockIdsRead}`
                );
            }

            debugLog(
                `Block ID ${blockId} (${paletteMap.get(blockId)}) at index ${blockIdsRead}`
            );
            blockIds.push(blockId);
            bitsRead += bitsNeededForPalette;
            blockIdsRead += 1;
        }

        if (bitsRead < 64) {
            // These extra bits can have any values. They are not
            // initialized before writing to disk.
            bitData.getBits(64 - bitsRead);
            debugLog(`Skipped ${64 - bitsRead} bits`);
        }

        bitsRead = 0;
    }

    return blockIds;
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
            const name = palette.data[i].findChild<NbtString>('Name');

            if (name) {
                paletteMap.set(i, name.data);
            } else {
                throw new Error(`Palette entry ${i} does not have a name`);
            }
        }

        const blockIds: number[] = [];

        if (blockStates) {
            const bitData = BitData.fromLongArrayTag(blockStates);
            parseBlockData(blockIds, bitData, paletteMap);
        }

        // Fill the rest of the blocks with the first element in the palette.
        // The documentation says that a chunk could be filled with just the
        // first index in the palette and not have any block data.
        while (blockIds.length < BLOCKS_PER_CHUNK) {
            blockIds.push(0);
        }

        // Safety
        while (blockIds.length > BLOCKS_PER_CHUNK) {
            blockIds.pop();
        }

        return new BlockData(paletteMap, blockIds);
    }

    constructor(
        public paletteMap: Map<number, string>,
        public blockIds: number[]
    ) {}

    chunkCoordinatesToIndex([x, y, z]: Coords3d) {
        return (y << 8) | (z << 4) | x;
    }

    findBlocksByName(name: string): number[] {
        const number = Array.from(this.paletteMap.keys()).find(
            (key) => this.paletteMap.get(key) === name
        );
        const result = [];

        for (let i = 0; i < this.blockIds.length; i++) {
            if (this.blockIds[i] === number) {
                result.push(i);
            }
        }

        return result;
    }

    getBlockByIndex(index: number) {
        const blockId = this.blockIds[index];
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

        const result = this.blockIds.map((blockId, index) => {
            const blockName = this.paletteMap.get(blockId);

            if (!blockName) {
                errors.push({
                    index,
                    chunkCoordinates: this.indexToChunkCoordinates(index),
                    blockId,
                    paletteLength: this.paletteMap.size,
                    palette: Array.from(this.paletteMap.values()),
                });
            }

            return {
                chunkCoordinates: this.indexToChunkCoordinates(index),
                blockName,
            };
        });

        if (errors.length) {
            throw new Error(JSON.stringify(errors));
        }

        return result;
    }
}

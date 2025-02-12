import { BinaryData } from './binary-data';
import { Chunk } from './chunk';
import { Coords2d } from '../types/coords';
import { inflate } from 'pako';
import { Nbt } from '../nbt/nbt';

type LocationEntry = {
    offset: number; // 3 bytes
    sectorCount: number; // 1 byte
};

enum CompressionType {
    GZIP = 1,
    ZLIB = 2,
    NONE = 3,
}

const LOCATION_ENTRIES_PER_FILE = 1024;
const SECTOR_SIZE = 4096;

/**
 * Read and write Minecraft Anvil region files.
 */
export class Anvil {
    static fromBuffer(buffer: ArrayBufferLike): Anvil {
        return new Anvil(buffer);
    }

    cachedLocationEntries: LocationEntry[] | null = null;
    data: BinaryData;

    constructor(data: ArrayBufferLike) {
        this.data = new BinaryData(data);
    }

    /**
     * Returns the buffer that holds the Anvil data.
     */
    buffer(): ArrayBufferLike {
        return this.data.buffer();
    }

    /**
     * Delete a chunk. The location is either given in X,Z chunk coordinates or
     * passed in from a Chunk object.
     */
    deleteChunk(chunkLocation: Coords2d | Chunk): void {
        let index;

        if (Array.isArray(chunkLocation)) {
            index = this.chunkCoordinatesToIndex(chunkLocation);
        } else {
            const coords = chunkLocation.chunkCoordinates();

            if (!coords) {
                throw new Error('Chunk does not have coordinates');
            }

            index = this.chunkCoordinatesToIndex(coords);
        }

        // Clear cache before modifying location entries
        this.cachedLocationEntries = null;
        this.data.seek(index * 4);
        this.data.setNByteInteger(0, 3);
        this.data.setByte(0);
    }

    /**
     * Parses all chunks in the Anvil blob. Chunk objects are read in the order
     * they are stored in the location entry header sector.
     *
     * @returns Chunk[] a list of Chunk objects
     */
    getAllChunks(): Chunk[] {
        // Empty files can be written
        if (this.data.byteLength() === 0) {
            return [];
        }

        const chunks = this.getLocationEntries()
            .filter((x) => x.sectorCount > 0)
            .map((offset) => {
                const nbt = Nbt.fromBuffer(this.getChunkData(offset.offset));

                return new Chunk(nbt);
            });

        return chunks;
    }

    // Gets a chunk using chunk coordinates.
    getChunk(chunkCoords: Coords2d): Chunk | undefined {
        const locationEntries = this.getLocationEntries();
        const entry = locationEntries[this.chunkCoordinatesToIndex(chunkCoords)];

        if (entry?.sectorCount > 0) {
            const nbt = Nbt.fromBuffer(this.getChunkData(entry.offset));

            return new Chunk(nbt);
        }

        return;
    }

    /**
     * Convert from chunk coordinates to region-relative chunk coordinates, and
     * then to an index.
     */
    private chunkCoordinatesToIndex(chunkCoords: Coords2d): number {
        let regionChunkX = chunkCoords[0];
        let regionChunkZ = chunkCoords[1];
        const step = 4096 * 4096;

        while (regionChunkX < 0) {
            regionChunkX += step;
        }

        while (regionChunkZ < 0) {
            regionChunkZ += step;
        }

        return (regionChunkX % 32) + (regionChunkZ % 32) * 32;
    }

    /**
     * Extracts data for a chunk present at the given offset in the Anvil blob.
     * The offset is provided in sectors of SECTOR_SIZE bytes (as in the chunk
     * location entries from the blob's first header sector).
     *
     * @param offset the chunk's offset in number of sectors from the Anvil blob's start.
     */
    protected getChunkData(offset?: number): ArrayBufferLike {
        if (offset !== undefined) {
            this.data.seek(offset * SECTOR_SIZE);
        }

        const length = this.data.getUInt();
        const compressionType = this.data.getByte();
        const data = this.data.getArrayBuffer(length - 1); // First byte is the compression type

        if (
            compressionType === CompressionType.ZLIB ||
            compressionType === CompressionType.GZIP
        ) {
            // Could be SharedArrayBuffer, but it won't get used again after
            // inflation, so it being "shared" does not matter.
            return inflate(data as ArrayBuffer).buffer;
        }

        return data;
    }

    /**
     * Retrieves the full list of chunk location entries from this Anvil blob.
     * The pointer will be moved to the beginning of the first header sector at
     * the start of this method and advanced to the end during reading.
     */
    protected getLocationEntries(): LocationEntry[] {
        if (this.cachedLocationEntries) {
            return this.cachedLocationEntries;
        }

        this.data.seek(0);
        const result: LocationEntry[] = [];

        for (let i = 0; i < LOCATION_ENTRIES_PER_FILE; i += 1) {
            result.push({
                offset: this.data.getNByteInteger(3),
                sectorCount: this.data.getByte(),
            });
        }

        this.cachedLocationEntries = result;

        return result;
    }
}

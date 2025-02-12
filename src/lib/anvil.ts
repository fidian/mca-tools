import { BinaryData } from './binary-data';
import { Chunk } from './chunk';
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

    data: BinaryData;

    constructor(data: ArrayBufferLike) {
        this.data = new BinaryData(data);
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
        this.data.seek(0);
        const result: LocationEntry[] = [];

        for (let i = 0; i < LOCATION_ENTRIES_PER_FILE; i += 1) {
            result.push({
                offset: this.data.getNByteInteger(3),
                sectorCount: this.data.getByte(),
            });
        }

        return result;
    }
}

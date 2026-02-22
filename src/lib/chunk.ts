/**
 * A Chunk is a 16 x 383 x 16 portion of a Minecraft world. It's stored as NBT
 * data in sections of 16 blocks in the Y axis. The Y axis range is from -64 to
 * 320.
 *
 * This class helps manipulate the chunk data.
 */

import { Block, BlockInstance } from '../block/block';
import { BlockData } from './block-data';
import { Coords2d, Coords3d } from '../types/coords';
import { NbtBase } from '../nbt/nbt-base';
import { NbtCompound } from '../nbt/nbt-compound';
import { NbtInt } from '../nbt/nbt-int';
import { NbtIntArray } from '../nbt/nbt-int-array';
import { NbtList } from '../nbt/nbt-list';
import { NbtLong } from '../nbt/nbt-long';
import { NbtLongArray } from '../nbt/nbt-long-array';
import { NbtString } from '../nbt/nbt-string';
import { NbtTagType } from '../nbt/nbt-tag-type';

export class Chunk {
    private dataVersion: number;
    private parsedSections = new Map<NbtCompound, BlockData>();
    private rootNbt: NbtCompound;

    /**
     * Constructs a new chunk object from a given NBT tag.
     *
     * @param root the NBT tag containing the chunk's data
     */
    constructor(root: NbtBase<any>) {
        if (!this.isValidChunkRoot(root)) {
            throw new Error('Invalid chunk root tag');
        }

        this.rootNbt = root;

        // 1.2.1 does not have this tag.
        this.dataVersion = root.findChild<NbtInt>('DataVersion')?.data ?? 0;
    }

    /**
     * Gets the block entity list tag.
     */
    blockEntities(): NbtList<NbtCompound> | undefined {
        return (
            // 1.18+
            this.rootNbt.findChild<NbtList<NbtCompound>>('block_entities') ||
            // up to 1.17
            this.rootNbt.findChild<NbtList<NbtCompound>>('Level/TileEntities')
        );
    }

    /**
     * Gets a block's entity data
     */
    blockEntityData(coords: Coords3d): NbtCompound | undefined {
        return this.blockEntities()?.data.find((tag: NbtCompound) => {
            const x = tag.findChild<NbtInt>('x');
            const y = tag.findChild<NbtInt>('y');
            const z = tag.findChild<NbtInt>('z');

            return (
                x?.data === coords[0] &&
                y?.data === coords[1] &&
                z?.data === coords[2]
            );
        });
    }

    /**
     * Gets the chunk's location in chunk coordinates.
     *
     * Returns a tuple of the chunk's X and Z coordinates.
     */
    chunkCoordinates(): Coords2d | undefined {
        const x =
            // 1.18+ region chunks
            this.rootNbt.findChild<NbtInt>('xPos') ||
            // up to 1.17 region chunks
            this.rootNbt.findChild<NbtInt>('Level/xPos');
        const z =
            // 1.18+ region chunks
            this.rootNbt.findChild<NbtInt>('zPos') ||
            // up to 1.17 region chunks
            this.rootNbt.findChild<NbtInt>('Level/zPos');

        if (typeof x?.data === 'number' && typeof z?.data === 'number') {
            return [x.data, z.data];
        }

        // Check for entity chunks
        const position = this.rootNbt.findChild<NbtIntArray>('Position');

        if (position && position.data.length === 2) {
            return [position.data[0], position.data[1]];
        }

        return;
    }

    /**
     * Returns a unique id for this chunk. It's just the chunk's X and Z
     * coordinates in number of chunks from the world's origin.
     */
    chunkKey(): string | undefined {
        const coords = this.chunkCoordinates();

        if (!coords) {
            return;
        }

        return `${coords[0]},${coords[1]}`;
    }

    /**
     * Returns an instance of a block at a given location using world
     * coordinates.
     */
    getBlock(coords: Coords3d): BlockInstance {
        const sectionY = Math.floor(coords[1] / 16);
        const sectionsTag = this.sectionsTag();

        if (!sectionsTag) {
            throw new Error('Invalid chunk - no sections found');
        }

        const section = sectionsTag.data.find(
            (section) => this.sectionY(section) === sectionY
        );

        if (!section) {
            throw new Error('Block not found in any sections');
        }

        const blockData = this.parseSection(section);
        const [xWorld, zWorld] = this.worldCoordinates() || [0, 0];
        const xChunk = coords[0] - xWorld;
        const zChunk = coords[2] - zWorld;

        if (xChunk < 0 || xChunk > 15) {
            throw new Error('X coordinate out of bounds');
        }

        if (zChunk < 0 || zChunk > 15) {
            throw new Error('Z coordinate out of bounds');
        }

        const index = blockData.chunkCoordinatesToIndex([
            xChunk,
            coords[1] % 16,
            zChunk,
        ]);
        const name = blockData.getBlockByIndex(index);

        return Block.create(name, coords, this.blockEntityData(coords));
    }

    /**
     * Finds all blocks by a given name. Provides [X, Y, Z] real-world coordinates.
     */
    findBlocksByName(name: string): Coords3d[] {
        const sectionsTag = this.sectionsTag();

        if (!sectionsTag) {
            return [];
        }

        return sectionsTag.data.flatMap((section) => {
            const yWorld = this.sectionY(section, true);
            const [xWorld, zWorld] = this.worldCoordinates() || [0, 0];
            const palette = this.sectionPalette(section);

            if (palette === undefined) {
                return [];
            }

            // // If it's not in the palette, we can skip processing.
            if (!this.paletteNameList(palette).includes(name)) {
                return [];
            }

            const blockData = this.parseSection(section);

            return blockData.findBlocksByName(name).map((index): Coords3d => {
                const chunkCoordinates =
                    blockData.indexToChunkCoordinates(index);

                return [
                    xWorld + chunkCoordinates[0],
                    yWorld + chunkCoordinates[1],
                    zWorld + chunkCoordinates[2],
                ];
            });
        });
    }

    /**
     * See how long the chunk has been inhabited. This number increases by 1
     * for each game tick, which is 20 times per second when a player is
     * nearby. It can also advance slowly when players are farther away.
     *
     * On newly created chunks, this value does not match what is expected. Use
     * this with caution.
     */
    inhabitedTime(): bigint | undefined {
        return (
            // 1.18+
            this.rootNbt.findChild<NbtLong>('InhabitedTime')?.data ||
            // up to 1.17
            this.rootNbt.findChild<NbtLong>('Level/InhabitedTime')?.data
        );
    }

    /**
     * Converts the chunk data to a JSON object.
     */
    toObject(): any {
        return this.rootNbt.toObject();
    }

    /**
     * Returns a list of unique block names in the chunk as a Set.
     */
    uniqueBlockNames(): Set<string> {
        const sectionsTag = this.sectionsTag();

        if (!sectionsTag) {
            return new Set();
        }

        const names = sectionsTag.data.flatMap((section) => {
            const palette = this.sectionPalette(section);

            if (!palette) {
                return [];
            }

            return this.paletteNameList(palette);
        });

        return new Set(names);
    }

    /**
     * Gets the chunk's location in real-world coordinates.
     *
     * Returns a tuple of the starting block's world X and Z coordinates. The
     * chunk contains the range from X to X+15 (going East), Y to Y+15 (going
     * up), and Z to Z+15 (going South).
     */
    worldCoordinates(): Coords2d | undefined {
        const result = this.chunkCoordinates();

        if (!result) {
            return;
        }

        return [result[0] * 16, result[1] * 16];
    }

    /**
     * Checks if the given NBT tag is a valid chunk root tag.
     * @param tag the tag to check.
     */
    private isValidChunkRoot(nbt: NbtBase<any>): nbt is NbtCompound {
        return nbt.isCompound('');
    }

    /**
     * Checks if the given NBT tag is a valid chunk section tag, containing a list of chunk sections.
     */
    private isValidChunkSection(
        nbt: NbtBase<any>
    ): nbt is NbtList<NbtCompound> {
        if (!nbt.isList(NbtTagType.COMPOUND)) {
            return false;
        }

        // Java uses "sections", unsure what uses "Sections"
        if (nbt.name.toLowerCase() === 'sections') {
            return true;
        }

        return false;
    }

    /**
     * Returns a list of names within a palette tag.
     */
    private paletteNameList(palette: NbtBase<any>): string[] {
        if (!palette.isList(NbtTagType.COMPOUND)) {
            return [];
        }

        return (palette as NbtList<NbtCompound>).data.map((tag) => {
            const name = tag.findChild<NbtString>('Name');

            return name?.data ?? '';
        });
    }

    /**
     * Parses a section tag into BlockData.
     *
     * Uses a cached version if available;
     */
    private parseSection(section: NbtCompound): BlockData {
        if (this.parsedSections.has(section)) {
            return this.parsedSections.get(section)!;
        }

        const palette = this.sectionPalette(section);

        if (!palette) {
            throw new Error('Invalid chunk section - no palette found');
        }

        const blockStates = this.sectionBlockStates(section);

        if (!blockStates) {
            throw new Error('Invalid chunk section - no block states found');
        }

        const blockData = BlockData.fromPaletteBlockStates(
            this.dataVersion,
            palette,
            blockStates
        );
        this.parsedSections.set(section, blockData);

        return blockData;
    }

    /**
     * Finds the BlockStates tag in a section.
     */
    private sectionBlockStates(section: NbtCompound): NbtLongArray | undefined {
        return (
            // 1.18+
            section.findChild<NbtLongArray>('block_states/data') ||
            // up to 1.17
            section.findChild<NbtLongArray>('BlockStates')
        );
    }

    /**
     * Finds the block palette in a section.
     */
    private sectionPalette(
        section: NbtCompound
    ): NbtList<NbtCompound> | undefined {
        return (
            // 1.18+
            section.findChild<NbtList<NbtCompound>>('block_states/palette') ||
            // up to 1.17
            section.findChild<NbtList<NbtCompound>>('Palette')
        );
    }

    /**
     * Returns all sections
     */
    private sectionsTag(): NbtList<NbtCompound> | undefined {
        const section =
            // 1.18+
            this.rootNbt.findChild<NbtList<NbtCompound>>('sections') ||
            // up to 1.17
            this.rootNbt.findChild<NbtList<NbtCompound>>('Level/Sections');

        if (section && this.isValidChunkSection(section)) {
            return section;
        }

        return;
    }

    /**
     * Returns the Y coordinate of a section, which goes from 0 to 256. If you want the world coordinate, pass true to get -128 to 4031.
     */
    private sectionY(section: NbtCompound, useWorldCoordinate = false): number {
        const ySection = section.findChild<NbtInt>('Y')?.data || 0;

        if (!useWorldCoordinate) {
            return ySection;
        }

        let yWorld = ySection * 16;

        if (yWorld >= 4032) {
            yWorld -= 4096;
        }

        return yWorld;
    }
}

MCA Tools
=========

Command-line tools to work with Minecraft Anvil files (`*.mca`), from version 1.21.4 or newer. Support could be added to earlier versions incrementally as needed.

To install, first you need to install Node.js, then use `npm` to install the package. (Deno and Bun users can use this too, but you'll need to use your tool to do the install.)

```
npm install -g mca-tools
```

After that, you'll have access to all of these fine utilities.

This also has an API to include into your own programs. The JavaScript library doesn't require any Node-specific tooling, allowing you to bundle and build it into a browser environment.


## Command-Line Tools


### `mca-json` - Convert MCA to JSON

Converts an MCA file to JSON. Both input and output files are optional and it will read from stdin and write to stdout if not provided.

```
# See all of the options available
mca-json --help

# Convert a MCA file to JSON
mca-json ~/.minecraft/saves/Test_World/region/r.2.1.mca ~/r.2.1.json
```

The output JSON is expected to be quite large. For example, one mostly untouched region used for testing is about 1 gigabyte of JSON. Because of this, there are options to make the output smaller while still being valid JSON. To not pretty-print the result, using `--compact` will reduce the size to roughly 1/10 of the expanded JSON but it's now all one long line. To preserve the majority of the spacing but collapse lists of numbers into a single line while still pretty printing the rest, use `--condense` and that will consume about 3/10 of the expanded size but still be understandable in a text editor.


### `mca-chunks` - List the chunk coordinates within a MCA file

Lists the chunk coordinates (not world coordinates) of each chunk contained with a single MCA file. Each chunk's coordinates are listed to the output, one per line in the format "X,Z".

```
# Show all chunk coordinates in a file
mca-chunks ~/.minecraft/saves/Test_World/region/r.2.1.mca
```

This can also read the MCA file from stdin or write the output to a file. See `mca-chunks --help` for usage instructions.


### `mca-trim-chunks-without-signs` - Erase chunks

Hides chunks in an MCA file if they do not have signs. If you want to change the seed of your server regularly, you could have players reserve 16x16 chunks by placing a sign anywhere in the chunk with any letters or numbers on it. These signs are different from naturally generating signs. The indexes will be overwritten with zeros to indicate that the data is no longer in the file, so Minecraft will regenerate the chunk the next time it is loaded.

```
# Trim chunks in your region files
cd ~/.minecraft/saves/Test_World/
mca-trim-chunks-without-signs region/*.mca DIM1/region/*.mca DIM-1/region/*.mca
```

Without using additional flags, this will trim chunks that currently have players. Check the usage with `mca-trim-chunks-without-signs --help` for additional options.

For reference, the naturally generating signs will have message like the following.

* Chairs in taiga villages: ["", "", "", ""] and ["", "", "", ""]
* Igloo basements: ["", "<----", "---->", ""] and ["", "", "", ""]


### `nbt-json` - Convert NBT data to JSON

This is useful for seeing what's in a player's `*.dat` file. Simply loads and decompresses the NBT, then writes it as a JSON object.

```
# See all of the options available
nbt-json --help

# Convert an NBT file to JSON
nbt-json ~/.minecraft/saves/Test_World/playerdata/b248e729-09c2-40dd-9168-12d191b4f0b8.dat
```


## API


### `class Anvil`

```
import { Anvil } from 'mca-tools';
import { readFile } from 'node:fs/promises';

const data = await readFile('r.0.0.mca');
const anvil = Anvil.fromBuffer(data.buffer);
```


#### `static fromBuffer(buffer: ArrayBufferLike): Anvil`

Loads data into an Anvil class.


#### `anvil.data`

The `ArrayBuffer` used. Nothing gets parsed right away and is all loaded and parsed on demand.

#### `anvil.getAllChunks(): Chunk[]`

Parses the NBT data and returns an array of `Chunk` instances.


### `class Chunk`

```
// Continuing example from Anvil class
const chunks = anvil.getAllChunks();
const firstChunk = chunks[0];
console.log(firstChunk.chunkCoordinates()); // [0, 0]
```


#### `chunk.blockEntityData(coords: Coords3d): NbtCompound | undefined`

Gets associated block entity data from the chunk. For instance, this can get a sign's text or the items in a chest. If the information is not found, this will return `undefined`.


#### `chunk.chunkCoordinates(): Coords2d`

Returns an array with the X and Z coordinates. The chunk's coordinates are the `xPos` and `yPos` tags, which are absolute chunk coordinates from the world origin, not from the region.


#### `chunk.findBlocksByName(name: string): Coords3d[]`

Returns an array. Each element in the array is another array of the X, Y, and Z coordinates of blocks. The coordinates are real-world coordinates. This method will need to unpack the block list, so it will first use a palette to see if the decompression and the lengthy scan can be avoided.


#### `chunk.getBlock(coords: Coords3d): GenericBlock`

Returns a block class that represents the block at the given coordinates. For known blocks, there are additional methods. See "Block Classes" for further information.


#### `chunk.inhabitedTime(): bigint | undefined`

Shows the number of ticks processed in the chunk. When the player is nearby, this increases at 20 ticks per second. When the player is farther away, the tick count could advance slower. Does not increment when the chunk isn't loaded.


#### `chunk.toObject(): object`

Converts the internal NBT structure to an object literal, which can be serialized properly with `JSON.stringify()`.


#### `chunk.uniqueBlockNames(): Set<string>`

Returns a list of all unique block names within a given chunk.


#### `chunk.worldCoordinates(): Coords2d`

Returns an array with the X and Z real-world coordinates. The chunk will span from X to X+15 (going East) and from Z to Z+15 (going South). The chunk is the entire vertical column of the world.


### Block Classes

All blocks will inherit from Generic. Other types of blocks are detected by their name. Below are the patterns and the type of block that will be produced if that filter matches. There's a built-in function that will be used to determine if a block is of a specific type. These are static methods on the `Block` class, which all take the name as the only parameter and return a boolean.

* `Block.isBanner(name: string): boolean` - Matches all banners
* `Block.isBarrel(name: string): boolean`
* `Block.isBeacon(name: string): boolean`
* `Block.isBed(name: string): boolean`
* `Block.isBeehive(name: string): boolean` - Matches beehives and bee nests
* `Block.isBell(name: string): boolean`
* `Block.isSign(name: string): boolean` - Matches all signs

To add to this complexity, there are many blocks that support generic methods, such as `.customName()` and `.lock()`. Those are listed under `generic` in this documentation and called out special because they are not on all block instances.


#### `generic.components(): NbtCompound | undefined`

Associated data components for this block.


#### `generic.coords: Coords3d`

The world coordinates of the block.


#### `generic.customName(): string | undefined`

Returns the custom name, used in the GUI when interacting with the block.

*Method only exists if block supports a custom name.*


#### `generic.entityData: NbtCompound | undefined`

The NBT entity data associated with this block. If there is none, this is left `undefined`.


#### `generic.lock(): string | undefined`

Returns the item name needed to interact with the block.

*Method only exists if block supports locking.*


#### `generic.name: string`

The name of the block.


#### `banner.patterns(): BannerPattern[]`

Returns a list of banner pattern information applied to the banner, in order.

```
interface BannerPattern {
    color: string;
    pattern: string | {
        asset_id: string;
        translation_key: string;
    }
}
```


#### `barrel.items(): NbtList<NbtCompound>`

The list of items in each slot of the barrel.


#### `barrel.lootTable(): string | undefined`

The loot table name for generating random contents.


#### `barrel.lootTableSeed(): bigint | undefined`

The seed to use when generating random contents. 0 means to use a random seed.


#### `beacon.primaryEffect(): string | undefined`

The primary effect name of the beacon.


#### `beacon.secondaryEffect(): string | undefined`

The secondary effect name of the beacon.


#### `beehive.bees(): NbtList<NbtCompound> | undefined`

Information about the bees within the beehive or bee nest.


#### `beehive.flowerPos(): Coords3d | undefined`

Location of the associated flower.


#### `sign.backColor(): string | undefined`

Returns the color of the text on the back of the sign for 1.20+. For older versions, this returns `undefined`.


#### `sign.backGlowingText(): boolean | undefined`

Returns `true` if the sign has glowing text on the back for 1.20+. For older versions, this returns `undefined`.


#### `sign.backText(): string[] | undefined`

Returns the four lines of text on the back of the sign for 1.20+. For older versions, this returns `undefined`.


#### `sign.frontColor(): string | undefined`

Returns the color of the text on the front of the sign.


#### `sign.frontGlowingText(): boolean | undefined`

Returns `true` if the sign has glowing text on the front.


#### `sign.frontText(): string[]`

Returns the four lines of text on the front of the sign.


#### `sign.isWaxed(): boolean`

Returns `true` if the sign is waxed and `false` if not for 1.20+. For older versions, this returns `undefined`.


### NBT Classes

There are several NBT classes that could be retrieved when you want direct access to the chunk's data. They all have a `.toJson()` method that will return an array with the name of the tag as the first element and the tag's data as the second. This is used to facilitate easier transforms into JSON.


#### `Nbt.fromBuffer(data: ArrayBufferLike): NbtBase<any>`

Parses NBT data. Returns one of the NBT classes below, depending on the tag's type. This does *not* deal with compressed data. It's the responsibility of the container (Anvil) to decompress the data stream before passing it to this parser.


#### `Nbt.fromSnbt(snbt: string): NbtBase<any>`

Parses SNBT data. Returns the hydrated NBT classes from the string form.


#### `Nbt.getTag(binaryData: BinaryData): NbtBase<any>`

Reads binary data from the `BinaryData` instance to determine the type, then calls the appropriate reader to provide the NBT tag.


#### `NbtBase.readName(binaryData: BinaryData): string`

Reads the name portion from a tag. Included in most tags.


#### `nbtBase.findChild(path: string): NbtBase<any> | undefined`

Finds a child by looking for exact string matches on names. Children can also be matched by using "/" as a separator, such as "Level/sections".

Only works on `NbtList` and `NbtCompound` tags. On all others, this will return `undefined`.


#### `nbtBase.isCompound(name: string): boolean`

Checks if this is a compound tag. If `name` is also given, this checks to see if the compound tag's name also exactly matches. If either condition is not met, this returns `false`.


#### `nbtBase.isList(subtype: NbtTagType): boolean`

Checks if the tag is a list. If `subtype` is also given, this checks to see if the list tag's subtype also exactly matches. If either condition is not met, this returns `false`.


#### `nbtBase.toObject(): any`

Returns a plain object form of the tag. If this is a compound or list, then all children are included as well.


#### `nbtBase.toSnbt(): string`

Converts the tag to SNBT. The conversion will write out into a standard form, not necessarily matching what was parsed. For instance, the byte value "true" would be changed to "1". Strings will all use double quotes. Other minor changes, but the output will be valid SNBT.


## Additional Notes


### Coordinate Systems

A player in Minecraft can easily determine their world coordinates. To convert
from world coordinates to chunk coordinates, divide the x and z world
coordinates by 16, rounded down. World coordinates and chunk coordinates also
relate similarly to regions, which are 32 x 32 chunks.  The region coordinates
are the chunk coordinates divided by 32 and rounded down.

|        Type        |   X   |   Y   |   Z   |
|:------------------:|:-----:|:-----:|:-----:|
|  World Coordinates |  1234 |   65  | -5678 |
|  Chunk Coordinates |   77  |   *   |  -355 |
| Region Coordinates |   2   |   *   |  -12  |

Special notes about the above example:

* Rounding always rounds down. This may be tricky for negative numbers. -5678 / 16 = -354.875, so that rounds down to -355.
* Chunks span the entire Y column, from bedrock to the build limit.
* Region coordinates are used in the naming of the anvil file. The coordinates used in the example above would be in the file named `r.2.-12.mca`.


### Supported versions

This has been loosely tested with the following editions. Other versions should work as well. If not, please supply a test MCA file and a description of the problem, or submit a pull request.

* Java, 1.21.4, data version 4189.
* Java, 1.17.1, data version 2730.

Other versions can be supported through pull requests that contain tests to verify loading and processing works.

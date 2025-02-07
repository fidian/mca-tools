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


### `mca2json` - Convert MCA to JSON

Converts an MCA file to JSON. Both input and output files are optional and it will read from stdin and write to stdout if not provided.

```
# See all of the options available
mca2json --help

# Convert a MCA file to JSON
mca2json ~/.minecraft/saves/Test_World/region/r.2.1.mca ~/r.2.1.json
```

The output JSON is expected to be quite large. For example, one mostly untouched region used for testing is about 1 gigabyte of JSON. Because of this, there are options to make the output smaller while still being valid JSON. To not pretty-print the result, using `--compact` will reduce the size to roughly 1/10 of the expanded JSON but it's now all one long line. To preserve the majority of the spacing but collapse lists of numbers into a single line while still pretty printing the rest, use `--condense` and that will consume about 3/10 of the expanded size but still be understandable in a text editor.

If you only want to know what chunks are within a region file, use `--list-chunk-coords` and they will be printed, one per line.


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


#### `chunk.findBlocksById(id: string): Coords3d[]`

Returns an array. Each element in the array is another array of the X, Y, and Z coordinates of blocks. The coordinates are real-world coordinates. This method will need to unpack the block list, so it will first use a palette to see if the decompression and the lengthy scan can be avoided.


#### `chunk.signText(coords: Coords3d): { front: string, back: string } | undefined`

Gets a sign's text, both the front and back sides. If the entity data is not found or is not for a sign, this will return `undefined`.


#### `chunk.toJson(): object`

Converts the internal NBT structure to a JSON version.


#### `chunk.uniqueBlockNames(): Set<string>`

Returns a list of all unique block names within a given chunk.


#### `chunk.worldCoordinates(): Coords2d`

Returns an array with the X and Z real-world coordinates. The chunk will span from X to X+15 (going East) and from Z to Z+15 (going South). The chunk is the entire vertical column of the world.


### `nbtParser(data: ArrayBufferLike): NbtBase`

Parses NBT data. Returns one of the NBT classes below, depending on the tag's type. This does *not* deal with compressed data. It's the responsibility of the container (Anvil) to decompress the data stream before passing it to this parser.


### NBT Classes

There are several NBT classes that could be retrieved when you want direct access to the chunk's data. They all have a `.toJson()` method that will return an array with the name of the tag as the first element and the tag's data as the second. This is used to facilitate easier transforms into JSON.


## Additional Notes


### Coordinate Systems

A player in Minecraft can easily determine their world coordinates. To convert
from world coordinates to chunk coordinates, divide the x and z world
coordinates by 16, rounded down. World coordinates and chunk coordinates also
relate similarly to regions, which are 32 x 32 chunks.  The region coordinates
are the chunk coordinates divided by 32 and rounded down.

|        Type        |   X   |   Y   |   Z   |
|:------------------:|:-----:|:-----:|:-----:|
| Player Coordinates |  1234 |   65  | -5678 |
|  Chunk Coordinates |   77  |   *   |  -355 |
| Region Coordinates |   2   |   *   |  -12  |

Special notes about the above example:

* Rounding always rounds down. This may be tricky for negative numbers. -5678 / 16 = -354.875, so that rounds down to -355.
* Chunks span the entire Y column, from bedrock to the build limit.
* Region coordinates are used in the naming of the anvil file. The coordinates used in the example above would be in the file named `r.2.-12.mca`.


### Supported versions

* Java, 1.21.4, data format 4189.

Other versions can be supported through pull requests that contain tests to verify loading and processing works.

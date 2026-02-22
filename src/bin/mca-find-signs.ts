#!/usr/bin/env node

import debug from 'debug';
import neodoc from 'neodoc';
import { Anvil } from '../lib/anvil';
import { Chunk } from '../lib/chunk';
import { Sign } from '../block/sign';
import { readFile } from 'node:fs/promises';

interface SignInfo {
    chunkX: number;
    chunkZ: number;
    x: number;
    y: number;
    z: number;
    front: string[];
    back: string[] | null;
}

interface Args {
    '--blank'?: boolean;
    '--generated'?: boolean;
    '--first'?: boolean;
    '--user'?: boolean;
    '--verbose'?: boolean;
    MCA_FILE?: string[];
}

const debugLog = debug('mca-find-signs');
const args: Args = neodoc.run(
    `Usage: mca-find-signs [OPTIONS] MCA_FILE...

Extracts sign coordinates from MCA files. This is designed to find different
categories of signs.

* Blank signs are blank on both sides.
* Generated signs can be blank or have any non-numeric and non-alphabetic
  characters. This is so igloos with "<----" and "---->" are included.
* User-created signs must have at least a number or a letter on the front or
  the back. There's no way to tell from the block data that a user placed a
  sign, but this is a good heuristic.

The default output is a JSON array that shows the following information:

[
    {
        "chunkX": 0,
        "chunkZ": 3,
        "x": 12,
        "y": 34,
        "z": 56,
        "front": ["Line 1", "Line 2", "Line 3", "Line 4"],
        "back": ["Line 1", "Line 2", "Line 3", "Line 4"]
    },
    ...
]

Options:
    --blank         Only show blank signs. Conflicts with --generated and --user.
    --generated     Only show generated signs. Conflicts with --blank and --user.
    --user          Only show user-created signs. Conflicts with --blank and --generated.
    --first         Stop scanning a chunk after the first sign is found.
    -h, --help      Show this message.
    -v, --verbose   Show more information during processing.
`,
    {
        argv: [...process.argv].slice(2),
        laxPlacement: true,
    }
);

if (!args.MCA_FILE?.length) {
    console.error('No files specified.');
    process.exit(1);
}

if (
    (args['--blank'] ? 1 : 0) +
        (args['--generated'] ? 1 : 0) +
        (args['--user'] ? 1 : 0) >
    1
) {
    console.error(
        'Conflicting options specified. Please choose only one of --blank, --generated, or --user.'
    );
    process.exit(1);
}

const signs: SignInfo[] = [];

for (const file of args.MCA_FILE) {
    try {
        const moreSigns = await processFile(file);
        signs.push(...moreSigns);
    } catch (e) {
        console.error(`Error processing file ${file}: ${e}`);

        process.exit(1);
    }
}

console.log(JSON.stringify(signs, null, 4));

async function processFile(filename: string): Promise<SignInfo[]> {
    debugLog(`Reading file: ${filename}`);

    if (args['--verbose']) {
        console.log(`Reading file: ${filename}`);
    }

    const contents = await readFile(filename);
    const anvil = Anvil.fromBuffer(contents.buffer);
    const chunks = anvil.getAllChunks();
    const allSignsFound: SignInfo[] = [];

    for (const chunk of chunks) {
        const chunkKey = chunk.chunkKey() || '';
        const signs = processChunk(chunk);

        if (signs.length > 0) {
            debugLog(`Found ${signs.length} signs in chunk ${chunkKey}.`);

            if (args['--verbose']) {
                console.log(
                    `Found ${signs.length} signs in chunk ${chunkKey}.`
                );
            }

            allSignsFound.push(...signs);
        }
    }

    return allSignsFound;
}

function processChunk(chunk: Chunk): SignInfo[] {
    const blockNames = chunk.uniqueBlockNames();
    const foundSigns: SignInfo[] = [];

    for (const blockName of blockNames) {
        if (blockName.match(/^minecraft:.+_sign$/)) {
            debugLog(`Found sign: ${blockName}`);

            const listOfBlockCoordinates = chunk.findBlocksByName(blockName);

            if (listOfBlockCoordinates.length === 0) {
                debugLog(
                    `Possible corruption - no blocks found for sign: ${blockName}`
                );
            }

            for (const coords of listOfBlockCoordinates) {
                debugLog(`Checking block at coordinates: ${coords}`);
                const block = chunk.getBlock(coords);

                if (!(block instanceof Sign)) {
                    throw new Error(
                        `Block is supposed to be a sign: ${block.name}`
                    );
                }

                const front = block.frontText();
                const back = block.backText();
                const text = [...front, ...(back ?? [])].join('');
                debugLog(`Front: ${JSON.stringify(front)}`);
                debugLog(`Back: ${JSON.stringify(back)}`);

                if (args['--blank'] && text.length !== 0) {
                    debugLog(`Skipping non-blank sign.`);
                    continue;
                }

                if (args['--generated'] && !text.match(/^[^a-z0-9]*$/i)) {
                    debugLog(`Skipping user-created sign.`);
                }

                if (args['--user'] && !text.match(/[a-z0-9]/i)) {
                    debugLog(`Skipping a possible generated sign.`);
                    continue;
                }

                debugLog(`Found a matching sign.`);

                if (args['--verbose']) {
                    console.log(
                        `Found a matching sign: ${JSON.stringify(front)} and ${JSON.stringify(back)}`
                    );
                }

                const chunkCoordinates = chunk.chunkCoordinates();

                if (!chunkCoordinates) {
                    throw new Error('Chunk coordinates not found.');
                }

                foundSigns.push({
                    chunkX: chunkCoordinates[0],
                    chunkZ: chunkCoordinates[1],
                    x: coords[0],
                    y: coords[1],
                    z: coords[2],
                    front,
                    back: back ?? null,
                });

                if (args['--first']) {
                    return foundSigns;
                }
            }
        }
    }

    return foundSigns;
}

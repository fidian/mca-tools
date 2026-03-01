#!/usr/bin/env node

import debug from 'debug';
import getStdin from 'get-stdin';
import neodoc from 'neodoc';
import { inflate } from 'pako';
import { Nbt } from '../nbt/nbt.js';
import { readFile } from 'node:fs/promises';

const debugLog = debug('mca-trim-chunks-without-signs');
main();

async function main() {
const args: {
    'NBT_FILE'?: string[];
} = neodoc.run(
`Usage: nbt-get-player-locations NBT_FILE...

Scans a player NBT data file for the player location and prints it to stdout.
NBT files can be compressed or uncompressed and this tool can handle both. If the filename is "-" or not provided, this will read from stdin.

The output is JSON with the following fields:

{
    "chunkX": 7,                            # player's chunk X coordinate
    "chunkZ": -29                           # player's chunk Z coordinate
    "x": 123,                               # player's X coordinate, rounded
    "y": 64,                                # player's Y coordinate, rounded
    "z": -456,                              # player's Z coordinate, rounded
    "dimension": "minecraft:overworld",     # or "minecraft:the_nether" or "minecraft:the_end"
}

Options:
    -h, --help      Show this message.
`,
    {
        argv: [...process.argv].slice(2),
        laxPlacement: true,
    }
);

    if (!args.NBT_FILE?.length) {
        args.NBT_FILE = ['-'];
    }

    for (const file of args.NBT_FILE) {
        try {
            await processFile(file);
        } catch (e) {
            console.error(`Error processing file ${file}: ${e}`);

            process.exit(1);
        }
    }
}

async function readInput(filename: string | undefined) {
    if (!filename || filename === '-') {
        debugLog('Reading from stdin');
        return await getStdin.buffer();
    }

    debugLog('Reading file: %s', filename);

    return readFile(filename);
}

async function processFile(filename: string) {
    const inputBuffer = await readInput(filename);

    if (inputBuffer.length === 0) {
        if (filename === '-') {
            console.error('Input (stdin) is empty.');
        } else {
            console.error(`Input file is empty: ${filename}`);
        }
        console.error('Aborting. Use --help for usage.');
        process.exit(1);
    }

    let buffer = inputBuffer.buffer as ArrayBufferLike;

    try {
        buffer = inflate(inputBuffer).buffer;
    } catch (_ignore) {}

    const nbt = Nbt.fromBuffer(buffer);

    const dimension = nbt.findChild('Dimension')?.data;
    const x = nbt.findChild('Pos/0')?.data;
    const y = nbt.findChild('Pos/1')?.data;
    const z = nbt.findChild('Pos/2')?.data;

    if (typeof dimension !== 'string' || typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
        console.error(`NBT file ${filename} does not contain valid player location data.`);
        process.exit(1);
    }

    const chunkX = Math.floor(x / 16);
    const chunkZ = Math.floor(z / 16);
    const output = {
        chunkX,
        chunkZ,
        x: Math.round(x),
        y: Math.round(y),
        z: Math.round(z),
        dimension,
    };
    console.log(JSON.stringify(output, null, 4));
}

#!/usr/bin/env node

import debug from 'debug';
import neodoc from 'neodoc';
import { Anvil } from '../lib/anvil';
import { Chunk } from '../lib/chunk';
import { Sign } from '../block/sign';
import { readFile, writeFile } from 'node:fs/promises';

const debugLog = debug('mca-trim-chunks-without-signs');
const args: {
    '--dry-run'?: boolean;
    '--preserve'?: string[];
    '--verbose'?: boolean;
    'MCA_FILE'?: string[];
} = neodoc.run(
`Usage: mca-trim-chunks-without-signs [OPTIONS] MCA_FILE...

Removes chunks from MCA files that do not contain a matching sign block. Signs
need to have at least one letter or number on them to differentiate them from
naturally generated signs.

This does not change the file size. Similar to deleting a file on a hard drive,
the space is marked as free but not overwritten.

Options:
    -h, --help      Show this message.
    -n, --dry-run   Do not write changes to the file.
    --preserve CHUNK_COORDINATES...
                    Do not remove chunks with these coordinates. Coordinates
                    are in the format "x,z". May be specified multiple times.
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

if (!args['--preserve']) {
    args['--preserve'] = [];
}

if (args['--preserve'].length) {
    console.log(`Preserving coordinates: ${args['--preserve'].join(' ')}`);
}

for (const file of args.MCA_FILE) {
    try {
        await processFile(file);
    } catch (e) {
        console.error(`Error processing file ${file}: ${e}`);

        process.exit(1);
    }
}

async function processFile(filename: string) {
    debugLog(`Reading file: ${filename}`);

    if (args['--verbose']) {
        console.log(`Reading file: ${filename}`);
    }

    const contents = await readFile(filename);
    const anvil = Anvil.fromBuffer(contents.buffer);
    const chunks = anvil.getAllChunks();
    let changes = 0;
    const preservedCoordinates = new Set(args['--preserve']);

    for (const chunk of chunks) {
        const chunkKey = chunk.chunkKey() || '';

        if (preservedCoordinates.has(chunkKey)) {
            debugLog(`Preserving chunk (via command-line): ${chunkKey}`);

            if (args['--verbose']) {
                console.log(`Preserving chunk (via command-line): ${chunkKey}`);
            }
        } else if (processChunk(chunk)) {
            debugLog(`Preserving chunk (sign detected): ${chunkKey}`);

            if (args['--verbose']) {
                console.log(`Preserving chunk (sign detected): ${chunkKey}`);
            }
        } else {
            debugLog(`Removing chunk: ${chunkKey}`);
            anvil.deleteChunk(chunk);
            changes += 1;
        }
    }

    if (args['--verbose']) {
        console.log(`Chunks removed: ${changes}/${chunks.length}`);
    }

    if (changes) {
        if (args['--dry-run']) {
            console.log(`DRY RUN: Would write changes to file: ${filename}`);
        } else {
            console.log(`Writing changes to file: ${filename}`);
            const modifiedBuffer = Buffer.from(anvil.buffer());
            await writeFile(filename, modifiedBuffer);
        }
    }
}

function processChunk(chunk: Chunk): boolean {
    const blockNames = chunk.uniqueBlockNames();

    for (const blockName of blockNames) {
        if (blockName.match(/^minecraft:.+_sign$/)) {
            debugLog(`Found sign: ${blockName}`);

            for (const coords of chunk.findBlocksByName(blockName)) {
                const block = chunk.getBlock(coords);

                if (!(block instanceof Sign)) {
                    throw new Error(`Block is supposed to be a sign: ${block.name}`);
                }

                const front = block.frontText();
                const back = block.backText();
                debugLog(`Front: ${JSON.stringify(front)}`);
                debugLog(`Back: ${JSON.stringify(back)}`);

                if ([...front, ...(back || [])].join('').match(/[a-z0-9]/i)) {
                    debugLog(`Found a user-created sign. Preserving chunk.`);

                    if (args['--verbose']) {
                        console.log(`Found a user-created sign: ${JSON.stringify(front)} and ${JSON.stringify(back)}`);
                    }

                    return true;
                }
            }
        }
    }

    return false;
}

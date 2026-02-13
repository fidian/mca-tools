#!/usr/bin/env node

import debug from 'debug';
import neodoc from 'neodoc';
import { Anvil } from '../lib/anvil';
import { Chunk } from '../lib/chunk';
import { Sign } from '../block/sign';
import { readFile, writeFile } from 'node:fs/promises';

const debugLog = debug('mca-find-chunks-with-signs');
const args: {
    '--verbose'?: boolean;
    MCA_FILE?: string[];
} = neodoc.run(
    `Usage: mca-trim-chunks-without-signs [OPTIONS] MCA_FILE...

Displays chunk X and Z coordinates, separated by a tab, for all chunks in MCA
files that contain a sign block. Signs need to have at least one letter or
number on them to differentiate them from naturally generated signs.

Options:
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

    for (const chunk of chunks) {
        const chunkKey = chunk.chunkKey() || '';

        if (processChunk(chunk)) {
            const coords = chunk.chunkCoordinates();

            if (!coords) {
                throw new Error(`Chunk ${chunkKey} has no coordinates.`);
            }

            console.log(`${coords[0]}\t${coords[1]}`);
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
                    throw new Error(
                        `Block is supposed to be a sign: ${block.name}`
                    );
                }

                const front = block.frontText();
                const back = block.backText();
                debugLog(`Front: ${JSON.stringify(front)}`);
                debugLog(`Back: ${JSON.stringify(back)}`);

                if ([...front, ...(back || [])].join('').match(/[a-z0-9]/i)) {
                    debugLog(`Found a user-created sign. Preserving chunk.`);

                    if (args['--verbose']) {
                        console.log(
                            `Found a user-created sign: ${JSON.stringify(front)} and ${JSON.stringify(back)}`
                        );
                    }

                    return true;
                }
            }
        }
    }

    return false;
}

#!/usr/bin/env node

import debug from 'debug';
import neodoc from 'neodoc';
import { Anvil } from '../lib/anvil.js';
import { readFile, writeFile } from 'node:fs/promises';

const debugLog = debug('mca-remove-chunks');
const args: {
    '--dry-run'?: boolean;
    '--remove'?: string[];
    '--remove-list'?: string;
    '--preserve'?: string[];
    '--preserve-list'?: string;
    '--verbose'?: boolean;
    MCA_FILE?: string[];
} = neodoc.run(
    `Usage: mca-remove-chunks [OPTIONS] MCA_FILE...

Removes chunks from MCA files (region/r.*.*.mca or entities/r.*.*.mca).

This does not change the file size. Similar to deleting a file on a hard drive,
the space is marked as free but not actually removed. Minecraft will reuse or reclaim the space when the region file is next modified.

You can either specify chunk coordinates to preserve or chunk coordinates to remove, but not both.

Options:
    -h, --help      Show this message.
    -n, --dry-run   Do not write changes to the file.
    --remove CHUNK_COORDINATES...
                    Remove chunks with these coordinates. Coordinates are in
                    the format "x,z". May be specified multiple times.
    --remove-list FILE
                    Remove chunks with coordinates specified in a text file.
                    Each line of the file should have coordinates in the format
                    "x,z". Safe to combine with --remove option.
    --preserve CHUNK_COORDINATES...
                    Do not remove chunks with these coordinates. Coordinates
                    are in the format "x,z". May be specified multiple times.
    --preserve-list FILE
                    Preserve chunks with coordinates specified in a text file.
                    Each line of the file should have coordinates in the format
                    "x,z". Safe to combine with --preserve option.
    -v, --verbose   Show more information during processing.
`,
    {
        argv: [...process.argv].slice(2),
        laxPlacement: true,
    }
);

main();

async function main() {
    if (!args.MCA_FILE?.length) {
        console.error('No files specified.');
        process.exit(1);
    }

    if (args['--remove-list']) {
        const coordinates = await readCoordinates(args['--remove-list']);

        if (!args['--remove']) {
            args['--remove'] = [];
        }

        args['--remove'].push(...coordinates);
    }

    if (args['--preserve-list']) {
        const coordinates = await readCoordinates(args['--preserve-list']);

        if (!args['--preserve']) {
            args['--preserve'] = [];
        }

        args['--preserve'].push(...coordinates);
    }

    if (args['--remove'] && args['--preserve']) {
        console.error('Cannot specify both --remove and --preserve options.');
        process.exit(1);
    }

    if (!args['--remove'] && !args['--preserve']) {
        console.error('Must specify either --remove or --preserve option.');
        process.exit(1);
    }

    if (args['--preserve'] && args['--verbose']) {
        console.log(`Preserving coordinates: ${args['--preserve'].join(' ')}`);
    }

    if (args['--remove'] && args['--verbose']) {
        console.log(`Removing coordinates: ${args['--remove'].join(' ')}`);
    }

    const determinator = makeDeterminator();

    for (const file of args.MCA_FILE) {
        try {
            await processFile(file, determinator);
        } catch (e) {
            console.error(`Error processing file ${file}: ${e}`);

            process.exit(1);
        }
    }
}

async function processFile(
    filename: string,
    determinator: (chunkKey: string) => boolean
) {
    debugLog('Reading file: %s', filename);

    if (args['--verbose']) {
        console.log(`Reading file: ${filename}`);
    }

    const contents = await readFile(filename);
    const anvil = Anvil.fromBuffer(contents.buffer);
    const chunks = anvil.getAllChunks();
    let changes = 0;

    for (const chunk of chunks) {
        const chunkKey = chunk.chunkKey() || '';

        if (determinator(chunkKey)) {
            debugLog('Preserving chunk: %s', chunkKey);

            if (args['--verbose']) {
                console.log(`Preserving chunk: ${chunkKey}`);
            }
        } else {
            debugLog('Removing chunk: %s', chunkKey);

            if (args['--verbose']) {
                console.log(`Removing chunk: ${chunkKey}`);
            }

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

function makeDeterminator() {
    if (args['--preserve']) {
        const preservedCoordinates = new Set(args['--preserve']);

        return (chunkKey: string) => preservedCoordinates.has(chunkKey);
    } else if (args['--remove']) {
        const removedCoordinates = new Set(args['--remove']);

        return (chunkKey: string) => !removedCoordinates.has(chunkKey);
    } else {
        throw new Error('Invalid state: no determinator could be created.');
    }
}

async function readCoordinates(filename: string): Promise<string[]> {
    const contents = await readFile(filename, 'utf-8');
    const lines = contents
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
    return lines;
}

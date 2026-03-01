#!/usr/bin/env node

import getStdin from 'get-stdin';
import neodoc from 'neodoc';
import { Anvil } from '../lib/anvil.js';
import { readFile, writeFile } from 'node:fs/promises';

async function readInput(filename: string | undefined) {
    if (!filename || filename === '-') {
        return await getStdin.buffer();
    }

    return readFile(filename);
}

const args: {
    '--chunk-coords'?: string | string[];
    '--compact'?: boolean;
    '--condense'?: boolean;
    '<input>'?: string;
    '<output>'?: string;
} = neodoc.run(
`Usage: mca-json [OPTIONS] [<input> [<output>]]

Converts a Minecraft MCA file to JSON. Both input and output are optional. If
input is not provided, this reads from stdin. If output is not provided, this
writes to stdout.

Because MCA files can contain a tremendous amount of information, the tool
might run out of memory. When that happens, you can dump specific chunks by
specifying the --chunk-coords option.

Options:
    --chunk-coords=COORDS
                    Only write out the chunk at the specified chunk coordinates.
                    Chunk coordinates are absolute chunks from the world origin.
                    Can be specified multiple times. Coordinates are specified
                    as "x,z". Highly recommended to limit the size of the JSON
                    that's generated.
    --compact       Do not use pretty-printing in the JSON output.
    --condense      Condense arrays of bytes, ints, and longs to a single line.
                    This significantly cuts down on the size of the generated
                    JSON.
    -h, --help      Show this message.
`,
    {
        argv: [...process.argv].slice(2),
        laxPlacement: true,
    }
);

readInput(args['<input>'])
    .then((inputBuffer) => {
        if (inputBuffer.length === 0) {
            console.error('No input provided. Use --help for usage.');
            process.exit(1);
        }

        const anvilParser = Anvil.fromBuffer(inputBuffer.buffer as ArrayBuffer);
        let chunks = anvilParser.getAllChunks();

        if (args['--chunk-coords']) {
            if (!Array.isArray(args['--chunk-coords'])) {
                args['--chunk-coords'] = [args['--chunk-coords']];
            }

            const wanted = new Set<string | undefined>(args['--chunk-coords']);
            chunks = chunks.filter((chunk) => wanted.has(chunk.chunkKey()));
        }

        let jsonObjects = chunks.map((chunk) => chunk.toObject());

        if (args['--compact']) {
            return JSON.stringify(jsonObjects);
        }

        let content = JSON.stringify(jsonObjects, null, 4);

        if (args['--condense']) {
            content = content.replace(
                /: \[(\n\s*"?-?\d+"?,?)*\n\s*\]/g,
                (match) => {
                    return match.replace(/\n\s*/g, ' ');
                }
            );
        }

        return content;
    })
    .then((output: string) => {
        if (args['<output>']) {
            writeFile(args['<output>'], output);
        } else {
            console.log(output);
        }
    });

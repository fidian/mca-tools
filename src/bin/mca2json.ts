#!/usr/bin/env node

import getStdin from 'get-stdin';
import neodoc from 'neodoc';
import { Anvil } from '../lib/anvil';
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
    '--list-chunk-coords'?: boolean;
    '<input>'?: string;
    '<output>'?: string;
} = neodoc.run(
`Usage: mca2json [OPTIONS] [<input> [<output>]]

Converts a Minecraft MCA file to JSON. Both input and output are optional. If
input is not provided, this reads from stdin. If output is not provided, this
writes to stdout.

Options:
    --chunk-coords=COORDS
                    Only write out the chunk at the specified chunk coordinates.
                    Chunk coordinates are absolute chunks from the world origin.
                    Can be specified multiple times. Coordinates are specified
                    as "x,z". See note about chunk coordinates.
    --compact       Do not use pretty-printing in the JSON output.
    --condense      Condense arrays of bytes, ints, and longs to a single line.
                    This significantly cuts down on the size of the generated
                    JSON.
    --list-chunk-coords
                    Lists all of the chunk coordinates in the file. When used,
                    the output file only has a list of chunk coordinates and the
                    JSON output is not produced.
    -h, --help      Show this message.

Chunk Coordinates:

A player typically interacts with Minecraft and can easily determine their
world coordinates. To convert from world coordinates to chunk coordinates,
divide the x and z world coordinates by 16, rounded down. World coordinates and
chunk coordinates also relate similarly to regions, which are 32 x 32 chunks.
The region coordinates are the chunk coordinates divided by 32 and rounded
down.

                      X    Y    Z
Player coordinates: 1234, 65, 5678
 Chunk coordinates:   77,      354 - Chunks span the entire Y column
Region coordinates:    2,       11 - Region file is r.2.11.mca
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

        if (args['--list-chunk-coords']) {
            return chunks.map((chunk) => chunk.chunkKey()).join('\n');
        }

        if (args['--chunk-coords']) {
            if (!Array.isArray(args['--chunk-coords'])) {
                args['--chunk-coords'] = [args['--chunk-coords']];
            }

            const wanted = new Set<string | undefined>(args['--chunk-coords']);
            chunks = chunks.filter((chunk) => wanted.has(chunk.chunkKey()));
        }

        let jsonObjects = chunks.map((chunk) => {
            const [name, json] = chunk.toJson();
            json.name = name;

            return json;
        });

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

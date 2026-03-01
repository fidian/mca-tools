#!/usr/bin/env node

import getStdin from 'get-stdin';
import neodoc from 'neodoc';
import { inflate } from 'pako';
import { Nbt } from '../nbt/nbt.js';
import { readFile, writeFile } from 'node:fs/promises';

async function readInput(filename: string | undefined) {
    if (!filename || filename === '-') {
        return await getStdin.buffer();
    }

    return readFile(filename);
}

const args: {
    '--compact'?: boolean;
    '--condense'?: boolean;
    '<input>'?: string;
    '<output>'?: string;
} = neodoc.run(
`Usage: nbt-json [OPTIONS] [<input> [<output>]]

Shows NBT data in a JSON format. Both input and output are optional. If input
is not provided, this reads from stdin. If output is not provided, this writes
to stdout.

NBT files can be compressed or uncompressed. This tool can handle both. One
example NBT file is the player.dat file.

Options:
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

        let buffer = inputBuffer.buffer as ArrayBufferLike;

        try {
            buffer = inflate(inputBuffer).buffer;
        } catch (_ignore) {}

        const nbt = Nbt.fromBuffer(buffer);

        let jsonObject = nbt.toObject();

        if (args['--compact']) {
            return JSON.stringify(jsonObject);
        }

        let content = JSON.stringify(jsonObject, null, 4);

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

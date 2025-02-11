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
`Usage: mca-chunks [OPTIONS] [<input> [<output>]]

Lists the chunk coordinates in a Minecraft MCA file, one set of coordinates per
line. Each line will have "X,Z", such as "-23,14". Both input and output are
optional.  If input is not provided, this reads from stdin. If output is not
provided, this writes to stdout.

Options:
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

        return chunks.map((chunk) => chunk.chunkKey()).join('\n');
    })
    .then((output: string) => {
        if (args['<output>']) {
            writeFile(args['<output>'], output);
        } else {
            console.log(output);
        }
    });

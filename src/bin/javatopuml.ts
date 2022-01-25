#!/usr/bin/env node
import yargs from 'yargs/yargs';
import javatopuml from '..';

// tslint:disable-next-line: no-console
const log = console.log;

const argv = yargs(process.argv.slice(2))
    .options({
        path: { type: 'string', default: '.' },
        output: { type: 'string', default: './target/puml' },
        outputformat: { type: 'string', default: 'puml' },
    })
    .parseSync();

(async function main() {
    const result = await javatopuml(argv.path, { output: argv.output, outputFormat: argv.outputformat });
    if (!result) {
        return log(
            'No diagrams were created. Are you sure you are in a valid, compiling Java Project and your input is correct?',
        );
    }

    if (typeof result === 'string') {
        return log(`saved ${result}`);
    }

    result.forEach((res) => {
        log(`saved ${res}`);
    });
})();

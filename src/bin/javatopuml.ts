#!/usr/bin/env node
import dedent from 'endent';
import yargs from 'yargs/yargs';
import javatopuml, { Options } from '..';

// tslint:disable-next-line: no-console
const log = console.log;

const argv = yargs(process.argv.slice(2))
    .options({
        path: { type: 'string', default: __dirname, defaultDescription: 'current directory' },
        output: { type: 'string', default: './target/puml' },
        format: { type: 'string', default: 'puml' },
        linkbyfields: { type: 'boolean', default: true },
        inheritance: { type: 'boolean', default: true },
        packages: { type: 'string', array: true },
    })
    .describe({
        path: 'The path of the java project',
    })
    .example('javatopuml', 'Generates a class diagram of the project the command is invoked in')
    .example(
        'javatopuml my.super.nice.package',
        'Generates a class diagram of the package, if it can be found in the current project',
    )
    .example('javatopuml --format=txt', 'Outputs to <packagename>.txt instead of <packagename>.puml')
    .example(
        'javatopuml --output=classdiagrams',
        'Outputs to ./classdiagrams/<packagename>.puml instead of ./target/plantuml/<packagename>.puml',
    )
    .positional('packages', {})
    .parseSync();

(async function main() {
    const options: Options = {
        output: argv.output,
        format: argv.format,
        linkbyfields: argv.linkbyfields,
        inheritance: argv.inheritance,
        packages: (argv.packages as string[]) ?? argv._.map((value) => value.toString()),
    };
    const result = await javatopuml(argv.path, options);
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

import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { getClassPuml } from './converter/class';
import { convert } from './converter/convert';
import { getPackagePuml } from './converter/package';
import { findPackage } from './files';
import { getClass } from './parser/class';
import { getPackage } from './parser/package';

export { convert, getPackage, getPackagePuml, getClass, getClassPuml };

export interface Options {
    [k: string]: any;
    output?: string;
    packages?: string | string[];
    linkbyfields?: boolean;
    inheritance?: boolean;
    format?: string;
}

const defaultOptions: Options = {
    output: undefined,
    packages: undefined,
    linkbyfields: true,
    inheritance: true,
    format: 'puml',
};

const defaultHandler = {
    get(target: Options, name: string) {
        return target.hasOwnProperty(name) ? target[name] : defaultOptions[name];
    },
};

/**
 * Converts Java Files to Plantuml and optionally saves them
 * @param path the root path of a Java project
 * @param options the conversion options
 * @returns the resulting plantuml or the output paths, if options.output was specified
 */
export default async function javatopuml(path: string, options?: Options): Promise<undefined | string | string[]> {
    options = new Proxy(options ?? defaultOptions, defaultHandler);
    const packages = options.packages?.length === 0 ? undefined : options.packages;

    if (options.output) return convertAndSave(path, packages, options);

    if (!packages || typeof packages === 'string') {
        const packagePath = await findPackage(path, packages);
        if (!packagePath) return;
        const javaPackage = await getPackage(packagePath, packages);
        const packagePuml = convert(javaPackage, options);
        return packagePuml;
    }

    // multiple packages provided
    const results: string[] = [];
    for (const p of packages) {
        options.packages = p;
        const resultPuml = javatopuml(path, options);
        if (typeof resultPuml !== 'string') continue;
        results.push(resultPuml);
    }
}

/**
 * Converts java files and saves the resulting PlantUML code.
 * @param path the root of a java project
 * @param packages [the packages that should be converted]
 * @param options [an options object]
 * @returns the save locations of the generated PlantUML code
 */
async function convertAndSave(
    path: string,
    packages?: string | string[],
    options?: Options,
): Promise<string | string[] | undefined> {
    if (!options) options = defaultOptions;
    // no packages or one package provided
    if (!packages || typeof packages === 'string') {
        const packagePath = await findPackage(path, packages);
        if (!packagePath) return;
        const javaPackage = await getPackage(packagePath, packages);
        const packagePuml = convert(javaPackage, options);
        const resultPath = join(options.output ?? '.', `${javaPackage.name}.${options.format}`);
        const resultDir = parse(resultPath).dir;
        if (!existsSync(resultDir) && !(await mkdir(resultDir, { recursive: true }))) {
            return;
        }
        await writeFile(resultPath, packagePuml);
        writeFile('test.json', JSON.stringify(javaPackage));
        return resultPath;
    }
    // multiple packages provided
    const resultPaths: string[] = [];
    for (const p of packages) {
        const resultPath = await convertAndSave(path, p, options);
        if (typeof resultPath !== 'string') continue;
        resultPaths.push(resultPath);
    }

    return resultPaths;
}

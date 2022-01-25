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

interface Options {
    output?: string;
    packages?: string | string[];
    nestedClasses?: boolean;
    outputFormat?: string;
}

/**
 * Converts Java Files to Plantuml and optionally saves them
 * @param path the root path of a Java project
 * @param options the conversion options
 * @returns the resulting plantuml or the output paths, if options.output was specified
 */
export default async function javatopuml(path: string, options?: Options): Promise<undefined | string | string[]> {
    options = fillDefaultValues(options);
    const packages = options.packages;

    if (options.output) return convertAndSave(path, packages, options);

    if (!packages || typeof packages === 'string') {
        const packagePath = await findPackage(path, packages);
        if (!packagePath) return;
        const javaPackage = await getPackage(packagePath, packages);
        const packagePuml = convert(javaPackage);
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
    options = fillDefaultValues(options);
    // no packages or one package provided
    if (!packages || typeof packages === 'string') {
        const packagePath = await findPackage(path, packages);
        if (!packagePath) return;
        const javaPackage = await getPackage(packagePath, packages);
        const packagePuml = convert(javaPackage);
        const resultPath = join(options.output ?? '.', `${javaPackage.name}.${options.outputFormat}`);
        const resultDir = parse(resultPath).dir;
        if (!existsSync(resultDir) && !(await mkdir(resultDir, { recursive: true }))) {
            return;
        }
        await writeFile(resultPath, packagePuml);
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

/**
 * Autocompletes an options object.
 * @param options [the (not necessarily complete) options object]
 * @returns a complete options object, with default values inserted
 */
function fillDefaultValues(options?: Options): Options {
    return {
        output: options?.output || undefined,
        packages: options?.packages || undefined,
        nestedClasses: options?.nestedClasses ?? true,
        outputFormat: options?.outputFormat || 'puml',
    };
}

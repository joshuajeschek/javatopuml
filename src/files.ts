import { promise as glob } from 'glob-promise';
import { dir } from 'node:console';
import { statSync } from 'node:fs';
import path, { join, normalize, parse } from 'node:path';

/**
 * Finds the directory of a package in the given root directory.
 * @param root the root directory
 * @param name the package name that should be found
 * @returns the directory of the package
 */
export async function findPackage(root: string, name?: string): Promise<string | undefined> {
    if (name) {
        const packageDir = join.apply(null, name.split('.'));
        const needs = join('src', 'main', 'java', packageDir);

        if (root.includes(needs)) return trimPath(root, needs);

        const wanted = join(root, needs);
        return statSync(wanted).isDirectory() ? wanted : undefined;
    }

    // no src/main/java with name in root found
    if (root.includes(join('src', 'main', 'java'))) {
        root = await trimPath(root, join('src', 'main', 'java'));
    } else if (statSync(join(root, 'src', 'main', 'java')).isDirectory()) {
        root = join(root, 'src', 'main', 'java');
    } else {
        // no src/main/java found in subdirectories
        return;
    }

    // root now ends with src/main/java
    if (name) {
        const wanted = join(root, join.apply(null, name.split('.')));
        return statSync(wanted).isDirectory() ? wanted : undefined;
    }

    // return the 'biggest' package in src/main/java
    const globbed = await glob(join(root, '**', '*.java'));
    if (globbed.length === 0) return;

    // find directory that contains every found file
    return findCommonDirectory(globbed);
}

export async function findSubPackages(root: string): Promise<{ root: string; name?: string }[]> {
    return (await glob(join(root, '*')))
        .filter((value) => statSync(value).isDirectory())
        .filter(async (value) => containsJavaFiles(value))
        .map((value) => value.replaceAll('/', path.sep))
        .map((value) => {
            return { root: value, name: value.split(path.sep).at(-1) };
        });
}

async function containsJavaFiles(root: string): Promise<boolean> {
    return (await glob(join(root, '**', '*.java'))).length !== 0;
}

export async function findJavaFiles(root: string): Promise<string[]> {
    return (await glob(join(root, '*.java')))
        .filter((value) => statSync(value).isFile)
        .map((value) => value.replaceAll('/', path.sep));
}

async function trimPath(root: string, needs: string): Promise<string> {
    let current = root;
    let next = parse(root).dir;
    while (next.includes(needs)) {
        current = next;
        next = parse(next).dir;
    }
    return current;
}

function findCommonDirectory(dirs: string[]): string {
    // create 2D array of all directory names
    const dirArray = dirs.map((value) => normalize(value).split(path.sep)).sort((a, b) => a.length - b.length);
    const resultArray: string[] = [];
    while (dirArray.at(0)?.length ?? 0 > 0) {
        const toBeAdded = dirArray[0][0];
        const sameness = dirArray.map((value) => value[0] === toBeAdded).reduce((_, current) => current);
        if (!sameness) break;
        resultArray.push(toBeAdded);
        dirArray.forEach((innerArray) => innerArray.shift());
    }
    return resultArray.join(path.sep);
}

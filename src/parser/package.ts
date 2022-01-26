import { Class, getClass } from './class';
import path, { join, normalize } from 'node:path';
import { findJavaFiles, findSubPackages } from '../files';
import { readFile } from 'node:fs/promises';

export interface Package {
    name: string;
    packages: Package[];
    classes: Class[];
}

/**
 * Parses a directory and the contained java files.
 * @param root the root directory of the package
 * @param name [the name of the package]
 * @returns the package with all of its contents
 */
export async function getPackage(root: string, name?: string): Promise<Package> {
    root = normalize(root);

    if (!name) name = extractName(root);

    const subPackages = await findSubPackages(root);
    const packages: Package[] = [];

    let subIndex = 0;
    for (const subPackage of subPackages) {
        const subName = subPackage.name ? `${name}.${subPackage.name}` : `${name}.sub${subIndex++}`;
        packages.push(await getPackage(subPackage.root, subName));
    }

    const classes: Class[] = [];

    const javaFiles = await findJavaFiles(root);

    for (const javaFile of javaFiles) {
        // console.log(getClass(await readFile(javaFile, 'utf-8')));
        classes.push(getClass(await readFile(javaFile, 'utf-8')));
    }

    // console.log(classes);

    const result = { name, packages, classes };
    matchPackageImports(result);

    return result;
}

/**
 * Extracts the package name from a path.
 * @param root the path
 * @returns the extracted name, 'unknown.package' if no 'src/main/java' directory was found
 */
function extractName(root: string): string {
    let name = root.split(join('src', 'main', 'java')).at(-1)?.replaceAll(path.sep, '.');
    name = name ?? 'unknown.package';
    return name.startsWith('.') ? name.replace('.', '') : name;
}

function matchPackageImports(result: Package): Package {
    result.classes = result.classes.map((inheritor) => {
        for (const candidate of result.classes) {
            if (candidate.name.endsWith(`.${inheritor.extends}`)) {
                inheritor.extends = candidate.name;
            }
            inheritor.implements.map((className) => {
                if (candidate.name.endsWith(`.${className}`)) {
                    return candidate;
                }
                return className;
            });
        }
        return inheritor;
    });

    return result;
}

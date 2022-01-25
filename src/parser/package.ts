import { promise as glob } from 'glob-promise';
import { Class, getClass } from './class';
import path, { join, normalize, parse } from 'path';
import { statSync } from 'fs';
import { readFile } from 'fs/promises';

export interface Package {
    name: string;
    packages: Package[];
    classes: Class[];
}

export async function getPackage(root: string, name?: string): Promise<Package | undefined> {
    root = normalize(root);
    const pRoot = await findPackage(root, name);

    if (!pRoot) return;
    root = pRoot;

    if (!name) {
        name = root.split(join('src', 'main', 'java')).at(-1)?.replaceAll(path.sep, '.');
    }
    if (!name) return;
    name = name.startsWith('.') ? name.replace('.', '') : name;

    const directories = (await glob(join(root, '*')))
        .filter((value) => statSync(value).isDirectory())
        .map((value) => value.replaceAll('/', path.sep));

    const packages: Package[] = [];

    for (const directory of directories) {
        const subName = directory.split(path.sep).at(-1);
        const p = subName ? await getPackage(directory, `${name}.${subName}`) : undefined;
        if (p) packages.push(p);
    }

    const classes: Class[] = [];

    const javaFiles = await glob(join(root, '*.java'));

    for (const javaFile of javaFiles) {
        const fileContent = await readFile(javaFile, 'utf-8');
        classes.push(getClass(fileContent));
    }

    return { name, packages, classes };
}

async function findPackage(root: string, name?: string): Promise<string | undefined> {
    if (name) {
        const packageDir = join.apply(null, name.split('.'));
        const needs = join('src', 'main', 'java', packageDir);

        if (root.includes(needs)) return trimPath(root, needs);

        const wanted = join(root, needs);
        return statSync(wanted).isDirectory() ? wanted : undefined;
    }

    // no src/main/java found
    if (root.includes(join('src', 'main', 'java'))) {
        root = await trimPath(root, join('src', 'main', 'java'));
    } else if (statSync(join(root, 'src', 'main', 'java')).isDirectory()) {
        root = join(root, 'src', 'main', 'java');
    } else {
        return;
    }

    const globbed = await glob(join(root, '**', '*.java'));
    if (globbed.length === 0) return;

    globbed.sort((a, b) => {
        return a.split('/').length - b.split('/').length;
    });
    return normalize(parse(globbed[0]).dir);
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

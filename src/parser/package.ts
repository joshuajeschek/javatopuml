import { promise as glob } from 'glob-promise';
import { JavaClassFileReader } from 'java-class-tools';
import { Class, getClass } from './class';
import { inspect } from 'util';

interface Package {
    packages: Package[],
    classes: Class[],
}

export async function getPackage(root: string, packagename?: string): Promise<Package | undefined> {
    packagename = packagename ?? '';
    const classFilePaths = await glob(`${root}/*.class`);
    const directories = await glob(`${root}/*/`);

    const packages: Package[] = [];

    for (const directory of directories) {
        const p = await getPackage(directory, packagename + directory.split('/').at(-1))
        if (p) packages.push(p);
    }

    const classes : Class[] = [];
    for (const classFilePath of classFilePaths) {
        // do not search inner classes
        if (classFilePath.includes('$')) continue;
        classes.push(await getClass(classFilePath, packagename));
    }

    return { packages, classes }
}

import { promise as glob } from "glob-promise";
import { ClassInfo, JavaClassFile, JavaClassFileReader, Utf8Info } from "java-class-tools";
import { Field, getFields } from "./fields";
import { getMethods, Method } from "./methods";
import { Flag, getFlags } from "./util";

export interface Class {
    name: string,
    extends: string | undefined,
    implements: string[],
    flags: Flag[],
    fields: Field[],
    methods: Method[],
    classes: Class[],
}

export async function getClass(path: string, packageName: string): Promise<Class> {

    const innerClassFiles = await glob(path.replace(/\.class$/, '$*.class'));
    const classes: Class[] = [];
    for (const innerClassFile of innerClassFiles) {
        classes.push(await getClass(innerClassFile, packageName));
    }

    const reader = new JavaClassFileReader();
    const classFile = reader.readFromFile(path);

    return {
        name: `${packageName}.${path.replace(/\.class$/, '').split('/').at(-1) ?? 'NULL'}`,
        extends: getSuperName(classFile),
        flags: getFlags(classFile.access_flags),
        implements: [],
        fields: getFields(classFile),
        methods: getMethods(classFile),
        classes,
    }
}

export function getSuperName(classFile: JavaClassFile): string | undefined {
    const classInfo = classFile.constant_pool[classFile.super_class] as ClassInfo;
    const classNameEntry = classFile.constant_pool[classInfo.name_index] as Utf8Info;
    const textDecoder = new TextDecoder();
    return textDecoder
        .decode(new Uint8Array(classNameEntry.bytes))
        .replace(/\//g, '.');
}

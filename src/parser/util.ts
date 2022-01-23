import { Modifier } from "java-class-tools";

export enum Flag {
    Public,
    Private,
    Protected,
    Static,
    Final,
    Super,
    Interface,
    Abstract,
    Annotation,
    Enum,
}

/**
 * Extracts modifiers
 * @param modifier java modifier
 * @returns all modifiers as flags
 */
export function getFlags(modifier: number): Flag[] {
    const flags: Flag[] = [];

    if (modifier >= Modifier.ENUM) {
        modifier -= Modifier.ENUM;
        flags.push(Flag.Enum);
    }
    if (modifier >= Modifier.ANNOTATION) {
        modifier -= Modifier.ANNOTATION;
        flags.push(Flag.Annotation);
    }
    if (modifier >= Modifier.SYNTHETIC) {
        modifier -= Modifier.SYNTHETIC;
    }
    if (modifier >= Modifier.ABSTRACT) {
        modifier -= Modifier.ABSTRACT;
        flags.push(Flag.Abstract);
    }
    if (modifier >= Modifier.INTERFACE) {
        modifier -= Modifier.INTERFACE;
        flags.push(Flag.Interface);
    }
    if (modifier >= Modifier.NATIVE) {
        modifier -= Modifier.NATIVE;
    }
    if (modifier >= Modifier.VARARGS) {
        modifier -= Modifier.VARARGS;
    }
    if (modifier >= Modifier.TRANSIENT) {
        modifier -= Modifier.TRANSIENT;
    }
    if (modifier >= Modifier.BRIDGE) {
        modifier -= Modifier.BRIDGE;
    }
    if (modifier >= Modifier.VOLATILE) {
        modifier -= Modifier.VOLATILE;
    }
    if (modifier >= Modifier.SUPER) {
        modifier -= Modifier.SUPER;
        flags.push(Flag.Super);
    }
    if (modifier >= Modifier.FINAL) {
        modifier -= Modifier.FINAL;
        flags.push(Flag.Final);
    }
    if (modifier >= Modifier.STATIC) {
        modifier -= Modifier.STATIC;
        flags.push(Flag.Static);
    }
    if (modifier >= Modifier.PROTECTED) {
        modifier -= Modifier.PROTECTED;
        flags.push(Flag.Protected);
    }
    if (modifier >= Modifier.PRIVATE) {
        modifier -= Modifier.PRIVATE;
        flags.push(Flag.Private);
    }
    if (modifier >= Modifier.PUBLIC) {
        modifier -= Modifier.PUBLIC;
        flags.push(Flag.Public);
    }

    return flags;
}

export function getType(descriptor: string): string {
    const objectTypeMatch = descriptor.match(/L(.*);/);
    if (objectTypeMatch) {
        return getObjectType(objectTypeMatch[1]);
    }
    const arrayTypeMatch = descriptor.match(/\[(.*)/);
    if (arrayTypeMatch) {
        return getArrayType(arrayTypeMatch[1]);
    }
    return getBaseType(descriptor);
}


function getObjectType(objectTypeDescriptor: string): string {
    return objectTypeDescriptor.split('/').at(-1) ?? 'void';
}

function getArrayType(arrayTypeDescriptor: string): string {
    return getType(arrayTypeDescriptor) + '[]';
}

function getBaseType(baseTypeDescriptor: string): string {
    switch (baseTypeDescriptor) {
        case 'B':
            return 'byte'
        case 'C':
            return 'char'
        case 'D':
            return 'double'
        case 'F':
            return 'float'
        case 'I':
            return 'int'
        case 'J':
            return 'long'
        case 'S':
            return 'short'
        case 'Z':
            return 'boolean'
        default:
            return 'void';
    }
}

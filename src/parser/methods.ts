import { JavaClassFile, Utf8Info } from "java-class-tools";
import { Flag, getFlags, getType } from "./util";

export interface Method {
    name: string,
    returnType: string,
    parameterTypes: string[],
    flags: Flag[],
}

/**
 * Extracts all Methods from a Java Class
 * @param javaClass - the java class to extract the methods from
 * @returns the methods of the class
 */
export function getMethods(javaClass: JavaClassFile): Method[] {
    const methods: Method[] = [];
    const textDecoder = new TextDecoder();

    javaClass.methods.forEach(m => {
        const methodNameEntry = javaClass.constant_pool[m.name_index] as Utf8Info;
        const descriptorEntry = javaClass.constant_pool[m.descriptor_index] as Utf8Info;
        const descriptor = textDecoder.decode(new Uint8Array(descriptorEntry.bytes))
        const accessFlags = m.access_flags;
        methods.push({
            name: textDecoder.decode(new Uint8Array(methodNameEntry.bytes)),
            returnType: getReturn(descriptor),
            parameterTypes: getParameters(descriptor),
            flags: getFlags(accessFlags),
        });
    });

    return methods;
}

function getReturn(descriptor: string): string {
    const returnMatchArray = descriptor.match(/\)(.*$)/);
    if (!returnMatchArray) return 'void';
    const returnMatch = returnMatchArray[1];
    if (returnMatch === 'V') return 'void';
    return getType(returnMatch);
}

function getParameters(descriptor: string): string[] {
    const allParamsResult = descriptor.match(/\((.*?)\)/);
    if (!allParamsResult) return [];
    const allParamsMatch = allParamsResult[1];
    if (allParamsMatch.length === 0) return [];

    // TODO fix regex (e.g. if [ is followed by multiple arguments)
    // L.*?;|[BCDFIJSZ]|(\[.+?)L|[BCDFIJSZ]
    const singleParamsResult = allParamsMatch.match(/L.*?;|[BCDFIJSZ]|\[.*/);
    if (!singleParamsResult) return [];

    const parameters: string[] = [];

    singleParamsResult.forEach(singleParamMatch => {
        parameters.push(getType(singleParamMatch));
    });

    return parameters;
}

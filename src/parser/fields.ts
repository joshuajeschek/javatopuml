import { JavaClassFile, Utf8Info } from "java-class-tools";
import { Flag, getFlags, getType } from "./util";

export interface Field {
    name: string,
    type: string,
    flags: Flag[],
}

/**
 * Extracts all Methods from a Java Class
 * @param javaClass - the java class to extract the methods from
 * @returns the methods of the class
 */
export function getFields(javaClass: JavaClassFile): Field[] {
    const fields: Field[] = [];
    const textDecoder = new TextDecoder();

    javaClass.fields.forEach(m => {
        const methodNameEntry = javaClass.constant_pool[m.name_index] as Utf8Info;
        const descriptorEntry = javaClass.constant_pool[m.descriptor_index] as Utf8Info;
        const descriptor = textDecoder.decode(new Uint8Array(descriptorEntry.bytes))
        const accessFlags = m.access_flags;
        fields.push({
            name: textDecoder.decode(new Uint8Array(methodNameEntry.bytes)),
            type: getType(descriptor),
            flags: getFlags(accessFlags),
        });
    });

    return fields;
}

import { Modifier, getModifiers } from './modifiers';

export interface Field {
    name: string;
    type: string;
    modifiers: Modifier[];
}

/**
 * Extracts all Methods from a Java Class
 * @param javaClass - the java class to extract the methods from
 * @returns the methods of the class
 */
export function getFields(possibleFields: string[]): Field[] {
    const fields: Field[] = [];

    let index = 0;
    for (let candidate of possibleFields) {
        candidate = candidate.replace(/=[\s\S]*$/, '');
        // is function
        if (candidate.includes('(')) continue;
        const field = getField(candidate, index++);
        if (field) fields.push(field);
    }

    return fields;
}

/**
 * Extracts imformation about a single Field from a string.
 * @param possibleField the string that may contain information about a field
 * @param index the index of the Field to create placeholders if needed
 * @returns the extracted Field or undefined if it was not possible
 */
function getField(possibleField: string, index: number): Field | undefined {
    if (possibleField.replaceAll(/\s/g, '').length === 0) return;

    const fieldArray = possibleField.split(' ').filter((value) => !value.match(/^\s*$/));
    // name => last element in array
    const name = fieldArray.pop();
    const modifiersAndType = getModifiers(fieldArray);

    return {
        modifiers: modifiersAndType.modifiers,
        name: name?.trim() ?? `field${index}`,
        type: !modifiersAndType.newString.match(/^\s*$/) ? modifiersAndType.newString.trim() : `type${index}`,
    };
}

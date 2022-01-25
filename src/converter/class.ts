import dedent from 'endent';
import { Class } from '../parser/class';
import { Field } from '../parser/fields';
import { Method } from '../parser/methods';
import { Modifier } from '../parser/modifiers';
import { getModifierPuml } from './modifier';

/**
 * Converts a Java Class to PlantUML code.
 * @param javaClass the Java Class(es) to convert
 * @returns the generated PlantUML code (without @startuml/@enduml)
 */
export function getClassPuml(javaClass: Class | Class[]): string {
    if (!('name' in javaClass)) {
        return javaClass.map((jc) => getClassPuml(jc)).join('\n\n');
    }

    return dedent`
        ${getClassType(javaClass.modifiers)} ${javaClass.name} {
            ${javaClass.values ? `' --- values (${javaClass.name}) ---` : ''}
            ${javaClass.values?.join(', ') ?? ''}

            ${javaClass.fields.length ? `' --- fields (${javaClass.name}) ---` : ''}
            ${getFieldPuml(javaClass.fields)}

            ${javaClass.methods.length ? `' --- methods (${javaClass.name}) ---` : ''}
            ${getMethodPuml(javaClass.methods)}
        }`;
}

/**
 * converts Modifiers to PlantUML code.
 * @param javaModifiers the classes Modifiers
 * @returns the PlantUML equivalent
 */
function getClassType(javaModifiers: Modifier[]): string {
    if (javaModifiers.includes(Modifier.class)) return 'class';
    if (javaModifiers.includes(Modifier.interface)) return 'interface';
    if (javaModifiers.includes(Modifier.enum)) return 'enum';
    if (javaModifiers.includes(Modifier.abstract)) return 'abstract';
    return 'class';
}

/**
 * Converts a Java Field to PlantUML code.
 * @param javaField the Java Field to convert
 * @returns the resulting plantuml string
 */
function getFieldPuml(javaField: Field | Field[]): string {
    if (!('name' in javaField)) {
        return javaField.map((jf) => getFieldPuml(jf)).join('\n');
    }
    return `${getModifierPuml(javaField.modifiers)}${javaField.type} ${javaField.name}`;
}

/**
 * Converts a Java Method to PlantUML code.
 * @param javaMethod the Java Method to convert
 * @returns the resulting plantuml string
 */
function getMethodPuml(javaMethod: Method | Method[]): string {
    if (!('name' in javaMethod)) {
        return javaMethod.map((jm) => getMethodPuml(jm)).join('\n');
    }
    return (
        `${getModifierPuml(javaMethod.modifiers)}${javaMethod.returnType} ` +
        `${javaMethod.name}(${javaMethod.parameters.map(({ name, type }) => `${type} ${name}`).join(', ')})`
    );
}

import { Modifier } from '../parser/modifiers';

/**
 * Converts Java Modifiers to PlantUML code.
 * @param javaModifiers the Java Modifiers to convert
 * @returns the resulting plantuml string
 */
export function getModifierPuml(javaModifiers: Modifier[]): string {
    let modifiers = '';
    if (javaModifiers.includes(Modifier.static)) {
        modifiers += '{static}';
    } else if (javaModifiers.includes(Modifier.abstract)) {
        modifiers += '{abstract}';
    }
    if (javaModifiers.includes(Modifier.private)) {
        modifiers += '- ';
    } else if (javaModifiers.includes(Modifier.protected)) {
        modifiers += '# ';
    } else if (javaModifiers.includes(Modifier.public)) {
        modifiers += '+ ';
    } else {
        modifiers += '~ ';
    }
    return modifiers;
}

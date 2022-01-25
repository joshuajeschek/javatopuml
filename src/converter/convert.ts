import dedent from 'endent';
import { getClassPuml } from './class';
import { getPackagePuml } from './package';
import { Class } from '../parser/class';
import { Package } from '../parser/package';

/**
 * Converts a Java Package / Class to PlantUML code.
 * @param javaInfo the Package / Class that should be converted
 * @returns the complete PlantUML code (with @startuml/@enduml)
 */
export function convert(javaInfo: Package | Class): string {
    return dedent`
        @startuml ${javaInfo.name}
        title ${javaInfo.name}

        ${'fields' in javaInfo ? getClassPuml(javaInfo) : getPackagePuml(javaInfo)}

        @enduml`.replaceAll(/^\s+$/gm, '');
}

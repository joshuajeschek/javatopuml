import dedent from 'endent';
import { Package } from '../parser/package';
import { getClassPuml } from './class';

/**
 * Converts one or more Packages to PlantUml code
 * @param javaPackage the Package(s) to convert
 * @returns the puml code (without @startuml/@enduml)
 */
export function getPackagePuml(javaPackage: Package | Package[]): string {
    if (!('name' in javaPackage)) {
        return javaPackage.map((jp) => getPackagePuml(jp)).join('\n\n');
    }

    return dedent`
        package ${javaPackage.name} {

            ${javaPackage.classes.length ? `' -=- classes (${javaPackage.name}) -=-` : ''}
            ${getClassPuml(javaPackage.classes)}

            ${javaPackage.packages.length ? `' === packages (${javaPackage.name}) ===` : ''}
            ${getPackagePuml(javaPackage.packages)}
        }`;
}

import dedent from 'endent';
import { getClassPuml } from './class';
import { getPackagePuml } from './package';
import { Class } from '../parser/class';
import { Package } from '../parser/package';
import { Options } from '..';

/**
 * Converts a Java Package / Class to PlantUML code.
 * @param javaInfo the Package / Class that should be converted
 * @returns the complete PlantUML code (with @startuml/@enduml)
 */
export function convert(javaInfo: Package | Class, options: Options): string {
    const classes = options.inheritance || options.linkbyfields ? getAllClassNames(javaInfo) : [];
    return dedent`
        @startuml ${javaInfo.name}
        title ${javaInfo.name}

        ${'modifiers' in javaInfo ? getClassPuml(javaInfo) : getPackagePuml(javaInfo)}

        ${
            options.linkbyfields
                ? ["' autogenerated field links, may be faulty.", ...getFieldLinks(javaInfo, classes)].join('\n')
                : ''
        }

        ${
            options.inheritance
                ? ["' autogenerated inheritances, may be faulty.", ...getInheritance(javaInfo, classes)].join('\n')
                : ''
        }

        @enduml`.replaceAll(/^\s+$/gm, '');
}

/**
 * Returns all class names within the given package / class.
 * @param javaInfo the Java Package or Class to analyze
 * @returns an array of Fully Qualified Class Names
 */
function getAllClassNames(javaInfo: Package | Class): string[] {
    let results = 'fields' in javaInfo ? [javaInfo.name] : [];
    if ('packages' in javaInfo) results = results.concat(javaInfo.packages.flatMap((value) => getAllClassNames(value)));
    return results.concat(javaInfo.classes.map((value) => value.name));
}

/**
 * Tries to generate links between classes based on Field types.
 * @param javaInfo Package or Class with fields that should be linked
 * @param classes all classes that can be linked to
 * @returns array of puml links
 */
function getFieldLinks(javaInfo: Package | Class, classes: string[]): string[] {
    let results: string[] = [];

    results = results.concat(javaInfo.classes.flatMap((value) => getFieldLinks(value, classes)));
    if ('packages' in javaInfo)
        results = results.concat(javaInfo.packages.flatMap((value) => getFieldLinks(value, classes)));

    if ('packages' in javaInfo) return results;

    for (const field of javaInfo.fields) {
        results = results.concat(
            classes
                .map((value) => value.match(new RegExp('^.*\\.' + field.type + '$'))?.at(0))
                .filter((value) => value)
                .map((value, i) => `${i > 0 ? "'" : ''}${javaInfo.name} o-- ${value}`),
        );
    }

    return results.filter((res, i) => results.indexOf(res) === i);
}

/**
 * Converts all inheritances (extends or implements) to puml code.
 * @param javaInfo Package or Class with inheriting objects
 * @param classes all the class that can be inherited from (same project)
 * @returns array of puml links
 */
function getInheritance(javaInfo: Package | Class, classes: string[]): string[] {
    let results: string[] = [];
    if ('extends' in javaInfo && javaInfo.extends) {
        const unTyped = javaInfo.extends.replace(/<.*>/, '');
        const classdeclaration = !classes.includes(unTyped) ? `class ${unTyped}\n` : '';
        results = [`${classdeclaration}${unTyped} <|-- ${javaInfo.name}`];
    }
    if ('implements' in javaInfo)
        results = results.concat(
            javaInfo.implements.map((imp) => {
                const unTyped = imp.replace(/<.*>/, '');
                const classdeclaration = !classes.includes(unTyped) ? `interface ${unTyped}\n` : '';
                return `${classdeclaration}${unTyped} <|.. ${javaInfo.name}`;
            }),
        );
    results = results.concat(javaInfo.classes.flatMap((value) => getInheritance(value, classes)));
    if ('modifiers' in javaInfo) return results;
    return results.concat(javaInfo.packages.flatMap((value) => getInheritance(value, classes)));
}

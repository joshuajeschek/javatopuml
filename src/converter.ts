import dedent from 'endent';
import { Class } from './parser/class';
import { Field } from './parser/fields';
import { Method } from './parser/methods';
import { Modifier as Modifier } from './parser/modifiers';
import { Package } from './parser/package';

export function convert(javaPackage: Package): string {
    return dedent`
        @startuml ${javaPackage.name}
        title ${javaPackage.name}

        ${getPackagePuml(javaPackage)}

        @enduml`.replaceAll(/^\s+$/gm, '');
}

function getPackagePuml(javaPackage: Package | Package[]): string {
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

function getClassPuml(javaClass: Class | Class[]): string {
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

function getFieldPuml(javaField: Field | Field[]): string {
    if (!('name' in javaField)) {
        return javaField.map((jf) => getFieldPuml(jf)).join('\n');
    }
    return `${getModifierPuml(javaField.modifiers)}${javaField.type} ${javaField.name}`;
}

function getMethodPuml(javaMethod: Method | Method[]): string {
    if (!('name' in javaMethod)) {
        return javaMethod.map((jm) => getMethodPuml(jm)).join('\n');
    }
    return (
        `${getModifierPuml(javaMethod.modifiers)}${javaMethod.returnType} ` +
        `${javaMethod.name}(${javaMethod.parameters.map(({ name, type }) => `${type} ${name}`).join(', ')})`
    );
}

function getClassType(javaModifiers: Modifier[]): string {
    if (javaModifiers.includes(Modifier.class)) return 'class';
    if (javaModifiers.includes(Modifier.interface)) return 'interface';
    if (javaModifiers.includes(Modifier.enum)) return 'enum';
    if (javaModifiers.includes(Modifier.abstract)) return 'abstract';
    return 'class';
}

function getModifierPuml(javaModifiers: Modifier[]): string {
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

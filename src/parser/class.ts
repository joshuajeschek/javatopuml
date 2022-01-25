import XRegExp from 'xregexp';
import { Field, getFields } from './fields';
import { getMethods, Method } from './methods';
import { Modifier, getModifiers } from './modifiers';
import { cleanJavaContent } from './util/cleaner';

export interface Class {
    name: string;
    extends: string | undefined;
    implements: string[];
    modifiers: Modifier[];
    fields: Field[];
    methods: Method[];
    classes: Class[];
    values?: string[]; // only for enums
}

/**
 * extracts class information from a java class code string
 * @param javaContent the content of a java file
 * @param packageName [the name of the package the java file belongs to]
 * @param preAmble [the preamble of a java file (for inner classes)]
 * @param className [the classname, useful for inner classes]
 * @returns the class object
 */
export async function getClass(
    javaContent: string,
    packageName?: string,
    preAmble?: string[],
    className?: string,
): Promise<Class> {
    javaContent = cleanJavaContent(javaContent);

    // class is an inner class, preamble was already extracted
    if (!preAmble) {
        const result = getPreAmble(javaContent);
        preAmble = result.preAmble;
        javaContent = result.rest;
    }

    packageName = packageName ?? getPackageName(preAmble);

    let classDeclaration: string | undefined;
    let classContent: string | undefined;

    // matches main curlies -> returns classDeclaration and classContent without surrouding curlies
    XRegExp.matchRecursive(javaContent, '\\{', '\\}', 'g', {
        valueNames: ['classDeclaration', null, 'classContent', null],
    }).forEach((matchElement) => {
        if (matchElement.name === 'classDeclaration') {
            classDeclaration = matchElement.value;
        } else if (matchElement.name === 'classContent') {
            classContent = matchElement.value;
        }
    });

    className = classDeclaration ? getClassname(classDeclaration) : 'UnknownClass';

    let investigatables: string[] = [];
    const classes: Class[] = [];

    // matches inner curlies -> returns between (actual information)
    // and match(content, but also inner class content)
    let isInnerClass: string | false = false;
    const contentMatchArray = XRegExp.matchRecursive(classContent ?? '', '\\{', '\\}', 'g', {
        valueNames: ['between', null, 'match', null],
    });
    for (const matchElement of contentMatchArray) {
        if (matchElement.name === 'between' && matchElement.value.match(/\s(interface|class|enum)\s/)) {
            isInnerClass = matchElement.value;
        } else if (isInnerClass && matchElement.name === 'match') {
            const innerJavaContent = `${isInnerClass} { ${matchElement.value} }`;
            classes.push(await getClass(innerJavaContent, packageName, preAmble));
            isInnerClass = false;
        } else if (matchElement.name === 'between') {
            investigatables = investigatables.concat(matchElement.value.split(';'));
        }
    }

    investigatables = investigatables.filter((value) => !value.match(/^\s*$/));

    const fields: Field[] = getFields(investigatables);
    const methods: Method[] = getMethods(investigatables);

    const extendsClass = classDeclaration ? getExtends(classDeclaration, preAmble) : undefined;
    const modifiers = classDeclaration ? getModifiers(classDeclaration).modifiers : [];
    const implementsClasses = classDeclaration ? getImplements(classDeclaration, preAmble) : [];
    const values = modifiers.includes(Modifier.enum) ? classContent?.split(',') : undefined;

    return {
        name: `${packageName}.${className}`,
        extends: extendsClass,
        modifiers,
        implements: implementsClasses,
        fields,
        methods,
        classes,
        values,
    };
}

/**
 * Extracts the preamble (package declaration and imports) from java code
 * @param javaContent the java code to analyze
 * @returns an object with the preamble and the rest of the java code
 */
function getPreAmble(javaContent: string): { preAmble: string[]; rest: string } {
    // matches import or package statements,
    // negative lookbehind to check that they are not inside curlies
    const preAmbleMatches = javaContent.matchAll(/(?<!{[\s\S]*)package[^;]*;|(?<!{[\s\S]*)import[^;]*;/g);
    let preAmble = '';
    let rest = javaContent;
    let statement = '';

    while (statement !== undefined) {
        rest = rest.replace(statement, '');
        preAmble += statement;
        statement = preAmbleMatches.next().value;
    }

    const preAmbleArray = preAmble.split(';').filter((value) => value.length > 0);

    return { preAmble: preAmbleArray, rest };
}

/**
 * Extracts the package name from preamble
 * @param preAmble the preamble containing a package declaration
 * @returns the package name or 'unknown.package' if it was not successfull
 */
function getPackageName(preAmble: string[]) {
    for (const candidate of preAmble) {
        const packageMatch = candidate.match(/(?<=package\s)[\s\S]*/);
        if (packageMatch) return packageMatch[0].replaceAll(/\s/g, '');
    }
    return 'unknown.package';
}

/**
 * Extracts all classnames that the class implements
 * @param classDeclaration the class declaration to analyze
 * @param preAmble the prampble to extract Fully Qualified Names from
 * @returns fully qualified names of the classes that the class implements
 */
function getImplements(classDeclaration: string, preAmble: string[]): string[] {
    const implementsMatchArray = classDeclaration.match(/implements ([\s\S]*)/);
    const implementsClassNames = implementsMatchArray ? implementsMatchArray[1] : undefined;
    if (!implementsClassNames) return [];

    const implementsClassNameArray = implementsClassNames.split(',');

    const implementsFQN: string[] = [];

    implementsClassNameArray.forEach((implementsClassName) => {
        const fqn = getFQN(preAmble, implementsClassName.trim());
        if (fqn) implementsFQN.push(fqn);
    });

    return implementsFQN;
}

/**
 * extract the class the class is extending
 * @param classDeclaration the class declaration to analyze
 * @param preAmble the preamble to extract Fully Qualified Names from
 * @returns the fully qualified name of the class that is being extended
 */
function getExtends(classDeclaration: string, preAmble: string[]): string | undefined {
    const extendsMatchArray = classDeclaration.match(/extends ([\s\S]*)/);
    const extendsClassName = extendsMatchArray ? extendsMatchArray[1] : undefined;
    if (!extendsClassName) return;

    return getFQN(preAmble, extendsClassName);
}

/**
 * Finds the Fully Qualified Name belonging to a class
 * @param preAmble is searched for the Fully Qualified Name
 * @param name the name to search for
 * @returns the fully qualified name belonging to the name
 */
function getFQN(preAmble: string[], name: string) {
    // for things like EventHandler<InputEvent>
    const innerMatchArray = XRegExp.matchRecursive(name, '<', '>', 'g', {
        valueNames: ['outer', null, 'inner', null],
    });
    name = innerMatchArray[0]?.value ?? name;
    const innerType = innerMatchArray[1]?.name === 'inner' ? innerMatchArray[1].value : undefined;
    const innerFQN = innerType ? getFQN(preAmble, innerType) : undefined;

    let fqn = name;

    for (const candidate of preAmble) {
        const candidateMatch = candidate.match(new RegExp('import ([a-z0-9.]*.' + name + ')'));
        if (candidateMatch) {
            // console.log(candidateMatch[1]);
            fqn = candidateMatch[1] ?? name;
        }
    }

    fqn = innerType ? `${fqn}<${innerFQN}>` : fqn;

    return fqn;
}

/**
 * finds the classname in a class declaration (or enum / interface)
 * @param classDeclaration the class / enum / interface declaration to search
 * @returns the classname
 */
function getClassname(classDeclaration: string): string {
    const nameMatch = classDeclaration.match(/(?:class|enum|interface)\s+(\S+)/);
    return nameMatch && nameMatch[1] ? nameMatch[1] : 'UnknownClass';
}

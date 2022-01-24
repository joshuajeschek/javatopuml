import { Modifiers, getModifiers } from './util';

export interface Method {
    name: string;
    returnType: string;
    parameters: { name: string; type: string }[];
    modifiers: Modifiers[];
}

/**
 * Extracts all Methods from a Java Class
 * @param javaClass - the java class to extract the methods from
 * @returns the methods of the class
 */
export function getMethods(possibleMethods: string[]): Method[] {
    const methods: Method[] = [];

    let index = 0;
    for (let candidate of possibleMethods) {
        candidate = candidate.replace(/=[\s\S]*$/, '');
        // is not function
        if (!candidate.includes('(')) continue;
        const field = getMethod(candidate, index++);
        if (field) methods.push(field);
    }

    return methods;
}

function getMethod(possibleMethod: string, index: number): Method | undefined {
    if (possibleMethod.replaceAll(/\s/g, '').length === 0) return;

    const parameters: { name: string; type: string }[] = [];

    const parameterMatch = possibleMethod.match(/(?<=\()[\s\S]*(?=\))/);
    const rawParameters = parameterMatch
        ? parameterMatch[0].split(/(?<!<[^>]*),/).filter((value) => !value.match(/^\s*$/))
        : [];
    let parameterIndex = 0;
    rawParameters.forEach((rawParameter) => parameters.push(getParameter(rawParameter, parameterIndex++)));

    const declarationArray = possibleMethod
        .split('(')[0]
        .split(' ')
        .filter((value) => !value.match(/^\s*$/));
    // name => last element in array
    const name = declarationArray.pop();
    const modifersAndType = getModifiers(declarationArray);

    return {
        modifiers: modifersAndType.modifiers,
        name: name?.trim() ?? `method${index}`,
        returnType: modifersAndType.newString.trim(),
        parameters,
    };
}

function getParameter(rawParameter: string, parameterIndex: number): { name: string; type: string } {
    const rawParameterArray = rawParameter.split(' ');
    const name = rawParameterArray.pop();
    const type = rawParameterArray.join(' ');

    return {
        name: name ? name.trim() : `param${parameterIndex}`,
        type: !type.match(/^\s*$/) ? type.trim() : `type${parameterIndex}`,
    };
}

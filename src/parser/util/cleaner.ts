import strip from 'strip-comments';
import XRegExp from 'xregexp';

/**
 * Cleans a java code string by
 * - stripping comments
 * - removing throws clauses
 * - removing string literals
 * - removing annotations
 * - removing newlines and duplicate whitespaces.
 * @param javaContent the java file content to be cleaned
 * @returns the cleaned java content
 */
export function cleanJavaContent(javaContent: string): string {
    // remove comments
    javaContent = strip(javaContent);

    // we remove throws-clauses here, since it is easier (always between '(' and '{')
    // positive lookbehind: )
    // in between: (whitespace(s)), then everything but: {
    // positive lookahead: {
    javaContent = javaContent.replaceAll(/(?<=\))\s*throws[^{]*(?={)/g, '');

    // remove all String literals, as they can be quite the problem later
    // (e.g. unmatched brackets)
    // https://stackoverflow.com/questions/171480/regex-grabbing-values-between-quotation-marks
    // modified to match newlines as well -> (for multiline strings)
    javaContent = javaContent.replaceAll(/(["'])(?:(?=(\\?))\2[\s\S])*?\1/g, '');

    javaContent = removeAnnotations(javaContent);

    // remove newlines
    javaContent = javaContent.replaceAll(/[^\S ]*/g, '');
    // remove duplicate whitespaces
    javaContent = javaContent.replaceAll(/[ ]+/g, ' ');

    return javaContent;
}

/**
 * Removes annotation from a java code string.
 * @param javaContent the java code to remove the annotations from
 * @returns the java code without annotations
 */
function removeAnnotations(javaContent: string): string {
    // remove annotations without parameter
    // (no brackets / empty brackets)
    javaContent = javaContent.replaceAll(/@[^\s(]*(\(\))*(?=\s)/g, '');

    const toBeRemoved = getAnnotationParameterLocations(javaContent);

    // sort from back to front
    toBeRemoved.sort((a, b) => b.start - a.start);

    // remove annotation parameters that have been found
    toBeRemoved.forEach(({ start, end }) => {
        javaContent = javaContent.slice(0, start) + javaContent.slice(end);
    });

    // remove annotations without parameter
    // (no brackets / empty brackets)
    javaContent = javaContent.replaceAll(/@[^\s(]*(\(\))*(?=\s)/g, '');

    return javaContent;
}

/**
 * Finds all parameters of annotations in a java code string.
 * @param javaContent the java code with annotation parameters that should be detected
 * @returns the locations of all annotation parameters in the java code
 */
function getAnnotationParameterLocations(javaContent: string): { start: number; end: number }[] {
    const toBeRemoved: { start: number; end: number }[] = [];

    const bracketMatches = XRegExp.matchRecursive(javaContent, '\\(', '\\)', 'g', {
        valueNames: ['between', null, 'match', null],
    });

    // if (javaContent.includes('test=')) console.log(javaContent, bracketMatches);

    let removeNext = false;
    bracketMatches.forEach((bracketMatch) => {
        if (removeNext) {
            toBeRemoved.push({ start: bracketMatch.start, end: bracketMatch.end });
            removeNext = false;
        } else if (bracketMatch.name === 'between') {
            removeNext = Boolean(bracketMatch.value.match(/@[\S]+$/));
        } else if (bracketMatch.name === 'match') {
            if (bracketMatch.value.includes('@')) {
                const innerResults = getAnnotationParameterLocations(bracketMatch.value)
                    // change indices to reflect complete javaContent
                    .map((value) => {
                        return { start: value.start + bracketMatch.start, end: value.end + bracketMatch.start };
                    });
                innerResults.forEach((innerResult) => toBeRemoved.push(innerResult));
            }
        }
    });

    return toBeRemoved;
}

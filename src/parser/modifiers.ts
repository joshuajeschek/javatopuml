export enum Modifier {
    class,
    interface,
    enum,
    static,
    public,
    private,
    protected,
    abstract,
    final,
    super,
    annotation,
}

/**
 * Extracts modifiers
 * @param input String that starts with modifiers / already split string
 * @returns all modifiers as modifiers and the new string (without modifiers)
 */
export function getModifiers(input: string[] | string): { modifiers: Modifier[]; newString: string } {
    const modifiers: Set<Modifier> = new Set();

    const modifiedStringArray = (typeof input !== 'string' ? input : input.split(' ')).filter(
        (value) => !value.match(/^\s*$/),
    );

    let candidate = modifiedStringArray.at(0);
    let flag = candidate ? Modifier[candidate as keyof typeof Modifier] : undefined;
    while (flag !== undefined && candidate) {
        modifiers.add(flag);
        modifiedStringArray.shift();
        candidate = modifiedStringArray.at(0);
        flag = candidate ? Modifier[candidate as keyof typeof Modifier] : undefined;
    }

    return {
        modifiers: [...modifiers],
        newString: modifiedStringArray.join(' '),
    };
}

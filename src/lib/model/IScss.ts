export const IScssElementType = {
    default: "Default",
    rule: "Rule",
    block: "Block",
    oneLineComment: "OneLineComment",
    multiLineComment: "MultiLineComment",
    code: "Code"
}
export interface IScssAbstract {
    content?: string
    child?: Array<IScss>
    elementType: string
}

export interface IScssRule extends IScssAbstract {
    name: string
    value?: string
}


export interface IScssBlock extends IScssAbstract {
    name: string
}

export interface IScssComment extends IScssAbstract {
    text: string
}

export interface IScssCode extends IScssAbstract {
    code: Array<string>
}

export type IScss = IScssAbstract | IScssRule | IScssBlock | IScssComment | IScssCode;
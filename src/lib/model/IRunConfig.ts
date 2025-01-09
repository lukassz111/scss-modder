export interface IRunConfigAbstract {
    commands: Array<IRunConfigCommand>
}

export interface IRunConfigMultipleFiles extends IRunConfigAbstract {
    startDir: string,
    excludePathFilesRegex?: string
    outputDir: string
}

export interface IRunConfigOneFile extends IRunConfigAbstract {
    startFile: string,
    outFile: string
}

export enum IRunConfigCommandType {
    RemoveRuleByName = 'RemoveRuleByName',
    RemoveEmptyBlocks = 'RemoveEmptyBlocks',
    RemoveEmptyComments = 'RemoveEmptyComments',
    ChangeOneLineCommentsToMultiline = 'ChangeOneLineCommentsToMultiline',
    RemoveCssVar = 'RemoveCssVar',
    CommentsContentTrim = 'CommentsContentTrim'
}

export interface IRunConfigCommandAbstract {
    commandType: IRunConfigCommandType,
    runCommandOnContentOfComment?: boolean
}

export interface IRunConfigCommand_RemoveRuleByName extends IRunConfigCommandAbstract {
    ruleName: Array<string>
}
export interface IRunConfigCommand_RemoveEmptyBlocks extends IRunConfigCommandAbstract {
    blockWithOnlyCommentsTreatAsEmpty?: boolean
}
export interface IRunConfigCommand_RemoveEmptyComments extends IRunConfigCommandAbstract {

}
export interface IRunConfigCommand_ChangeOneLineCommentsToMultiline extends IRunConfigCommandAbstract {

}
export interface IRunConfigCommand_RemoveCssVar extends IRunConfigCommandAbstract {

}
export interface IRunConfigCommand_CommentsContentTrim extends IRunConfigCommandAbstract {

}


export type IRunConfigCommand = 
    IRunConfigCommand_RemoveRuleByName | IRunConfigCommand_RemoveEmptyBlocks | IRunConfigCommand_RemoveEmptyComments |
    IRunConfigCommand_ChangeOneLineCommentsToMultiline | IRunConfigCommand_RemoveCssVar | IRunConfigCommand_CommentsContentTrim;
export type IRunConfig = IRunConfigMultipleFiles | IRunConfigOneFile;
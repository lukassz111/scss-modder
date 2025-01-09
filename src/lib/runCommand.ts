import { IRunConfigCommand, IRunConfigCommand_RemoveEmptyBlocks, IRunConfigCommand_RemoveRuleByName, IRunConfigCommandType } from "./model/IRunConfig";
import { IScss, IScssComment, IScssElementType, IScssRule } from "./model/IScss";
import { Functions } from "./services/Functions";

export function tryRunCommandsOnComment(styleString: string, command: IRunConfigCommand): string {
    let inString = styleString;
    let data = Functions.scssConvertToObject(inString);
    let origOutString = Functions.objectConvertToScss(data);
    if(!Functions.compareScssStrings(inString,origOutString)) {
        return inString;
    }
    let cpCommand: IRunConfigCommand = JSON.parse(JSON.stringify(command));
    cpCommand.runCommandOnContentOfComment = false;
    runCommand(data, cpCommand);
    return Functions.objectConvertToScss(data);
}
export function runCommand(data: IScss, command: IRunConfigCommand) {
    switch (command.commandType) {
        case IRunConfigCommandType.RemoveCssVar:
            {
                let stack: Array<IScss> = [data];
                while (stack.length > 0) {
                    let currentNode: IScss = stack.pop() as IScss;
                    if(currentNode.child != null && currentNode.child != undefined) {
                        for (let iChild = currentNode.child.length - 1; iChild >= 0; iChild--) {
                            if(currentNode.child[iChild].elementType == IScssElementType.rule) {
                                let iscssRuleChild: IScssRule = currentNode.child[iChild] as IScssRule;
                                if(iscssRuleChild.value != null && iscssRuleChild != undefined && iscssRuleChild.name.startsWith('--')) {
                                    currentNode.child.splice(iChild, 1);
                                }
                            } else {
                                stack.push(currentNode.child[iChild]);
                            }
                        }
                    }
                }
            }
            break;
        case IRunConfigCommandType.CommentsContentTrim:
            {
                let stack: Array<IScss> = [data];
                while (stack.length > 0) {
                    let currentNode: IScss = stack.pop() as IScss;
                    if(currentNode.child != null && currentNode.child != undefined) {
                        for (let iChild = currentNode.child.length - 1; iChild >= 0; iChild--) {
                            if(
                                currentNode.child[iChild].elementType == IScssElementType.oneLineComment ||
                                currentNode.child[iChild].elementType == IScssElementType.multiLineComment
                            ) {
                                (currentNode.child[iChild] as IScssComment).text = (currentNode.child[iChild] as IScssComment).text.trim();
                            } else {
                                stack.push(currentNode.child[iChild]);
                            }
                        }
                    }
                }
            }
            break;
        case IRunConfigCommandType.ChangeOneLineCommentsToMultiline:
            {
                let stack: Array<IScss> = [data];
                while (stack.length > 0) {
                    let currentNode: IScss = stack.pop() as IScss;
                    if(currentNode.child != null && currentNode.child != undefined) {
                        let commentText: string = '';
                        let removeEnd: number = -1;
                        let removeStart: number = -1;
                        for (let iChild = currentNode.child.length - 1; iChild >= 0; iChild--) {
                            switch(currentNode.child[iChild].elementType) {
                                case IScssElementType.oneLineComment:
                                    if(removeEnd == -1) {
                                        removeEnd = iChild;
                                    } else {
                                        removeStart = iChild;
                                    }
                                    commentText = (currentNode.child[iChild] as IScssComment).text + `\n` + commentText;
                                    break;
                                default:
                                    if(removeStart != -1 && removeEnd != -1) {
                                        let insert: IScss = {
                                            elementType: IScssElementType.multiLineComment,
                                            text: commentText
                                        };
                                        currentNode.child.splice(removeStart, removeEnd-removeStart, insert);
                                    }
                                    removeStart = -1;
                                    removeEnd = -1;
                                    commentText = '';
                                    break;
                            }
                        }
                        
                        if(removeStart != -1 && removeEnd != -1) {
                            let insert: IScss = {
                                elementType: IScssElementType.multiLineComment,
                                text: commentText
                            };
                            currentNode.child.splice(removeStart, removeEnd-removeStart, insert);
                        }

                        for (let iChild = currentNode.child.length - 1; iChild >= 0; iChild--) {
                            switch(currentNode.child[iChild].elementType) {
                                case IScssElementType.oneLineComment:
                                case IScssElementType.multiLineComment:
                                    break;
                                default:
                                    stack.push(currentNode.child[iChild]);
                                    break;
                            }
                        }
                    }
                }
            }
            break;
        case IRunConfigCommandType.RemoveEmptyComments:
            {
                let stack: Array<IScss> = [data];
                while (stack.length > 0) {
                    let currentNode: IScss = stack.pop() as IScss;

                    if (currentNode.child != null) {
                        for (let iChild = currentNode.child.length - 1; iChild >= 0; iChild--) {
                            if (currentNode.child[iChild].elementType == IScssElementType.oneLineComment) {
                                let x = (currentNode.child[iChild] as IScssComment);
                                if(x.text.trim() == '') {
                                    currentNode.child.splice(iChild, 1)
                                }
                            } 
                            else if (currentNode.child[iChild].elementType == IScssElementType.multiLineComment) {
                                let x = (currentNode.child[iChild] as IScssComment);
                                if(x.text.trim() == '') {
                                    currentNode.child.splice(iChild, 1)
                                }
                            }
                            else {
                                stack.push(currentNode.child[iChild]);
                            }
                        }
                    }
                }
            }
            break;
        case IRunConfigCommandType.RemoveRuleByName:
            {
                let stack: Array<IScss> = [data];
                while (stack.length > 0) {
                    let currentNode: IScss = stack.pop() as IScss;

                    if (currentNode.child != null) {
                        for (let iChild = currentNode.child.length - 1; iChild >= 0; iChild--) {
                            if (currentNode.child[iChild].elementType == IScssElementType.rule) {
                                if ((command as IRunConfigCommand_RemoveRuleByName).ruleName.includes((currentNode.child[iChild] as IScssRule).name.trim())) {
                                    currentNode.child.splice(iChild, 1)
                                }
                            } else {
                                stack.push(currentNode.child[iChild]);
                            }
                        }
                    }
                }
            }
            break;
        case IRunConfigCommandType.RemoveEmptyBlocks:
            {
                let iterations = 0;
                let doneOperations = 0;
                let blockWithOnlyCommentsTreatAsEmpty: boolean = false;
                if ((command as IRunConfigCommand_RemoveEmptyBlocks).blockWithOnlyCommentsTreatAsEmpty != null && (command as IRunConfigCommand_RemoveEmptyBlocks).blockWithOnlyCommentsTreatAsEmpty != undefined) {
                    blockWithOnlyCommentsTreatAsEmpty = (command as IRunConfigCommand_RemoveEmptyBlocks).blockWithOnlyCommentsTreatAsEmpty as boolean;
                }
                do {
                    iterations++;
                    doneOperations = 0;

                    let stack: Array<IScss> = [data];
                    while (stack.length > 0) {
                        let currentNode: IScss = stack.pop() as IScss;

                        if (currentNode.child != null) {
                            for (let iChild = currentNode.child.length - 1; iChild >= 0; iChild--) {
                                let currentChildNode: IScss = currentNode.child[iChild] as IScss;
                                if (currentChildNode.elementType == IScssElementType.block) {
                                    if (currentChildNode.child == null) {
                                        currentNode.child.splice(iChild, 1);
                                        doneOperations++;
                                    } else {
                                        let countChildsOfChildsComments = currentChildNode.child
                                            .map(v => v.elementType)
                                            .filter(v => {
                                                return (v == IScssElementType.multiLineComment) || (v == IScssElementType.oneLineComment)
                                            }).length;
                                        if (currentChildNode.child.length <= 0) {
                                            currentNode.child.splice(iChild, 1)
                                            doneOperations++;
                                        } else if ((countChildsOfChildsComments == currentChildNode.child.length) && blockWithOnlyCommentsTreatAsEmpty) {
                                            currentNode.child.splice(iChild, 1)
                                            doneOperations++;
                                        } else {
                                            stack.push(currentNode.child[iChild]);
                                        }
                                    }
                                } else {
                                    stack.push(currentNode.child[iChild]);
                                }
                            }
                        }
                    }

                } while (doneOperations > 0);

                // console.log(`Command ${command.commandType}, iterations: ${iterations}`);
            }
            {
                let blockWithOnlyCommentsTreatAsEmpty: boolean = false;
                if ((command as IRunConfigCommand_RemoveEmptyBlocks).blockWithOnlyCommentsTreatAsEmpty != null && (command as IRunConfigCommand_RemoveEmptyBlocks).blockWithOnlyCommentsTreatAsEmpty != undefined) {
                    blockWithOnlyCommentsTreatAsEmpty = (command as IRunConfigCommand_RemoveEmptyBlocks).blockWithOnlyCommentsTreatAsEmpty as boolean;
                }
                if(blockWithOnlyCommentsTreatAsEmpty) {
                    if(data.child!=null && data.child!=undefined) {
                        let x = data.child.map( v => v.elementType);
                        
                        let isAllCommentOrEmpty = x.map(v => (v == IScssElementType.multiLineComment || v == IScssElementType.oneLineComment)).reduce( (p, c) => {
                            return (p && c);
                        }, true);
                        if(isAllCommentOrEmpty && data.child.length > 0) {
                            while(data.child.length > 0) {
                                data.child.pop();
                            }
                        }
                    }
                }
            }
            break;
        default:
            console.log(`Command ${command.commandType} not implemented`);
            break;
    }

    if(command.runCommandOnContentOfComment) {
        let stack: Array<IScss> = [data];
        while(stack.length > 0) {
            let curr = stack.pop() as IScss;
            switch(curr.elementType) {
                case IScssElementType.multiLineComment:
                case IScssElementType.oneLineComment:
                    let text = (curr as IScssComment).text;
                    text = tryRunCommandsOnComment(text, command);
                    (curr as IScssComment).text = text;
                    break;
            }
            if(curr.child != null && curr.child != undefined) {
                curr.child.forEach( c => stack.push(c));
            }
        }
    }
}
import { Debug, debug } from "./Debug";
import { IScssElementType, IScss, IScssBlock, IScssCode, IScssComment, IScssRule } from "../model/IScss";
import { utility } from "../utility";

export class Functions {
    public static findDifference(stringA: string, changedString: string): Map<string, number> {
        const maxLength = Math.max(stringA.length, changedString.length);
        const differences: Map<string, number> = new Map<string, number>();


        for (let i = 0; i < maxLength; i++) {
            let charA = ' ';
            let charB = ' ';
            if (i < stringA.length) {
                charA = stringA[i];
            }
            if (i < changedString.length) {
                charB = changedString[i];
            }
            let key = `${charA}${charB}`;
            if (charA != charB) {
                let v = differences.get(key);
                if (v == undefined || v == null) {
                    v = 1;
                } else {
                    v++;
                }
                differences.set(key, v);
            }
        }

        return differences;
    }

    public static countCharacters(char: string, str: string): number {
        let result: number = 0;
        for (let c of str) {
            if (c == char) {
                result++;
            }
        }
        return result;
    }
    public static countCharactersMap(chars: Array<string>, str: string): Map<string, number> {
        let result: Map<string, number> = new Map<string, number>();
        for (let char of chars) {
            result.set(char, 0);
        }

        for (let c of str) {
            if (chars.includes(c)) {
                let v = 1 + (result.get(c) as number);
                result.set(c, v);
            }
        }
        return result;
    }

    public static compareScssFiles(filePathA: string, filePathB: string): boolean {
        let fileA = utility.loadFileText(filePathA);
        let fileB = utility.loadFileText(filePathB);
        return Functions.compareScssStrings(fileA, fileB);
    }
    public static probablySameScssStrings(stringA: string, stringB: string): boolean {
        const preprocesString = function (str: string): string {
            return str
                .split(`\n`)//Split text to lines
                .filter(l => !l.trimStart().startsWith('//'))//Remove lines starts like //
                .join(`\n`)//Joint lines into one string
                .replace(/\s+/g, "");//Remove whitespaces
        }
        let fileA = preprocesString(stringA);
        let fileB = preprocesString(stringB);
        let diffCount = fileA.length - fileB.length;
        let charsToCount = ['{', '}', ';'];
        let aCount = Functions.countCharactersMap(charsToCount, fileA);
        let bCount = Functions.countCharactersMap(charsToCount, fileB);
        let sumCount: Map<string, number> = new Map<string, number>();
        let result = false;
        for (let c of charsToCount) {
            let sum: number = (aCount.get(c) as number) - (bCount.get(c) as number);
            if (sum != 0) {
                sumCount.set(c, sum);
            }
        }
        if (sumCount.size <= 0) {
            result = true;
        }
        else if (sumCount.size == 1) {
            let sumKey = [...sumCount.keys()][0];
            if (sumKey == ';') {
                result = this.compareScssStrings(fileA.replace(/;/g, ""), fileB.replace(/;/g, ""));
            } else {
                let diff = this.findDifference(fileA, fileB);
                console.log({ sumKey, sumKeyCount: sumCount.get(sumKey) });
            }
        }
        else {
            let diff = this.findDifference(fileA, fileB);
            console.log(sumCount);
        }
        // if(!result) {
        //     console.log({stringA});
        // }
        return result;
    }
    public static compareScssStrings(stringA: string, stringB: string): boolean {

        let fileA = stringA.replace(/\s+/g, "");
        let fileB = stringB.replace(/\s+/g, "");
        let result = (fileA == fileB);
        // if (!result) {
        //     let x = findDifference(fileA, fileB);
        //     console.log({ diff: x });
        // }
        return result;
    }
    public static scssConvertToObject(scssString: string): IScss {
        let data: IScss = {
            content: scssString,
            child: [],
            elementType: IScssElementType.default
        };

        let iterations = 0;
        const unpackContentFromIScss = function (dataObject: IScss) {
            
            if (dataObject.content == null || dataObject.content == undefined) {
                return;
            }
            dataObject.child = [];
            // console.log({ dataObject });
            let content = dataObject.content;

            const IN_BLOCK = "IN_BLOCK";
            const IN_ONELINECOMMENT = "IN_ONELINECOMMENT";
            const IN_MULTILINECOMMENT = "IN_MULTILINECOMMENT";
            const OUT = "OUT";
            const IN_RULE = "IN_RULE";
            const IN_NAME_RULE_OR_BLOCK = "IN_NAME_RULE_OR_BLOCK";
            const IN_INTERNAL_BLOCK = "IN_INTERNAL_BLOCK";
            const IN_INTERNAL_BLOCK_MULTILINECOMMENT = "IN_INTERNAL_BLOCK_MULTILINECOMMENT";

            let state: Array<string> = [];
            state.push(OUT);
            let name_rule_or_block: string = '';
            let name_rule: string = '';
            let rule_value: string = '';
            let comment: string = '';
            let blockIScss: IScssBlock = {
                name: "",
                child: [],
                elementType: IScssElementType.block
            }
            for (let indexCharacter = 0; indexCharacter < content.length; indexCharacter++) {
                let lastState = state[state.length - 1];
                let previousState: string | null = null;
                if (state.length >= 2) {
                    previousState = state[state.length - 2];
                }
                let currentCharacter = content[indexCharacter];
                let currentText = content.substring(indexCharacter);
                // switch(lastState) {
                //     case IN_INTERNAL_BLOCK:
                //         break;
                //     default:
                //         console.log(`${previousState} - ${lastState} | ${currentText}`);
                //         break;
                // }
                switch (lastState) {
                    case OUT:
                        if (utility.isWhitespace(currentCharacter)) {
                            continue;
                        }
                        else if (currentText.startsWith('/*')) {
                            indexCharacter++;
                            comment = '';
                            state.push(IN_MULTILINECOMMENT);
                            continue;
                        }
                        else if (currentText.startsWith('//')) {
                            indexCharacter++;
                            comment = '';
                            state.push(IN_ONELINECOMMENT);
                            continue;
                        }
                        name_rule_or_block = currentCharacter;
                        state.push(IN_NAME_RULE_OR_BLOCK);
                        break;
                    case IN_ONELINECOMMENT:
                        if (currentCharacter == `\n`) {
                            state.pop();
                            dataObject.child.push({
                                text: comment,
                                elementType: IScssElementType.oneLineComment
                            });
                            comment = '';
                        }
                        comment += currentCharacter;
                        break;
                    case IN_MULTILINECOMMENT:
                        if (currentText.startsWith('*/')) {
                            indexCharacter++;
                            state.pop();
                            dataObject.child.push({
                                text: comment,
                                elementType: IScssElementType.multiLineComment
                            });
                            comment = '';

                        } else {
                            comment += currentCharacter;
                        }
                        break;
                    case IN_NAME_RULE_OR_BLOCK:
                        if (currentCharacter == ':') {
                            name_rule = name_rule_or_block;
                            rule_value = '';
                            state.pop();
                            state.push(IN_RULE);
                        } else if(currentText.startsWith('#{')) {
                            name_rule_or_block += '#{';
                            indexCharacter++;
                        }
                         else if (currentCharacter == '{') {
                            blockIScss.name = name_rule_or_block;
                            blockIScss.content = '';
                            blockIScss.child = [];
                            name_rule_or_block = '';
                            state.pop();
                            state.push(IN_BLOCK);
                        } else if (currentCharacter == ';') {
                            dataObject.child.push({
                                name: name_rule_or_block,
                                elementType: IScssElementType.rule
                            });
                            state.pop();
                            name_rule_or_block = '';
                        }
                        else {
                            name_rule_or_block += currentCharacter;
                        }
                        break;
                    case IN_BLOCK:
                        if (currentCharacter == '{') {
                            state.push(IN_INTERNAL_BLOCK);
                            blockIScss.content += currentCharacter;
                        }
                        else if (currentCharacter == '}') {
                            state.pop();
                            dataObject.child.push(JSON.parse(JSON.stringify(blockIScss)));
                        }
                        else if(currentText.startsWith('/*')) {
                            state.push(IN_INTERNAL_BLOCK_MULTILINECOMMENT);
                            blockIScss.content += '/*';
                            indexCharacter++;
                        }
                        else if (utility.isWhitespace(currentCharacter)) {
                            blockIScss.content += currentCharacter;
                        } else {
                            blockIScss.content += currentCharacter;
                        }
                        break;
                    case IN_INTERNAL_BLOCK_MULTILINECOMMENT:
                        if(currentText.startsWith('*/')) {
                            blockIScss.content += '*/';
                            indexCharacter++;
                            state.pop();
                        } else {
                            blockIScss.content += currentCharacter;
                        }
                        break;
                    case IN_INTERNAL_BLOCK:
                        blockIScss.content += currentCharacter;
                        if (currentCharacter == '{') {
                            state.push(IN_INTERNAL_BLOCK);
                        } else if (currentCharacter == '}') {
                            state.pop();
                        }
                        break;
                    case IN_RULE:
                        // console.log(`${indexCharacter} - ${previousState} - ${lastState} - ${currentText}`);
                        // console.log({ name_rule, rule_value, currentTextTrim: currentText.trim() });

                        if (currentCharacter == ';') {
                            dataObject.child.push({
                                name: name_rule,
                                value: rule_value,
                                elementType: IScssElementType.rule
                            });
                            state.pop();
                            name_rule = '';
                            rule_value = '';
                        } else if (currentText.startsWith('#{')) {
                            rule_value += '#{';
                            indexCharacter++;
                        }
                        else if (currentCharacter == '{') {
                            blockIScss.name = name_rule + ":" + rule_value;
                            blockIScss.content = '';
                            blockIScss.child = [];
                            name_rule_or_block = '';
                            name_rule = '';
                            rule_value = '';
                            state.pop();
                            state.push(IN_BLOCK);
                        }
                        else if (currentText.trim().length <= 0) {
                            dataObject.child.push({
                                name: name_rule,
                                value: rule_value,
                                elementType: IScssElementType.rule
                            });
                            state.pop();
                            name_rule = '';
                            rule_value = '';
                        }
                        else {
                            rule_value += currentCharacter;
                        }
                        break;
                    default:
                        console.log(`State not implemented: ${lastState}`);
                        break;


                }
            }
            delete dataObject.content;
            debug.SaveObjectAsJsonFile(`unpackContentFromIScss.${iterations}`, state);
        }

        let dataToUnpack: Array<IScss> = [data];
        while (dataToUnpack.length > 0) {
            let x = dataToUnpack.pop() as IScss;
            unpackContentFromIScss(x);
            if (x.child != undefined && x.child != null) {
                x.child.forEach((v: IScss) => dataToUnpack.push(v));
            }
            debug.SaveObjectAsJsonFile(`scssConvertToObject.${iterations}`, data);
            iterations++;
        }

        return data;
    }

    public static objectConvertToScss(_object: IScss): string {
        let object = JSON.parse(JSON.stringify(_object));
        if (object.child == null || object.child == undefined) {
            return "";
        } else if (object.child.length <= 0) {
            return "";
        }

        const interateOver = function(data: IScss, callable: (parent: IScss, child: IScss) => boolean|IScss): number {
            let stack: Array<IScss> = [data];
            let operationsDone = 0;
            while (stack.length > 0) {
                let node: IScss = stack.pop() as IScss;
                if(node.child != undefined && node.child != null) {
                    for ( let iChild = node.child.length-1; iChild >= 0; iChild--) {
                        let result = callable(node,node.child[iChild]);
                        if(result === true) {}
                        else if(result === false) {
                            operationsDone++;
                            node.child.splice(iChild,1);
                        } else {
                            operationsDone++;
                            node.child.splice(iChild,1, result);
                        }
                    }
                    for ( let c of node.child) {
                        stack.push(c);
                    }
                }
            }
            return operationsDone;
        }
        const step1 = function(parent: IScss, child: IScss): boolean|IScss {
            switch(child.elementType) {
                case IScssElementType.rule:
                    {
                        let code: string = (child as IScssRule).name;
                        if((child as IScssRule).value != undefined || (child as IScssRule).value != null) {
                            code += ":"+(child as IScssRule).value;
                        }
                        code +=";";
                        return {
                            code: [code],
                            elementType: IScssElementType.code
                        };
                    }
                case IScssElementType.oneLineComment:
                    {
                        let code: string = `// ` + (child as IScssComment).text;
                        return {
                            code: [code],
                            elementType: IScssElementType.code
                        };
                    }
                case IScssElementType.multiLineComment:
                    {
                        let code: string = `/* ` + (child as IScssComment).text + ` */`;
                        return {
                            code: [code],
                            elementType: IScssElementType.code
                        };
                    }
                case IScssElementType.block: 
                    {
                        let blockChilds = (child as IScssBlock).child;
                        if(blockChilds == null || blockChilds == undefined) {
                            let code = ""+(child as IScssBlock).name + "{}";
                            return {
                                code: [code],
                                elementType: IScssElementType.code
                            };
                        } else if(blockChilds.length <= 0) {
                            let code = ""+(child as IScssBlock).name + "{}";
                            return {
                                code: [code],
                                elementType: IScssElementType.code
                            };
                        } else if(blockChilds.length == 1) {
                            let codes: Array<string> = [];
                            codes.push(""+(child as IScssBlock).name + "{");
                            if(blockChilds[0].elementType == IScssElementType.code) {
                                (blockChilds[0] as IScssCode).code.forEach( c => codes.push(`\t${c}`));
                                codes.push("}");
                                return {
                                    code: [...codes],
                                    elementType: IScssElementType.code
                                };
                            }
                            return true;
                        }
                    }
                
            }
            return true;
        };
        const step2 = function(parent: IScss, child: IScss): boolean|IScss {
            if(parent.child != undefined && parent.child != null) {
                if(parent.child.length <= 1) {
                    return true;
                }
                let codes: Array<string> = [];
                let allChildsIsCode: boolean = true;

                parent.child.forEach( (c: IScss) => {
                    if(c.elementType == IScssElementType.code) {
                        codes.push(...(c as IScssCode).code);
                    } else {
                        allChildsIsCode = false;
                    }
                });
                if(allChildsIsCode) {
                    // console.log({codes});
                    // return true;
                    parent.child = [{
                        code: codes,
                        elementType: IScssElementType.code
                    }];
                    return true;
                }
            }
            return true;
        }
        let operations = 1;
        while(operations > 0) {
            operations = 0;
            operations += interateOver(object, step1);
            operations += interateOver(object, step2);
        }

        // const findDeepestElements = function (data: IScss): { elements: IScss[]; maxDepth: number } {
        //     let stack: { node: IScss; depth: number }[] = [{ node: data, depth: 0 }];
        //     let deepest: IScss[] = [];
        //     let maxDepth = 0;

        //     while (stack.length > 0) {
        //         const { node, depth } = stack.pop()!;
        //         if (node.elementType == elementType.code) {
        //             continue;
        //         }

        //         if (depth > maxDepth) {
        //             maxDepth = depth;
        //             deepest = [node];
        //         } else if (depth === maxDepth) {
        //             deepest.push(node);
        //         }

        //         if (node.child) {
        //             for (const child of node.child) {
        //                 stack.push({ node: child, depth: depth + 1 });
        //             }
        //         }
        //     }

        //     return { elements: deepest, maxDepth };
        // }

        // const mergeCodeElementsInSameNodes = function (data: IScss): number {
        //     let stack: Array<IScss> = [];
        //     stack.push(data);
        //     let mergedCount = 0;

        //     while (stack.length > 0) {
        //         let node = stack.pop()!;
        //         if (node.elementType == elementType.code) {
        //             continue;
        //         }
        //         if (node.child) {
        //             let newChilds: Array<IScss> = [];
        //             for (let i = 0; i < (node.child.length); i++) {
        //                 if (newChilds.length <= 0) {
        //                     newChilds.push(node.child[i]);
        //                 }
        //                 else if (newChilds[newChilds.length - 1].elementType != elementType.code) {
        //                     newChilds.push(node.child[i]);
        //                 }
        //                 else if (newChilds[newChilds.length - 1].elementType == elementType.code && node.child[i].elementType == elementType.code) {
        //                     (node.child[i] as IScssCode).code.forEach(c => {
        //                         (newChilds[newChilds.length - 1] as IScssCode).code.push(c);
        //                     })

        //                     mergedCount++;
        //                 }
        //             }
        //             for (let child of newChilds) {
        //                 stack.push(child);
        //             }
        //             node.child = newChilds;
        //         }
        //     }
        //     return mergedCount;
        // }
        // const replceBlockWithOneChildCodeToCode = function (data: IScss): number {
        //     let stack: Array<IScss> = [];
        //     stack.push(data);
        //     let mergedCount = 0;

        //     while (stack.length > 0) {
        //         let node = stack.pop()!;
        //         if (node.elementType == elementType.code) {
        //             continue;
        //         }
        //         if (node.child) {
        //             if (node.child.length == 0) {
        //                 node.elementType = elementType.code;
        //                 if (node.elementType == elementType.default) {
        //                     (node as IScssCode).code = [];
        //                 } else {
        //                     (node as IScssCode).code = [(node as IScssBlock).name + "{}"];
        //                 }
        //                 delete node.child;
        //                 delete node.content;
        //                 mergedCount++;
        //             }
        //             else if ((node.child.length == 1) && (node.child[0].elementType == elementType.code)) {

        //                 if (node.elementType == elementType.default) {
        //                     (node as IScssCode).code = [];
        //                 } else {
        //                     (node as IScssCode).code = [(node as IScssBlock).name + "{"];
        //                 }
        //                 (node.child[0] as IScssCode).code.forEach(x => {
        //                     (node as IScssCode).code.push('  ' + x);
        //                 });
        //                 if (node.elementType == elementType.block) {
        //                     (node as IScssCode).code.push('}');
        //                 }
        //                 node.elementType = elementType.code;
        //                 delete node.child;
        //                 delete node.content;
        //                 let nodeBlock = node as any;
        //                 delete nodeBlock.name;
        //                 mergedCount++;

        //             }
        //             else {
        //                 for (let c of node.child) {
        //                     stack.push(c);
        //                 }
        //             }
        //         }
        //     }
        //     return mergedCount;
        // }
        // let operationsDone = 0;
        // let iterations = 0;
        // do {
        //     debug.SaveObjectAsJsonFile(`objectConvertToScss.${iterations}`, object);
        //     let deepest = findDeepestElements(object).elements;
        //     operationsDone = 0;
        //     for (let i = 0; i < deepest.length; i++) {
        //         let deep: any = deepest[i];
        //         switch (deep.elementType) {
        //             case elementType.rule:
        //                 {
        //                     let code = (deep as IScssRule).name;
        //                     delete deep.name;
        //                     if ((deep as IScssRule).value) {
        //                         code += ':' + (deep as IScssRule).value
        //                         delete deep.value;
        //                     }
        //                     code += ';';
        //                     (deep as IScssCode).code = [code];
        //                     (deep as IScssCode).elementType = elementType.code;
        //                     operationsDone++;
        //                 }
        //                 break;
        //             case elementType.multiLineComment:
        //                 {
        //                     let comment = (deep as IScssComment).text;
        //                     delete deep.text;
        //                     let code = `/*${comment}*/`;

        //                     (deep as IScssCode).code = [code];
        //                     (deep as IScssCode).elementType = elementType.code;
        //                     operationsDone++;
        //                 }
        //                 break;
        //             case elementType.oneLineComment:
        //                 {
        //                     let comment = (deep as IScssComment).text;
        //                     delete deep.text;
        //                     let code = `//${comment}`;

        //                     (deep as IScssCode).code = [code];
        //                     (deep as IScssCode).elementType = elementType.code;
        //                     operationsDone++;
        //                 }
        //                 break;
        //         }
        //     }
        //     let operationsDoneChangedToCode = operationsDone;


        //     let operationsDoneMergeCodeAll = 0;
        //     let operationsDoneReplaceBlockAll = 0;
        //     {
        //         let operationsDoneReplaceBlock = 0;
        //         do {
        //             operationsDoneReplaceBlock = replceBlockWithOneChildCodeToCode(object);
        //             operationsDoneReplaceBlockAll += operationsDoneReplaceBlock;
        //         } while (operationsDoneReplaceBlock > 0)
        //     }
        //     {
        //         let operationsDoneMergeCode = 0;
        //         do {
        //             operationsDoneMergeCode = mergeCodeElementsInSameNodes(object);
        //             operationsDoneMergeCodeAll += operationsDoneMergeCode;
        //         } while (operationsDoneMergeCode > 0)
        //         operationsDone += operationsDoneMergeCodeAll;
        //     }

        //     {
        //         let operationsDoneReplaceBlock = 0;
        //         do {
        //             operationsDoneReplaceBlock = replceBlockWithOneChildCodeToCode(object);
        //             operationsDoneReplaceBlockAll += operationsDoneReplaceBlock;
        //         } while (operationsDoneReplaceBlock > 0)
        //     }
        //     operationsDone += operationsDoneMergeCodeAll;
        //     operationsDone += operationsDoneReplaceBlockAll;

        //     // console.log({operationsDoneChangedToCode, operationsDoneMergeCode, operationsDoneReplaceBlockAll, operationsDone});
        //     iterations++;
        // } while (operationsDone > 0);

        if (Object.keys(object).includes('code')) {
            return object.code.join(`\n`);
        } else if(object.child.length == 1 && object.child[0].elementType == IScssElementType.code) {
            return (object.child[0] as IScssCode).code.join(`\n`);
        }
        return JSON.stringify(object, null, 2);
    }
}
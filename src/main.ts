import { IRunConfig, IRunConfigCommand, IRunConfigMultipleFiles } from "./lib/model/IRunConfig";
import { utility } from "./lib/utility";
import { join } from "path";
import { Functions } from "./lib/services/Functions";
import { logger } from "./lib/services/Logger";
import { runCommand } from "./lib/runCommand";


function processForFile(inPath: string, outPath: string, commands: Array<IRunConfigCommand>) {
    logger.flush();
    logger.log(`Process file: ${inPath} -> ${outPath}`);
    if (!utility.doesFileExist(inPath)) {
        logger.log(`In file ${inPath} does't exist`);
        logger.printLogsAndFlush();
        return;
    }
    let inString: string = utility.loadFileText(inPath);
    utility.createDirectoriesSync(utility.getDirectoryPath(outPath));

    let data = Functions.scssConvertToObject(inString);
    let orginalStyleOut = Functions.objectConvertToScss(data);
    let properlyPackAndUnpackScss = Functions.compareScssStrings(inString, orginalStyleOut);
    if(!properlyPackAndUnpackScss) {
        let probablySameScssStrings = Functions.probablySameScssStrings(inString, orginalStyleOut);
        properlyPackAndUnpackScss = probablySameScssStrings;
    }
    logger.log("Is properly packed and unpacked scss: " + properlyPackAndUnpackScss);
    if (properlyPackAndUnpackScss == false) {
        let debugOut = utility.changeExtension(outPath, 'fail.json');
        utility.saveObjectAsJson(debugOut, data);
        logger.printLogsAndFlush();
        utility.saveString(utility.changeExtension(outPath, "fail." + utility.getExtension(outPath)), orginalStyleOut);
    }

    for (let cmd of commands) {
        runCommand(data, cmd);
    }

    let debugOut = utility.changeExtension(outPath, '.json');
    // utility.saveObjectAsJson(debugOut, data);
    let outString = Functions.objectConvertToScss(data);
    if (outString.trim().length > 0) {
        utility.saveString(outPath, outString);
    }


}

let runConfig: IRunConfig | null = null;
let runConfigFilePath: string = 'scss_modder.json';
if (!utility.doesFileExist(runConfigFilePath)) {
    console.log("Brak pliku scss_modder.json");
    process.exit();
}


runConfig = JSON.parse(utility.loadFileText(runConfigFilePath));
if (Object.keys(runConfig as any).includes('startDir')) {
    let runConfigMultiple = runConfig as IRunConfigMultipleFiles;

    if (utility.doesFileExist(runConfigMultiple.outputDir)) {
        utility.deleteDirectorySync(runConfigMultiple.outputDir);
    }
    if (runConfigMultiple.startDir.endsWith('/')) {
        runConfigMultiple.startDir = runConfigMultiple.startDir.substring(0, runConfigMultiple.startDir.length - 1);
    }
    let dirToCheck: Array<string> = ['.'];

    console.log(runConfig);
    while (dirToCheck.length > 0) {

        let dir: string = dirToCheck.pop() as string;
        let findPath = join(process.cwd(), runConfigMultiple.startDir, dir);
        // console.log(`Processing path: ${findPath}`);
        let filesInDir = utility.getFilesSync(findPath).filter(v => { return (v.endsWith('.css')) || (v.endsWith('.scss')) })
        for (let fileInDir of filesInDir) {
            let testPath = `${join(runConfigMultiple.startDir,dir,fileInDir)}`;
            if(testPath.startsWith(runConfigMultiple.outputDir)) {
                continue;
            }
            if(runConfigMultiple.excludePathFilesRegex != null && runConfigMultiple.excludePathFilesRegex != undefined) {
                if(testPath.match(new RegExp(runConfigMultiple.excludePathFilesRegex)) != null) {
                    continue;
                }
            }
            // console.log(`File: ${testPath}`);
            processForFile(join(runConfigMultiple.startDir, dir, fileInDir), join(runConfigMultiple.outputDir, dir, fileInDir), runConfigMultiple.commands);
        }
        let directoriesInDir = utility.getDirectoriesSync(findPath);
        for (let dirInDir of directoriesInDir) {
            // console.log(`Dir: ${join(dir,dirInDir)}`);
            dirToCheck.push(join(dir, dirInDir));
        }
    }
}
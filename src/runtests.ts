import { IScssCode } from "./lib/model/IScss";
import { debug } from "./lib/services/Debug";
import { Functions } from "./lib/services/Functions";
import { logger } from "./lib/services/Logger";
import { utility } from "./lib/utility";

let startDir = "./tests"
let directories = utility.getDirectoriesSync(startDir);

directories.map( v => `${startDir}/${v}`).forEach( (dirPath, dirIndex) =>{
    debug.DebugOutputDir = dirPath;
    debug.DebugEnable();
    logger.log("Run tests for dir: "+dirPath);
    if(utility.doesFileExist(`${dirPath}/disabled.txt`)) {
        logger.log("Skip test because is disabled");
        // logger.printLogsAndFlush();
        return;
    }
    let inFilePath = `${dirPath}/in.scss`;
    if(!utility.doesFileExist(inFilePath)) {
        logger.log(`File ${inFilePath} not exist check another`);
        inFilePath = `${dirPath}/in.css`;
    }
    
    if(!utility.doesFileExist(inFilePath)) {
        logger.log(`File ${inFilePath} not exist`);
        logger.log(`Skip: ${dirPath}`);
        return;
    }
    logger.log(`Process file: ${inFilePath}`);

    let inFile = utility.loadFileText(inFilePath);

    let data = Functions.scssConvertToObject(inFile);
    
    let outFilePathJson = `${dirPath}/out.json`;

    utility.saveObjectAsJson(outFilePathJson,data);

    
    let outFilePathScss = `${dirPath}/out.scss`;
    let outScss: string = Functions.objectConvertToScss(data);

    utility.saveString(outFilePathScss,outScss);
    let outIsSameAsIn = Functions.compareScssFiles(inFilePath, outFilePathScss)
    logger.log("out and in is same: "+(outIsSameAsIn ? "true": 'false'));
    let probablySameScssStrings = Functions.probablySameScssStrings(inFilePath, outFilePathScss)
    logger.log("probably out and in is same: "+(probablySameScssStrings ? "true": 'false'));
    if(outIsSameAsIn || probablySameScssStrings) {
        logger.flush()
    } else {
        logger.printLogsAndFlush();
    }
});
import { join } from 'path';
import { utility } from '../utility';

export class Debug {
    protected _debugOutputDir: string = process.cwd();
    protected _debugEnabled: boolean = false;
    public set DebugOutputDir(value: string) { 
        this._debugOutputDir = value;
        this.CleanDebugDir();
    }
    public get DebugOutputDir(): string { 
        return this._debugOutputDir;
    }
    public DebugEnable() { 
        this._debugEnabled = true;
    }
    public CleanDebugDir() {
        utility.getFilesSync(this.DebugOutputDir).forEach( (file) => {
            if(file.endsWith(".debug.json")) {
                utility.deleteFileSync(join(this.DebugOutputDir, file),true);
            }
        });
    }

    public GetDebugOutPath(filepath: string): string {
        return join(this.DebugOutputDir, filepath);
    }

    public SaveObjectAsJsonFile(name: string, data: any) {
        if(this._debugEnabled) {
            utility.saveObjectAsJson(this.GetDebugOutPath(name+".debug.json"),data);
        }
    }
}

export const debug: Debug = new Debug();
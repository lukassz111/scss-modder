import { existsSync, readdirSync, readFileSync, statSync, writeFileSync, mkdirSync, rmSync } from 'fs';
import path, { join, resolve } from 'path';

export const utility = {
    getFilesSync: function(path: string): string[] {
        try {
            const entries = readdirSync(path);
            return entries.filter((entry) => {
                const fullPath = join(path, entry);
                return statSync(fullPath).isFile();
            });
        } catch (error) {
            console.error('Error reading files:', error);
            return [];
        }
    },
    getDirectoriesSync: function(path: string): string[] {
        try {
            const entries = readdirSync(path);
            return entries.filter((entry) => {
            const fullPath = join(path, entry);
                return statSync(fullPath).isDirectory();
            });
        } catch (error) {
            console.error('Error reading directories:', error);
            return [];
        }
    },
    loadFileText: function(filePath: string): string {
        try {
            const absolutePath = join(process.cwd(), filePath);
            const fileContent = readFileSync(absolutePath, 'utf-8');
            return fileContent;
        } catch (error) {
            console.error('Error loading file:', error);
            return '';
        }
    },
    doesFileExist: function (filePath: string): boolean {
        const absolutePath = join(process.cwd(), filePath);
        return existsSync(absolutePath);
    },
    saveObjectAsJson: function(filePath: string, data: object): void {
        try {
          const absolutePath = join(process.cwd(), filePath);
          const jsonData = JSON.stringify(data, null, 2); // Konwersja do JSON z wcięciami
          writeFileSync(absolutePath, jsonData, 'utf-8');
        //   console.log(`Plik zapisany: ${absolutePath}`);
        } catch (error) {
          console.error('Błąd podczas zapisywania pliku JSON:', error);
        }
    },
    saveString: function(filePath: string, data: string): void {
        try {
          const absolutePath = join(process.cwd(), filePath);
          writeFileSync(absolutePath, data, 'utf-8');
        } catch (error) {
          console.error('Błąd podczas zapisywania pliku:', error);
        }
    },
    isWhitespace: function(char: string): boolean {
        return /^\s$/.test(char);
    },
    createDirectoriesSync: function(targetPath: string) {
        // Podziel ścieżkę na segmenty i iteruj po nich, tworząc katalogi
        let parts = targetPath.split('/');
        let prefix: string = "";
        parts.forEach(part=>{
            prefix=join(prefix,part);
            if(!existsSync(prefix)) {
                mkdirSync(prefix);
            }
        })
    },
    getDirectoryPath: function(filePath: string): string {
        const pathParts = filePath.split(/[/\\]/); // Obsługa zarówno "/" jak i "\"
        pathParts.pop(); // Usunięcie ostatniego elementu (nazwa pliku)
        return pathParts.join('/'); // Zwrócenie ścieżki katalogu
    },
    changeExtension: function(filePath: string, newExtension: string): string {
        let parts = filePath.split('.');
        if(parts.length > 1) {
            parts[parts.length - 1] = newExtension;
        }
        return parts.join('.');
    },
    getExtension: function(filePath: string): string {
        let parts = filePath.split('.');
        if(parts.length > 1) {
            return parts.pop() as string;
        }
        return ""
    },
    deleteDirectorySync: function(directoryPath: string): void {
        try {
            rmSync(directoryPath, { recursive: true, force: true });
            console.log(`Katalog '${directoryPath}' został usunięty.`);
        } catch (error) {
            console.error(`Nie udało się usunąć katalogu: ${error}`);
        }
    },
    deleteFileSync: function(filePath: string, silent: boolean = false): void {
        try {
            rmSync(filePath, { force: true });
            if(!silent)
                console.log(`Plik '${filePath}' został usunięty.`);
        } catch (error) {
            console.error(`Nie udało się usunąć pliku: ${error}`);
        }
    }
}
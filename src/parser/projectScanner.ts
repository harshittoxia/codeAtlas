import { Project } from "ts-morph";
import * as vscode from "vscode";
import * as path from "path";

export function loadProject(): Project | null {

    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders) {
        vscode.window.showErrorMessage("Open a workspace first.");
        return null;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;

    const tsconfigPath = path.join(rootPath, 'tsconfig.json');

    const project = new Project({
        tsConfigFilePath: tsconfigPath,
        skipAddingFilesFromTsConfig: false
    });

    return project;
}

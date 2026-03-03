import * as vscode from 'vscode';
import { generateCallGraph } from './commands/generateMap';

export function activate(context: vscode.ExtensionContext) {

    console.log("CodeAtlas AI Activated 🚀");

    const disposable = vscode.commands.registerCommand(
        'codeatlas.generateMap',
        async () => {
            await generateCallGraph(context);
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}

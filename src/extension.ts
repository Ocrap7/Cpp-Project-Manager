'use strict';

import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import fetch from 'node-fetch';
import { spawn } from 'child_process';

const baseUrl =
    'https://raw.githubusercontent.com/Ocrap7/Cpp-Project-Manager/master';

const customTemplatesFolder = (() => {
    let e = vscode.extensions.getExtension('Ocrap7.cpp-project-manager');
    if (!e) {
        return '';
    }

    let dir = `${e.extensionPath}\\..\\cppmanager_custom_templates`;
    if (os.type() !== 'Windows_NT') {
        dir = `${e.extensionPath}/../cppmanager_custom_templates`;
    }

    if (!existsSync(dir)) {
        try {
            mkdirSync(dir);
            writeFileSync(
                `${dir}/files.json`,
                `{
    "templates": {
        "Example Custom Template": {
            "directories": [
                "ExampleDirectory"
            ],
            "blankFiles": [
                "HelloWorld.txt"
            ],
            "openFiles": [
                "HelloWorld.txt"
            ]
        }
    }
}`
            );
        } catch (err) {
            console.error(err);
        }
    }

    return dir;
})();

interface CppProjectsJSON {
    version: string;
    directories?: string[];
    templates: {
        [templateName: string]: {
            directories?: [string];
            blankFiles?: [string];
            files?: { [from: string]: string };
            openFiles?: [string];
        };
    };
}

interface CppClassesJSON {
    [className: string]: {
        [fileName: string]: {
            folder: string;
            extension: string;
        };
    };
}

export function activate(context: vscode.ExtensionContext) {
    let createProjectCommand = vscode.commands.registerCommand(
        'cppmanager.createProject',
        createProject
    );
    let createClassCommand = vscode.commands.registerCommand(
        'cppmanager.createClass',
        createClass
    );
    let createGetterSetterCommand = vscode.commands.registerCommand(
        'cppmanager.createGetterSetter',
        createGetterSetter
    );
    let createGetterCommand = vscode.commands.registerCommand(
        'cppmanager.createGetter',
        createGetter
    );
    let createSetterCommand = vscode.commands.registerCommand(
        'cppmanager.createSetter',
        createSetter
    );
    let openCustomTemplateCommand = vscode.commands.registerCommand(
        'cppmanager.openCustomDir',
        openCustomDir
    );

    let buildButton = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        0
    );
    buildButton.command = 'workbench.action.tasks.build';
    buildButton.text = '⚙ Build';
    buildButton.tooltip = 'Build C++ Project (make) [Ctrl+F7]';
    buildButton.show();

    let buildAndRunButton = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        0
    );
    buildAndRunButton.command = 'workbench.action.tasks.test';
    buildAndRunButton.text = '▶ Build & Run';
    buildAndRunButton.tooltip = 'Build & Run C++ Project (make run) [F7]';
    buildAndRunButton.show();

    context.subscriptions.push(buildButton);
    context.subscriptions.push(buildAndRunButton);
    context.subscriptions.push(createProjectCommand);
    context.subscriptions.push(createClassCommand);
    context.subscriptions.push(createGetterSetterCommand);
    context.subscriptions.push(createGetterCommand);
    context.subscriptions.push(createSetterCommand);
    context.subscriptions.push(openCustomTemplateCommand);
}

export function deactivate() {}

const openCustomDir = () => {
    let dir = customTemplatesFolder;

    const currentOs = os.type();
    if (currentOs === 'Linux') {
        spawn('xdg-open', [`${dir}`]); // /out/templates/custom
    } else if (currentOs === 'Darwin') {
        spawn('open', [`${dir}`]); // /out/templates/custom
    } else if (currentOs === 'Windows_NT') {
        spawn('explorer', [`${dir}`]); // \\out\\templates\\custom
    }
};

const createClass = async () => {
    try {
        const data = await fetch(`${baseUrl}/templates/classes/files.json`);
        const templates: CppClassesJSON = await data.json();
        const template_files = [];
        for (let tname in templates) {
            template_files.push(tname);
        }

        const selected = await vscode.window.showQuickPick(template_files);
        if (!selected) {
            return;
        }

        const val = await vscode.window.showInputBox({
            prompt: `Enter class name`,
        });
        if (!val || !vscode.window.activeTextEditor) {
            return;
        }

        const currentFolderWorkspace = vscode.workspace.getWorkspaceFolder(
            vscode.window.activeTextEditor.document.uri
        );
        if (!currentFolderWorkspace) {
            return;
        }

        const currentFolder = currentFolderWorkspace.uri.fsPath;
        for (let file in templates[selected]) {
            const value = await fetch(
                `${baseUrl}/templates/classes/${selected}/${file}`
            );
            let data = await value.text();
            data = data.replace(new RegExp('easyclass', 'g'), val);
            writeFileSync(
                `${currentFolder}/${templates[selected][file].folder}/${val}.${templates[selected][file].extension}`,
                data
            );

            vscode.workspace
                .openTextDocument(
                    `${currentFolder}/${templates[selected][file].folder}/${val}.${templates[selected][file].extension}`
                )
                .then(doc =>
                    vscode.window.showTextDocument(doc, { preview: false })
                );
        }
    } catch (err) {
        vscode.window.showErrorMessage(`C++ Project Manager error: ${err}`);
    }
};

const createProject = async (local?: boolean) => {
    let templates = [];

    try {
        let data;
        if (local) {
            const res = readFileSync(
                `${__dirname}/templates/project/files.json`
            );
            data = JSON.parse(res.toString());
        } else {
            const res = await fetch(`${baseUrl}/templates/project/files.json`);
            data = await res.json();
        }

        for (let tname in data.templates) {
            templates.push(tname);
        }
        templates.push('Custom templates');

        const filePath = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
        });
        if (!filePath) return;
        const projectName = await vscode.window.showInputBox({
            validateInput: value => {
                if (value === '') return null;
                const projectPath = path.join(filePath[0].fsPath, value);
                if (fs.existsSync(projectPath)) {
                    return 'A project with this name already exists!';
                }
                return null;
            },
            prompt: 'Project name',
        });
        if (!projectName) return;

        const projectPath = path.normalize(
            path.join(filePath[0].fsPath, projectName)
        );

        const selected = await vscode.window.showQuickPick(templates);
        fs.mkdirSync(projectPath, { recursive: true });

        if (selected === 'Custom templates') {
            const res = readFileSync(`${customTemplatesFolder}/files.json`);
            const data = JSON.parse(res.toString());
            templates = [];
            for (let tname in data.templates) {
                templates.push(tname);
            }

            const selected = await vscode.window.showQuickPick(templates);

            await selectFolderAndDownload(
                data,
                selected,
                { path: projectPath, projectName },
                true,
                true
            );
            vscode.workspace
                .getConfiguration('files')
                .update(
                    'associations',
                    { '*.tpp': 'cpp' },
                    vscode.ConfigurationTarget.Workspace
                );
            vscode.workspace
                .getConfiguration('terminal.integrated.shell')
                .update(
                    'windows',
                    'cmd.exe',
                    vscode.ConfigurationTarget.Workspace
                );
        } else {
            await selectFolderAndDownload(
                data,
                selected,
                { path: projectPath, projectName },
                local,
                false
            );
            vscode.workspace
                .getConfiguration('files')
                .update(
                    'associations',
                    { '*.tpp': 'cpp' },
                    vscode.ConfigurationTarget.Workspace
                );
            vscode.workspace
                .getConfiguration('terminal.integrated.shell')
                .update(
                    'windows',
                    'cmd.exe',
                    vscode.ConfigurationTarget.Workspace
                );
        }
        // await vscode.commands.executeCommand(
        //     'vscode.openFolder',
        //     vscode.Uri.parse(fileUrl(projectPath))
        // );
    } catch (error) {
        console.log(error);
        if (local) {
            vscode.window.showErrorMessage(
                `C++ Project Manager error: Could not load 'files.json' locally.\nError: ${error}`
            );
        } else {
            vscode.window.showWarningMessage(
                `C++ Project Manager error: Could not fetch 'files.json' from GitHub, using local files.\nError: ${error}`
            );
            createProject(true);
        }
    }
};

const selectFolderAndDownload = async (
    files: CppProjectsJSON,
    templateName: string | undefined,
    data: { path?: string; projectName?: string },
    local?: boolean,
    custom?: boolean
) => {
    if (!templateName) {
        return;
    }

    if (
        vscode.workspace.workspaceFolders &&
        vscode.workspace.workspaceFolders.length > 1
    ) {
        try {
            const chosen = await vscode.window.showWorkspaceFolderPick();
            if (!chosen) {
                return;
            }
            let folder = chosen.uri;
            await downloadTemplate(
                files,
                templateName,
                folder.fsPath,
                data,
                local
            );
        } catch (err) {
            vscode.window.showErrorMessage(`C++ Project Manager error: ${err}`);
        }
    } else {
        console.log(
            'path',
            data.path ?? vscode.workspace.workspaceFolders?.[0].uri.fsPath
        );
        if (vscode.workspace.workspaceFolders) {
            await downloadTemplate(
                files,
                templateName,
                data.path ?? vscode.workspace.workspaceFolders?.[0].uri.fsPath,
                data,
                local,
                custom
            );
        } else if (data.path) {
            await downloadTemplate(
                files,
                templateName,
                data.path,
                data,
                local,
                custom
            );
        }
    }
};

const downloadTemplate = async (
    files: CppProjectsJSON,
    templateName: string,
    folder: string,
    projectData: { path?: string; projectName?: string },
    local?: boolean,
    custom?: boolean
) => {
    if (files.directories) {
        files.directories.forEach((dir: string) => {
            if (!existsSync(`${folder}/${dir}`)) {
                mkdirSync(`${folder}/${dir}`);
            }
        });
    }

    let directories = files.templates[templateName].directories;
    if (directories) {
        directories.forEach((dir: string) => {
            if (!existsSync(`${folder}/${dir}`)) {
                mkdirSync(`${folder}/${dir}`);
            }
        });
    }

    let blankFiles = files.templates[templateName].blankFiles;
    if (blankFiles) {
        blankFiles.forEach((file: string) => {
            if (!existsSync(`${folder}/${file}`)) {
                writeFileSync(`${folder}/${file}`, '');
            }
        });
    }

    let f = files.templates[templateName].files;
    if (f) {
        for (let file in f) {
            try {
                let data;
                if (local) {
                    if (custom) {
                        data = readFileSync(
                            `${customTemplatesFolder}/${file}`
                        ).toString();
                    } else {
                        data = readFileSync(
                            `${__dirname}/templates/project/${file}`
                        ).toString();
                    }
                } else {
                    const res = await fetch(
                        `${baseUrl}/templates/project/${file}`
                    );
                    data = await res.text();
                }

                // if (projectData.projectName)
                //     data.replace(/@\{ProjectName\}/, projectData.projectName);

                writeFileSync(`${folder}/${f[file]}`, data);
            } catch (error) {
                if (local) {
                    vscode.window.showErrorMessage(
                        `C++ Project Manager error: Could not load '${file}' locally.\nError: ${error}`
                    );
                } else {
                    vscode.window.showWarningMessage(
                        `C++ Project Manager error: Could not download '${file}' from GitHub, using local files.\nError: ${error}`
                    );
                }
            }
        }
    }

    let openFiles = files.templates[templateName].openFiles;
    if (openFiles) {
        for (let file of openFiles) {
            if (existsSync(`${folder}/${file}`)) {
                vscode.workspace
                    .openTextDocument(`${folder}/${file}`)
                    .then(doc =>
                        vscode.window.showTextDocument(doc, { preview: false })
                    );
            }
        }
    }

    if (!existsSync(`${folder}/.vscode`)) {
        mkdirSync(`${folder}/.vscode`);
    }
};

const createGetterSetter = (getter?: boolean, setter?: boolean) => {
    if (!getter && !setter) {
        getter = setter = true;
    }
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }

    const getterSnippet = (variableName: string, variableType: string) => {
        return new vscode.SnippetString(`
    ${variableType} get${
            variableName.charAt(0).toUpperCase() + variableName.substring(1)
        }() {
        return ${variableName};
    }
    `);
    };
    const setterSnippet = (variableName: string, variableType: string) => {
        return new vscode.SnippetString(`
    void set${
        variableName.charAt(0).toUpperCase() + variableName.substring(1)
    }(${variableType} ${variableName}) {
        this->${variableName} = ${variableName};
    }
    `);
    };

    let selection = editor.selection;
    let selectedText = editor.document
        .getText(new vscode.Range(selection.start, selection.end))
        .trim();

    let lines = selectedText.split('\n');

    let createData: { type: string; name: string }[] = [];

    for (let line of lines) {
        if (!/\s*\w+\s+[*]*\w+\s*(,\s*\w+\s*)*;+/.test(line)) {
            vscode.window.showErrorMessage(
                `Syntax error, cannot create getter or setter: ${line}`
            );
            return;
        }

        let type = line.search(/\w+\s+/);
        let firstSpace = line.indexOf(' ', type);

        let vType = line.substring(type, firstSpace).trim();
        line = line.substring(firstSpace).trim();
        let vNames = line.replace(' ', '').replace(';', '').split(',');

        vNames.forEach(e => {
            while (e.includes('*')) {
                e = e.replace('*', '');
                vType += '*';
            }
            createData.push({ type: vType, name: e });
        });
    }

    for (let e of createData) {
        if (getter) {
            editor.insertSnippet(
                getterSnippet(e.name, e.type),
                new vscode.Position(selection.end.line + 1, 0)
            );
        }
        if (setter) {
            editor.insertSnippet(
                setterSnippet(e.name, e.type),
                new vscode.Position(selection.end.line + 1, 0)
            );
        }
    }
};

const createGetter = () => createGetterSetter(true, false);
const createSetter = () => createGetterSetter(false, true);

const fileUrl = (str: string) => {
    if (typeof str !== 'string') {
        throw new Error('Expected a string');
    }

    var pathName = path.resolve(str).replace(/\\/g, '/');

    // Windows drive letter must be prefixed with a slash
    if (pathName[0] !== '/') {
        pathName = '/' + pathName;
    }

    return encodeURI('file://' + pathName);
};

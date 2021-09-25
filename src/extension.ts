import {
  ExtensionContext,
  window,
  workspace
} from 'vscode';

function generateColors(number: number) {
  return Array(number).fill(0).map(() => {
    return `#${(Math.random().toString(16) + '00000').slice(2,8)}`;
  });
}

export function activate(context: ExtensionContext) {
  console.log('Workspace Color: started');
  
  let activeColor: string;
  const workbench = workspace.getConfiguration('workbench');
  const workspaceFolders = workspace.workspaceFolders;
  
  if (!workspaceFolders || !workspaceFolders.length) {
    console.error('Workspace Color: no folders in workspace');
    return;
  };

  const colors = generateColors(workspaceFolders.length);
  const folders = workspaceFolders
    .map(({ name, uri, index }) => ({ name, uri, index, color: colors[index] }))
    .sort((a, b) => b.uri.path.length - a.uri.path.length);

  window.onDidChangeActiveTextEditor((evt) => {
    if (!evt) return;

    for (let i = 0; i < folders.length; ++i) {
      const folder = folders[i];

      if (evt.document.uri.path.includes(folder.uri.path)) {
        if (activeColor === folder.color) return;

        workbench.update('colorCustomizations', { 
          'titleBar.activeBackground': folder.color 
        }, false);
  
        activeColor = folder.color;
        break;
      }
    }
  });
}

export function deactivate() {
  console.log('Workspace Color: ended');
}
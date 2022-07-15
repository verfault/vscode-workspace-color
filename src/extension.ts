import {
  ExtensionContext,
  window,
  workspace,
  commands,
  WorkspaceFolder
} from 'vscode';

const log = (...args: any) => {
  console.log(`${new Date().toLocaleTimeString()} | Workspace Color: ${args}`);
}

function prepareColors(folders: readonly WorkspaceFolder[], colors = ''): any {
  let initialColors = {} as Record<string, string>;
  
  if (colors) {
    initialColors =  JSON.parse(colors)
  }

  log(initialColors);

  return folders.reduce((prev, curr) => ({
    ...prev,
    [curr.name]: initialColors[curr.name] || `#${(Math.random().toString(16) + '00000').slice(2,8)}`
  }), {});
}

export function activate(context: ExtensionContext) {
  log('Started');
  
  let activeColor: string;
  const workbench = workspace.getConfiguration('workbench');
  const workspaceFolders = workspace.workspaceFolders;
  
  if (!workspaceFolders || !workspaceFolders.length) {
    console.error('Workspace Color: no folders in workspace');
    return;
  };

  const colors = prepareColors(
    workspaceFolders,
    context.workspaceState.get('workspaceColors')
  );

  const folders = workspaceFolders
    .map(({ name, uri, index }) => ({ name, uri, index, color: colors[name] }))
    .sort((a, b) => b.uri.path.length - a.uri.path.length);

  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((evt) => {
      if (!evt) return;
      
      for (let i = 0; i < folders.length; ++i) {
        const folder = folders[i];
        const documentPath = evt.document.uri.path.toLowerCase();
        const folderPath = folder.uri.path.toLowerCase();
        
        
        if (documentPath.includes(folderPath)) {
          if (activeColor === folder.color) return;
          activeColor = folder.color;
          
          workbench.update('colorCustomizations', { 
            'titleBar.activeBackground': activeColor 
          }, false);
          break;
        }
      }

      context.workspaceState.update(
        'workspaceColors', 
        JSON.stringify(folders.reduce((prev, curr) => ({
          ...prev,
          [curr.name]: curr.color
        }), {}))
      );
    }),
    commands.registerCommand('workspaceColor.changeColor', () => {
      window.showWorkspaceFolderPick().then((folder) => {
        if (!folder) return
        
        window.showInputBox({
          title: 'HEX Color',
          validateInput: (hex: string) => {
            if (/^#([0-9a-f]{3}){1,2}$/i.test(hex)) return null;
            return 'Wrong HEX Color!';
          },
          placeHolder: '#fff000'
        }).then((value) => {
          if (!value) {
            window.showErrorMessage(`No color provided for ${folder.name}!`);
            return;
          }
          
          const fol = folders.find(fol => fol.name === folder.name);
          if (!fol) return;
          fol.color = value;
          const documentPath = window.activeTextEditor?.document.uri.path.toLocaleLowerCase()
          
          if (documentPath?.includes(fol.uri.path.toLowerCase())) {
            if (activeColor === fol.color) return;
            activeColor = fol.color;
            
            workbench.update('colorCustomizations', { 
              'titleBar.activeBackground': activeColor 
            }, false);
          }
        })
      })
    })
  );
}

export function deactivate(context: ExtensionContext) {
  if (!context) {
    window.showErrorMessage('No context provided for deactivation!');
  }
  context.subscriptions.forEach(sub => sub.dispose())
  log('Finished');
}
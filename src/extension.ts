import {
  ExtensionContext,
  window,
  workspace,
  commands,
  Uri,
} from 'vscode';

type TColors = Record<string, string>;

interface IFolder {
  name: string;
  uri: Uri;
  index: number;
  color: string;
}

const log = (...args: any) => {
  console.log(`${new Date().toLocaleTimeString()} | Workspace Color: ${args}`);
};

const workbench = workspace.getConfiguration('workbench');

function transformWorkspaceFolders(context: ExtensionContext): IFolder[] {
  const colors = getWorkspaceData(context.workspaceState);
  const workspaceFolders = workspace.workspaceFolders;

  return (workspaceFolders || [])
    .map(({ name, uri, index }) => ({ name, uri, index, color: colors[name] }))
    .sort((a, b) => b.uri.path.length - a.uri.path.length);
}

function getWorkspaceData(workspaceState: ExtensionContext['workspaceState']): TColors {
  return workspaceState.get('workspaceColors') || {};
}

export function activate(context: ExtensionContext) {
  log('Started');
  
  if (!workspace.workspaceFolders?.length) {
    console.error('Workspace Color: no folders in workspace');
    return;
  };

  context.subscriptions.push(
    window.onDidChangeActiveTextEditor((evt) => {
      if (!evt) return;

      const folders = transformWorkspaceFolders(context);
      const state = getWorkspaceData(context.workspaceState);

      for (let i = 0; i < folders.length; ++i) {
        const documentPath = evt.document.uri.path.toLowerCase();
        const folderPath = folders[i].uri.path.toLowerCase();
        
        if (documentPath.includes(folderPath)) {
          workbench.update('colorCustomizations', {
            'titleBar.activeBackground': folders[i].color
          }, false);
          break;
        }
      }
    }),

    commands.registerCommand(
      'workspaceColor.setColor',
      () => {
        window.showWorkspaceFolderPick().then((folder) => {
          if (!folder) return;
          
          window.showInputBox({
            title: 'HEX Color',
            validateInput: (hex: string) => {
              if (/^#([0-9a-f]{3}){1,2}$/i.test(hex)) return null;
              return 'Wrong HEX Color!';
            },
            placeHolder: '#fff000'
          }).then((color) => {
            context.workspaceState.update(
              'workspaceColors',
              {
                ...getWorkspaceData(context.workspaceState),
                [folder.name]: color
              }
            );
            
            const documentPath = window.activeTextEditor?.document.uri.path.toLocaleLowerCase();
            if (documentPath?.includes(folder.uri.path.toLowerCase())) {
              workbench.update('colorCustomizations', { 
                'titleBar.activeBackground': color 
              }, false);
            }
          });
        });
      }
    ),

    commands.registerCommand(
      'workspaceColor.clearColor', 
      () => {
        window.showWorkspaceFolderPick().then((folder) => {
          if (!folder) return;
      
          workbench.update('colorCustomizations', { 
            'titleBar.activeBackground': undefined 
          }, false);
      
          const state = getWorkspaceData(context.workspaceState);
          delete state[folder.name];
          context.workspaceState.update('workspaceColors', state);
        });
      }
    )
  );
}

export function deactivate(context: ExtensionContext) {
  context.subscriptions.forEach(sub => sub.dispose());

  log('Finished');
}
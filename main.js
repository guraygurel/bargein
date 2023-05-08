// Modules to control application life and create native browser window
const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const Store = require('electron-store');
const { Console } = require('console');

const NICKNAME = "BargeIn";
const URI_PARM_NAME = NICKNAME + "INDEX";
const store = new Store();
const isMac = process.platform === 'darwin'

// Standard menu template
// We only need to customize the File menu to add Home Page and Help menu to add bargein github page.
const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{ role: 'appMenu'}] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        { label: 'Home Page',
        click: async () => {
            const mainWindow = BrowserWindow.getFocusedWindow();
            await mainWindow.loadFile('index.html');
          }          
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
    {
      role: 'help',
      submenu: [
        {
          label: 'About electronJS',
          click: async () => {
            const { shell } = require('electron')
            await shell.openExternal('https://electronjs.org')
          }          
        }
      ]
    }
  ]
  
const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)
  
// Bypass security warnings about self signed certificates
app.commandLine.appendSwitch('ignore-certificate-errors');
app.commandLine.appendSwitch('allow-insecure-localhost', 'true');

function showError(desc) {
  const mainWindow = BrowserWindow.getFocusedWindow();
  mainWindow.errorcode = desc;
  mainWindow.loadFile('error.html');
}

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function errorUnlessDefined(element, desc, showConfigFile = false) {
  if (typeof element === 'undefined') {
    if (showConfigFile) {
      showError('<pre>' + desc + " in config file:\n" + getConfigPath() + '</pre>');
    } else {
      showError('<pre>' + desc + '</pre>');
    }
    return true;
  }
  return false;
}


const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  //mainWindow.loadURL(mainWindow.homepage);
  // and load the index.html of the app.
  mainWindow.loadFile('index.html');

  mainWindow.webContents.on("did-fail-load", (event, code, desc, url, isMainFrame) => {
    showError(desc);
  });

  mainWindow.webContents.on('did-finish-load', ()=>{
    var myURL = mainWindow.webContents.getURL();
    console.log("My url = " + myURL);
    var myIndex = -1;
    var myIndexStr = myURL.indexOf(URI_PARM_NAME + '=');
    if (myIndexStr > 0) {
        myIndex = myURL.substring(myIndexStr + URI_PARM_NAME.length + 1);
        console.log("My index is " + myIndex);
        mainWindow.myIndex = myIndex;
        var target = mainWindow.targets[myIndex];
        if (errorUnlessDefined(target, 'Index '+ myIndex + ': Cannot find target definition', true)) return; 
        if (errorUnlessDefined(target.type, 'Index '+ myIndex + ': type not defined for target', true)) return; 
        if (errorUnlessDefined(mainWindow.targettypes[target.type], 'targettype ' + target.type + 'not defined', true)) return;

        console.log("type:"+(typeof mainWindow.targettypes[target.type]));
        var targettype = mainWindow.targettypes[target.type];
        mainWindow.nickname = target.nickname;
        mainWindow.ip = target.ip;
        mainWindow.targettype = targettype;
        if (typeof target.user === 'undefined') {
          target.user=targettype.user;
        }
        if (typeof target.pass === 'undefined') {
          target.pass=targettype.pass;
        }
        mainWindow.target = target;
    }
    else if (myURL.indexOf("error.html") > 0) {
      mainWindow.nickname = NICKNAME;
      console.log("Sending errorcode:"+mainWindow.errorcode);
      mainWindow.webContents.send('error-code', mainWindow.errorcode);
    }
    else if (myURL.indexOf("index.html") > 0) {
      mainWindow.nickname = NICKNAME;
      mainWindow.webContents.send('error-code', getConfigPath());
    }
    else if (myURL.indexOf("homepage.html") > 0) {
      mainWindow.nickname = NICKNAME;
      if (typeof mainWindow.homepage === 'undefined') {
        console.log("Creating homepage for the first time");
        if (store.has('version')) {
          var html = '';
          if (store.has('msg')) {
            html = store.get('msg');
          }
          html += '<ul>';
          var targets = [];
          if (store.has('targets')) {
            targets = store.get('targets');
          }
          mainWindow.targets = targets;
          var targettypes = {};
          if (store.has('targettypes')) {
            targettypes = store.get('targettypes');
          }
          mainWindow.targettypes = targettypes;
          for (var i = 0; i < targets.length; i++) {
            if (errorUnlessDefined(targets[i].nickname, 'nickname not defined for target at index ' + i, true)) return;
            if (errorUnlessDefined(targets[i].ip,       'ip not defined for target at index ' + i, true)) return;
            if (errorUnlessDefined(targets[i].type,     'type not defined for target at index ' + i, true)) return;
            html += '<li><a href="https://' + targets[i].ip + '/?' + URI_PARM_NAME + '='+i+'">' + targets[i].nickname + ' (' + targets[i].ip + ') </a></li>';
          }
          html += '</ul>';
          mainWindow.homepage=html;            
        } else {
          console.log("Invalid store");
          mainWindow.errorcode = "<pre>Not a valid configuration file:\n" + path.join(app.getPath('userData'), 'config.json') + '</pre>';
          mainWindow.loadFile('error.html');              
        }
      }
      mainWindow.webContents.send('error-code', mainWindow.homepage);
    }
  
    if (typeof mainWindow.targettype != 'undefined') {
      let target = mainWindow.target;
      for (const action of mainWindow.targettype["uriactions"]) {
        if (myURL.indexOf(action.uri) > 0) {          
          let code = eval('`' + action.actioncode + '`');
          mainWindow.webContents.executeJavaScript(code).catch(function () {
            console.log("Promise Rejected");
          });
        }
      }
    }
    mainWindow.setTitle(mainWindow.nickname);
});

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
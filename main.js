// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        icon: __dirname + '/favicon.png',
        webPreferences: {
            nodeIntegration: true, 
            preload: __dirname + '/preload.js'
        }
    })
    Menu.setApplicationMenu(null)
    // and load the index.html of the app.
    mainWindow.loadFile('cv-frontend/indexDev.html')
    ipcMain.on("overwrite", (e, { dir, data }) => {
        console.log(dir)
        fs.writeFile(dir, data, function (err) {
            console.log(data)
            if (err) { return console.log('error is writing new file') }
            mainWindow.webContents.send("message", `Start editing ${dir}`)
        });
    })

    ipcMain.on("save", (e, { name, data }) => {
        dialog.showSaveDialog(mainWindow, {
            defaultPath: `./file/${name}.json`
        }).then(result => {
            if (result.canceled) {
                mainWindow.webContents.send("message", `Did not save`)
            } else {
                mainWindow.webContents.send("setLogix", result.filePath)
                fs.writeFile(result.filePath, data, function (err) {
                    if (err) { return console.log('error is writing new file') }
                    mainWindow.webContents.send("message", `Start editing ${result.filePath}`)
                });
            }
        }).catch(err => {
            console.log(err)
        });
    })
    ipcMain.on("saveOnline", (e, { name, data,image }) => {
        console.log(name, data, image)
        let child = new BrowserWindow({ parent: mainWindow, show: false })
        child.webContents.openDevTools()
        child.loadURL("https://circuitverse.org/simulator")
        child.once('ready-to-show', () => {
            child.show()
        })
        child.webContents.executeJavaScript('localStorage.setItem("recover_login",' + JSON.stringify(data) + ');', true)
        child.webContents.executeJavaScript("window.location.href = 'https://circuitverse.org/users/sign_in'", true)
        child.webContents
        .executeJavaScript('localStorage.getItem("recover_login");', true)
        .then(result => {
            console.log(result);
        });
    })
    ipcMain.on("open", (e) => {
        dialog.showOpenDialog(mainWindow, {
            properties: ['openFile']
        }).then(result => {
            if (result.canceled) {
                mainWindow.webContents.send("message", `Did not Open`)
            } else {
                mainWindow.webContents.send("setLogix", result.filePaths[0])
                fs.readFile(result.filePaths[0], 'utf8', (err, data) => {
                    if (err) throw err;
                    console.log(data);
                    mainWindow.webContents.send("loadData",data)
                });
            }
        }).catch(err => {
            console.log(err)
        });
    });
    // Open the DevTools.
    mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    createWindow()

    app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
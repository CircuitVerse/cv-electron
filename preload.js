const { ipcRenderer } = window.require('electron');
window.ipcRenderer = ipcRenderer
console.log(ipcRenderer)
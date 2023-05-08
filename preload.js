// All the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
    const counter = document.getElementById('bargeinerrorcode')
    ipcRenderer.on('error-code', (_event, value) => {
        counter.innerHTML = value
    })
})
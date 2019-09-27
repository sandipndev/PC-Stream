const EventEmitter = require('events')
const menu_click_emitter = new EventEmitter()

module.exports.menu_template = [
    {label: 'Toggle Server',    click() { menu_click_emitter.emit("menu-click", "toggle-server") } },
    {label: 'User Account Controls',    click() { menu_click_emitter.emit("menu-click", "show-uac") } },
    {label: 'About'},
    {label: 'Exit'}
]
module.exports.menu_click_emitter = menu_click_emitter
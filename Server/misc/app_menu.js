const EventEmitter = require('events')
const menu_click_emitter = new EventEmitter()

module.exports.menu_template = [
    {label: 'Home',  click() { menu_click_emitter.emit("menu-click", "home-section") } },
    {label: 'Toggle Server',    click() { menu_click_emitter.emit("menu-click", "toggle-server") } },
    {label: 'User Account Controls',
     submenu: [
         {  label: 'Add User',  click() { menu_click_emitter.emit("menu-click", "add-user-section") } },
         {  label: 'User Permissions',  click() { menu_click_emitter.emit("menu-click", "user-perms-section") } },
         {  label: 'Change Password',  click() { menu_click_emitter.emit("menu-click", "edit-pw-section") } },
         {  label: 'Remove User',  click() { menu_click_emitter.emit("menu-click", "del-user-section") } },
     ] },
    {label: 'About'},
    {label: 'Exit', click() { menu_click_emitter.emit("quit-menu") }}
]
module.exports.menu_click_emitter = menu_click_emitter
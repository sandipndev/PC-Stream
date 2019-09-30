const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const glob = require('glob');

exports.isFile = source => fs.lstatSync(source).isFile()
exports.isDir = source => fs.lstatSync(source).isDirectory()
exports.getFileSize = source => fs.statSync(source).size

exports.streamableFileExts = []
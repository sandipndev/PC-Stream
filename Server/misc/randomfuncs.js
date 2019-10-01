const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const glob = require('glob');

exports.isFile = source => fs.lstatSync(source).isFile()
exports.isDir = source => fs.lstatSync(source).isDirectory()
exports.getFileSize = source => fs.statSync(source).size
exports.isPathAbs = source => path.isAbsolute(source)
exports.pathExists = source => fs.existsSync(source)

async function sh(cmd) {
	return new Promise(function (resolve, reject) {
		exec(cmd, (err, stdout, stderr) => {
			if (err) {
				reject(err);
			} else {
				resolve({ stdout, stderr });
			}
		});
	});
}

exports.driveDataWin = async function () {
	let { stdout } = await sh('wmic logicaldisk get name,size,description,freespace,volumename');
	var x = [];
	for (let line of stdout.split('\n').slice(1, -2)) {
		var r = line.split('  ').slice(0, -1).filter(v => v != '');
		var y = {};
		y['type'] = r[0]?r[0].trim():null;
		y['name'] = r[2]?r[2].trim():null;
		y['size'] = r[3]?r[3].trim():null;
		y['free'] = r[1]?r[1].trim():null;
		y['volumename'] = r[4]?r[4].trim():null;

		if (y['type'] == "CD-ROM Disc" && y['name']==null) {
			var temp;
			temp = y['name'];
			y['name'] = y['free'];
			y['free'] = temp;
			y['name'] = y['name'].trim();
		}

		y['size'] = Number(y['size']);
		y['free'] = Number(y['free']);

		x.push(y);
	}
	return x;
}

exports.streamableFileExts = []
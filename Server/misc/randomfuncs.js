const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const glob = require('glob');
const ffmpeg = require('fluent-ffmpeg');

exports.isFile = source => fs.lstatSync(source).isFile()
exports.isDir = source => fs.lstatSync(source).isDirectory()
exports.modifiedTime = source => fs.lstatSync(source).mtime
exports.getFileSize = source => fs.statSync(source).size
exports.isPathAbs = source => path.isAbsolute(source)
exports.pathExists = source => fs.existsSync(source)
exports.deleteFile = (source, cb) => fs.unlink(source, cb)
exports.renameFile = (source, newSource, cb) => fs.rename(source, newSource, cb)

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

/* https://stackoverflow.com/a/24526156 */
// function to encode file data to base64 encoded string
function base64_encode(file) {
    var bitmap = fs.readFileSync(file);
    return new Buffer.from(bitmap).toString('base64');
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

exports.video_extentions_streamable = ['.avi', '.mkv', '.mp4', '.wmv']
exports.audio_extentions_streamable = ['.mp3']
exports.streamable = exports.video_extentions_streamable.concat(exports.audio_extentions_streamable)

exports.getDirectories = function (src, callback) {
	glob(src + '/**/*', callback);
};

exports.isChild = (parent, dir) => {
	const relative = path.relative(parent, dir);
	return (relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

exports.req_data_check = (data) => {
	return data !== null && ((typeof data === "string" && data !== "" ) || typeof data === "number")
}

exports.resDataCheck = (data) => {
	return data !== null && ((typeof data === "string" && data !== "" ) || typeof data === "number")
}

exports.get_thumbnail = function (file, reqTime) {
	console.log(reqTime)
    return new Promise((resolve, reject) => {
        new ffmpeg(file)
        .takeScreenshots({
            filename: "%b.png",
            count: 1,
            timestamps: [ reqTime ]
        }, path.join(__dirname, '..', 'misc', 'thumbnails'))
        .on('end', () => {
            const thumbnail_path = path.join(__dirname, '..', 'misc', 'thumbnails', 
                                                `${path.basename(file, path.extname(file))}.png`)
            resolve({
				base64: base64_encode(thumbnail_path),
				thumbpath: thumbnail_path
			})
        })
        .on('error', (error) => {
            reject(error)
        })
    })
}

exports.send_error = function (res, type, error) {
	res.status(500).send({ type, error })
}
//sreamerfile.js
require('dotenv').config();
const util = require('util');
const express = require('express');
const colors = require('colors/safe');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const currentDir = __dirname;
const parentDir = path.normalize(currentDir + '/..');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

const doSomething1 = function() {

};
const doSomething2 = function() {

}

module.exports = function (app, obj) {
	app.get('/simplevideo', function(req, res) {
		const path = parentDir + '/public/video/sample.mp4'
		const stat = fs.statSync(path)
		const fileSize = stat.size
		const range = req.headers.range

		if (range) {
			const parts = range.replace(/bytes=/, "").split("-")
			const start = parseInt(parts[0], 10)
			const end = parts[1] ? parseInt(parts[1], 10)	: fileSize-1

			if(start >= fileSize) {
				res.status(416).send('Requested range not satisfiable\n'+start+' >= '+fileSize);
				return
			}

			const chunksize = (end-start)+1
			const file = fs.createReadStream(path, {start, end})
			const head = {
				'Content-Range': `bytes ${start}-${end}/${fileSize}`,
				'Accept-Ranges': 'bytes',
				'Content-Length': chunksize,
				'Content-Type': 'video/mp4',
			}

			res.writeHead(206, head)
			file.pipe(res)
		} else {
			const head = {
				'Content-Length': fileSize,
				'Content-Type': 'video/mp4',
			}
			res.writeHead(200, head)
			fs.createReadStream(path).pipe(res)
		}
	});

	app.post('/uploadstream', function(req, res) {
		try {
			const data = req.body.data;
			const cmd = req.body.cmd;
			let dataBuffer = new Buffer(data, 'base64');

			const abPath = '/public/video/usr/upload/';
			const inFilename = "video.webm";
			const inPath = parentDir + abPath + inFilename;
			const outFilename = "video.mp4";
			const outPath = parentDir + abPath + outFilename;
			//finalvideo.webm'
			const fileStream = fs.createWriteStream(inPath, {flags: 'a'});

			console.log(cmd);
			if (cmd === 'blank'){
				fileStream.write(dataBuffer);
			} else if (cmd === 'close'){
				fileStream.write(dataBuffer);
				
				fileStream.close();
				dataBuffer = null;
				

				try{
					ffmpeg(inPath)
					/*.outputOptions("-c:v", "copy")  */// this will copy the data instead or reencode it
					.save(outPath);
				}catch (err)	{
					console.log(err);
				}
			}
			console.log(dataBuffer);
			return res.json({gotit: true});
		} catch (error) {
			console.log(error);
			return res.json({gotit: false});
		}
	});
//https://192.168.43.192/openstream/test/html/youtubeaudio.html
	app.post('/youtubaudio/(:videoId)', function(req, res) {
		//http://youtube.com/watch?v=jLh9eqO1IUk
		var requestUrl = 'https://youtube.com/watch?v=' + req.params.videoId
		try {
			var youtubeStream = require('youtube-audio-stream');
			youtubeStream(requestUrl).pipe(res);
		} catch (exception) {
			res.status(500).send(exception);
		}
	});
	return {
		doSomething1,
		doSomething2
	}
}

//uploader.js
require('dotenv').config();
const util = require('util');
const express = require('express');
const colors = require('colors/safe');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const currentDir = __dirname;
const parentDir = path.normalize(currentDir + '/..');
const usrUploadDir = parentDir + process.env.USRUPLOAD_DIR;

const upload = multer({ dest: usrUploadDir});
const DWLD = '/imgs/usr/upload';
const NORD = '/Normal';

const doCreateDir = function(pathToCreate) {
	//console.log('pathToCreate=> ' + pathToCreate);
	pathToCreate.split(path.sep).reduce((prevPath, folder) => {
		const currentPath = path.join(prevPath, folder, path.sep);
		//console.log('currentPath=> ' + currentPath);
		if (!fs.existsSync(currentPath)){
			fs.mkdirSync(currentPath);
			fs.chmodSync(currentPath, 0777);
		}
		return currentPath;
	}, '');
}

const deleteFolderRecursive = function(path) {
	if( fs.existsSync(path) ) {
		fs.readdirSync(path).forEach(function(file,index){
			var curPath = path + "/" + file;
			if(fs.lstatSync(curPath).isDirectory()) { // recurse
				deleteFolderRecursive(curPath);
			} else { // delete file
				fs.unlinkSync(curPath);
			}
		});
		fs.rmdirSync(path);
	}
}

const doCreateRoomUploadDir = function(roomName) {
	const roomDir = parentDir + process.env.USRUPLOAD_DIR + '/' + roomName;
	//console.log('Create roomDir=> ' + roomDir);
	if (!fs.existsSync(roomDir)){
		fs.mkdirSync(roomDir);
	}
}

const doDeleteRoomUploadDir = function(roomName) {
	const roomDir = parentDir + process.env.USRUPLOAD_DIR + '/' + roomName;
	//console.log('Delete roomDir=> ' + roomDir);
	if(fs.existsSync(roomDir) ) {
		fs.readdir(roomDir, function(err, items) {
		   //console.log('File Item=> ' + items);
		    for (var i=0; i<items.length; i++) {
			//console.log(items[i]);
			let delteFile = roomDir + '/' + items[i];
			fs.unlink(delteFile, function (err) {
			    if (err) throw err;
			    // if no error, file has been deleted successfully
			    //console.log(delteFile + ' <=File deleted!');
			});
		    }
		    setTimeout(() => {
		    	fs.rmdirSync(roomDir);
		    }, 1500);	
		});
	}
}

module.exports = function (app, obj) {
	app.get('/createroomupload/(:roomname)', function(req, res) {
		//console.log('usrUploadDir=> ' + usrUploadDir);
		const roomname = req.params.roomname;
		const roomDir = parentDir + process.env.USRUPLOAD_DIR + '/' + roomname;
		fs.exists(roomDir, function(exists) {
		    if (!exists) {
			doCreateRoomUploadDir(roomname);
		    }
		});
		res.status(200).send('OK Boy.');	
	});
	app.get('/removeroomupload/(:roomname)', function(req, res) {
		//console.log('usrUploadDir=> ' + usrUploadDir);
		const roomname = req.params.roomname;
		const roomDir = parentDir + process.env.USRUPLOAD_DIR + '/' + roomname;
		fs.exists(roomDir, function(exists) {
		    if (exists) {
			doDeleteRoomUploadDir(roomname);
		    }
		});
		res.status(200).send('OK Boy.');	
	});
	app.post('/uploadavatar/(:roomname)/(:screenno)', upload.array('photos'), function(req, res) {
		const rootname = req.originalUrl.split('/')[1];	
		const roomname = req.params.roomname;
		const screenno = req.params.screenno;
		const roomDir = parentDir + process.env.USRUPLOAD_DIR + '/' + roomname;
		obj.getRoomByName(rootname, roomname).then((theroom) => {
			//console.log('uploadavatar theroom=> ', colors.green(JSON.stringify(theroom)));
			if (theroom.roomname){
				let user = theroom.users.filter((item)=>{
					if (item.screen.screenno === screenno) {
						return item;
					}
				});
				if (user.length > 0) {
					user = user[0];
					//{profile: {displayname: '', avatarUrl: ''}, screen: {screenno: screenno, clientId: ''}};

					var oldPath = req.files[0].destination + '/' + req.files[0].filename;

					var newPath = req.files[0].destination + '/'  + roomname + '/' + req.files[0].originalname;

					var readStream = fs.createReadStream(oldPath);
					var writeStream = fs.createWriteStream(newPath);

					readStream.pipe(writeStream);

					var filename = req.files[0].originalname;
					var link =  '/' + rootname + DWLD + '/' + roomname + '/' + filename;
					user.profile.avatarUrl = link;

					res.status(200).send({status: {code: 200}, link: link});
				} else {
					res.status(200).send({status: {code: 204}});	
				}
			} else {
				res.status(200).send({status: {code: 204}});	
			}
		});
	});
	app.post('/updatedisplayname/(:roomname)/(:screenno)', function(req, res) {
		const rootname = req.originalUrl.split('/')[1];	
		const roomname = req.params.roomname;
		const screenno = req.params.screenno;
		obj.getRoomByName(rootname, roomname).then((theroom) => {
			//console.log('theroom=> ', colors.green(JSON.stringify(theroom)));
			if (theroom.roomname){
				let user = theroom.users.filter((item)=>{
					if (item.screen.screenno === screenno) {
						return item;
					}
				});
				console.log('if user grather than one it will error!!=>', user);
				if (user.length > 0) {
					user = user[0];
					user.profile.displayname = req.body.displayname;
					res.status(200).send({status: {code: 200}, newdisplayname: user.profile.displayname});	
				} else {
					res.status(200).send({status: {code: 204}});	
				}
			} else {
				res.status(200).send({status: {code: 204}});	
			}
		});
	});
	app.post('/uploadimagemsg/(:roomname)/(:screenno)', upload.array('imagemsg'), function(req, res) {
		const rootname = req.originalUrl.split('/')[1];	
		const roomname = req.params.roomname;
		const screenno = req.params.screenno;
		const roomDir = parentDir + process.env.USRUPLOAD_DIR + '/' + roomname;

		var oldPath = req.files[0].destination + '/' + req.files[0].filename;
		//console.log('oldPath=> ', colors.green(oldPath));
		var newPath = req.files[0].destination + '/'  + roomname + '/' + req.files[0].originalname;
		//console.log('newPath=> ', colors.green(newPath));

		var readStream = fs.createReadStream(oldPath);
		var writeStream = fs.createWriteStream(newPath);

		readStream.pipe(writeStream);

		var filename = req.files[0].originalname;
		var link =  '/' + rootname + DWLD + '/' + roomname + '/' + filename;

		res.status(200).send({status: {code: 200}, link: link});
	});
	app.post('/uploadnormal', upload.array('chatboxphotos', 12), function(req, res) {
		const rootname = req.originalUrl.split('/')[1];	
		const roomDir = parentDir + process.env.USRUPLOAD_DIR + NORD;

		//console.log('files length=> ', colors.green( req.files.length));
		var oldPath = req.files[0].destination + '/' + req.files[0].filename;
		//console.log('oldPath=> ', colors.green(oldPath));
		var newPath = req.files[0].destination + NORD + '/' + req.files[0].originalname;
		//console.log('newPath=> ', colors.green(newPath));

		var readStream = fs.createReadStream(oldPath);
		var writeStream = fs.createWriteStream(newPath);

		readStream.pipe(writeStream);

		var filename = req.files[0].originalname;
		var link =  '/' + rootname + DWLD + NORD + '/' + filename;
		res.status(200).send({status: {code: 200}, link: link});
		res.end();
	});

	app.post('/warnningtext',  function(req, res) {
		var warnningTextPath = parentDir + '/public/doc/warnning.txt';
		fs.readFile(warnningTextPath, (e, data) => {
			if (e) throw e;
			res.send(data);
		});
	});

	return {
		doCreateRoomUploadDir,
		doDeleteRoomUploadDir
	}
}

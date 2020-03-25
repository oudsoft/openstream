//openstream.js

require('dotenv').config();
const os = require('os');
const fs = require('fs');
const path = require("path");
const colors = require('colors/safe');
const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');
const openstreamApp = express();

let openstreamObj = null;
let uploader = null;
let streamerfile =null;
let dbman = null;
let billgen = null;
let proxy = null;

openstreamApp.use(bodyParser.urlencoded({ extended: true }));
openstreamApp.use(bodyParser.json({ limit: "50MB", type:'application/json'}));
openstreamApp.use(express.static('public'));

const geegee = require('./geegee.js');
const qrservice = require('./qrservice.js');
const manual = require('./manual.js');
openstreamApp.use('/qrservice', qrservice);
openstreamApp.use('/manual', manual);
openstreamApp.use('/geegee', geegee);

const auth = require('./auth.js')(openstreamApp);

openstreamApp.post('/uniquenewroomname/(:newname)', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];
	const newname = req.params.newname;
	//console.log(colors.green(openstreamObj.rooms));
	//console.log(colors.green(JSON.stringify(openstreamObj)));
	var promiseList = new Promise(function(resolve, reject){
		let sepRoom = openstreamObj.rooms.filter((item)=>{
			//console.log('==>',item.roomname, newname);
			//console.log('==>',item.rootname, rootname);
			if ((item.roomname === newname) && (item.rootname === rootname)) {
				return item;
			}
		});
		resolve(sepRoom);
	});
	Promise.all([promiseList]).then((ob)=>{
		res.status(200).send({result: ob[0]});
	});	  
});

openstreamApp.post('/createnewroom/(:roomname)', function(req, res) {
	//console.log('req.body=> ', req.body);
	const rootname = req.originalUrl.split('/')[1];
	const roomname = req.params.roomname;
	const roomtype = req.body.roomoption;
	const roomsize = req.body.roomsize;
	openstreamObj.createNewRoom(rootname, roomname, roomtype, roomsize);
	//console.log('All Rooms: ' + colors.green(openstreamObj.rooms));
	uploader.doCreateRoomUploadDir(roomname);
	res.status(200).send({status: {code: 200}});	  
});

openstreamApp.post('/changestatusroom/(:roomname)', function(req, res) {
	//console.log('req.body=> ', req.body);
	const rootname = req.originalUrl.split('/')[1];
	const roomname = req.params.roomname;
	const newstatus = req.body.newstatus;
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		//console.log('theroom=> ', colors.green(JSON.stringify(theroom)));
		if (theroom.roomname) {
			theroom.status = newstatus;
			res.status(200).send({status: {code: 201}});	  
		} else {
			res.status(200).send({status: {code: 203}});	  
		}
	});
});

openstreamApp.post('/checkroom/(:roomname)', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];;
	const roomname = req.params.roomname;
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		//console.log('theroom=> ', colors.green(JSON.stringify(theroom)));
		if (theroom.roomname){
			res.status(200).send({status: {code: 201, roomstatus: theroom.status, roomtype: theroom.type}});	  
		} else {
			res.status(200).send({status: {code: 200, roomstatus: theroom.status, roomtype: theroom.type}});	  
		}
	});
});

openstreamApp.post('/checkscreen/(:roomname)/(:screenno)', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];
	const roomname = req.params.roomname;
	const screenno = req.params.screenno;
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		let roomSize = Number(theroom.roomsize);
		if (Number(screenno) <= roomSize)		{
			if(theroom.roomname === roomname) {
				//console.log(theroom);
				var promiseList = new Promise(function(resolve, reject){
					let user = theroom.users.filter((item)=>{
						if (item.screen.screenno === screenno) {
							return item;
						}
					});
					resolve(user);
				});
				Promise.all([promiseList]).then((ob)=>{
					let user = ob[0];
					//console.log('User length: ' + colors.green(user.length));
					if (user.length > 0) {
						//console.log('User: ' + colors.green(user));
						if (user[0].screen.clientId === ''){
							//console.log('User[0]: ' + colors.blue(user[0]));
							res.status(200).send({status: {code: 201}});
						} else {
							res.status(200).send({status: {code: 203}, clientId: user[0].screen.clientId});
						}
					} else {
						res.status(200).send({status: {code: 200}});
					}
				});
			} else {
				res.status(200).send({status: {code: 202}});	  			
			}
		} else {
			res.status(200).send({status: {code: 204}});	  		
		}
	});
});

openstreamApp.post('/verifyscreen/(:roomname)/(:screenno)/(:clientId)', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];
	const roomname = req.params.roomname;
	const screenno = req.params.screenno;
	const clientId = req.params.clientId;
	openstreamObj.verifyScreen(rootname, roomname, screenno, clientId).then((screen) => {
		//console.log('That Screen: ' + colors.green(screen));
		if(screen.screen.screenno){
			res.status(200).send({status: {code: 200}});
		} else {
			res.status(200).send({status: {code: 204}});
		}
	});
});

openstreamApp.post('/addnewuser/(:roomname)/(:screenno)', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];
	const roomname = req.params.roomname;
	const screenno = req.params.screenno;
	openstreamObj.addNewUser(rootname, roomname, screenno).then((theroom) => {
		//console.log('The Room Obj: ' + colors.green(JSON.stringify(theroom)));
		//console.log('Param Room name: ' + colors.green(roomname));	
		//console.log('The Room name: ' + colors.green(theroom.roomname));
		res.status(200).send({status: {code: 200}});
	});
});

openstreamApp.get('/viewlistrooms', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];
	var promiseList = new Promise(function(resolve, reject){
		let listrooms = openstreamObj.rooms.map((item) =>{
			if (item.rootname === rootname) {
				//return {rootname: item.rootname, roomname: item.roomname, createdAt: item.createdAt, type: item.type, status: item.status};
				delete item.messages;
				return item;
			}
		});
		resolve(listrooms);
	});
	Promise.all([promiseList]).then((ob)=>{
		res.status(200).send(ob[0]);
	});
});

openstreamApp.get('/viewuserrooms/(:roomname)', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];
	const roomname = req.params.roomname;
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		//console.log('The ' + roomname  + ' Room : ' + colors.green(JSON.stringify(theroom)));
		res.status(200).send(theroom.users);
	});
});

openstreamApp.get('/closeroom/(:roomname)', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];
	const roomname = req.params.roomname;
	uploader.doDeleteRoomUploadDir(roomname);
	var promiseList = new Promise(function(resolve, reject){
		/** Remove Cron Job **/
		//console.log('All Tasks=> ', colors.green(openstreamObj.tasks));
		let anotherTasks = openstreamObj.tasks.filter((item)=> {
			if (item.roomname !== roomname) {return item; }
		});
		//console.log('Anothe Tasks=> ', colors.green(anotherTasks));
		openstreamObj.tasks = anotherTasks;

		/** Remove Room **/
		console.log('All Rooms Before => ', colors.green(openstreamObj.rooms));
		let anotherRooms = openstreamObj.rooms.filter((room) => {
			if (room.rootname === rootname){
				if (room.roomname !== roomname){
					return room;
				}
			} else {
				return room;
			}
		});
		resolve(anotherRooms);
	});
	Promise.all([promiseList]).then((ob)=>{
		openstreamObj.rooms = ob[0];
		console.log('All Rooms After => ', colors.green(openstreamObj.rooms));
		res.status(200).send({status: {code: 200}});	
	});
});

openstreamApp.get('/exitroom/(:roomname)', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];
	const roomname = req.params.roomname;
	var promiseList = new Promise(function(resolve, reject){
		openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
			if (theroom.users) {
				theroom.users = [];
			}
		});
		resolve();
	});
	Promise.all([promiseList]).then((ob)=>{
		res.status(200).send({status: {code: 200}});	
	});
});

openstreamApp.get('/removescreen/(:roomname)/(:screenno)', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];
	const roomname = req.params.roomname;
	const screenno = req.params.screenno;
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		var promiseList = new Promise(function(resolve, reject){
			let anotherUsers = theroom.users.filter((user) => {
				if (user.screen.screenno !== screenno) { return user; }
			});
			resolve(anotherUsers)
		});
		Promise.all([promiseList]).then((ob)=>{
			theroom.users = ob[0];
			res.status(200).send({status: {code: 200}});	
		});
	});
});

openstreamApp.post('/getuserprofile', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];	
	const roomname = req.body.roomname;
	const screenno = req.body.screenno;
	//console.log('== ' + rootname  + '  : ' + roomname + ' : ' + screenno);
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		if (theroom.users) {
			//theroom.users.push(blankUser);
			//const blankUser = {profile: {displayname: '', avatarUrl: ''}, screen: {screenno: screenno, clientId: ''}};
			//console.log('User Profile of The ' + roomname  + ' Room : ' + colors.green(JSON.stringify(theroom)));
			var promiseList = new Promise(function(resolve, reject){
				let thisuser = theroom.users.filter((user) => {
					if (user.screen.screenno === screenno) { return user; }
				});
				resolve(thisuser);
			});
			Promise.all([promiseList]).then((ob)=>{
				console.log(ob[0][0]);
				res.status(200).send(ob[0][0]);	
			});
		} else {
			res.status(200).send({status: {code: 401}});	
		}		
	});
});

openstreamApp.post('/stampstarttime/(:roomname)', function(req, res) {
	const rootname = req.originalUrl.split('/')[1];
	const roomname = req.body.roomname;
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		if (theroom) {
			if (!theroom.starttime) {
				const startDate = new Date();
				theroom.starttime = startDate;
				theroom.status = 'Active';
				// seconds * minutes * hours * milliseconds = 1 day 
				const day = 24 * 60 * 60 * 1000;
				//const day = 5 * 60  * 1000;
				let endDate = new Date(startDate.getTime() + day);
				let endMM = endDate.getMonth() + 1;
				let endDD = endDate.getDate();
				let endHH = endDate.getHours();
				let endMN = endDate.getMinutes();
				let endSS = endDate.getSeconds();
				let scheduleClose = endSS + ' ' + endMN + ' ' + endHH + ' ' + endDD + ' ' + endMM + ' *';
				//console.log('scheduleClose=> ', colors.green(scheduleClose));

				/* Cron Job After Arrive Time */
				let task = cron.schedule(scheduleClose, function(){
					/** Remove Cron Job **/
					//console.log('All Tasks=> ', colors.green(openstreamObj.tasks));
					let anotherTasks = openstreamObj.tasks.filter((item)=> {
						if (item.roomname !== roomname) {return item; }
					});
					//console.log('Anothe Tasks=> ', colors.green(anotherTasks));
					openstreamObj.tasks = anotherTasks;

					/** Remove Room **/
					let anotherRooms = openstreamObj.rooms.filter((room) => {
						if((room.roomname !== roomname) && (room.rootname === rootname)){return (room); }
					});
					//console.log('anotherRooms after cron job revoke=> ', colors.green(anotherRooms));
					openstreamObj.rooms = anotherRooms;
				});

				openstreamObj.tasks.push({roomname: roomname, task: task});

				res.status(200).send({status: {code: 202}, starttime: startDate});	
			} else {
				/*`ทำไมต้องลบ starttime ที่ตรงนี้ งง*/
				/*
				นึกออกแล้ว เงื่อนไขคือ
				ถ้า master เข้ามา แล้วเช็คไม่พบค่า starttime หมายถึง เป็นการเข้าใช้งานครั้งแรก
				แต่ถ้าเข้ามาแล้วพบค่า starttime หมายถึงเป็นการเข้ามาใช้ครั้งถัดๆ ไป
				ดังนั้น ในหน้า control จึงไม่ต้องมายุ่งเรื่อง statmptime ไม่ว่า newstatus จะเป็น Active หรือ Pending ก็ตาม
				ปรับที่
					openstreaam
					master
					control
				*/
				/* delete theroom.starttime; */
				res.status(200).send({status: {code: 201}, starttime: theroom.starttime});		
			}
		} else {
			res.status(200).send({status: {code: 401}});	
		}
	});
});

openstreamApp.get('/roomsize/(:roomname)', function(req, res) {
	const roomname = req.params.roomname;
	const rootname = req.originalUrl.split('/')[1];
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		if (theroom.roomsize){
			res.status(200).send({roomname: roomname, roomsize: theroom.roomsize});	
		} else {
			res.status(200).send({status: {code: 401}});
		}
	});
});

openstreamApp.post('/updateroomsize/(:roomname)', function(req, res) {
	const roomname = req.params.roomname;
	const rootname = req.originalUrl.split('/')[1];
	const newSize = req.body.roomsize;
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		theroom.roomsize = newSize;
		if (newSize == 0){
			theroom.type = 'Unlimited';
		}
		res.status(200).send({status: {code: 200}});
	});
});

openstreamApp.post('/roomsizeplus/(:roomname)', function(req, res) {
	const roomname = req.params.roomname;
	const rootname = req.originalUrl.split('/')[1];
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		let size = Number(theroom.roomsize);
		size++;
		theroom.roomsize = size;
		res.status(200).send({roomname: roomname, roomsize: size});
	});
});

openstreamApp.post('/nextscreenno/(:roomname)', function(req, res) {
	const roomname = req.params.roomname;
	const rootname = req.originalUrl.split('/')[1];
	const padZero = function (num, size) {
	   var s = num+"";
	   while (s.length < size) s = "0" + s;
	   return s;
	}
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		let size = Number(theroom.roomsize);
		let nextNo = padZero((size++), 2);
		res.status(200).send({roomname: roomname, next: nextNo});
	});
});

openstreamApp.post('/updatepaymentlog/(:roomname)', function(req, res) {
	const roomname = req.params.roomname;
	const rootname = req.originalUrl.split('/')[1];
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		if (theroom){
			theroom.paymentlogid = req.body.paymentlogid;
			res.status(200).send({status: {code: 200}});	
		} else {
			res.status(200).send({status: {code: 401}});
		}
	});
});

openstreamApp.post('/updatebilllink/(:roomname)', function(req, res) {
	const roomname = req.params.roomname;
	const rootname = req.originalUrl.split('/')[1];
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		if (theroom){
			theroom.billlink = req.body.billlink;
			res.status(200).send({status: {code: 200}});	
		} else {
			res.status(200).send({status: {code: 401}});
		}
	});
});

openstreamApp.get('/master/(:roomname)/(:screenno)', function(req, res) {
	const roomname = req.params.roomname;
	const rootname = req.originalUrl.split('/')[1];
	const screenno = req.params.screenno;
	const hostname = req.headers.host;
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		let url = '';
		if (theroom.roomname === roomname){
			if (theroom.status === 'Active'){
				url = 'https://' + hostname + '/' + rootname + '/master.html?roomname=' + roomname + '&screenno=' + screenno;
			} else {
				url = 'https://' + hostname + '/' + rootname + '/error.html?roomname=' + roomname + '&screenno=' + screenno + '&err=406';
			}
		} else {
			url = 'https://' + hostname + '/' + rootname + '/error.html?roomname=' + roomname + '&screenno=' + screenno + '&err=405';
		}
		res.writeHead(301, {Location: url});
		res.end();
	});
});

/* err code
	405=Room not found
	406=Room not active
	407=screenno not allow
*/

openstreamApp.get('/client/(:roomname)/(:type)/(:screenno)', function(req, res) {
	const roomname = req.params.roomname;
	const rootname = req.originalUrl.split('/')[1];
	const screenno = req.params.screenno;
	const type = req.params.type;
	const hostname = req.headers.host;
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		let url = '';
		if ((theroom.roomname == roomname) && (theroom.roomsize)){
			if (theroom.status === 'Active'){
				let size = Number(theroom.roomsize);
				//console.log('room size=> ', size);
				let scnno = Number(screenno);
				if (scnno <= size){
					let dest = 'client';
					url = 'https://' + hostname + '/' + rootname + '/' + dest + '.html?roomname=' + roomname + '&screenno=' + screenno + '&t=' + type;
				} else {
					url = 'https://' + hostname + '/' + rootname + '/error.html?roomname=' + roomname + '&screenno=' + screenno + '&err=407';
				}
			} else {
				url = 'https://' + hostname + '/' + rootname + '/error.html?roomname=' + roomname + '&screenno=' + screenno + '&err=406';
			}
		} else {
			url = 'https://' + hostname + '/' + rootname + '/error.html?roomname=' + roomname + '&screenno=' + screenno + '&err=405';
		}
		res.writeHead(301, {Location: url});
		res.end();
	});
});

openstreamApp.get('/client/(:roomname)/(:type)/(:screenno)/(:clientId)', function(req, res) {
	const roomname = req.params.roomname;
	const rootname = req.originalUrl.split('/')[1];
	const screenno = req.params.screenno;
	const type = req.params.type;	
	const clientId = req.params.clientId;
	const hostname = req.headers.host;
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		let url = '';
		if ((theroom.roomname == roomname) && (theroom.roomsize)){
			if (theroom.status === 'Active'){
				let size = Number(theroom.roomsize);
				let scnno = Number(screenno);
				if (scnno <= size){
					let dest = 'client';	
					if (clientId){
						url = 'https://' + hostname + '/' + rootname + '/' + dest + '.html?roomname=' + roomname + '&screenno=' + screenno + '&t=' + type + '&clientId=' + clientId;
					} else {
						url = 'https://' + hostname + '/' + rootname + '/' + dest + '.html?roomname=' + roomname + '&screenno=' + screenno + '&t=' + type;
					}
				} else {
					url = 'https://' + hostname + '/' + rootname + '/error.html?roomname=' + roomname + '&screenno=' + screenno + '&err=407';
				}
			} else {
				url = 'https://' + hostname + '/' + rootname + '/error.html?roomname=' + roomname + '&screenno=' + screenno + '&err=406';
			}
		} else {
			url = 'https://' + hostname + '/' + rootname + '/error.html?roomname=' + roomname + '&screenno=' + screenno + '&err=405';
		}
		res.writeHead(301, {Location: url});
		res.end();
	});
});

openstreamApp.get('/vchat/(:roomname)/(:type)/(:callerno)/(:calleeno)/(:clientId)', function(req, res) {
	const roomname = req.params.roomname;
	const calltype = req.params.type;
	const rootname = req.originalUrl.split('/')[1];
	const callerno = req.params.callerno;
	const calleeno = req.params.calleeno;
	const clientId = req.params.clientId;
	const hostname = req.headers.host;
	openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
		let url = '';
		if ((theroom.roomname == roomname) && (theroom.roomsize)){
			if (theroom.status === 'Active'){
				let size = Number(theroom.roomsize);
				let clrno = Number(callerno);
				let cleno = Number(calleeno);
				if ((clrno <= size) && (cleno <= size)){
					url = 'https://' + hostname + '/' + rootname + '/vchat.html?roomname=' + roomname + '&callerno=' + callerno + '&calleeno=' + calleeno + '&t=' + calltype + '&v=' + clientId;
				} else {
					url = 'https://' + hostname + '/' + rootname + '/error.html?roomname=' + roomname + '&screenno=' + callerno + '&err=407';
				}
			} else {
				url = 'https://' + hostname + '/' + rootname + '/error.html?roomname=' + roomname + '&screenno=' + callerno + '&err=406';
			}
		} else {
			url = 'https://' + hostname + '/' + rootname + '/error.html?roomname=' + roomname + '&screenno=' + callerno + '&err=405';
		}
		res.writeHead(301, {Location: url});
		res.end();
	});
});

//module.exports = app;
module.exports = ( httpsServer ) => { 
	openstreamObj = require('./OpenStreamClass.js')(httpsServer);
	uploader = require('./uploader.js')(openstreamApp, openstreamObj);
	streamerfile = require('./streamerfile.js')(openstreamApp, openstreamObj);
	dbman = require('./dbman.js')(openstreamApp, openstreamObj);
	billgen = require('./BillGenerator.js')(openstreamApp, openstreamObj);
	proxy = require('./proxy.js')(openstreamApp, openstreamObj);
	return {openstreamApp}; 	
}

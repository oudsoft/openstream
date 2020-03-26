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

/* WS */

class OpenStream {	
	constructor (arg) {
		//let roomname = 'socket';
		//const newChatRoom = {roomName: roomname, users: [], messages: []};

		let masterId = '';
		let masterNo = '';

		this.rooms = [];
		this.tasks = [];
		//this.rooms.push(newChatRoom);		
		this.httpsServer = arg;
		//console.log('arg:=> ' + colors.blue(JSON.stringify(this.httpsServer)));
		const WebSocketServer = require('ws').Server;
		const wss = new WebSocketServer({server: this.httpsServer/*, path: '/' + roomname */});  

		/* Chat*/
		/* Rooms*/

		wss.getUniqueID = function () {
		    function s4() {
		        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		    }
		    return s4() + s4() + '-' + s4();
		};

		wss.getNextClientNo = async function (rootname, roomname) {
			function padZero(num, size) {
			   var s = num+"";
			   while (s.length < size) s = "0" + s;
			   return s;
			}
			let theroom = await openstreamObj.getRoomByName(rootname, roomname);
			let countClient;
			if (theroom.users) {
				countClient = theroom.users.length;
			} else {
				countClient = 1;
			}
			return padZero((countClient-1), 2)
		};

		wss.on('connection', async function (ws, req) {
			console.log(`WS Conn Url : ${req.url} Connected.`);
			let fullReqPaths = req.url.split('?');
			let wssPath = fullReqPaths[0];
			console.log(wssPath);
			//wssPath = wssPath.substring(1);
			wssPath = wssPath.split('/');
			console.log(wssPath);
			let rootname = wssPath[1];
			let roomname = wssPath[2];

			let queries = fullReqPaths[1].split('&');
			let connType = queries[0].split('=');
			let screenno = queries[1].split('=');
			//console.log('screenno ', screenno);

			if (roomname !== 'Admin') {

				if (wssPath.length > 3) {
					let username = wssPath[3];
					ws.username = username;
				} else {
					ws.username = roomname+ '-' + screenno[1];
				}

				let yourClientId;
				if (queries.length > 2) {
					let prevClientId = queries[2].split('=');
					yourClientId = prevClientId[1];
				}
				//console.log(connType);
				ws.roomName = roomname;
				//let yourNo = wss.getNextClientNo(rootname, roomname);
				let yourNo = screenno[1];
				ws.no = yourNo;
				//console.log('Client ID: ' + ws.id /*JSON.stringify(ws)*/);
				//console.log('YourNo: ' + yourNo);
				
				let theroom = await openstreamObj.getRoomByName(rootname, roomname);
				//console.log('theroom=> ', theroom);

				let newclientObject = null;		
				if (!yourClientId) {
					/* First Connection Condition*/
					ws.id = wss.getUniqueID();
					if (connType[1] === 'master'){
						ws.type = 'master';
						masterId = ws.id;
						masterNo = yourNo;
						newclientObject = {clientType: 'master', clientId: ws.id, clientNo: yourNo, masterId: masterId, masterNo: masterNo, roomName: roomname, screenNo: yourNo, roomsize: theroom.roomsize};
					} else if (connType[1] === 'client'){
						ws.type = 'client';
						newclientObject = {clientType: 'client',  clientId: ws.id, clientNo: yourNo, masterId: masterId, masterNo: masterNo, roomName: roomname, screenNo: yourNo, roomsize: theroom.roomsize};
					} else if (connType[1] === 'vchat'){
						ws.type = 'vchat';
						newclientObject = {clientType: 'vchat',  clientId: ws.id, clientNo: yourNo, masterId: masterId, masterNo: masterNo, roomName: roomname, screenNo: yourNo, roomsize: theroom.roomsize};
					} else {
						newclientObject = {error: 'Wrong Connection'};
					}
				} else {
					/* Re-Connection Condition */
					ws.id = yourClientId;
					if (connType[1] === 'master'){
						ws.type = 'master';
						masterId = yourClientId;
						masterNo = yourNo;
						newclientObject = {clientType: 'master', clientId: yourClientId, clientNo: yourNo, masterId: masterId, masterNo: masterNo, roomName: roomname, screenNo: yourNo, roomsize: theroom.roomsize};
					} else if (connType[1] === 'client'){
						ws.type = 'client';
						newclientObject = {clientType: 'client',  clientId: yourClientId, clientNo: yourNo, masterId: masterId, masterNo: masterNo, roomName: roomname, screenNo: yourNo, roomsize: theroom.roomsize};
					} else if (connType[1] === 'vchat'){
						ws.type = 'vchat';
						newclientObject = {clientType: 'vchat',  clientId: yourClientId, clientNo: yourNo, masterId: masterId, masterNo: masterNo, roomName: roomname, screenNo: yourNo, roomsize: theroom.roomsize};
					} else {
						newclientObject = {error: 'Wrong Connection'};
					}
				}

				newclientObject.type = "register";
				newclientObject.channel = "chat";
				ws.send(JSON.stringify(newclientObject));
				
				/*Lock Screen with ws.id */
				let theuser = await openstreamObj.lockScreen(theroom, screenno[1], ws.id);
				console.log('theuser==>', theuser);
				
				/* Event trigger for master */
				newclientObject.type = "newclient";
				let clients = wss.clients;
				clients.forEach(function each(client) {
					if (client.type === 'master') {
						if (client.roomName === roomname){
							if (client.readyState === 1 ) {
								client.send(JSON.stringify(newclientObject));
							}
						}
					}
				});
			} else {
				ws.roomName = 'Admin';
				let username = wssPath[3];
				ws.username = username;
			}
			ws.send("Hello world");  

			ws.on('message', function (message) {
				var data; 
				
				//accepting only JSON messages 
				try { 
					data = JSON.parse(message); 
				} catch (e) { 
					console.log("Invalid JSON"); 
					data = {}; 
				}

				console.log(data.roomName + ':' + roomname);
				if (data.roomName === roomname) {
					//switching type of the user message 
					switch (data.type) { 
						case "offer": 
							/* เลือก Client ปลายทาง ที่ Master.js ระบุมาใน data.clientId แล้วส่งเฉพาะ Client นั้นๆ */
							/* data.clientId คือ ปลายทางที่ต้องการส่งคือ client โดยระบุไว้ด้วยค่า peerId ที่ master.js */
							var promiseList = new Promise(function(resolve, reject){
								let allClientOfRoom = [];							
								wss.clients.forEach((item) => {
									if ((item.roomName === data.roomName) && (item.id === data.clientId) && (item.id !== masterId)) { allClientOfRoom.push( item); }
								});
								resolve(allClientOfRoom);
							});
							Promise.all([promiseList]).then((ob)=>{
								let allClients = ob[0];
								console.log('Amount of allClientOfRoom=>', allClients.length);
								allClients.forEach((client)=> {
									client.send(JSON.stringify({ channel: data.channel, type: "offer", offer: data.offer, sender: data.sender, name: data.name, clientId: ws.id, roomName: roomname, screenNo: screenno[1]}));
									console.log('sender =>' + ws.id + ' sende offer to =>', client.id);
									//ws.id => source, client.id => dest
								});
							});

			            break;
							
						case "answer": 
							/*  เลือก Client เฉพาะ Client ที่เป็น Master ของห้องนั้นๆ*/
							var promiseList = new Promise(function(resolve, reject){
								let allMasterOfRoom = [];							
								wss.clients.forEach((item) => {
									if ((item.roomName === data.roomName) && (item.id === masterId) && (data.clientId===masterId)) { allMasterOfRoom.push( item); }
								});
								resolve(allMasterOfRoom);
							});
							Promise.all([promiseList]).then((ob)=>{
								let allMasters = ob[0];
								console.log('Amount of allMasterOfRoom=>', allMasters.length);
								allMasters.forEach((client)=> {
									console.log('sender =>' + ws.id + ' sende answer to =>', client.id);
									client.send(JSON.stringify({ channel: data.channel, type: "answer", answer: data.answer, sender: data.sender, name: data.name, clientId: ws.id, roomName: roomname, screenNo: screenno[1]}));
									//ws.id => source, client.id => dest
								});
							});

			            break; 
							
						case "candidate": 
							wss.clients.forEach(function each(client) {
								//console.log("WS Sending candidate to:"+  data.name  + "[" + client.id + "]"); 
								//if (client !== ws && client.readyState === 1) {
								if (client.roomName === roomname){
									if (client.readyState === 1 ) {
										client.send(JSON.stringify({ channel: data.channel, type: "candidate", candidate: data.candidate, sender: data.sender, name: data.name, clientId: client.id, roomName: roomname, screenNo: screenno[1]}));
									}
								}
							});
			            break;
						
						case "start": 
							console.log("WS Sending Start Call to:", data.name); 
							console.log("start : ", JSON.stringify(data.start));	
							wss.clients.forEach(function each(client) {
								//if (client !== ws && client.readyState === 1) {
								if (client.roomName === roomname){
									if (client.readyState === 1 ) {
										//console.log('screenno ', screenno);
										client.send(JSON.stringify({ channel: data.channel, type: "start", start: data.start, sender: data.sender, name: data.name, clientId: data.clientId, roomName: roomname, screenNo: screenno[1]}));
									}
								}
							});
			            break;

						case "leave": 
							console.log("WS Sending Leave Call from:",data.leave.clientId); 
							console.log("leave : ", JSON.stringify(data.leave));	
							let senderId = data.leave.clientId;
							wss.clients.forEach(function each(client) {
								//if (client !== ws && client.readyState === 1) {
								if (client.roomName === roomname){	
									//console.log('debug point=>', client.id, data.sendto);								
									if ((client.readyState === 1 ) && (client.id === data.sendto)) {
										client.send(JSON.stringify({ channel: data.channel, type: "leave", leave: data.leave, sender: data.sender, senderId: senderId, name: data.name, clientId: data.leave.clientId, roomName: roomname, screenno: data.leave.screenno}));
									}
								}
							});
			            break;

						case "close": 
							console.log("WS Sending close to:",data.name); 
							console.log("close : ", JSON.stringify(data.close));	
							wss.clients.forEach(function each(client) {
								//if (client !== ws && client.readyState === 1) {
								if (client.roomName === roomname){
									if (client.readyState === 1 ) {
										client.send(JSON.stringify({ channel: data.channel, type: "close", close: data.close, sender: data.sender, name: data.name, clientId: client.id, roomName: roomname, screenNo: screenno[1]}));
									}
								}
							});
			            break;

						case "test": 
							console.log("WS Sending test to:",data.name); 
							//console.log("test : ", JSON.stringify(data.test));	
							
							wss.clients.forEach(function each(client) {
								if (client === ws && client.readyState === 1) {
									client.send(JSON.stringify({ channel: data.channel, type: "test", test: data.test}));
								}
							});
							
			            break;
						
						case "message":
							//console.log("WS Sending message to:", data.name); 
							//console.log("message: ", JSON.stringify(data.message));	
							//console.log('test=> ', ws.id, data.message.fromId);
							//console.log('test=>> ', data.sendto);
							if (data.sendto === 'all') {
								openstreamObj.getRoomByName(data.message.rootname, data.message.roomName).then(async function(room) {
									//console.log("The Room:", room); 
									if (room.messages) {
										wss.clients.forEach(function each(client) {
											//console.log(client.roomName, roomname);
											//console.log(client.id, data.message.fromId);
											if ((client.roomName === roomname) && (client.id !== data.message.fromId)){				
												data.message.clientNo = client.no;
												room.messages.push(data.message);
												client.send(JSON.stringify({channel: 'chat', type: 'message', message: data.message, roomName: roomname, screenNo: screenno[1], clientId: ws.id}));
												//console.log('send =>> ' + data.message.msgType + ' to ' + client.id);
											}
										});
									}
								});
							} else {
								/* In case of caller to callee trigger open interupt dialog */
								wss.clients.forEach(function(client){
									//console.log('test1=>> ', client.roomName, roomname);
									if (client.roomName === roomname) {
										//console.log('test2=>> ', client.id, data.sendto);
										if (client.id === data.sendto){
											console.log(data);
											data.message.clientNo = client.no;
											data.message.sendto = data.sendto;
											data.message.callerId = data.callerId;
											console.log(data.message);
											client.send(JSON.stringify({channel: 'chat', type: 'message', message: data.message, roomName: roomname, screenNo: screenno[1], clientId: ws.id}));
										}
									}
								});
							}
						break;

						case "vchat-offer" :
							wss.clients.forEach(function each(client) {
								//console.log(client.roomName + ':' + roomname);
								if (client.roomName === roomname){
									//console.log(client.readyState);
									console.log('offer client=>', client.roomName + ':' + client.id + ':' + data.clientId);
									if ((client.readyState === 1 ) && (client.id === data.clientId)){
										client.send(JSON.stringify({ channel: data.channel, type: "vchat-offer", offer: data.offer, sender: data.sender, name: data.name, clientId: data.clientId, roomName: roomname, screenNo: screenno[1], fromId: data.fromId}));
									} 
								}
							});
						break;

						case "vchat-answer" :
							wss.clients.forEach(function each(client) {
								if (client.roomName === roomname){							
									console.log('answer client=>', client.roomName + ':' + client.id + ':' + data.clientId);	
									if ((client.readyState === 1 ) && (client.id === data.clientId)){
										client.send(JSON.stringify({ channel: data.channel, type: "vchat-answer", answer: data.answer, sender: data.sender, name: data.name, clientId: data.clientId, roomName: roomname, screenNo: screenno[1], fromId: data.fromId}));
									}
								}
							});
						break;

						case "vchat-candidate" :
							wss.clients.forEach(function each(client) {
								if (client.roomName === roomname){
									//console.log('candidate client=>', client.roomName + ':' + client.id + ':' + data.clientId);
									if ((client.readyState === 1 )   && (client.id === data.clientId)) {
										client.send(JSON.stringify({ channel: data.channel, type: "vchat-candidate", candidate: data.candidate, sender: data.sender, name: data.name, clientId: client.id, roomName: roomname, screenNo: screenno[1], fromId: data.fromId}));
									}
								}
							});
						break;

						case "vchat-readyCall" :
							wss.clients.forEach(function each(client) {
								if (client.roomName === roomname){
									//console.log('readyCall=>', client.roomName + ':' + client.id + ':' + data.callerId);
									if ((client.readyState === 1 )   && (client.id === data.callerId)) {
										client.send(JSON.stringify({ channel: data.channel, type: "vchat-readyCall", readyCall: data.readyCall, sender: data.sender, name: data.name, clientId: client.id, roomName: roomname, screenNo: screenno[1]}));
									}
								}
							});
						break;

						case "vchat-rejectCall" :
							wss.clients.forEach(function each(client) {
								if (client.roomName === roomname){
									//console.log('rejectCall=>', client.roomName + ':' + client.id + ':' + data.callerId);
									if ((client.readyState === 1 )   && (client.id === data.callerId)) {
										client.send(JSON.stringify({ channel: data.channel, type: "vchat-rejectCall", rejectCall: data.rejectCall, sender: data.sender, name: data.name, clientId: client.id, roomName: roomname, screenNo: screenno[1]}));
									}
								}
							});
						break;

						case "vchat-closeConnection" :
							wss.clients.forEach(function each(client) {
								if (client.roomName === roomname){
									//console.log('closeConnection=>', client.roomName + ':' + client.id + ':' + data.clientId);
									if ((client.readyState === 1 )   && (client.id === data.clientId)) {
										client.send(JSON.stringify({ channel: data.channel, type: "vchat-closeConnection", closeConnection: data.closeConnection, sender: data.sender, name: data.name, clientId: client.id, roomName: roomname, screenNo: screenno[1], fromId: data.fromId}));
									}
								}
							});
						break;

						case "indiv-message": 
							//console.log('<<test>>');
							wss.clients.forEach(function each(client) {
								//console.log(client.readyState);
								if (client.readyState === 1 ) {
									//console.log(data);
									//console.log(client.roomName, data.roomName);
									//console.log(client.username)
									if ((client.roomName === data.roomName)) {
										//console.log(client.username, ws.username)
										let dataSend = {channel: data.channel, type: 'indiv-message', rootname: data.rootname, roomName: data.roomName, sender: data.sender, recver: data.recver, message: {msgtype: data.message.msgtype, msg: data.message.msg}, timestamp: new Date()};
										if (client.username === data.recver) {
											client.send(JSON.stringify(dataSend));
											//console.log('dataSend=>', dataSend);
										}
									}
								}
							});
				    		break;

					}
				}
			});

			ws.isAlive = true;

			ws.on('pong', () => {
				console.log('On Pong');
				ws.isAlive = true;
			});

			ws.on('close', function(ws, req) {
				console.log(`WS Conn Url : ${req.url} Close.`);	
				console.log('Check=> ', ws, req); //reasonCode, description
			});

		});

		setInterval(() => {
		    wss.clients.forEach((ws) => {
		        
		        if (!ws.isAlive) return ws.terminate();
		        
		        ws.isAlive = false;
				console.log('Start Ping');
		        ws.ping(null, false, true);
		    });
		}, 85000);
		
	};
	
	getRoomByName(rootname, roomName) {
		let allRooms = this.rooms;
		return new Promise(function(resolve, reject) {
			var result = allRooms.filter(function(item, inx) {
				if((roomName === item.roomname) && (rootname === item.rootname)){return (item); }
			});
			//console.log('The Result:=> ' + JSON.stringify(result));
			if (result.length > 0){
				resolve(result[0]);
			}else {
				resolve({});
			}
		});
	}

	createNewRoom(rootname, roomName, roomOption, roomsize){
		let status = 'Active';
		if ((roomOption === 'Upper') || (roomOption === 'Class')) {
			status = 'Pending';
		}

		let newChatRoom = {rootname: rootname, roomname: roomName, users: [], messages: [], type: roomOption, roomsize: roomsize, status: status, createdAt: new Date()};
		this.rooms.push(newChatRoom);	

		return newChatRoom;
	}

	addNewUser(rootname, roomname, screenno) {
		const blankUser = {profile: {displayname: '', avatarUrl: ''}, screen: {screenno: screenno, clientId: ''}};
		return new Promise(function(resolve, reject) {
			openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
				theroom.users.push(blankUser);
				resolve(theroom);
			});
		});
	}

	verifyScreen(rootname, roomname, screenno, clientId) {
		return new Promise(function(resolve, reject) {
			openstreamObj.getRoomByName(rootname, roomname).then((theroom) => {
				let users = theroom.users;
				let user = users.filter(function(item, inx) {
					if ((screenno === item.screen.screenno) && (clientId === item.screen.clientId)) {return (item); }
				});
				console.log('The Result:=> ' + JSON.stringify(user));
				if (user.length === 1){
					resolve(user[0]);
				}else {
					resolve({});
				}
			});
		});
	}

	lockScreen (thisroom, screenno, Id) {
		return new Promise(function(resolve, reject) {
			if (thisroom.users)	{
				let thisUser = thisroom.users.filter((user) => {
					if (user.screen.screenno === screenno) { return user; }
				});
				if (thisUser.length ===1){
					thisUser[0].screen.clientId = Id;
				}
				resolve(thisUser);
			} else {
				reject({error: 'Can not found user of room.'});
			}
		});
	}

}

/*************************************************/

//module.exports = app;
module.exports = ( httpsServer ) => { 
	//openstreamObj = new OpenStream(httpsServer);
	openstreamObj = require('./OpenStreamClass.js')(httpsServer);

	uploader = require('./uploader.js')(openstreamApp, openstreamObj);
	streamerfile = require('./streamerfile.js')(openstreamApp, openstreamObj);
	dbman = require('./dbman.js')(openstreamApp, openstreamObj);
	billgen = require('./BillGenerator.js')(openstreamApp, openstreamObj);
	proxy = require('./proxy.js')(openstreamApp, openstreamObj);
	return {openstreamApp }; 	
}

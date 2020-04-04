/* OpenStreamClass.js */
/* WS */

function OpenStreamClass (arg) {	
	// begin constructor
		//let roomname = 'socket';
		//const newChatRoom = {roomName: roomname, users: [], messages: []};
		let $this = this;

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
		const padZero = function (num, size) {
		   var s = num+"";
		   while (s.length < size) s = "0" + s;
		   return s;
		}

		wss.getUniqueID = function () {
		    function s4() {
		        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
		    }
		    return s4() + s4() + '-' + s4();
		};

		wss.getNextClientNo = async function (rootname, roomname) {
			let theroom = await $this.getRoomByName(rootname, roomname);
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

				//console.log(connType);
				ws.roomName = roomname;
				//let yourNo = wss.getNextClientNo(rootname, roomname);
				let yourNo = screenno[1];
				ws.no = yourNo;
				//console.log('Client ID: ' + ws.id /*JSON.stringify(ws)*/);
				//console.log('YourNo: ' + yourNo);
				
				let theroom = await $this.getRoomByName(rootname, roomname);
				//console.log('theroom=> ', theroom);

				let newclientObject = null;		

				/* First Connection Condition*/
				ws.id = wss.getUniqueID();
				if (connType[1] === 'master'){
					ws.type = 'master';
					masterId = ws.id;
					masterNo = yourNo;
					newclientObject = {clientType: 'master', clientId: ws.id, clientNo: yourNo, masterId: masterId, masterNo: masterNo, roomName: roomname, screenNo: yourNo, roomsize: theroom.roomsize};
				} else if (connType[1] === 'client'){
					let clienttype = queries[2].split('=');
					ws.type = 'client';
					ws.clienttype = clienttype[1];
					newclientObject = {clientType: 'client',  clientId: ws.id, clientNo: yourNo, masterId: masterId, masterNo: masterNo, roomName: roomname, screenNo: yourNo, roomsize: theroom.roomsize, clientType: clienttype[1]};
				} else if (connType[1] === 'vchat'){
					ws.type = 'vchat';
					newclientObject = {clientType: 'vchat',  clientId: ws.id, clientNo: yourNo, masterId: masterId, masterNo: masterNo, roomName: roomname, screenNo: yourNo, roomsize: theroom.roomsize};
				} else {
					newclientObject = {error: 'Wrong Connection'};
				}

				newclientObject.type = "register";
				newclientObject.channel = "chat";
				ws.send(JSON.stringify(newclientObject));
				
				/*Lock Screen with ws.id */
				let theuser = await $this.lockScreen(theroom, yourNo, ws.id);
				//console.log('theuser==>', theuser);
				
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

				//console.log('check room=> ' +data.roomName + ':' + roomname);
				if (data.roomName === roomname) {
					//console.log('the message=> ', data);
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
								$this.getRoomByName(data.message.rootname, data.message.roomName).then(async function(room) {
									//console.log("The Room:", room); 
									if (room.messages) {
										wss.clients.forEach(function each(client) {
											//console.log(client.roomName, roomname);
											//console.log(client.id, data.message.fromId);
											if ((client.roomName === roomname) && (client.id !== data.message.fromId)){				
												data.message.clientNo = client.no;
												//room.messages.push(data.message);
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
											//console.log(data);
											data.message.clientNo = client.no;
											data.message.sendto = data.sendto;
											data.message.callerId = data.callerId;
											//console.log(data.message);
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
		
	//end constructor
	
	this.getRoomByName = function(rootname, roomName) {
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

	this.createNewRoom = function(rootname, roomName, roomOption, roomsize){
		let status = 'Active';
		if ((roomOption === 'Upper') || (roomOption === 'Class')) {
			status = 'Pending';
		}

		let newChatRoom = {rootname: rootname, roomname: roomName, users: [], messages: [], type: roomOption, roomsize: roomsize, status: status, createdAt: new Date()};
		this.rooms.push(newChatRoom);	

		return newChatRoom;
	}

	this.addNewUser = function(rootname, roomname, screenno) {
		return new Promise(function(resolve, reject) {
			$this.getRoomByName(rootname, roomname).then((theroom) => {
				let someUsers = theroom.users.filter((item) => {
					if (item.screen.screenno == screenno)	{
						return item;
					}
				});
				if (someUsers.length === 0)	{
					const blankUser = {profile: {displayname: '', avatarUrl: ''}, screen: {screenno: screenno, clientId: ''}};
					theroom.users.push(blankUser);
				}
				resolve(someUsers);
			});
		});
	}

	this.verifyScreen = function(rootname, roomname, screenno, clientId) {
		return new Promise(function(resolve, reject) {
			$this.getRoomByName(rootname, roomname).then((theroom) => {
				let users = theroom.users;
				let user = users.filter(function(item, inx) {
					if ((screenno == item.screen.screenno) && (clientId === item.screen.clientId)) {return (item); }
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

	this.lockScreen = function (thisroom, screenno, Id) {
		//console.log('will lock screenno=>', screenno);
		//console.log('with Id=>', Id);
		return new Promise(function(resolve, reject) {
			//console.log('thisroom.users=>', thisroom.users);
			if (thisroom.users)	{
				let thisUser = thisroom.users.filter((user) => {
					if (user.screen.screenno == screenno) { return user; }
				});
				//console.log('thisUser=>', thisUser);
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

module.exports = (arg) => {
	const openStream = new OpenStreamClass(arg);
	return openStream;
}

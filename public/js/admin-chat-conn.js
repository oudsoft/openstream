//adminconn.js

/************************************************************/
/*					Begin Chatbox To Customer			*/

//console.log(window.location.hostname);
const chathostname = window.location.hostname;
const urlPath = window.location.pathname.split('/')[2];
//console.log(urlPath);

let chatroomname;
let chatrootname;
if (urlPath.indexOf('control') === 0) {
	chatroomname = 'Admin';
	let rootName = doGetRootName();
	let cookieStr = $.cookie(rootName).substr(2);
	let cookie = $.parseJSON(cookieStr);
	chatrootname = cookie.username;
} else {
	chatroomname = urlPath;
	chatrootname = doGetRootName();
}

let wws = null;
//let timer =null;


//let RootName = chatrootname;
//let RoomName = chatroomname;


var counter = 0;
var idList = new Array();

var SenderName = '';

function setSenderName(value) {
	SenderName = value;
}

function setWebSocket(value) {
	wws = value;
}

function doConnectChatWebScket(RoomName, UserName) {
	//console.log(RoomName);
	let wssUrl = 'wss://' + chathostname + '/' + chatrootname + '/' + RoomName + '/' + UserName + '?type=vchat&screenno=00';
	//console.log(wssUrl);
	wws = new WebSocket(wssUrl);
	wws.onopen = function () {
		console.log('Websocket is connected to the individual Chat server');
		/*
		console.log(pingWSDelayTime);
		timer = window.setTimeout(function () { 
			doSendTest();
		}, pingWSDelayTime);
		*/
	};
	wws.onmessage = function (msg) {
		console.log(msg);
		if (msg.data !== 'Hello world') {
			var data = JSON.parse(msg.data);
			console.log(data);
			if (data.message) {
				let existId = chatboxManager.search(data.sender);
				if (existId < 0) {
					var boxId = doCreateNewBox(data.sender);
					var rmBox = chatboxManager.roomBox(boxId);
					$('#'+ rmBox).chatbox("option", "boxManager").addMsg(data.sender, data.message.msg, data.message.msgtype);

					doShowAllRooms();
					
				} else {
					var rmBox = chatboxManager.roomBox(existId);
					$('#'+ rmBox).chatbox("option", "boxManager").addMsg(data.sender, data.message.msg, data.message.msgtype);
				}
			}
		}
		/*
		if(timer) {
			window.clearTimeout(timer);
		}
		timer = window.setTimeout(function () { 
			doSendTest();
		}, pingWSDelayTime);
		*/
	};
	wws.onclose = function(event) {
		console.log("WebSocket is closed now. with  event:=> ", event);
		//doReConnectChatWebScket(RoomName, UserName);
	};

	chatboxManager.init({messageSent : sendMessageCallback});

	function sendMessageCallback(id, user, msg, type) {
		//console.log(id, user, msg, type);
		$("#" + id).chatbox("option", "boxManager").addMsg('You', msg, type);
		//const AdminName = 'Officer';
		let msgSend = {type: 'indiv-message', rootname: chatrootname, roomName: RoomName, sender: UserName, recver: user.name, message: {msgtype: type, msg}};
		wws.send(JSON.stringify(msgSend));  
	}

	$('#OnoffWS').attr('onclick', 'doDisconnectChatWebScket("' +RoomName + '","' + UserName + '")');
	$('#OnoffWS').text('Stop');
	$('#OnoffWS').reddy();
}

function doCreateNewBox(sender) {
	counter ++;
	var id = "box" + counter;
	idList.push(id);
	chatboxManager.addBox(id, 
			{dest: "dest" + counter,
			title: sender,
			user: {name: sender}
		});
	existId = chatboxManager.search(sender);
	return existId;
}

function doGetRootName() {
	return window.location.pathname.split('/')[1];
}

function doSendTest() {
   wws.send(JSON.stringify({
		channel: "media",
		type: "test",
		name: SenderName,
		sender: 'remote',
		roomName: chatroomname,	
		test: {test: 'test', channel: 'media', name: SenderName, id: wws.id, sender: 'remote'} 
	}));  
}

function doDisconnectChatWebScket(RoomName, UserName) {
	wws.close();
	$('#OnoffWS').attr('onclick', 'doConnectChatWebScket("' +RoomName + '","' + UserName + '")');
	$('#OnoffWS').greenify();
	$('#OnoffWS').text('Start');
	setSenderName('Officer');
}

function doReConnectChatWebScket(RoomName, UserName) {
	doConnectChatWebScket(RoomName, UserName);
}
//client.js
const myname = 'client';

let hostname = window.location.hostname;
let ws = null;

let rootname = window.location.pathname.split('/')[1];

let urlParams = urlQueryToObject(location.search);

let roomname = urlParams.roomname;
let screenno = urlParams.screenno;
let clienttype = urlParams.t;
let wsUrl = 'wss://' + hostname + '/' + rootname + '/' + roomname + '?type=' + myname + '&screenno=' + screenno + '&t=' + clienttype;

let vchatConn;
let vchatLocalStream;

function doConnect() {
	doGetRequestMasterReady(roomname).then((statusM) => {
		/* No Master in room will send notify and close connection*/
		/* ป้องกันการจั่วลม */
		if (statusM.status.code == 200)	{
			console.log('screenno==>', screenno);
			params = {rootname: rootname, roomname: roomname, screenno: screenno};
			doRequestAddUser(params).then((statusU) => {
				if (statusU.status.code === 200) {
					screenno = statusU.screenno;
					//$('#ClientProfileMark').text(screenno);
					$('#ClientProfileLogo').text(screenno);
					wsUrl = 'wss://' + hostname + '/' + rootname + '/' + roomname + '?type=' + myname + '&screenno=' + screenno + '&t=' + clienttype;
					console.log('wsUrl==>', wsUrl);
					doWebSocketConnect();
				} else {
					alert('It can not Connect at this time with your Screen No = ' + screenno + '\nPlease refresh this page and connect again.');
				}
			});
		} else {
			alert('Your master screen not ready, please try again later.');
			$("#OnCmd").toggle();
			$("#OffCmd").toggle();
			$("#FullCmd").toggle();
		}
	});
}

function doWebSocketConnect() {
	//ws = new WebSocket('wss://' + hostname + ':4433/' + roomname + '?type=' + myname);
	ws = new WebSocket(wsUrl);
	ws.onopen = function () {
		console.log('Websocket is connected to the signaling server');
	}

	ws.onmessage = function (msg) {
		//console.log("WS Got message", msg.data);
		if ((msg.data !== '') && (msg.data !== 'Hello world')) {
		   var data = JSON.parse(msg.data); 
		   //console.log(data.roomName + ':' + roomname);
		   console.log(data);
		   if (data.roomName === roomname) {
				if (data.type !== 'newclient')	{
					switch(data.channel) { 
					case "screen":
					   switch(data.type) { 
						//when somebody wants to call us 
						case "offer": 
							wsHandleOffer(data.offer, data.sender, data.clientId); 
							break; 
						case "answer": 
							wsHandleAnswer(data.answer, data.sender); 
							break; 
						//when a remote peer sends an ice candidate to us 
						case "candidate": 
							wsHandleCandidate(data.candidate, data.sender); 
							break; 
						case "leave": 
							wsHandleLeave(data); 
							break; 
						default: 
							break; 
					   }
					break;
					case "vchat":
						switch(data.type) { 
							//when somebody wants to call us 
							case "vchat-offer": 
								if (data.clientId === clientId)	{
									console.log("Received Offer from remote peer.");
									vchatConn.setRemoteDescription(new RTCSessionDescription(data.offer));
									createAndSendAnswer();
								}
							break; 
							case "vchat-answer": 
								if (data.clientId === clientId)	{
									console.log("Received Answer from remote peer.");
									vchatConn.setRemoteDescription(new RTCSessionDescription(data.answer));
								}									
							break; 
							//when a remote peer sends an ice candidate to us 
							case "vchat-candidate": 
								if (data.clientId === clientId)	{
									vchatConn.addIceCandidate(new RTCIceCandidate(data.candidate));
								}
							break; 
							case "vchat-readyCall": 
								if ((data.clientId === clientId) &&  (data.readyCall))	{
									if (vchatLocalStream)	{
										videoCallButton.removeAttribute("disabled");
										let event = new Event('click');
										setTimeout(() => {
											videoCallButton.dispatchEvent(event);
										}, 3000);
									}
								}
							break; 
							case "vchat-closeConnection": 
								if ((data.clientId === clientId) &&  (data.closeConnection))	{
									console.log("Received 'close call' signal from remote peer.");
									endCall();
								}
							break; 
							default: 
							break; 
						}
					break;
					case "chat":
						switch(data.type) {
						case "register": 
							handleRegister(data);
						break;
						case "message": 
							switch (data.message.msgType) {
								case 'master_disconnect' :
									doDisconnect(screenno);
								break;
								case "vcall" :
									handleMessage(data.message);
								break;
								case undefined :
									handleMessage(data.message);
								break;
							}
						break;
						case "refresh": 
							handleRefreshWindow();
						break;
						default: 
							break; 
						}
					break;
					case "indiv-chat":
						switch(data.type) {
							case "indiv-message": 
								handleIndivChat(data);
							break;
							default: 
							break; 
						}
					break;
					default: 
					break; 
					}
				} else {
					//clientId = data.clientId;
				}
			}
		}
	}

	ws.onclose = function(event) {
		console.log("WebSocket is closed now. with  event:=> ", event);
	};

	ws.onerror = function (err) { 
	   console.log("WS Got error", err); 
	}

	doInitStream();
	//doInitMedia();
	doReadySystem();
	if (remoteVideo.readyState === 0)	{
		$('#WaitingLayout').load('content/loading.html', function() {
			//แก้ปัญหาที่ว่า เมื่อ user start connect แล้ว remoteVideo ไม่ play (จะเกิดขึ้นในกรณีที่ master กับ client อยู่คนล่ะเครื่องกัน)
			//เพราะปกติแล้ว เมื่อ start connect ไป ทาง master จะปล่อย localStream มาให้ทันที (ถ้าอยู่เครื่องเดียวกันจะได้ Stream และ Play ทันที)
			//แต่ถ้าได้มาแล้ว readyState ===0 ก็ต้องขอใหม่
			//เป็นการช่วย client user
			//ที่ remoteConn.ontrack ได้ remoteStream มาแล้ว แต่ไม่ play
			
			setTimeout(() => {
				doCallStream();
				$('#WaitingLayout').empty();
			}, 7000);
			
			// ย้ายไปแก้ที่ remoteConn.ontrack โดยต้องรอให้ master มี localConn.onicegatheringstatechange == complete ก่อน
		});
	}
}

 //using Google public stun server 
/*
const configuration = { 
	"iceServers": [{ "url": "stun:stun2.1.google.com:19302" }, {'url': 'stun:stun.services.mozilla.com'}]
}; 
*/
/* การเชื่อมต่อ STUN Server แบบต้องระบุ Username & Password
var servers = {
  'iceServers': [{
    'urls': 'turn:numb.viagenie.ca',
    'credential': '<your TURN password>',
    'username': '<your TURN username>'
}]
};

*/

/*
var servers = {
  'iceServers': [{
    'urls': 'stun:stun.services.mozilla.com'
  }, {
    'urls': 'stun:stun.l.google.com:19302'
  }, {
    'urls': 'turn:numb.viagenie.ca',
    '******': 'connectah',
    'raplizard97@gmail.com': 'raplizard97@gmail.com'
  }]
};
*/

 const configuration = { 
	"iceServers": [
	 {
		'urls': 'stun:202.28.68.28:3478',
	 },
	 {
		'urls': 'turn:202.28.68.28:3478',
		'credential': 'some-password',
		'username': 'some-username'	
	 }
	]
 };

const offerOptions = {
	offerToReceiveVideo: 1,
	offerToReceiveAudio: 1
};


//* Screen Section *//

var remoteConn;

function doCallStream() {
	if ((doGetWsState() == 0) || (doGetWsState() == 1)){
		ws.send(JSON.stringify({
			channel: "screen",
			type: "start",
			name: myname,
			sender: 'remote',
			start: {start: 'start', channel: 'screen', name: myname, id: ws.id, sender: 'remote'},
			clientId: this.clientId,
			roomName: roomname		
		}));  
	} else {
		alert('ยังไม่สามารถเชื่อมต่อกับระบบฯ ได้เนื่องจากจอหลักยังไม่เริ่มถ่ายทอดสัญญาณ\nโปรดเชื่อมต่ออีกครั้งในภายหลังโดยคลิกปุ่มรูปสวิชต่อ์สีเขียว');
		$("#OnCmd").toggle();
		$("#OffCmd").toggle();
		$("#FullCmd").toggle();
	}
}

function doInitStream() {

	remoteConn = new RTCPeerConnection(configuration); 
	//console.log("ICE gathering state of remoteConn: "  + remoteConn.iceGatheringState); 

	remoteConn.onicecandidate = function (event) { 
		console.log("ICE gathering state change: " + event.target.iceGatheringState);
		if (event.candidate) { 
		   ws.send(JSON.stringify({ 
				channel: "screen",
				type: "candidate", 
				candidate: event.candidate,
				name: myname,
				sender: 'remote',
				clientId: this.clientId,
				roomName: roomname				
		   })); 
		} 
	};

	//console.log("ICE connection state: " + remoteConn.iceConnectionState); 

 	remoteConn.oniceconnectionstatechange = function(event) {
		console.log('ICE state change event: ', event);
		//console.log("ICE connection state change: " + event.target.iceConnectionState);
		const peerConnection = event.target;
		const ref = peerConnection.iceConnectionState;
		if (ref!== "closed" && ref !== "failed" && ref !== "disconnected" && ref !== "completed") {
			remoteConn = peerConnection;
		}
	};
	
	remoteConn.ontrack = function(event) {
		if (event.streams[0]) {
			remoteStream = event.streams[0];
			//console.log('RemoteSteamConn ontrack event: ', event);
			//console.log('RemoteSteam: ', remoteStream);
			//console.log('RemoteSteam.getVideoTracks(): ', remoteStream.getVideoTracks());
			remoteVideo.srcObject = remoteStream;
			//console.log(remoteVideo.srcObject);	
			//console.log(remoteVideo.readyState);
			event.track.onended = e => {
				console.log('Remote Stream End!!');
				remoteVideo.srcObject = null;
			}

			let userMsg = screenno + ' Receive Stream Succes. And start join in your room.';

			requestSendMessage('text', userMsg, screenno, 'all');
		} else {
			let userMsg = screenno + ' can not receive your stream. Something wrong!!.';

			requestSendMessage('text', userMsg, screenno, 'all');
		}

		$('#WaitingLayout').empty();
	};

}

function doDisconnect(AClientNo) {
	$('#WaitingLayout').load('content/loading.html', function() {
		console.log(AClientNo);
		handleClientDisConnect(AClientNo);
		doStopShareScreen();
		if ((ws.readyState == 0) || (ws.readyState == 1)){
			ws.send(JSON.stringify({
				channel: "screen",
				type: "leave",
				name: myname,
				sender: 'remote',
				roomName: roomname,	
				sendto: masterId,
				rootname: rootname,
				leave: {leave: 'leave', channel: 'screen', name: myname, clientId: clientId, screenno: screenno, sender: 'remote'} 
			}));  

			let userMsg = screenno + ' Disconnect. And exit from your room.';

			requestSendMessage('text', userMsg, screenno, 'all');

		}
		doGetRequestRemoveScreen(roomname, screenno).then((sts) => {
			if (sts.status.code === 200 ) {
				doCloseBox(ReceiverName);
				console.clear();
				setTimeout(() => {
					ws.close();
					doInitSystem();
					//msgScreen.innerHTML = '';
					//$('#WaitingLayout').empty();
					alert('New\'s class session already connect again.');
					window.location.reload(false);
				}, 5000);
			} else {

			}
		});
	});
}

function doStopShareScreen() {
	if (remoteStream){
		remoteStream.getTracks().forEach((track)=>{
			track.stop();
		});
	}
}

//when somebody sends us an offer 
function wsHandleOffer(offer, sender, masterId) {
	masterId = masterId;
	remoteConn.setRemoteDescription(new RTCSessionDescription(offer));
	
	//create an answer to an offer 
	remoteConn.createAnswer(function (answer) { 
		//console.log(JSON.stringify(answer));
		remoteConn.setLocalDescription(answer); 

		ws.send(JSON.stringify({ 
			channel: "screen",
			type: "answer", 
			answer: answer,
			sender: 'remote',
			name: myname,
			clientId: masterId,
			roomName: roomname			
		})); 
		
	}, function (error) { 
		console.log(JSON.stringify(error));
		alert("Error when creating an answer"); 
	}); 
}

//when we got an answer from a remote user
function wsHandleAnswer(answer, sender) { 
   //localConn.setRemoteDescription(new RTCSessionDescription(answer)); 
};
  
//when we got an ice candidate from a remote user 
function wsHandleCandidate(candidate, sender) { 
	console.log('wsHandleCandidate sender=> ' + sender);
	//if (sender === 'local') {
		//console.log("wsHandleCandidate ICE connection state: <Before> " + remoteConn.iceConnectionState); 
		remoteConn.addIceCandidate(new RTCIceCandidate(candidate)).then(
			function() {
				//$(statsBox).append('<p style="font-weight: bold;">remoteConn AddIceCandidate success.</p>');
				console.log("remoteConn AddIceCandidate success.");
				//console.log("wsHandleCandidate ICE connection state: <After> " + remoteConn.iceConnectionState); 
			},
			function(error) {$(errorBox).append('<p>remoteConn Failed to add Ice Candidate:'+ error.toString() + '</p>');}
		);
	//}
};

function wsHandleLeave(data) {
	//console.log('data leave', JSON.stringify(data));
	if (data.clientId === data.senderId){
		remoteVideo.srcObject = null; 

		remoteConn.close(); 
		remoteConn.onicecandidate = null; 
		remoteConn.onaddstream = null; 
	}
}

function doSendTest() {
   ws.send(JSON.stringify({
		channel: "media",
		type: "test",
		name: myname,
		sender: 'remote',
		roomName: roomname,	
		test: {start: 'start', channel: 'media', name: myname, id: ws.id, sender: 'remote'} 
	}));  
}


////////////////////////////////////////////////////

//* Media Section *//

function doCallMedia() {
   ws.send(JSON.stringify({
		channel: "media",
		type: "start",
		name: myname,
		sender: 'remote',
		roomName: roomname,	
		start: {start: 'start', channel: 'media', name: myname, id: ws.id, sender: 'remote'} 
	}));  
}

////////////////////////////////////////////////////

//* VChat Section *//

///////////////////////////////////////////////////////
var boxCounter = 0;
var idList = new Array();

function doCreateNewBox(sender) {
	boxCounter ++;
	var id = "box" + boxCounter;
	idList.push(id);
	chatboxManager.addBox(id, 
			{dest: "dest" + boxCounter,
			title: sender,
			user: {name: sender}
		});
	let existId = chatboxManager.search(sender);
	return existId;
}

var SenderName = '';
var ReceiverName = '';

function setSenderName(value) {
	SenderName = value;
}

function setReceiverName(value) {
	ReceiverName = value;
}

chatboxManager.init({messageSent : sendMessageCallback});

function sendMessageCallback(id, user, msg, type) {
	//console.log(id, user, msg, type);
	//console.log(SenderName, ReceiverName);
	$("#" + id).chatbox("option", "boxManager").addMsg('You', msg, type);
	//const AdminName = 'Officer';
	let msgSend = {channel: 'indiv-chat', type: 'indiv-message', rootname: rootname, roomName: roomname, sender: SenderName, recver: ReceiverName, message: {msgtype: type, msg}};
	//console.log(msgSend);
	ws.send(JSON.stringify(msgSend));  
}

function handleIndivChat(data) {
	//console.log(data);
	let existId = chatboxManager.search(data.sender);
	//console.log('existId=>', existId);
	if (existId < 0) {
		setSenderName(data.recver);
		setReceiverName(data.sender);
		var boxId = doCreateNewBox(data.sender);
		var rmBox = chatboxManager.roomBox(boxId);
		$('#'+ rmBox).chatbox("option", "boxManager").addMsg(data.sender, data.message.msg, data.message.msgtype);
	} else {
		var rmBox = chatboxManager.roomBox(existId);
		$('#'+ rmBox).chatbox("option", "boxManager").addMsg(data.sender, data.message.msg, data.message.msgtype);
	}
}

function doCloseBox(roomName) {
	let existId = chatboxManager.search(roomName);
	console.log(existId);
	if (existId >= 0) {
		idList.splice(existId, 1);
		chatboxManager.removeBox(existId);
	}
}

function doGetRequestRemoveScreen(roomname, screenno){
	return new Promise(function(resolve, reject) {
		var url = "/" + rootname + "/removescreen/" + roomname + "/" + screenno;
		$.get(url, {}, function(data){
			resolve(data);
		}).fail(function(error) { 
			console.log(JSON.stringify(error));
			reject(error); 
		});
	});
}

function doGetRequestMasterReady(roomname) {
	return new Promise(function(resolve, reject) {
		var url = "/" + rootname + "/masterready/" + roomname;
		$.get(url, {}, function(data){
			resolve(data);
		}).fail(function(error) { 
			console.log(JSON.stringify(error));
			reject(error); 
		});
	});
}

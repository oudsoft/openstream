//master.js
const myname = 'master';

let screenno = '00';
let hostname = window.location.hostname;
let ws = null;

let rootname = window.location.pathname.split('/')[1];
let urlParams = urlQueryToObject(window.location.search);
	
let roomname = urlParams.roomname;
let roomtype;
let roomsize;
let wsUrl = 'wss://' + hostname + '/' + rootname + '/' + roomname + '?type=' + myname + '&screenno=' + screenno;

function doConnect() {
	//ws = new WebSocket('wss://' + hostname + ':4433/' + roomname + '?type=' + myname);
	ws = new WebSocket(wsUrl);
	ws.onopen = function () {
		console.log('Websocket is connected to the signaling server')
	}

	ws.onmessage = function (msg) {
		//console.log("WS Got message", msg.data);
		if ((msg.data !== '') && (msg.data !== 'Hello world')) {
			var data = JSON.parse(msg.data); 
			console.log(data);
			if (data.roomName === roomname){
				$(statsBox).append('<p>' + JSON.stringify(data) + '</p>');
				if (data.type !== 'newclient')	{
					switch(data.channel) { 
						case "screen":
							switch(data.type) { 
								//when somebody wants to call us 
								case "offer": 
									wsHandleOffer(data.offer, data.sender); 
								break; 
								case "answer": 
									wsHandleAnswer(data.answer, data.sender, data.clientId); 
								break; 
								//when a remote peer sends an ice candidate to us 
								case "candidate": 
									wsHandleCandidate(data.candidate, data.sender, data.clientId); 
								break; 
								case "start": 
									wsHandleStart(data.start, data.sender, data.clientId); 
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
									if (data.clientId === clientId){
										doHandleOffer(data.fromId, data.offer, data.screenNo);
									}
								break; 
								case "vchat-answer": 
									if (data.clientId === clientId){
										getPeerById(data.fromId).then((vchatConn) => {
											console.log("Received Answer from remote peer.");
											vchatConn.setRemoteDescription(new RTCSessionDescription(data.answer));
										});
									}									
								break; 
								//when a remote peer sends an ice candidate to us 
								case "vchat-candidate": 
									if (data.clientId === clientId){
										getPeerById(data.fromId).then((vchatConn) => {
											vchatConn.addIceCandidate(new RTCIceCandidate(data.candidate));
										});
									}
								break; 
								case "vchat-readyCall": 
									if ((data.clientId === clientId) &&  (data.readyCall))	{
										if (vchatLocalVideo.srcObject)	{
											videoCallButton.removeAttribute("disabled");
											let event = new Event('click');
											setTimeout(() => {
												videoCallButton.dispatchEvent(event);
											}, 3000);
										}
									}
								break; 
								case "vchat-rejectCall": 
									if ((data.clientId === clientId) &&  (data.rejectCall))	{
										doHandleReject();
									}
								break; 
								case "vchat-closeConnection": 
									if ((data.clientId === clientId) &&  (data.closeConnection))	{
										console.log("Received 'close call' signal from remote peer.");
										doClosePeer(data.fromId);
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
								handleMessage(data.message);
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
					//newclient - connect
					$(statsBox).append('<p>You have new client id: ' + data.clientId + '<b>[' + data.clientNo + ']</b> connected</p>');
					handleNewClientConnect(data);
					/* create localConn and push to localPeers*/
					doInitStream(data.clientId, data.clientNo).then((newLocalConn) => {
						//console.log(newLocalConn);
						//doInitMedia(data.clientId);
						if (mixedStream){
							/* Step 1, 2, 3 */
							// create an offer 
							//doStartSendIndivOffer(data.clientId);
							//delay(12000).then(() => doCreateOffer(newLocalConn, data.clientId));
							//doCreateOffer(newLocalConn, data.clientId);
							$('#CallOpenLocalFileBar, #CallOpenYoutubeBar').show();
						}
					});
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
	}

	ws.onclose = function(event) {
		console.log("WebSocket is closed now. with  event:=> ", event);
		/*
		setTimeout(() => {
			doReConnect();
		}, 1500);
		*/
	};

	ws.onerror = function (err) { 
	   console.log("WS Got error", err); 
	}

	doReadyGetStream();
	doPropmtStopShare();
}

function doReConnect() {
	console.log(clientId);
	if (clientId) {
		wsUrl = 'wss://' + hostname + '/' + rootname + '/' + roomname + '?type=' + myname + '&screenno=' + screenno  + '&clientId=' + clientId;
		doConnect();
	}
}

function doDisconnect() {
	$('#Mic-On-Cmd').hide();
	$('#Webcam-On-Cmd').hide();
	$('#Mic-Off-Cmd').hide();
	$('#Webcam-Off-Cmd').hide();
	$('#WaitingLayout').load('content/loading.html', function() {
		doToggleLoading();
		doBroadcastClientClose();
		setTimeout(() => {
			if (ws) ws.close();
			console.clear();
			doInitSystem();
			//doGetRequestRemoveScreen(roomname, screenno).then((sts) => {
			doGetRequestExitRoom(roomname).then((sts) => {
				console.log('Exit Room Status=>', sts);
				//console.log(localMediaStream);
				doCloseBox();
				$('#CallOpenLocalFileBar, #CallOpenYoutubeBar').hide();
				$('#MessageScreen').load('content/masterguide.html');
				alert('New\'s class session already connect again.');
				$('#WaitingLayout').empty();
				window.location.reload(false);
			});
		}, 2500);
	});
}

function doBroadcastClientClose() {
	//console.log(doGetWsState());
	if ((doGetWsState() == 0) || (doGetWsState() == 1)){
		ws.send(JSON.stringify({ 
			channel: "chat",
			type: "message", 
			message: {msg: 'Master want Close, Now.', msgType: 'master_disconnect', timestamp: new Date(), clientname: myname, fromId: clientId, toId: 'all', roomName: roomname, rootname: rootname},
			name: myname,
			sender: 'master',
			sendto: 'all',
			roomName: roomname,
			rootname: rootname
		})); 
	}
}

/*
 const configuration = { 
	"iceServers": [{ "url": "stun:stun2.1.google.com:19302" }, {'url': 'stun:stun.services.mozilla.com'}]
 }; 
*/

 const configuration = { 
	"iceServers": [
	 {
		'urls': 'stun:202.28.68.28:3478'
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


var localPeers = [];
//var localMediaPeers = [];

/* 
	var localConn; ยกเลิกการเข้าถึงทางตรง เปลี่ยนไปใช้วิธี 
	ให้ใช้วิธี getLocalConnById(clientId).then(function(localConn) แทน
	เพราะมันถูกเก็บเข้า localPeers

*/


//* Screen Section *//

function doInitStream(clientId, screenNo) {
	return new Promise(async function(resolve, reject) {
		
		let localConn = new RTCPeerConnection(configuration); 
			
		// Setup ice handling 
		localConn.onicecandidate = function (event) { 
			if (event.candidate) { 
			   ws.send(JSON.stringify({ 
					channel: "screen",
					type: "candidate", 
					candidate: event.candidate,
					sender: 'local',
					name: myname,
					clientId: clientId,
					roomName: roomname									
			   })); 
			} 
		};
		 
		localConn.oniceconnectionstatechange = function(event) {
			const peerConnection = event.target;
			console.log('ICE state change event: ', event);
			localConn = peerConnection;
		};

		localConn.onicegatheringstatechange = function() {
			switch(localConn.iceGatheringState) {
				case "new":
				case "complete":
					//label = "Idle";
					console.log(localConn.iceGatheringState);
					//เริ่มส่ง stream ให้ client อัตโนมัติ
					wsHandleStart(null, 'remote', clientId)
				break;
				case "gathering":
					//label = "Determining route";
				break;
			}			
		};

		await mixedStream.getTracks().forEach((track) => {
			localConn.addTrack(track, mixedStream);
		});

		//console.log(screenno);
		await localPeers.push({localConn: localConn, clientId: clientId, screenno: screenNo});

		resolve(localConn);
	});
}

//initiating a call 
function doStartShareScreen() {

	/* Step 1, 2, 3 */
	// create an offer ส่งไปล่ะ 1 client

	for (let i=0; i<localPeers.length; i++){
		delay(2000).then(function() {
			let localConn = localPeers[i].localConn;
			let peerId = localPeers[i].clientId;
			doCreateOffer(localConn, peerId);
		});
	}
}

function doStartSendIndivOffer(clientId) {
	getLocalConnById(clientId).then(function(localConn) {
		if (localConn)	{
			doCreateOffer(localConn, clientId);
			console.log('Send stream to ' + clientId + ' Ready.');
		} else {
			console.log('Can not found localConn. of ' + clientId);
		}
	});

}
function doCreateOffer(localConn, peerId) {
	localConn.createOffer(function (offer) { 
		localConn.setLocalDescription(offer); 
		ws.send(JSON.stringify({ 
			channel: "screen",
			type: "offer", 
			offer: offer ,
			sender: 'local',
			name: myname,
			clientId: peerId,
			roomName: roomname
		})); 

	}, function (error) { 
		alert("WSError when creating an offer"); 
	});
	return localConn;
}
//when somebody sends us an offer 
function wsHandleOffer(offer, sender) {
	/* Step 4, 5, 6, 7 */ 
	/* These steps will be show detail on client side. */
}

//when we got an answer from a remote user
function wsHandleAnswer(answer, sender, clientId) { 
	/* Step 8 */
	//console.log(sender);
	if ((sender === 'remote')){
		//console.log(clientId);
		getLocalConnById(clientId).then(function(localConn) {
			if (localConn){
				localConn.setRemoteDescription(new RTCSessionDescription(answer)).then(
					function() {
						console.log('localConn setRemoteDescription success.');
						console.log(localConn);
						$(statsBox).append('<p style="font-weight: bold;">localConn setRemoteDescription success.</p>');
					}, 	function(error) {
						console.log('localConn Failed to setRemoteDescription:=> ' + error.toString() );
						$(errorBox).append('<p>localConn Failed to setRemoteDescription:' + error.toString() + '</p>');
					}
				);
		  }
		});
	}
};
  
//when we got an ice candidate from a remote user 
function wsHandleCandidate(candidate, sender, AClientId) { 
	//console.log('xsHandleCandidate=> ' + JSON.stringify(candidate));
	if (sender === 'remote') {
		//console.log('All localPeers=> ' + localPeers);
		getLocalConnById(AClientId).then(function(localConn) {
			if (localConn){			
				//console.log('localConn Found=> ' + localConn);
				localConn.addIceCandidate(new RTCIceCandidate(candidate)).then(
					function() {$(statsBox).append('<p style="font-weight: bold;">localConn AddIceCandidate success.</p>');},
					function(error) {$(errorBox).append('<p>localConn Failed to add Ice Candidate:'+ error.toString() + '</p>');}
				);
			}
		});
	}
};

function wsHandleStart(start, sender, AClientId) {
	if (sender==='remote') {
		//console.log('AClientId=> ' + AClientId);
		getLocalConnById(AClientId).then(function(localConn) {
			//console.log('localConn=>', localConn);
			localConn.createOffer(function (offer) { 
				localConn.setLocalDescription(offer); 
				ws.send(JSON.stringify({ 
					channel: "screen",
					type: "offer", 
					offer: offer ,
					sender: 'local',
					name: myname,
					clientId: AClientId,
					roomName: roomname					
				})); 

			}, function (error) { 
				alert("WSError when creating an offer"); 
			});
		});
	}
}

function wsHandleLeave(data) {
	//console.log(data);
	//console.log(localPeers);
	var promiseList = new Promise(function(resolve, reject){
		let otherPeers = localPeers.filter((item) => {
			if (item.clientId !== data.clientId) {
				return item;
			}
		});
		resolve(otherPeers);
	});
	Promise.all([promiseList]).then((ob)=>{
		localPeers = ob[0];
		//console.log(localPeers);
		handleClientDisConnect(data.screenno);
	});
}

function getLocalConnById(clientId) {
	return new Promise(function(resolve, reject) {
		//console.log('clientId:=> ' + clientId);
		//console.log('All Local Peers:=> ' + JSON.stringify(localPeers));
		var result = localPeers.filter(function(item, inx) {
			if(clientId === item.clientId){return (item); }
		});
		//console.log('The Result:=> ' + JSON.stringify(result));
		if (result.length > 0){
			resolve(result[0].localConn);
		}else {
			resolve(null);
		}
	});
}

function getClientIdByNo(screenNo) {
	return new Promise(function(resolve, reject) {
		//console.log('clientId:=> ' + clientId);
		//console.log('All Local Peers:=> ' + JSON.stringify(localPeers));
		var result = localPeers.filter(function(item, inx) {
			if(screenNo === item.screenno){return (item); }
		});
		//console.log('The Result:=> ' + JSON.stringify(result));
		if (result.length > 0){
			resolve(result[0].clientId);
		}else {
			resolve(null);
		}
	});
}

function doSendTest() {
	if (ws.readyState === 1) {
		ws.send(JSON.stringify({
			channel: "media",
			type: "test",
			name: myname,
			sender: 'remote',
			roomName: roomname,	
			test: {start: 'start', channel: 'media', name: myname, id: ws.id, sender: 'remote'} 
		}));  
	}
}

////////////////////////////////////////////////////

//* Media Section *//

function doGetLocalMedia() {
	navigator.mediaDevices.getUserMedia({
		audio: true,
		video: true 
		/*
	    video: {
			width: { ideal: 1280 },
			height: { ideal: 760 } 
	    } 
		*/
	})
	.then(gotMediaStream)
	.catch(function(e) {
		alert('getUserMedia() error: ' + e.name);
	});
}

function gotMediaStream(stream) {
	console.log('Audio localMediaStream', stream.getAudioTracks());
	console.log('Video localMediaStream', stream.getVideoTracks());
	console.log('Adding local media stream.');

	localMediaStream = stream;

	localMediaStream.addEventListener('inactive', function(e) {}, false);
 
	localMediaVideo.srcObject = localMediaStream;

	$("#Mic-On-Cmd").toggle();
	$("#Webcam-On-Cmd").toggle();

	doReadyShareMedia();
}

function doToggleMicrophoneLocalMedia() {
	let meStream = localMediaVideo.srcObject;
	meStream.getTracks().forEach((track) => {
		if (track.kind === 'audio'){
			track.enabled = !track.enabled;
		}
	});
}

function doToggleWebcamLocalMedia() {
	//localMediaStream.getVideoTracks()[0].stop();
	let meStream = localMediaVideo.srcObject;
	meStream.getTracks().forEach((track) => {
		if (track.kind === 'video'){
			track.enabled = !track.enabled;
			/*
			if (track.enabled){
				track.show();
			} else {
				track.hide();
			}
			*/
		}
	});
}

////////////////////////////////////////////////////

//* VChat Section *//


///////////////////////////////////////////////////////

function doGetRequestExitRoom(roomname){
	return new Promise(function(resolve, reject) {
		var url = "/" + rootname + "/exitroom/" + roomname;
		$.get(url, {}, function(data){
			resolve(data);
		}).fail(function(error) { 
			console.log(JSON.stringify(error));
			reject(error); 
		});
	});
}

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

function doCloseBox() {
	for (let i=0; i< idList.length; i++){
		idList.splice(i, 1);
		chatboxManager.removeBox(i);
	}
}

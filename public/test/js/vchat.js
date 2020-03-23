//webrtc.js
/** browser dependent definition are aligned to one and the same standard name **/
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition || window.msSpeechRecognition || window.oSpeechRecognition;

let hostname = window.location.hostname;
let roomname = 'Sanook';
let myname = 'client';
let screenno ='01';

let rootname = window.location.pathname.split('/')[1];

/*
let clientId = '';
มีเหตุการณ์บางเหตุการณ์ที่ไปทำให้ค่า clientId กลายเป็น undifined หลังจาก register และได้ค่า clientId มาแล้ว
แต่ยังหาเหตุการนั้นไม่เจอ จึงต้องเปลี่ยไปใช้ x แทน เพื่อ detect ว่า x.clientId ถูกเปลี่ยนเมื่อไหร่
*/

let x = {
	clientId: '',
	aListener: function(val) {},
	set a(val) {
		this.clientId = val;
		this.aListener(val);
	},
	get a() {
		return this.aInternal;
	},
	registerListener: function(listener) {
		this.aListener = listener;
	}
}

x.registerListener(function(val) {
	alert("Someone changed the value of x.a to " + val);
});

var config = {
	wssHost: 'wss://' + hostname + '/' + rootname + '/' + roomname + '?type=' + myname + '&screenno=' + screenno
};

var localVideo = null, 
	remoteVideo = null, 
	localVideoStream = null,
	videoCallButton = null;
	/* endCallButton = null; */
var localConn = null,

peerConnCfg = {'iceServers': 
		[{'urls': 'stun:58.137.157.66:3478'}, 
		{'urls': 'turn:58.137.157.66:3478', 'credential': 'some-password',	'username': 'some-username'	}]
	};

/*
 const peerConnCfg = { 
	"iceServers": [{ "url": "stun:stun2.1.google.com:19302" }, {'url': 'stun:stun.services.mozilla.com'}]
 }; 
*/

var wsc;

function doConnennectWebsocketServer(wssHost) {
	let ws = new WebSocket(wssHost);

	ws.onmessage = function (evt) {
		var signal = null;
		//if (!localConn) answerCall();
		if (evt.data){
			if ((evt.data !== '') && (evt.data !== 'Hello world')) {
				//console.log('Signal Data: ', (evt.data));
				signal = JSON.parse(evt.data);
				if (signal.type === 'vchat-offer') {
					if (signal.clientId !== x.clientId)	{
						console.log("Received Offer from remote peer.");
						if (localVideoStream)	{
							localConn.setRemoteDescription(new RTCSessionDescription(signal.offer));
							createAndSendAnswer();
						} else {
							let acc = confirm('You have someone try connect, Are you accept this connect?');
						}
					}
				} else if (signal.type === 'vchat-answer') {
					if (signal.clientId !== x.clientId)	{
						console.log("Received Answer from remote peer.");
						localConn.setRemoteDescription(new RTCSessionDescription(signal.answer));
					}
				} else if (signal.type === 'vchat-candidate') {
					//console.log(signal.clientId);
					//console.log(x.clientId);
					if (signal.clientId === x.clientId)	{
						//console.log("Received ICECandidate from remote peer.");
						//console.log("ICECandidate.", signal.candidate);
						localConn.addIceCandidate(new RTCIceCandidate(signal.candidate));
					}
				} else if (signal.type === 'vchat-readyCall') {
					console.log(signal.clientId);
					console.log(x.clientId);
					console.log(signal.callerId);
					if ((signal.clientId === x.clientId) &&  (signal.readyCall))	{
						if (localVideoStream)	{
							videoCallButton.removeAttribute("disabled");
						}
					}
				} else if (signal.type === 'vchat-closeConnection') {
					//console.log(signal.clientId);
					//console.log(x.clientId);
					//console.log(signal.closeConnection);
					if ((signal.clientId === x.clientId) &&  (signal.closeConnection))	{
						console.log("Received 'close call' signal from remote peer.");
						endCall();
						if ((wsc.readyState === 1 ))	{
							wsc.close();
						}
					}
				} else if (signal.type === 'register') {
					console.log('Register Data: ' + JSON.stringify(signal));
					x.clientId = signal.clientId;
					//console.log(x.clientId);
				}
			}
		}
	}
	return ws;
}

function doSocketSend(data) {
	if (/*(wsc.readyState === 0 ) || */ (wsc.readyState === 1 )) {
		wsc.send(JSON.stringify(data));
	} else {
		console.log('I\'m can not send, Your websocket not in ready state.');
	}
}

function pageReady() {

	wsc = doConnennectWebsocketServer(config.wssHost);

	// check browser WebRTC availability 
	if(navigator.getUserMedia) {
		videoCallButton = document.getElementById("videoCallButton");
		//endCallButton = document.getElementById("endCallButton");
		localVideo = document.getElementById('localVideo');
		remoteVideo = document.getElementById('remoteVideo');
		//videoCallButton.removeAttribute("disabled");
		if (callType === 'caller'){
			videoCallButton.addEventListener("click", createAndSendOffer);
		} else if (callType === 'callee'){
			videoCallButton.style.display = 'none'; 
		}
	} else {
		alert("Sorry, your browser does not support WebRTC!")
	}
};

function prepareCall() {
	localConn = new RTCPeerConnection(peerConnCfg);

	localConn.onicecandidate = onIceCandidateHandler;

	localConn.ontrack = onAddStreamHandler;

 	localConn.oniceconnectionstatechange = function(event) {
		const peerConnection = event.target;
		const ref = peerConnection.iceConnectionState;
		if (ref!== "closed" && ref !== "failed" && ref !== "disconnected" && ref !== "completed") {
			localConn = peerConnection;
		}
	};
};

// run start(true) to initiate a call
function initiateCallRemote(fromId, toId, roomName, rootname, sendto) {
	prepareCall();
	// get the local stream, show it in the local video element and send it
	navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(function (stream) {
		localVideoStream = stream;
		localVideo.srcObject = localVideoStream;
		localVideoStream.getTracks().forEach((track) => {
			localConn.addTrack(track, localVideoStream);
		});
		//console.log(fromId, toId, roomName, rootname, sendto, callerId);
		doSendCall(fromId, toId, roomName, rootname, sendto);
	}).catch(function(e) {
		alert('getUserMedia() error: ' + e.name);
	});
};

function initiateAcceptRemoteCall() {
	prepareCall();
	// get the local stream, show it in the local video element and send it
	navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(function (stream) {
		localVideoStream = stream;
		localVideo.srcObject = localVideoStream;
		localVideoStream.getTracks().forEach((track) => {
			localConn.addTrack(track, localVideoStream);
		});
	}).catch(function(e) {
		alert('getUserMedia() error: ' + e.name);
	});
};

function answerCall() {
	prepareCall();
	// get the local stream, show it in the local video element and send it
	navigator.getUserMedia({ "audio": true, "video": true }, function (stream) {
		localVideoStream = stream;
		localVideo.srcObject = localVideoStream;
		localVideoStream.getTracks().forEach((track) => {
			console.log('Local Video Track:=> ' + JSON.stringify(track));
			localConn.addTrack(track, localVideoStream);
		});
	}, function(error) { console.log(error);});
};

function createAndSendOffer() {
	//console.log(x.clientId);
	localConn.createOffer(
		function (offer) {
			var off = new RTCSessionDescription(offer);
			localConn.setLocalDescription(new RTCSessionDescription(off), 
				function() {
					let skdata = {channel: "vchat", type: "vchat-offer", offer: off, sender: 'local', name: myname, clientId: x.clientId, roomName: roomname};
					doSocketSend(skdata);
				}, 
				function(error) { console.log(error);}
			);
		}, 
		function (error) { console.log(error);}
	);
};

function createAndSendAnswer() {
	localConn.createAnswer(
		function (answer) {
			var ans = new RTCSessionDescription(answer);
			//console.log(x.clientId);
			localConn.setLocalDescription(ans, function() {
				let skdata = {channel: "vchat", type: "vchat-answer", answer: ans, sender: 'remote', name: myname, clientId: x.clientId, roomName: roomname};
				doSocketSend(skdata);
			}, 
			function (error) { console.log(error);}
			);
		},
		function (error) {console.log(error);}
	);
};

function onIceCandidateHandler(evt) {
	if (!evt || !evt.candidate) return;
	let skdata = {channel: "vchat", type: "vchat-candidate", candidate: evt.candidate, sender: 'local', name: myname, clientId: x.clientId, roomName: roomname};
	doSocketSend(skdata);
};

function onAddStreamHandler(evt) {
	//console.log('Start Add Stream.', evt.streams[0]);
	videoCallButton.setAttribute("disabled", true);
	//endCallButton.removeAttribute("disabled"); 
	// set remote video stream as source for remote video HTML5 element
	
	let remoteStream = evt.streams[0];
	if (remoteStream) {
		remoteVideo.srcObject = remoteStream;
		remoteStream.onended = e => {
			console.log('Remote Stream End!!');
			remoteVideo.srcObject = null;
		}
	} else {
		alert('Error event stream.');
	}
};

function endCall() {
	//videoCallButton.removeAttribute("disabled");
	//endCallButton.setAttribute("disabled", true);
	checkbox.checked = false;

	if (localVideoStream) {
		localVideoStream.getTracks().forEach(function (track) {
			track.stop();
		});
		localVideo.srcObject = null;
	}
	if (remoteVideo) remoteVideo.srcObject = null;
	if (localConn) {
		localConn.close();
		localConn = null;
	}
};

function doSendCall(fromId, toId, roomName, rootname, sendto, callerId) {
	console.log(fromId, toId, roomName, rootname, sendto, callerId);
	let skdata = {channel: "chat", sendto: sendto, callerId: callerId, type: "message", message: {msgtype: "vcall", fromId: fromId, toId: toId, roomName: roomName, rootname: rootname, clientNo: fromId}, roomName: roomName, rootname: rootname, callerId: callerId};
	doSocketSend(skdata);
}
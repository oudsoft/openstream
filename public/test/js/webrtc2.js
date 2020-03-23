//webrtc.js
/** browser dependent definition are aligned to one and the same standard name **/
navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
window.RTCIceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate || window.webkitRTCIceCandidate;
window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription || window.webkitRTCSessionDescription;
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || window.mozSpeechRecognition 
  || window.msSpeechRecognition || window.oSpeechRecognition;

let hostname = window.location.hostname;
let roomname = 'Sanook';
let myname = 'client';
let screenno ='01';
/*
let clientId = '';
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
	wssHost: 'wss://' + hostname + '/' + roomname + '?type=' + myname + '&screenno=' + screenno
	// wssHost: 'wss://example.com/myWebSocket'
};
var localVideo = null, 
	remoteVideo = null, 
	localVideoStream = null,
	videoCallButton = null, 
	endCallButton = null;
var localConn = null,
	remoteConn = null;
	peerConnCfg = {'iceServers': 
		[{'urls': 'stun:58.137.157.66:3478'}, 
		{'urls': 'turn:58.137.157.66:3478', 'credential': 'some-password',	'username': 'some-username'	}]
	};

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
					console.log(signal.clientId);
					console.log(x.clientId);
					if (signal.clientId !== x.clientId)	{
						console.log("Received Offer from remote peer.");
						localConn.setRemoteDescription(new RTCSessionDescription(signal.offer));
						createAndSendAnswer();
					}
				} else if (signal.type === 'vchat-answer') {
					if (signal.clientId !== x.clientId)	{
						console.log("Received Answer from remote peer.");
						remoteConn.setRemoteDescription(new RTCSessionDescription(signal.answer));
					}
				} else if (signal.type === 'vchat-candidate') {
					console.log("Received ICECandidate from other peer.");
					if (signal.clientId !== x.clientId)	{
						localConn.addIceCandidate(new RTCIceCandidate(signal.candidate));
						remoteConn.addIceCandidate(new RTCIceCandidate(signal.candidate));
					}
				} else if (signal.type === 'register') {
					console.log('Register Data: ' + JSON.stringify(signal));
					x.clientId = signal.clientId;
					console.log(x.clientId);
				} else if (signal.closeConnection){
					console.log("Received 'close call' signal from remote peer.");
					endCall();
				}
			}
		}
	}
	return ws;
}

function pageReady() {

	wsc = doConnennectWebsocketServer(config.wssHost);

	// check browser WebRTC availability 
	if(navigator.getUserMedia) {
		videoCallButton = document.getElementById("videoCallButton");
		endCallButton = document.getElementById("endCallButton");
		localVideo = document.getElementById('localVideo');
		remoteVideo = document.getElementById('remoteVideo');
		videoCallButton.removeAttribute("disabled");
		if (callType === 'caller'){
			videoCallButton.addEventListener("click", createAndSendOffer);
		} else if (callType === 'callee'){
			videoCallButton.style.display = 'none'; 
		}
		endCallButton.addEventListener("click", function (evt) {
			wsc.send(JSON.stringify({
				/* "closeConnection": true */
				channel: "vchat",
				type: "vchat-closeConnection", 
				closeConnection: true,
				sender: 'local',
				name: myname,
				clientId: x.clientId,
				roomName: roomname						
			}));
		});
	} else {
		alert("Sorry, your browser does not support WebRTC!")
	}
};

function prepareCall() {
	localConn = new RTCPeerConnection(peerConnCfg);
	remoteConn = new RTCPeerConnection(peerConnCfg);
	// send any ice candidates to the other peer
	localConn.onicecandidate = onIceCandidateHandler;
	remoteConn.onicecandidate = onIceCandidateHandler;
	// once remote stream arrives, show it in the remote video element
	remoteConn.ontrack = onAddStreamHandler;

 	remoteConn.oniceconnectionstatechange = function(event) {
		console.log('ICE state change event: ', event);
		//console.log("ICE connection state change: " + event.target.iceConnectionState);
		const peerConnection = event.target;
		const ref = peerConnection.iceConnectionState;
		if (ref!== "closed" && ref !== "failed" && ref !== "disconnected" && ref !== "completed") {
			localConn = peerConnection;
		}
	};
};

// run start(true) to initiate a call
function initiateCallRemote() {
	prepareCall();
	// get the local stream, show it in the local video element and send it
	navigator.mediaDevices.getUserMedia({audio: true, video: true}).then(function (stream) {
		console.log('got stream=> ' + JSON.stringify(stream));
		localVideoStream = stream;
		localVideo.srcObject = localVideoStream;
		//localConn.addStream(localVideoStream);
		localVideoStream.getTracks().forEach((track) => {
			console.log('Local Video Track:=> ' + JSON.stringify(track));
			localConn.addTrack(track, localVideoStream);
		});
		//createAndSendOffer();	
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
		//localConn.addStream(localVideoStream);
		localVideoStream.getTracks().forEach((track) => {
			console.log('Local Video Track:=> ' + JSON.stringify(track));
			localConn.addTrack(track, localVideoStream);
		});
		//createAndSendAnswer();
	}, function(error) { console.log(error);});
};

function createAndSendOffer() {
	console.log(x.clientId);
	remoteConn.createOffer(
		function (offer) {
			var off = new RTCSessionDescription(offer);
			remoteConn.setLocalDescription(new RTCSessionDescription(off), 
				function() {
					wsc.send(JSON.stringify({
						/* "sdp": off */
						channel: "vchat",
						type: "vchat-offer", 
						offer: off,
						sender: 'local',
						name: myname,
						clientId: x.clientId,
						roomName: roomname						
					}));
					console.log('remoteConn.setLocalDescription succes.');
				}, 
				function(error) { console.log(error);}
			);
		}, 
		function (error) { console.log(error);}
	);
};

function createAndSendAnswer() {
	//if (x.clientId !== '') {
		localConn.createAnswer(
			function (answer) {
				var ans = new RTCSessionDescription(answer);
				//console.log(x.clientId);
				localConn.setLocalDescription(ans, function() {
					wsc.send(JSON.stringify({
						/* "sdp": ans */
						channel: "vchat",
						type: "vchat-answer", 
						answer: ans,
						sender: 'remote',
						name: myname,
						clientId: x.clientId,
						roomName: roomname			
					}));
					console.log('localConn.setLocalDescription succes.');
				}, 
				function (error) { console.log(error);}
				);
			},
			function (error) {console.log(error);}
		);
	//}
};

function onIceCandidateHandler(evt) {
	if (!evt || !evt.candidate) return;
	wsc.send(JSON.stringify({
		/*"candidate": evt.candidate */
		channel: "vchat",
		type: "vchat-candidate", 
		candidate: evt.candidate,
		sender: 'local',
		name: myname,
		clientId: x.clientId,
		roomName: roomname									
	}));
};

function onAddStreamHandler(evt) {
	console.log('Start Add Stream.', evt.streams[0]);
	videoCallButton.setAttribute("disabled", true);
	endCallButton.removeAttribute("disabled"); 
	// set remote video stream as source for remote video HTML5 element
	
	//remoteVideo.srcObject = evt.stream;
	
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
	endCallButton.setAttribute("disabled", true);
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

//index.js
let hostname = '';
let ws = null;

let rootname = window.location.pathname.split('/')[1];

let urlParams = location.search.split(/[?&]/).slice(1).map(function(paramPair) {
				return paramPair.split(/=(.+)?/).slice(0, 2);
			}).reduce(function (obj, pairArray) {            
				obj[pairArray[0]] = pairArray[1];
				return obj;
			}, {});
let roomname = 'Admin';

//let myname = 'user_1';

function doConnect(ARoomName) {
	ws = new WebSocket('wss://' + hostname + '/' + rootname + '/' + roomname + '/' + ARoomName);
	ws.onopen = function () {
		console.log('Websocket is connected to the signaling server');
	}
	ws.onmessage = function (msg) {
		var data = JSON.parse(msg.data);
		console.log(data);

		$("#chat_div").chatbox("option", "boxManager").addMsg(data.sendto, data.message.msg, data.message.msgtype);
	}
}




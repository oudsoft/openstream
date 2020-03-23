module.exports = ( wssArg ) => { 

	wssArg.on('connection', function (ws, req) {
		//ws.send("Hello world");  

		let fullReqPaths = req.url.split('?');
		let wssPath = fullReqPaths[0];
		console.log('Client Connect with path=> ' + wssPath);
		//wssPath = wssPath.substring(1);
		wssPath = wssPath.split('/');
		console.log('path Snippet+> ' + wssPath);
		let rootname = wssPath[1];
		let roomname = wssPath[2];
		let username = wssPath[3];
		ws.rootname = rootname;
		ws.roomname = roomname;
		ws.username = username;

		/*
		let queries = fullReqPaths[1].split('&');
		let connType = queries[0].split('=');
		let screenno = queries[1].split('=');
		*/

		ws.on('message', function (message) {
			var data; 
			//{rootname, roomname, username<sender>, message: {sendto, msgtype, msg, timestamp}}
			//accepting only JSON messages 
			try { 
				data = JSON.parse(message); 
			} catch (e) { 
				console.log("Invalid JSON"); 
				data = {}; 
			}

			//switching type of the user message 
			switch (data.type) { 
				case "message": 
					console.log("WS Receive message from: " + data.sender + " to " + data.recver);	
					console.log("Data : ", JSON.stringify(data));
					wss.clients.forEach(function each(client) {
						//console.log(client.readyState);
						if (client.readyState === 1 ) {
							console.log('client.rootname : client.roomname => ' + client.rootname + ' : ' + client.roomname);
							console.log('data.rootname : data.roomname => ' + data.rootname + ' : ' + data.roomname);
							if ((client.rootname === data.rootname) && ((client.roomname === data.roomname))) {
								let dataSend = {rootname: data.rootname, roomname: data.roomname, sender: data.sender, recver: data.recver, message: {msgtype: data.message.msgtype, msg: data.message.msg}, timestamp: new Date()};
								if (data.recver === 'all') {
									client.send(JSON.stringify(dataSend));
								} else if (data.recver === client.username) {
									client.send(JSON.stringify(dataSend));
								}
							}
						}
					});
		    		break;
					
			}
		});

		ws.on('close', function(ws, req) {
			console.log(`WS Conn Url : ${ws} Close.`);	
			console.log('Check=> ', ws, req); //reasonCode, description
		});

	});

	return  wss; 	
}


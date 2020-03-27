//utility.js
const delay = t => new Promise(resolve => setTimeout(resolve, t));
/*
	usage
	delay(3000).then(() => console.log('Hello'));
*/

/*
	การ cast ตัวเลขเป็น boolean
	เดิมใช้วิธีนี้
	a = a !== 0;
	ย่อเหลือเพียง
	a = !!a;
*/

/*
	กรองคำหยาบ
*/

const wordrude = new Array ( "ashole","a s h o l e","a.s.h.o.l.e","bitch","b i t c h","b.i.t.c.h","shit","s h i t","s.h.i.t","fuck","dick","f u c k","d i c k","f.u.c.k","d.i.c.k","มึง","มึ ง","ม ึ ง","ม ึง","มงึ","มึ.ง","มึ_ง","มึ-ง","มึ+ง","กู","ควย","ค ว ย","ค.ว.ย","คอ วอ ยอ","คอ-วอ-ยอ","ปี้","เหี้ย","ไอ้เหี้ย","เฮี้ย","ชาติหมา","ชาดหมา","ช า ด ห ม า","ช.า.ด.ห.ม.า","ช า ติ ห ม า","ช.า.ติ.ห.ม.า","สัดหมา","สัด","เย็ด","หี","สันดาน","แม่ง","ระยำ","ส้น ตีน","แตด", "ชิงหมาเกิด", "ไอ้เปรต", "อีเปรต" );

const pingWSDelayTime = 89000;
//const pingWSDelayTime = 40000;

let clientProfiles = [];

let isLockScreenMsg = false;

let remoteJoinHandle = false;

function ckeckrude( data ){
	//block คำหยาบ และประโยคที่จะนำมาแทนที่
	const rudemarkOpenTag = '<span style="color:red">';
	const rudemarkCloseTag = '</span>';

	for ( n = 0 ; n < wordrude.length ; n++ ){
		let rude = wordrude[n];
		let pattern = new RegExp( rude , "gi" );
		data = data.replace( pattern , (rudemarkOpenTag + rude + rudemarkCloseTag) );
	};
	return data;
};

function doCheckRude(data){
	var isRude = false;
	for ( n = 0 ; n < wordrude.length ; n++ ){
		var patt = new RegExp(wordrude[n]);
		var isRude = patt.test(data);
		if (isRude) {
			break;
			return isRude;
		}
	}
	return isRude;	
}

/*
	zero fill
*/
function zeroFill( number, width ){
	width -= number.toString().length;
	if ( width > 0 ){
		return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
	}
	return number + ""; // always return a string
}

function padZero(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

function urlQueryToObject(url) {	
	let result = url.split(/[?&]/).slice(1).map(function(paramPair) {
				return paramPair.split(/=(.+)?/).slice(0, 2);
		}).reduce(function (obj, pairArray) {            
				obj[pairArray[0]] = pairArray[1];
				return obj;
		}, {});
	return result;
}

function initScreenProfileClient(AClientNo) {
	clientProfiles = [];
	const userProfile = document.createElement('h2');
	userProfile.id = 'ClientProfileMark';
	userProfile.textContent = AClientNo;
	userProfile.className = 'ClientProfile';
	userProfile.classList.add('ClientStatusOff');
	userProfile.addEventListener("click", function(e){
		let isOnStatus = getCurrentConnectionStatus({screenNo: AClientNo});
		let event = new CustomEvent("ClientProfileClick", { "detail": {screenNo: AClientNo, roomName: roomname, isOnStatus}});
		document.dispatchEvent(event);
	});
	screenProfile.appendChild(userProfile);
	clientProfiles.push(userProfile);
}

function initScreenProfileMaster(params) {
	doRequestRoomsize(params).then((data) => {
		let dummyRegister = {screenNo: '00', clientId : '', masterNo: '00', masterId: '', roomName: params.roomname, roomsize: data.roomsize};
		handleRegister(dummyRegister);
	});
}

/* Messaging Management Share Section */

function handleMessage(message){
	console.log('Message From Client: ' + JSON.stringify(message));
	if (message.msgtype === 'vcall') {
		if (message.fromId !== screenno){
			$('#VideoCallInteruptPopup').dialog('option', 'title', 'You have Video Call from ' + message.fromId);
			$('#VideoCallInteruptPopup').dialog('open');
			$('#AcceptCmd').attr( "onclick", "doAceptVchat('" + roomname + "', '" + screenno + "', '" + message.fromId + "', '" + message.callerId + "')" );
			$('#NotAcceptCmd').attr( "onclick", "doNotAcceptInterupt('" + message.callerId + "')" );
		}
	}else if (message.msgtype === 'youtube') {
		let event = new CustomEvent("SwithYoutube", { "detail": {url: message.msg, videowidth: message.videowidth, videoheight: message.videoheight}});
		document.dispatchEvent(event);
	}else if (message.msgtype === 'callback') {
		let event = new CustomEvent("SwithBackRoom", { "detail": {}});
		document.dispatchEvent(event);
	} else {
		if (!isLockScreenMsg) {
			var timeStamp = new Date(message.timestamp);
			var frameMessage = document.createElement('div');
			frameMessage.className = 'FrameMessage';
			var newMessage = document.createElement('div');
			if (message.msgtype === 'text') {
				if (message.msg.indexOf('http') === 0) {
					newMessage.innerHTML = '<a href="' + message.msg + '" target="_blank">' + message.msg + '</a>';
				} else {
					newMessage.textContent = message.msg;	
				}
			} else if (message.msgtype === 'image') {
				newMessage.innerHTML = '<a href="' + message.msg + '" target="_blank"><img src="' + message.msg + '" width="80px" height="auto"/></a>';
			}
			if (message.fromId === screenno){
				newMessage.className = 'SelfMessage';
				var senderMessage = document.createElement('p');
				senderMessage.textContent = `ฉัน  เมื่อ ${timeStamp.getHours()}:${timeStamp.getMinutes()}`;	
				senderMessage.className = 'MeSenderMessage';
				frameMessage.appendChild(newMessage);
				frameMessage.appendChild(senderMessage);
			} else {
				var senderLogoProfile = document.createElement('div');
				senderLogoProfile.textContent = message.fromId;
				senderLogoProfile.className = 'SenderLogoProfile';
				senderLogoProfile.classList.add('ClientStatusOn');
				senderLogoProfile.addEventListener("click", function(e){
					//show user profile popup & interface to vchat.
					message.clientNo = clientNo;
					//toggleModal(message);
					let event = new CustomEvent("ClientLogoClick", { "detail": message});
					document.dispatchEvent(event);
				});
				newMessage.className = 'OtherMessage';
				var senderMessage = document.createElement('p');
				senderMessage.textContent = `จาก  ${message.fromId} เมื่อ ${timeStamp.getHours()}:${timeStamp.getMinutes()}`;	
				senderMessage.className = 'SenderMessage';
				frameMessage.appendChild(senderLogoProfile);
				frameMessage.appendChild(newMessage);
				frameMessage.appendChild(senderMessage);
				
				let notiMsg = `มีข้อความจาก  ${message.fromId} เขียนว่า ${message.msg}`;
				$.notify(notiMsg, 'success', {position: 'right bottom'});
			}
			msgScreen.appendChild(frameMessage);
			msgScreen.scrollIntoView();
			scrollToBottom(msgScreen);
		}
	}
}

function handleRegister(data) {
	console.log('Initial Register Data: ' + JSON.stringify(data));
	screenProfile.innerHTML = "";
	clientProfiles = [];
	const userProfile = document.createElement('div');
	userProfile.id = 'ClientProfileMark';
	userProfile.innerHTML = '<b>' + data.screenNo + '</b>';
	clientId = data.clientId;
	userProfile.addEventListener("click", function(e){
		let isOnStatus = getCurrentConnectionStatus({screenNo: data.screenNo});
		let event = new CustomEvent("ClientProfileClick", { "detail": {screenNo: data.screenNo, clientId : data.clientId, roomName: data.roomName, isOnStatus} });
		document.dispatchEvent(event);
	});
	/*
	userProfile.addEventListener("ChangeScrenNo", function(e){
		console.log(e.detail.screenNo);
		userProfile.innerHTML = '<b>' + e.detail.screenNo + '</b>';
	});
	*/
	userProfile.className = 'ClientProfile';
	//console.log(doGetWsState());
	if ((doGetWsState() == 0) || (doGetWsState() == 1)){
		userProfile.classList.add('ClientStatusOn');
		userProfile.classList.remove('ClientStatusOff');
	} else {
		userProfile.classList.add('ClientStatusOff');
		userProfile.classList.remove('ClientStatusOn');
	}
	screenProfile.appendChild(userProfile);
	clientProfiles.push(userProfile);
	clientId = data.clientId;
	clientNo = data.clientNo;
	if (data.masterId){
		masterId = data.masterId;
		//console.log('data.masterId: ' + data.masterId);
	}
	if (data.masterNo){
		masterNo = data.masterNo;
	}

	if (data.screenNo === '00') {
		roomsize = Number(data.roomsize);
		if (roomsize > 0){
			let clients = [];
			for (let i=1; i <= roomsize; i++) { let clno = padZero(i, 2); clients.push(clno); }
			//console.log(clients);
			clients.forEach((item)=>{
				let clientProfile = document.createElement('div');
				clientProfile.innerHTML = '<b>' + item + '</b>';
				clientProfile.addEventListener("click", function(e){
					let isOnStatus = getCurrentConnectionStatus({screenNo: item});
					let event = new CustomEvent("ClientProfileClick", { "detail": {screenNo: item, roomName: data.roomName, isOnStatus, clientId: clientId}});
					document.dispatchEvent(event);
				});
				clientProfile.className = 'ClientProfile';
				clientProfile.classList.add('ClientStatusOff');
				clientProfile.dataset.status = 0;
				clientProfiles.push(clientProfile);
			});
		} else {
			//Unlimited Type
			let clientProfile = document.createElement('div');
			clientProfile.innerHTML = '<b>V</b>';
			clientProfile.addEventListener("click", function(e){
				let event = new CustomEvent("ToggleUnlimitedClientProfile", { "detail": {}});
				document.dispatchEvent(event);
			});
			clientProfile.className = 'ClientProfile';
			clientProfiles.push(clientProfile);
		}
		clientProfiles.forEach((item)=>{
			screenProfile.appendChild(item);
		});		
	}
	return screenProfile;
}

function handleNewClientConnect(data){
	//console.log(JSON.stringify(data));
	let clientTarget = clientProfiles.filter((item) => {
		if (item.textContent === data.screenNo) return item;
	});
	//console.log(clientTarget);
	if (clientTarget.length > 0) {
		clientTarget[0].classList.remove('ClientStatusOff');
		clientTarget[0].classList.add('ClientStatusOn');
		clientTarget[0].dataset.status = 1;
	}
}

function getCurrentConnectionStatus(data){
	//console.log(JSON.stringify(data));
	let clientTarget = clientProfiles.filter((item) => {
		if (item.textContent === data.screenNo) return item;
	});
	//console.log(clientTarget);
	if (clientTarget.length > 0) {
		/*
		var classList = clientTarget[0].className.split(/\s+/);
		for (var i = 0; i < classList.length; i++) {
			console.log(classList[i]);
		}
		*/
		return clientTarget[0].classList.contains('ClientStatusOn');
	} else {
		return false;
	}
}

		let doShowUserProfile = function(screenno) {
			isLockScreenMsg = true;
			let params = { roomname: roomname, screenno: screenno, rootname: rootname};
			console.log('params for request user data => ', params);
			doRequestUserProfile(params).then((user) => {
				console.log('user data => ', user);
				if (user) {
					msgScreen.innerHTML = "";
					let displaynameBox = document.createElement('div');
					displaynameBox.style.textAlign = 'center';
					let displaynamePar = document.createElement('div');
					displaynamePar.setAttribute("id", 'DisplayName');
					displaynamePar.style.textAlign = 'center';
					displaynamePar.style.padding = '10px';
					if (user.profile.displayname) {
						displaynamePar.innerHTML = '<h3>' + user.profile.displayname + '</h3>';
					} else {
						displaynamePar.innerHTML = '<h3>undefined</h3>';
					}
					displaynameBox.appendChild(displaynamePar);

					let avatarSrc;					
					if (user.profile.avatarUrl) {
						avatarSrc = user.profile.avatarUrl;
					} else {
						avatarSrc = '/' + rootname + '/imgs/logo/who.png';
					}
					let avatarBox = document.createElement('div');
					avatarBox.style.textAlign = 'center';
					let avatarImg = document.createElement('img');
					avatarImg.setAttribute("id", 'avatarImg');
					avatarImg.setAttribute("src", avatarSrc);
					avatarImg.setAttribute("width", '80px');
					avatarImg.setAttribute("height", '80px');
					avatarBox.appendChild(avatarImg);

					msgScreen.appendChild(avatarBox);

					msgScreen.appendChild(displaynameBox);

					let controlClientCmdDiv = document.createElement('div');
					controlClientCmdDiv.style.textAlign = 'center';
					controlClientCmdDiv.classList.add('AlignBottom');
					let sendStreamCmd = document.createElement('button');
					sendStreamCmd.textContent = 'Send Stream';
					sendStreamCmd.addEventListener("click", function(e){
						doStartSendIndivOffer(user.screen.clientId);
					});
					controlClientCmdDiv.appendChild(sendStreamCmd);

					msgScreen.appendChild(controlClientCmdDiv);

					doSaveProfileAndRollbackMsgScreen();

				} else {
					msgScreen.innerHTML = "";
					let systemErrorMsg = document.createElement('h2');
					systemErrorMsg.textContent = 'System Error.';
					msgScreen.appendChild(systemErrorMsg);	
					doSaveProfileAndRollbackMsgScreen();
				}
			});
		}

		let doShowEditUserProfileForm = function(screenno) {
			isLockScreenMsg = true;
			let params = { roomname: roomname, screenno: screenno, rootname: rootname};
			console.log('params for request user data => ', params);
			doRequestUserProfile(params).then((user) => {
				console.log('user data => ', user);
				if (user) {
					msgScreen.innerHTML = "";
					let displaynameBox = document.createElement('div');
					displaynameBox.style.textAlign = 'center';
					let displaynamePar = document.createElement('div');
					displaynamePar.setAttribute("id", 'DisplayName');
					displaynamePar.style.textAlign = 'center';
					displaynamePar.style.padding = '10px';
					if (user.profile.displayname) {
						displaynamePar.innerHTML = '<h3>' + user.profile.displayname + '</h3>';
					} else {
						displaynamePar.innerHTML = '<h3>undefined</h3>';
					}
					displaynameBox.appendChild(displaynamePar);
					let editButton = document.createElement('button');
					editButton.textContent = 'แก้ไข';
					editButton.addEventListener("click", function(e){
						//เปิดช่องทาง edit displayname
						let newDisplayName = prompt('Please type your display name', 'Someone');
						if (newDisplayName){
							let params = {displayname: newDisplayName, screenno: screenno};
							updatedisplayname(params).then((resp) => {
								displaynamePar.innerHTML = '<h3>' + resp.newdisplayname + '</h3>';
							});
						} else {
							alert('Display name is blank, can not update');
						}
					});
					displaynameBox.appendChild(editButton);

					let uploadToolBox = document.createElement('div');	
					uploadToolBox.style.textAlign = 'center';				
					let uploadButton = document.createElement('input');
					uploadToolBox.appendChild(uploadButton);

					let uploadCmd = document.createElement('input');
					uploadToolBox.appendChild(uploadCmd);
					uploadCmd.setAttribute("type", 'button');
					uploadCmd.setAttribute("value", 'เปลี่ยน...');
					uploadCmd.setAttribute("onClick", "document.getElementById('fileupload').click()");

					//uploadButton.textContent = 'Change...';
					uploadButton.setAttribute("type", 'file');
					uploadButton.setAttribute("id", 'fileupload');
					uploadButton.setAttribute("name", 'photos');
					uploadButton.setAttribute("onChange", 'return uploadImage("' + screenno + '")');

					let avatarSrc;					
					if (user.profile.avatarUrl) {
						avatarSrc = user.profile.avatarUrl;
					} else {
						avatarSrc = '/' + rootname + '/imgs/logo/who.png';
					}
					let avatarBox = document.createElement('div');
					avatarBox.style.textAlign = 'center';
					let avatarImg = document.createElement('img');
					avatarImg.setAttribute("id", 'avatarImg');
					avatarImg.setAttribute("src", avatarSrc);
					avatarImg.setAttribute("width", '80px');
					avatarImg.setAttribute("height", '80px');
					avatarBox.appendChild(avatarImg);

					msgScreen.appendChild(avatarBox);

					msgScreen.appendChild(uploadToolBox);

					msgScreen.appendChild(displaynameBox);
					doSaveProfileAndRollbackMsgScreen();

					uploadButton.style.display = 'none';
				} else {
					msgScreen.innerHTML = "";
					let systemErrorMsg = document.createElement('h2');
					systemErrorMsg.textContent = 'System Error.';
					msgScreen.appendChild(systemErrorMsg);	
					doSaveProfileAndRollbackMsgScreen();
				}				
			});
		}

		let doSaveProfileAndRollbackMsgScreen = function() {
			let rollbackcmd = document.createElement('div');
			rollbackcmd.style.textAlign = 'center';
			rollbackcmd.style.padding = '30px';
			let okButton = document.createElement('button');
			okButton.textContent = 'OK';
			okButton.addEventListener("click", function(e){
				//rollback
				msgScreen.innerHTML = backupMsgContent;
				isFirstClick = true;
			});
			let howtoback = document.createElement('p');
			howtoback.textContent = 'Click OK button for back.';
			rollbackcmd.appendChild(howtoback);
			rollbackcmd.appendChild(okButton);
			msgScreen.appendChild(rollbackcmd);

			isLockScreenMsg = false;
		}

function handleClientDisConnect(AClientNo){
	let clientTarget = clientProfiles.filter((item) => {
		if (item.textContent === AClientNo) return item;
	});
	//console.log('Client Disconnect=> ',clientTarget);
	if (clientTarget.length > 0) {
		clientTarget[0].classList.remove('ClientStatusOn');
		clientTarget[0].classList.add('ClientStatusOff');
	}
	let otherClients = clientConecteds.filter((item) => {
		if (item.clientNo === AClientNo) return item;
	});
	clientConecteds = otherClients;
}

function scrollToBottom(e) {
  e.scrollTop = e.scrollHeight - e.getBoundingClientRect().height;
}

function handleRefreshWindow() {
	console.log('<<Client Refresh>>');
	window.location.reload(true); 
}


function doRequestRoomsize(params){
	return new Promise(function(resolve, reject) {
		var url = "/" + params.rootname + "/roomsize/" + params.roomname;
		$.get(url, params, function(data){
			resolve(data);
		}).fail(function(error) { 
			console.log(JSON.stringify(error));
			reject(error); 
		});
	});
}

function doRequestUserProfile(params){
	console.log(params);
	return new Promise(function(resolve, reject) {
		var url = "/" + params.rootname + "/getuserprofile";
		$.post(url, params, function(data){
			resolve(data);
		}).fail(function(error) { 
			console.log(JSON.stringify(error));
			reject(error); 
		});
	});
}

let updatedisplayname = function(params) {
	return new Promise(function(resolve, reject) {
		var url = "/" + rootname + "/updatedisplayname/" + roomname + "/" + params.screenno;
		$.post(url, params, function(data){
			console.log('Updateed.', data);
			resolve(data);
		}).fail(function(error) { 
			console.log(JSON.stringify(error));
			reject(error); 
		});
	});
}

let uploadImage = function (screenno) {
	const defSize = 200000;
	var fileSize = $('#fileupload')[0].files[0].size;
	if (fileSize <= defSize) {
		var uploadUrl = "/" + rootname+ "/uploadavatar/" + roomname + '/' + screenno;
		$('#fileupload').simpleUpload(uploadUrl, {
			success: function(data){
				//console.log('Uploaded.', data);
				$('#avatarImg').attr('src', data.link);
			}
		});
	} else {
		alert('File not excess ' + defSize + ' Byte.');
	}
}

function doGetRootName(){
	let paths = window.location.pathname.split('/');
	return paths[1];
}

function requestFullScreen(element) {
	return new Promise(function(resolve, reject) {
		// Supports most browsers and their versions.
		var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;
		if (requestMethod) { // Native full screen.
			requestMethod.call(element);
			var width = window.innerWidth;
			var height = window.innerHeight;
			resolve({width: width, height: height});
		} else if (typeof window.ActiveXObject !== "undefined") { // Older IE.
			var wscript = new ActiveXObject("WScript.Shell");
			if (wscript !== null) {
				wscript.SendKeys("{F11}");
			}
			resolve(null);
		}
	});
}

function isMobile() {
    if (sessionStorage.desktop) // desktop storage 
        return false;
    else if (localStorage.mobile) // mobile storage
        return true;
    // alternative
    var mobile = ['iphone','ipad','android','blackberry','nokia','opera mini','windows mobile','windows phone','iemobile']; 
    for (var i in mobile) if (navigator.userAgent.toLowerCase().indexOf(mobile[i].toLowerCase()) > 0) return true;
    // nothing found.. assume desktop
    return false;
}

/* Vchat section */

function doNotAcceptInterupt(callerId) {
	wasRejectCall(callerId);
	$('#VideoCallInteruptPopup').dialog('close');
}

function doAceptVchat(roomname, screenno, caller, sendtoId) {
	let contentHtml;
	if (screenno === '00') {
		contentHtml = 'content/vconf.html';
	} else {
		contentHtml = 'content/vchat.html';
	}
	$('#VideoCallInteruptPopup').dialog('close');
	$('#VchatPopup').dialog('option', 'title', 'Video Call');
	$('#VchatPopup').dialog('option', 'width', '720');
	$('#VchatPopup').dialog('option', 'height', 'auto');
	$('#VchatPopup').dialog('open');
	$('#VchatContent').load(contentHtml, function() {
		//console.log(roomname, screenno, caller, sendtoId);
		initCallee(sendtoId, clientId);
	});
}

function doCloseVchatPopup() {
	$('#VchatPopup').dialog('close');
}

jQuery.loadScript = function (url, callback) {
    jQuery.ajax({
        url: url,
        dataType: 'script',
        success: callback,
        async: true
    });
}
/* usesage 
if (typeof someObject == 'undefined') $.loadScript('url_to_someScript.js', function(){
    //Stuff to do after someScript has loaded
});
*/
let wasLoadSimpleUpload = false;
function doLoadSimpleUpload() {
	if (!wasLoadSimpleUpload) {
		const simpleUploadUrl = '/openstream/lib/simpleUpload.min.js';
		$.loadScript(simpleUploadUrl, function(){
		    console.log(simpleUploadUrl, 'was loades.');
		});
		wasLoadSimpleUpload = true;
	}
}

(function ( $ ) {
    $.fn.greenify = function() {
        this.css( "color", "white" );
        this.css( "background-color", "green" );
        return this;
    };
 
    $.fn.reddy = function() {
        this.css( "color", "white" );
        this.css( "background-color", "red" );
        return this;
    };
    $.fn.normally = function() {
        this.css( "color", "gray" );
        this.css( "background-color", "" );
        return this;
    };

}( jQuery ));

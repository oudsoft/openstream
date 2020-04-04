//QRCodeGenerator.js
const colors = require('colors/safe');
const imageFileExName = '.png';  
const publicDir = 'public';
const qrDir = 'imgs/qr/entery';

const QRCodeGenerator = (entryType, roomId, roomName, screenId, screenNo, hostname, rootname, callee='', callback = null) => {
	let imageFileName = roomName;
	
	const {registerFont, createCanvas, createImageData} = require('canvas');
	registerFont('public/font/THSarabunNew.ttf', { family: 'THSarabunNew' });
	registerFont('public/font/EkkamaiStandard-Light.ttf', { family: 'EkkamaiStandard-Light' });
	const imageHeigth = 470;
	const imageCanvas = createCanvas(400, imageHeigth);
	const qrcodeCanvas = createCanvas(400, 400);
	const ctx = imageCanvas.getContext('2d');
	/***********************/
	//for filling color background
	ctx.globalAlpha = 0.8;
	ctx.fillStyle = "yellow";
    ctx.fillRect(0,0,400,imageHeigth);
	ctx.fill();
	
	/*
	ctx.font = 'bold 30px "THSarabunNew"'
	ctx.fillStyle = 'black';
	ctx.textAlign = 'center';
	ctx.fillText("ขอบคุณที่ใช้บริการ " + creatorName, 200, 430);

	const mrqrCanvas = require('canvas');
	var mrqrLogoPath =  __dirname + '/imgs/mrqrlogo.png';
	var mrqrLogoImage = new mrqrCanvas.Image; 
	mrqrLogoImage.src = mrqrLogoPath;
	ctx.drawImage(mrqrLogoImage, 10, 467, 100, 100);

	var mrqrPath = '';
	if (apiSubLink == 'line'){
		mrqrPath =  __dirname + '/imgs/769gkhoz.png';
	} else {
		mrqrPath =  __dirname + '/imgs/mrqr-web-qr.png';
	}
	var mrqrImage = new mrqrCanvas.Image; 
	mrqrImage.src = mrqrPath;
	ctx.drawImage(mrqrImage, 290, 467, 100, 100);
	*/

	let QRText = 'https://' + hostname + '/' + rootname; 
	const entryPoint = QRText;

	let scrnNo = '';
	
	if (entryType==='master') {
		scrnNo = '00';
		QRText += '/master/' + roomName;
		QRText += '/' + scrnNo;
		imageFileName += '-' + scrnNo;
	} else if (entryType==='client') {
		scrnNo = screenNo;
		QRText += '/client/' + roomName
		QRText += '/m/' + scrnNo;
		imageFileName += '-' + scrnNo;
	} else if (entryType==='vchat') {
		scrnNo = screenNo;
		QRText += '/vchat/' + roomName + '/calee/';
		QRText += scrnNo + '/' + callee;	
		imageFileName += '-' + 'vchat-' + callee;
	}

	let filename = imageFileName + imageFileExName;
	//console.log(colors.blue("QRText : ") + colors.yellow(QRText));
	const QRCode = require('qrcode');
	QRCode.toCanvas(qrcodeCanvas, QRText, function (error) {
		//console.log(error);
		ctx.drawImage(qrcodeCanvas, 0, 0, 400, 400);
		/*		
		ctx.fillStyle = "yellow";
		ctx.fillRect(210,4,150,20);
		ctx.fill();
		*/

		ctx.font = 'bold 16px "EkkamaiStandard-Light"'
		ctx.fillStyle = 'black';
		ctx.textAlign = 'left';
		ctx.fillText('ชื่อห้อง: ' + roomName, 10, 425);
		ctx.fillText('หมายเลขจอ: ' + scrnNo, 10, 445);

		ctx.font = 'bold 15px "EkkamaiStandard-Light"'
		ctx.fillStyle = 'black';
		ctx.textAlign = 'left';
		ctx.fillText(entryPoint, 10, 465);

		var fs = require('fs');
		var parentPath = require('path').resolve(__dirname, '..');
		var imagePath =  parentPath + "/"  + publicDir + '/' + qrDir + '/' + filename;
		const out = fs.createWriteStream(imagePath);
		const stream = imageCanvas.createPNGStream();
		stream.pipe(out);
		out.on('finish', () =>  {
			var imageLink = '/' + rootname + '/' + qrDir + '/' + filename;
			callback(imageLink);
		});
	});
};

module.exports = QRCodeGenerator;

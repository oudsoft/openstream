//BillGenerator.js
require('dotenv').config();
const util = require('util');
const express = require('express');
const flash = require('connect-flash');
const fs = require('fs');
const path = require('path');
const request = require('request');
const session = require("express-session");
const colors = require('colors/safe');
const imageFileExName = '.png';  
const publicDir = 'public';
const billDir = 'imgs/bill';

const pool = require('./dbpool.js').getPool();

function doLoadBillData(logid){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select bill.id, bill.logid, bill.customername, bill.customertelno, bill.lastupd, paymentlog.agencyid, paymentlog.roomtype, paymentlog.roomname, paymentlog.amount from bill, paymentlog where (bill.logid = paymentlog.id) and (paymentlog.id = $1)";
			client.query(sqlCmd, [logid]).then(res => {
				if (res.rowCount > 0){
					client.query('COMMIT');
					resolve(res.rows);
				} else {
					resolve({});
				}
			}).catch(err => {
				client.query('ROLLBACK');
				reject(err.stack)
			});
			client.release();
		});
	});
}

const BillGenerator = (billdata) => {
	return new Promise(function(resolve, reject) {
		function padZero(num, size) {
		   var s = num+"";
		   while (s.length < size) s = "0" + s;
		   return s;
		}
		//console.log(billdata);
		let imageFileName = padZero(billdata.id, 10);
		let filename = imageFileName + imageFileExName;
		let billDate = new Date(billdata.lastupd);
		billDate = billDate.getDate() + '/' + (billDate.getMonth() + 1) + '/' + billDate.getFullYear();

		const {registerFont, createCanvas, createImageData} = require('canvas');
		registerFont('public/font/THSarabunNew.ttf', { family: 'THSarabunNew' });
		registerFont('public/font/EkkamaiStandard-Light.ttf', { family: 'EkkamaiStandard-Light' });
		const imageHeigth = 470;
		const imageCanvas = createCanvas(400, imageHeigth);
		const ctx = imageCanvas.getContext('2d');
		/***********************/
		//for filling color background
		ctx.globalAlpha = 0.9;
		ctx.fillStyle = "white";
		ctx.fillRect(0,0,400,imageHeigth);
		ctx.fill();

		const logoCanvas = require('canvas');
		var parentDir = require('path').resolve(__dirname, '..');
		var logoPath =  parentDir + "/" + publicDir + "/imgs/logo/myshopman.png";
		var logoImage = new logoCanvas.Image; 
		logoImage.src = logoPath;
		const imageWidth = logoImage.width;
		const imageHeight = logoImage.height;
		ctx.drawImage(logoImage, 125, 10, imageWidth, imageHeight);

		ctx.font = 'bold 20px "EkkamaiStandard-Light"';
		ctx.fillStyle = 'black';
		ctx.textAlign = 'center';
		ctx.fillText('ใบเสร็จรับเงิน', 200, 120);

		ctx.font = 'bold 10px "EkkamaiStandard-Light"';
		ctx.textAlign = 'left';
		ctx.fillText('เลขที่ ' + imageFileName, 10, 60);
		ctx.fillText('วันที่ ' + billDate, 10, 80);

		ctx.font = 'bold 16px "EkkamaiStandard-Light"';
		ctx.fillText('ลูกค้า/ผู้รับบริการ', 10, 150);

		ctx.font = 'bold 20px "THSarabunNew"';
		ctx.fillText('ชื่อ ' + billdata.customername, 30, 170);
		ctx.fillText('โทรศัพท์ ' + billdata.customertelno, 30, 190);

		ctx.font = 'bold 16px "EkkamaiStandard-Light"';
		ctx.fillText('รายการสินค้า/บริการ', 10, 220);

		ctx.font = 'bold 20px "THSarabunNew"';
		ctx.fillText('1. ห้องถ่ายทอดสัญญาณระยะใกล ชื่อห้อง '  + billdata.roomname, 10, 240);
		//ctx.fillText('ชื่อห้อง ' + billdata.roomname, 30, 260);
		ctx.fillText('ระยะเวลาใช้งาน 24 ชั่วโมง จำนวน 1 ห้อง ราคา ' + billdata.amount + ' บาท', 30, 260);
		//ctx.fillText('จำนวน 1 ห้อง', 30, 300);
		//ctx.fillText('ราคา ' + billdata.amount + ' บาท', 30, 280);

		ctx.font = 'bold 16px "EkkamaiStandard-Light"';
		ctx.fillText('รวม ' + billdata.amount + ' บาท', 10, 290);

		ctx.font = 'bold 20px "EkkamaiStandard-Light"';
		ctx.textAlign = 'center';
		ctx.fillText('ขอบคุณที่เลือกใช้บริการ', 200, 330);

		var imagePath =  parentDir + "/"  + publicDir + '/' + billDir + '/' + filename;
		const out = fs.createWriteStream(imagePath);
		const stream = imageCanvas.createPNGStream();
		stream.pipe(out);
		out.on('finish', () =>  {
			var imageLink = '/' + billDir + '/' + filename;
			resolve(imageLink);
		});
	});
}

module.exports = function (app, obj) {
	app.post('/createnewbill', (req, res) => {
		const logid = req.body.logid;
		doLoadBillData(logid).then((billdata)=> {
			BillGenerator(billdata[0]).then((billLink) => {
				res.status(200).send({status: {code: 200}, bill: {link: billLink}});	
			});
		});
	});
}
//dbman.js
require('dotenv').config();
const util = require('util');
const express = require('express');
const flash = require('connect-flash');
const fs = require('fs');
const path = require('path');
const request = require('request');
const session = require("express-session");

const pool = require('./dbpool.js').getPool();
/*
const { Pool, Client } = require('pg');

const pool = new Pool({
	user: process.env.PGUSER,
	host: process.env.PGHOST,
	database: process.env.PGDATABASE,
	password: process.env.PGPASSWORD,
	port: process.env.PGPORT,
});
*/

function doSaveRoomLog(rootname, log){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "insert into roomlogs (log, rootname, createat) values ($1::json, $2, now()) RETURNING id";
			client.query(sqlCmd, [log, rootname]).then(res => {
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

function doLoadLastRoomLog(rootname){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "SELECT id, log, createat FROM roomlogs where rootname=$1 ORDER BY createat DESC LIMIT 1";
			client.query(sqlCmd, [rootname]).then(res => {
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
function doSavePaymentLog(agencyid, roomtype, roomname, amount){
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "insert into paymentlog (agencyid, roomtype, roomname, amount, lastupd, billid) values ($1::int, $2, $3, $4::int, now(), 0) RETURNING id";
			client.query(sqlCmd, [agencyid, roomtype, roomname, amount]).then(res => {
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
function doUpdatePaymentLogBillId(billid, logid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "update paymentlog set billid=$1::int where id=$2";
			client.query(sqlCmd, [billid, logid]).then(res => {
				resolve({status: {code: 200}});
			}).catch(err => {
				client.query('ROLLBACK');
				reject(err.stack)
			});
			client.release();
		});
	});
}
function doSaveBilldata(logid, customername, customertelno) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "insert into bill (logid, customername, customertelno, lastupd) values ($1::int, $2, $3, now()) RETURNING id";
			client.query(sqlCmd, [logid, customername, customertelno]).then(res => {
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
function doLoadBilldata(logid) {
	return new Promise(function(resolve, reject) {
		pool.connect().then(client => {
			client.query('BEGIN');
			var sqlCmd = "select bill.*, paymentlog.* from bill, paymentlog where (bill.logid = paymentlog.id) and (paymentlog.id = $1)";
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

module.exports = function (app, obj) {
	app.get('/saveroomlog', (req, res) => {
		const rootname = req.originalUrl.split('/')[1];
		let therooms = JSON.stringify(obj.rooms);
		console.log(therooms);
		doSaveRoomLog(rootname, therooms).then((newrowid)=> {
			res.status(200).send(newrowid);	
		});
	});
	app.post('/loadlastroomlog', (req, res) => {
		const rootname = req.originalUrl.split('/')[1];
		doLoadLastRoomLog(rootname).then((lastrow)=> {
			res.status(200).send(lastrow);	
		});
	});
	app.post('/assignroomfromlog', (req, res) => {
		//console.log(req.body.log);
		obj.rooms = JSON.parse(req.body.log);
		//obj.rooms = req.body.log;
		res.status(200).send({status: {code: 200}});	
	});
	app.post('/savepaymentlog', (req, res) => {
		let params = req.body;
		//console.log(params);
		doSavePaymentLog(params.agencyid, params.roomtype, params.roomname, params.amount).then((lastrow)=> {
			//console.log(lastrow);
			res.status(200).send({status: {code: 200}, logid : {id: lastrow[0].id}});	
		});
	});
	app.post('/updatepaymentlogbillid', (req, res) => {
		let params = req.body;
		//console.log(params);
		doUpdatePaymentLogBillId(params.billid, params.logid).then((lastrow)=> {
			res.status(200).send({status: {code: 200}, logid : {id: params.billid}});	
		});
	});
	app.post('/savebilldata', (req, res) => {
		let params = req.body;
		//console.log(params);
		doSaveBilldata(params.logid, params.customername, params.customertelno).then((lastrow)=> {
			//console.log(lastrow);
			res.status(200).send({status: {code: 200}, logid : {id: lastrow[0].id}});	
		});
	});
	app.post('/loadbilldata', (req, res) => {
		let params = req.body;
		//console.log(params);
		doLoadBilldata(params.logid).then((billrow)=> {
			//console.log(lastrow);
			res.status(200).send({status: {code: 200}, data : billrow});	
		});
	});
}

/**
 * Module dependencies.
 */

// Modules
var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var fs = require('fs');
var multiparty = require('multiparty');
var geocoder = require('geocoder');
var mongojs = require('mongojs');
var xlsx = require('node-xlsx');

// Initialize Express
var app = express();

// Get port and environment
var port = process.env.PORT || 3000;
var env = app.get("env");

// Database Connections
var databaseUrl = process.env.MONGOHQ_URL;
var collections = ["password", "cities", "convention2014"];
var db = mongojs.connect(databaseUrl, collections);

// all environments
app.configure(function() {
	app.set('port', port);
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');
	app.use(express.favicon(path.join(__dirname, "/public/favicon.ico")));
	app.use(express.logger('dev'));
	app.use(express.urlencoded());
	app.use(express.methodOverride());
	app.use(require('less-middleware')({
		src: path.join(__dirname, 'public'),
		yuicompress: true
	}));
	app.use(express.static(path.join(__dirname, 'public')));
	app.use(app.router);
});

// development only
app.configure("development", function() {
	app.use(express.errorHandler());
});

routes(app, db, multiparty, xlsx, fs, geocoder);

http.createServer(app).listen(port, function (){
  console.log('Server running on port ' + port + " in " + env + " mode");
});

// Routes file

/*jshint -W083 */

var livesInColumn = "LIVES_IN";
var fullNameColumn = "FULLNAME";
var homeTownColumn = "HOME_TOWN";
var highSchoolColumn = "HIGH_SCHOOL";
var profCollegeColumn = "PROF_COLLEGE";
var workingAtColumn = "WORKING_AT";
var workSheetNumber = 0;


module.exports = function(app, db, multiparty, xlsx, fs, geocoder) {

	// GETs

	app.get("*", function(req, res, next) {
		res.header("X-UA-Compatible", "IE=edge,chrome=1");
		res.header("Content-type", "text/html;charset=UTF-8");
		next();
	});

	app.get("/", function(req, res) {
		res.render("index");
	});

	app.get("/upload", function(req, res) {
		res.render("upload", { displayForm: true });
	});

	app.get("/data", function(req, res) {
		res.header("Content-type", "text/json");
		res.sendfile(__dirname + "/public/testfile.json");
	});

	// POSTs

	app.post("*", function(req, res, next) {
		res.header("X-UA-Compatible", "IE=edge,chrome=1");
		res.header("Content-type", "text/html;charset=UTF-8");
		next();
	});

	app.post("/upload", function(req, res) {
		var renderPage = function (errorMsg) {
			res.render("upload", { showMsg: (errorMsg !== ""), error: errorMsg, success: !errorMsg });
		};

		var deleteFile = function (filename) {
			try {
				fs.unlink(filename);
			} catch (e) {}
		};

		var form = new multiparty.Form();

		form.parse(req, function(err, fields, files) {
			// Check for existence of multipart data
			
			var fileLocation = files.uploadFile[0].path;

			if (fields.password[0] === "") {
				deleteFile(fileLocation);
				renderPage("You did not enter a password!");
			} else if (files.uploadFile[0].originalFilename === "") {
				deleteFile(fileLocation);
				renderPage("You did not upload a file or there was an error uploading!");
			} else db.password.find().limit(1, function(err, password) {
				// Check if password has been entered correctly

				if (password[0].def !== fields.password[0]) {
					deleteFile(fileLocation);
					renderPage("You have entered the wrong password!");
				} else {

					try {
						var obj = xlsx.parse(fileLocation);
						var data = obj.worksheets[workSheetNumber].data;

						var header = data[0];
						var livesIn, fullName, homeTown, highSchool, profCollege, workingAt;
						for (var i = 0; i < header.length; i++) {
							var val = header[i].value;
							if (val == livesInColumn) livesIn = i;
							else if (val == fullNameColumn) fullName = i;
							else if (val == homeTownColumn) homeTown = i;
							else if (val == highSchoolColumn) highSchool = i;
							else if (val == profCollegeColumn) profCollege = i;
							else if (val == workingAtColumn) workingAt = i;
						}

						if (typeof livesIn === 'undefined' ||
							typeof fullName === 'undefined' ||
							typeof homeTown === 'undefined' ||
							typeof highSchool === 'undefined' ||
							typeof profCollege === 'undefined' ||
							typeof workingAt === 'undefined')
							throw("");

						db.cities.remove({}, function() {

							for (var j = 1; j < data.length; j++) {
								var currentField = data[j];
								var livesInParsed = currentField[livesIn] ? currentField[livesIn].value : null;
								var cityCheck = /^[A-Za-z ]+, *[A-Z]{2}$/;

								if (cityCheck.test(livesInParsed)) {
									// City is in the format city, state (Toronto, ON)

									var fullNameParsed = currentField[fullName] ? currentField[fullName].value : null;
									var homeTownParsed = currentField[homeTown] ? currentField[homeTown].value : null;
									var highSchoolParsed = currentField[highSchool] ? currentField[highSchool].value : null;
									var profCollegeParsed = currentField[profCollege] ? currentField[profCollege].value : null;
									var workingAtParsed = currentField[workingAt] ? currentField[workingAt].value : null;

									(function() {
										var city = livesInParsed;
										var fullName = fullNameParsed;
										var homeTown = homeTownParsed;
										var highSchool = highSchoolParsed;
										var profCollege = profCollegeParsed;
										var workingAt = workingAtParsed;
										var findGeocode;
										(findGeocode = function(city, fullName, homeTown, highSchool, profCollege, workingAt) {
											geocoder.geocode(city, function(err, geocodeData) {
												if (geocodeData.status === "OVER_QUERY_LIMIT") {
													setTimeout(function() {
														findGeocode(city, fullName, homeTown, highSchool, profCollege, workingAt);
													}, 500);
												} else {
													var results = geocodeData.results[0];

													db.cities.update({
														name: results.formatted_address,
													}, {
														$setOnInsert: {
															location: results.geometry.location
														},
														$push: {
															people: {
																$each: [
																	{
																		name: fullName,
																		homeTown: homeTown,
																		highSchool: highSchool,
																		profCollege: profCollege,
																		workingAt: workingAt
																	}
																]
															}
														}
													}, {
														upsert: true
													});
												}

											});
										}).call(null, city, fullName, homeTown, highSchool, profCollege, workingAt);

									})();


								}
							}

							renderPage();

						});



					} catch (e) {
						deleteFile(fileLocation);
						renderPage("An error occurred while parsing the file. Are you sure it is a properly formatted XLSX file?");
					}
				}
			});
		});
	});


};
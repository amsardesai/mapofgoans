// Routes file

/*jshint -W083 */

var livesInColumn = "LIVES_IN";
var fullNameColumn = "FULLNAME";
var firstNameColumn = "FIRSTNAME";
var middleNameColumn = "MIDDLENAME";
var lastNameColumn = "LASTNAME";
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
		res.render("upload");
	});

	app.get("/data", function(req, res) {
		res.header("Content-type", "text/json");
		db.cities.find(function(err, data) {
			res.json(data);
		});
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

				if (!password) {
					deleteFile(fileLocation);
					renderPage("Database Error");
					console.log(err);
				} else if (password[0].def !== fields.password[0]) {
					deleteFile(fileLocation);
					renderPage("You have entered the wrong password!");
				} else {

					try {
						var obj = xlsx.parse(fileLocation);
						var data = obj.worksheets[workSheetNumber].data;

						var header = data[0];
						var livesIn = -1,
							fullName = -1,
							firstName = -1,
							middleName = -1,
							lastName = -1,
							homeTown = -1,
							highSchool = -1,
							profCollege = -1,
							workingAt = -1;

						for (var i = 0; i < header.length; i++) {
							var val = header[i].value;
							if (val == livesInColumn) livesIn = i;
							else if (val == fullNameColumn) fullName = i;
							else if (val == firstNameColumn) firstName = i;
							else if (val == middleNameColumn) middleName = i;
							else if (val == lastNameColumn) lastName = i;
							else if (val == homeTownColumn) homeTown = i;
							else if (val == highSchoolColumn) highSchool = i;
							else if (val == profCollegeColumn) profCollege = i;
							else if (val == workingAtColumn) workingAt = i;
						}

						if (livesIn == -1 ||
							fullName == -1 ||
							firstName == -1 ||
							middleName == -1 ||
							lastName == -1 ||
							homeTown == -1 ||
							highSchool == -1 ||
							profCollege == -1 ||
							workingAt == -1)
							throw("");

						db.cities.remove({}, function() {

							for (var j = 1; j < data.length; j++) {
								var currentField = data[j];
								var livesIn = currentField[livesIn] ? currentField[livesIn].value : null;
								var cityCheck = /^\s*[A-Za-z \/]+, *[A-Z]{2}\s*$/;

								if (cityCheck.test(livesIn)) {
									// City is in the format city, state (Toronto, ON)

									fullName = currentField[fullName] ? currentField[fullName].value : null;
									firstName = currentField[firstName] ? currentField[firstName].value : null;
									middleName = currentField[middleName] ? currentField[middleName].value : null;
									lastName = currentField[lastName] ? currentField[lastName].value : null;
									homeTown = currentField[homeTown] ? currentField[homeTown].value : null;
									highSchool = currentField[highSchool] ? currentField[highSchool].value : null;
									profCollege = currentField[profCollege] ? currentField[profCollege].value : null;
									workingAt = currentField[workingAt] ? currentField[workingAt].value : null;

									(function() {
										var findGeocode;
										(findGeocode = function(livesIn, fullName, firstName, middleName, lastName, homeTown, highSchool, profCollege, workingAt) {
											geocoder.geocode(livesIn, function(err, geocodeData) {
												if (geocodeData.status === "OVER_QUERY_LIMIT") {
													setTimeout(function() {
														findGeocode(livesIn, fullName, firstName, middleName, lastName, homeTown, highSchool, profCollege, workingAt);
													}, 1000);
												} else {
													var results = geocodeData.results[0];

													var address_components = results.address_components;
													var city, state;
													for (var k = 0; k < address_components.length; k++) {
														var types = address_components[k].types;
														if (types.indexOf("locality") >= 0)
															city = address_components[k].long_name;
														else if (types.indexOf("administrative_area_level_1") >= 0)
															state = address_components[k].short_name;
													}


													if (city && state) {
														var parsedCity = city + ", " + state;

														console.log("Processed: " + fullName + " at " + parsedCity);
														
														db.cities.update({
															name: parsedCity,
														}, {
															$setOnInsert: {
																location: results.geometry.location
															},
															$push: {
																people: {
																	$each: [
																		{
																			name: fullName,
																			firstName: firstName,
																			middleName: middleName,
																			lastName: lastName,
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

													} else {
														console.log("Error: " + fullName + " at " + livesIn + " parsed as " + results.formatted_address);
													}

												}
											});
										}).call(null, livesIn, fullName, firstName, middleName, lastName, homeTown, highSchool, profCollege, workingAt);
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
// Routes file

/*jshint -W083 */

var livesInTitle = "LIVES_IN";
var fullNameTitle = "FULLNAME";
var firstNameTitle = "FIRSTNAME";
var middleNameTitle = "MIDDLENAME";
var lastNameTitle = "LASTNAME";
var homeTownTitle = "HOME_TOWN";
var highSchoolTitle = "HIGH_SCHOOL";
var profCollegeTitle = "PROF_COLLEGE";
var workingAtTitle = "WORKING_AT";
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
			data.sort(function(a, b) {
				return a.people.length - b.people.length;
			});
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
			
			if (fields.password[0] === "") {
				deleteFile(fileLocation);
				renderPage("You did not enter a password!");
				return;
			} else if (files.uploadFile[0].originalFilename === "") {
				deleteFile(fileLocation);
				renderPage("You did not upload a file or there was an error uploading!");
				return;
			} else if (process.env.MAPOFGOANS_PASSWORD !== fields.password[0]) {
				deleteFile(fileLocation);
				renderPage("You have entered the wrong password!");
				return;
			}

			// Password has been entered correctly
			try {
				var fileLocation = files.uploadFile[0].path;
				var obj = xlsx.parse(fileLocation);
				var data = obj.worksheets[workSheetNumber].data;

				var header = data[0];
				var livesInColumn = -1,
					fullNameColumn = -1,
					firstNameColumn = -1,
					middleNameColumn = -1,
					lastNameColumn = -1,
					homeTownColumn = -1,
					highSchoolColumn = -1,
					profCollegeColumn = -1,
					workingAtColumn = -1;

				for (var i = 0; i < header.length; i++) {
					var val = header[i].value;
					if (val == livesInTitle) livesInColumn = i;
					else if (val == fullNameTitle) fullNameColumn = i;
					else if (val == firstNameTitle) firstNameColumn = i;
					else if (val == middleNameTitle) middleNameColumn = i;
					else if (val == lastNameTitle) lastNameColumn = i;
					else if (val == homeTownTitle) homeTownColumn = i;
					else if (val == highSchoolTitle) highSchoolColumn = i;
					else if (val == profCollegeTitle) profCollegeColumn = i;
					else if (val == workingAtTitle) workingAtColumn = i;
				}

				//console.log(livesIn + " " + fullName + " " + firstName + " " + middleName + " " + lastName + " " + homeTown + " " + highSchool + " " + profCollege + " " + workingAt);

				if (livesInColumn == -1 ||
					fullNameColumn == -1 ||
					firstNameColumn == -1 ||
					middleNameColumn == -1 ||
					lastNameColumn == -1 ||
					homeTownColumn == -1 ||
					highSchoolColumn == -1 ||
					profCollegeColumn == -1 ||
					workingAtColumn == -1)
					throw("");

				db.cities.remove({}, function() {

					console.log("Starting processing...");

					for (var j = 1; j < data.length; j++) {
						var currentField = data[j];
						var cityCheck = /^ *[A-Za-z \.\/]+, *[A-Za-z]{2} *$/;
						var livesInCheck = currentField[livesInColumn] ? currentField[livesInColumn].value : null;
						
						if (cityCheck.test(livesInCheck)) {
							// City is in the format city, state (Toronto, ON)

							(function() {

								var index = j;
								var livesIn = livesInCheck;
								var fullName = currentField[fullNameColumn] ? currentField[fullNameColumn].value : null;
								var firstName = currentField[firstNameColumn] ? currentField[firstNameColumn].value : null;
								var middleName = currentField[middleNameColumn] ? currentField[middleNameColumn].value : null;
								var lastName = currentField[lastNameColumn] ? currentField[lastNameColumn].value : null;
								var homeTown = currentField[homeTownColumn] ? currentField[homeTownColumn].value : null;
								var highSchool = currentField[highSchoolColumn] ? currentField[highSchoolColumn].value : null;
								var profCollege = currentField[profCollegeColumn] ? currentField[profCollegeColumn].value : null;
								var workingAt = currentField[workingAtColumn] ? currentField[workingAtColumn].value : null;
								var findGeocode;

								(findGeocode = function(livesIn, fullName, firstName, middleName, lastName, homeTown, highSchool, profCollege, workingAt) {
									geocoder.geocode(livesIn, function(err, geocodeData) {
										if (geocodeData.status === "OVER_QUERY_LIMIT") {
											setTimeout(function() {
												findGeocode(livesIn, fullName, firstName, middleName, lastName, homeTown, highSchool, profCollege, workingAt);
											}, 2000);
											console.log("Error: Over query limit for " + fullName + " at " + livesIn + "! Retrying...");
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
								});

								setTimeout(function() {
									findGeocode(livesIn, fullName, firstName, middleName, lastName, homeTown, highSchool, profCollege, workingAt);
								}, index * 200);

							})();

						}
					}
					renderPage();
				});
			} catch (e) {
				deleteFile(fileLocation);
				renderPage("An error occurred while parsing the file. Are you sure it is a properly formatted XLSX file?");
			}
		});
	});
};
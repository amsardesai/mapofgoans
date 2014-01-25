// Routes file


var livesInColumn = "LIVES_IN";
var fullNameColumn = "FULLNAME";
var homeTownColumn = "HOME_TOWN";
var highSchoolColumn = "HIGH_SCHOOL";
var profCollegeColumn = "PROF_COLLEGE";
var workingAtColumn = "WORKING_AT";
var workSheetNumber = 0;


module.exports = function(app, db, multiparty, xlsx, fs) {

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


						console.log("livesInColumn: " + livesInColumn);
						console.log("fullNameColumn: " + fullNameColumn);
						console.log("homeTownColumn: " + homeTownColumn);
						console.log("highSchoolColumn: " + highSchoolColumn);
						console.log("profCollegeColumn: " + profCollegeColumn);
						console.log("workingAtColumn: " + workingAtColumn);

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

						console.log("livesIn: " + livesIn);
						console.log("fullName: " + fullName);
						console.log("homeTown: " + homeTown);
						console.log("highSchool: " + highSchool);
						console.log("profCollege: " + profCollege);
						console.log("workingAt: " + workingAt);

						if (!livesIn || !fullName || !homeTown || !highSchool || !profCollege || !workingAt)
							throw("");

						var parsedData = [];

						for (var j = 1; j < data.length; j++) {
							var currentField = data[j];
							var livesInParsed = currentField[livesIn];
							var cityCheck = /^[A-Za-z ]+, [A-Z]{2}$/;

							if (cityCheck.test(livesInParsed)) {
								var fullNameParsed = currentField[fullName];
								var homeTownParsed = currentField[homeTown];
								var highSchoolParsed = currentField[highSchool];
								var profCollegeParsed = currentField[profCollege];
								var workingAtParsed = currentField[workingAt];
								
								
								
								
								
							}
						}



						renderPage();
					} catch (e) {
						deleteFile(fileLocation);
						renderPage("An error occurred while parsing the file. Are you sure it is a properly formatted XLSX file?");
					}
				}
			});
		});
	});


};
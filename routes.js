// Routes file

module.exports = function(app, db, multiparty, xlsx) {

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

		var form = new multiparty.Form();

		form.parse(req, function(err, fields, files) {
			// Check for existence of multipart data

			console.log("files: ");
			console.log(files);
			console.log("fields: ");
			console.log(fields);

			if (fields.password[0] === "")
				renderPage("You did not enter a password!");
			else if (files.uploadFile[0].originalFilename === "")
				renderPage("You did not upload a file!");
			else db.password.find().limit(1, function(err, password) {
				// Check if password has been entered correctly

				if (password[0].def !== fields.password[0])
					renderPage("You have entered the wrong password!");
				else {

					var fileLocation = files.uploadFile[0].path;
					console.log("SUCCESS! path: " + fileLocation);

					var obj = xlsx.parse(fileLocation);
					console.log(obj);

					renderPage();
				}
			});
		});
	});


};
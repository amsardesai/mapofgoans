// Routes file

module.exports = function(app) {
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
};
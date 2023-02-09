import express from "express";
import path from "path";
import logger from "morgan";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import http from "http";
import createError from "http-errors";

const app = express(),
	router = express.Router();

var port = 3000;

let routes = [
	{
		path: "/",
		handler: (_req: any, res: any) => res.render("index", { title: "Home" }),
	},
	{
		path: "/pageTwo",
		handler: (_req: any, res: any) =>
			res.render("pageTwo", { title: "Page 2" }),
	},
	{
		path: "/pageThree",
		handler: (_req: any, res: any) =>
			res.render("pageThree", { title: "Page 3" }),
	},
	{
		path: "/pageFour",
		handler: (_req: any, res: any) =>
			res.render("pageFour", { title: "Page 4" }),
	},
];

routes.forEach((route) => {
	router.get(route.path, route.handler);
});

app.set("port", port);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use("/", router);
app.use(function (req, res, next) {
	next(createError(404));
});
app.use((err: any, req: any, res: any, _next: any) => {
	res.locals.title = "error";
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	res.status(err.status || 500);
	res.render("error");
});

var server = http.createServer(app);
server.listen(port);
server.on("error", (error: any) => {
	if (error.syscall !== "listen") {
		throw error;
	}

	var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

	switch (error.code) {
		case "EACCES":
			console.error(bind + " requires elevated privileges");
			process.exit(1);
			break;
		case "EADDRINUSE":
			console.error(bind + " is already in use");
			process.exit(1);
			break;
		default:
			throw error;
	}
});
server.on("listening", () => console.log(`Listening on: ${port}`));

import express from "express";
import path from "path";
import logger from "morgan";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import http from "http";
import createError from "http-errors";
import sqlite3 from "sqlite3";
import { name, expressPort, basePath } from "../package.json";
import process from "process";

let dbPath = basePath;

const app = express(),
	router = express.Router(),
	appName = process.execPath;

if (appName.endsWith(`${name}.exe`)) {
	dbPath = path.join("./resources/app.asar.unpacked", basePath);
}

const db = new sqlite3.Database(path.join(dbPath, "data.db"));

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
	{
		path: "/data",
		handler: (_req: any, res: any) => {
			db.all("select * from People", [], (err, rows) => {
				if (err) {
					res.status(400).json({ "error": err.message });
					return;
				}
				res.json({
					"message": "success",
					"data": rows
				});
			});
		},
	}
];

routes.forEach((route) => {
	router.get(route.path, route.handler);
});

app.set("port", expressPort);
app.set("views", path.join(__dirname, path.join("..", "views")));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, path.join("..", "public"))));
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

function shutdown() {
	console.log("Shutting down Express server...");
	db.close();
	server.close();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

let server = http.createServer(app);
server.listen(expressPort);
server.on("error", (error: any) => {
	if (error.syscall !== "listen") {
		throw error;
	}

	var bind = typeof expressPort === "string" ? "Pipe " + expressPort : "Port " + expressPort;

	switch (error.code) {
		case "EACCES":
			console.error(bind + " requires elevated privileges");
			process.exit(1);
		case "EADDRINUSE":
			console.error(bind + " is already in use");
			process.exit(1);
		default:
			throw error;
	}
});
server.on("listening", () => console.log(`Listening on: ${expressPort}`));

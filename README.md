# electron-with-express

A simple project demonstrating how to spawn an Express app from Electron as well
as providing server logs directly in the Electron app.

Express App:

![Express-App](screenshots/express-app.png)

Press `CommandOrControl+Shift+L` to show the server log:

![Server-Log](screenshots/server-log.png)

## How to run

Make sure you `npm install` in both the root and the express app folder so that
all dependencies are installed. Then use `npm run start` to start electron with
content being served from the express app.

## Author

Frank Hale &lt;frankhale@gmail.com&gt;

Updated on: 8 February 2023

## License

MIT - see [LICENSE](LICENSE)

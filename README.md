# electron-with-express

A simple project demonstrating how to spawn an Express app from Electron as well
as providing server logs directly in the Electron app.

Express App:

![Express-App](screenshots/express-app.png)

Press 'F1' to show the server log:

![Server-Log](screenshots/server-log.png)

## Dependencies

We'll need a copy of the `Node.exe` and `Node.lib`:

https://nodejs.org/dist/v6.2.0/win-x64/ (or equivalent version for your system)

After downloading a copy of this repository place them in the root of the code
folder.

When the Electron app starts it will spawn the Express app using an external
copy of Node. This allows the Express app to run outside the Electron process.

Additionally you'll need a full install of Node in order to download the Node
Modules and start the app.

## Additional Information

The `express-app` folder is just a vanilla Express generated app using
`express-generator`.

## How to run

1. Clone the code repository.
2. Open terminal to code repository.
3. Make sure a copy of `Node.exe` and `Node.dll` are copied to the root of the code repository.
4. Run `npm install`.
5. Change directories to the express-app folder and run `npm install`.
6. Change directories back to the root of the code repository.
7. Run `npm start` to start the application.

## Author(s)

Frank Hale &lt;frankhale@gmail.com&gt;  
1 June 2016

## License

GNU GPL v3 - see [LICENSE](LICENSE)

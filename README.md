# electron-with-express

A simple project demonstrating how to spawn an Express app from Electron as well
as providing server logs directly in the Electron app.

Express App:

![Express-App](screenshots/express-app.png)

Press 'F1' to show the server log:

![Server-Log](screenshots/server-log.png)

## Dependencies

We'll need a copy of the `Node.exe` and `Node.lib`:

https://nodejs.org/dist/v6.6.0/win-x64/ (or equivalent version for your system)

After downloading a copy of this repository place them in the root of the code
folder.

When the Electron app starts it will spawn the Express app using an external
copy of Node. This allows the Express app to run outside the Electron process.

## Additional Information

The `express-app` folder is just a vanilla Express generated app using
`express-generator`.

## How to run

1. Clone the code repository.
2. Open terminal to code repository.
3. Make sure a copy of `Node.exe` and `Node.lib` are copied to the root of the 
code repository.
4. Run `npm install`. (See Dependencies above)
5. Change directories to the express-app folder and run `npm install`.
6. Change directories back to the root of the code repository.
7. Run `npm start` to start the application.

## Package with Electron-Packager

If you would like to package this using `electron-packager` you'll need to 
make the following change:

In index.html (line ~59):

```javascript
app = require('electron').remote.app,
node = spawn(".\\node.exe", ["./express-app/bin/www"], { cwd: app.getAppPath() })
```

This makes sure the path to our local copy of `node.exe` is correct when we run
electron to start the app.

That said, I'm assuming the platform is Windows. If other platforms are desirable
additional changes are required.

## Author(s)

Frank Hale &lt;frankhale@gmail.com&gt;  
7 December 2016

## License

GNU GPL v3 - see [LICENSE](LICENSE)

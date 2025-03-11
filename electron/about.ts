import * as electron from 'electron';
import * as path from 'path';
import * as remoteMain from '@electron/remote/main';

// tslint:disable-next-line:no-require-imports
const pngIcon = path.join(
  __dirname,
  <string>require('./build/icon.png').default
);

// tslint:disable-next-line:no-require-imports
const winIcon = path.join(
  __dirname,
  <string>require('./build/icon.ico').default
);

export function createAboutWindow(): electron.BrowserWindow {
  const about = new electron.BrowserWindow({
    width: 400,
    height: 400,
    center: true,
    resizable: false,
    autoHideMenuBar: true,
    icon: process.platform === 'win32' ? winIcon : pngIcon,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  remoteMain.enable(about.webContents);

  // Make links open in external browser
  about.webContents.setWindowOpenHandler(({ url }) => {
    electron.shell.openExternal(url);
    return { action: 'deny' };
  });

  // Get package.json version and pass it to the renderer
  const packageInfo = require('../package.json');

  // Set environment variable for package version that the renderer can access
  process.env.npm_package_version = packageInfo.version;

  // Load the about HTML file
  about.loadFile(path.join(__dirname, 'about.html'));

  about.webContents.on('dom-ready', () => {
    // The following ensures proper path encoding for Windows paths too
    const iconPath = process.platform === 'win32' ? winIcon : pngIcon;
    const encodedPath = 'file://' + iconPath.replace(/\\/g, '/');

    about.webContents.executeJavaScript(`
      document.querySelector('.app-logo').src = "${encodedPath}";
      console.log("Updated icon path to: ${encodedPath}");
    `);
  });

  return about;
}

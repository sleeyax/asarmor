# Electron.js example
This project is based on the [electron-webpack-quick-start](https://github.com/electron-userland/electron-webpack-quick-start) boilerplate.

## Installation
Install dependencies:

`$ npm i`

## Usage
Run the following command to build this project:
``` 
# create unpacked build with electron-builder
$ npm run dist:dir
```

An [afterPack](https://www.electron.build/configuration/configuration.html#afterpack) hook that applies asarmor patches is already included in the build step.

To verify that the electron app still runs fine, go to `dist/<os>-unpacked/` and run the `asarmor-electron-example` executable. For example on Windows the path to the executable should be `dist/win-unpacked/asarmor-electron-example.exe`.

Finally, try to run `asar extract dist/<os>-unpacked/resources/app.asar extracted` and notice that it won't work :)

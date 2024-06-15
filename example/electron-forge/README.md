# electron-forge-example

## Installation
`npm install`

## Usage

### Development

1. Update `package.json` entrypoint to `"main": ".vite/build/main.js",`
2. Run `npm start`

### Package for production

1. Update `package.json` entrypoint to `"main": ".vite/build/main.node",`
2. Run `npm run package`
3. Test the packaged application by executing the resulting binary. 
For example (on Linux) run `/out/electron-forge-example-linux-x64/electron-forge-example `

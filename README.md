![Logo](admin/smarthome_webots.png)
# ioBroker.smarthome_webots

[![NPM version](https://img.shields.io/npm/v/iobroker.smarthome_webots.svg)](https://www.npmjs.com/package/iobroker.smarthome_webots)
[![Downloads](https://img.shields.io/npm/dm/iobroker.smarthome_webots.svg)](https://www.npmjs.com/package/iobroker.smarthome_webots)
![Number of Installations (latest)](https://iobroker.live/badges/smarthome_webots-installed.svg)
![Number of Installations (stable)](https://iobroker.live/badges/smarthome_webots-stable.svg)
[![Dependency Status](https://img.shields.io/david/goch/iobroker.smarthome_webots.svg)](https://david-dm.org/goch/iobroker.smarthome_webots)

[![NPM](https://nodei.co/npm/iobroker.smarthome_webots.png?downloads=true)](https://nodei.co/npm/iobroker.smarthome_webots/)

**Tests:** ![Test and Release](https://github.com/goch/ioBroker.smarthome_webots/workflows/Test%20and%20Release/badge.svg)

## smarthome_webots adapter for ioBroker

 This adapter connects to the smart home simulation software based on webots found [here](https://github.com/goch/smarthome-webots)

It acts as a bridge between the two systems, enabling ioBroker to receive data from the simulation software and use it to control devices in the simulated smart home environment.

Once connected, the adapter can receive real-time data from the simulation software about the state of various devices in the simulated smart home environment, such as lights, sensors, and appliances. It then sends this data to ioBroker, which can use it to control real-world smart home devices connected to the ioBroker system.

Users can test and experiment with smart home automation systems in a simulated environment before implementing them in their homes. This can save time and money by allowing users to identify potential problems and test different configurations without having to make physical changes to their homes.


## Installation:


1. Download and install ioBroker from their website https://www.iobroker.net/#de/download, then follow the setup wizard in your web browser. Confirm the default options.

3. If the setup wizard doesn't start automatically, open a web browser and go to localhost:8081 to start the wizard.

4. Once the wizard completes, cancel the automatic discovery and go to the Adapters section. Click on the human head icon on the top left and confirm the dialog box to toggle Expert Mode.

5. Click on the new Github logo that appeared below and select the custom tab. Enter the following URL and click on the install button:

```bash
https://github.com/goch/ioBroker.smarthome_webots/archive/refs/tags/v0.0.2-beta.0.zip
```


5. A new Smarthome Webots panel will appear. Click on the three dots to show further info and then on the + symbol on the bottom left to add a new instance.

6. In the instance settings window, configure the settings as required.

6. Start Webots and open the home.wbt world in smarthome_webots/worlds folder.

6. Start the simulation by pressing the play button at the top of Webots.

6. Go to ioBroker and open the Objects tab. Open the smarthome_webots/0 folder. All devices in the simulation should now be visible in ioBroker.

That's it! You have successfully installed the Smarthome Webots adapter for ioBroker and integrated it with your simulation.


<!-- 

#### install ioBroker:





### Best Practices
We've collected some [best practices](https://github.com/ioBroker/ioBroker.repositories#development-and-coding-best-practices) regarding ioBroker development and coding in general. If you're new to ioBroker or Node.js, you should
check them out. If you're already experienced, you should also take a look at them - you might learn something new :)

### Scripts in `package.json`
Several npm scripts are predefined for your convenience. You can run them using `npm run <scriptname>`
| Script name | Description |
|-------------|-------------|
| `test:js` | Executes the tests you defined in `*.test.js` files. |
| `test:package` | Ensures your `package.json` and `io-package.json` are valid. |
| `test:unit` | Tests the adapter startup with unit tests (fast, but might require module mocks to work). |
| `test:integration` | Tests the adapter startup with an actual instance of ioBroker. |
| `test` | Performs a minimal test run on package files and your tests. |
| `check` | Performs a type-check on your code (without compiling anything). |
| `lint` | Runs `ESLint` to check your code for formatting errors and potential bugs. |
| `release` | Creates a new release, see [`@alcalzone/release-script`](https://github.com/AlCalzone/release-script#usage) for more details. |

### Writing tests
When done right, testing code is invaluable, because it gives you the 
confidence to change your code while knowing exactly if and when 
something breaks. A good read on the topic of test-driven development 
is https://hackernoon.com/introduction-to-test-driven-development-tdd-61a13bc92d92. 
Although writing tests before the code might seem strange at first, but it has very 
clear upsides.

The template provides you with basic tests for the adapter startup and package files.
It is recommended that you add your own tests into the mix.

### Publishing the adapter
Since you have chosen GitHub Actions as your CI service, you can 
enable automatic releases on npm whenever you push a new git tag that matches the form 
`v<major>.<minor>.<patch>`. The necessary steps are described in `.github/workflows/test-and-release.yml`.

Since you installed the release script, you can create a new
release simply by calling:
```bash
npm run release
```
Additional command line options for the release script are explained in the
[release-script documentation](https://github.com/AlCalzone/release-script#command-line).

To get your adapter released in ioBroker, please refer to the documentation 
of [ioBroker.repositories](https://github.com/ioBroker/ioBroker.repositories#requirements-for-adapter-to-get-added-to-the-latest-repository).

### Test the adapter manually on a local ioBroker installation
In order to install the adapter locally without publishing, the following steps are recommended:
1. Create a tarball from your dev directory:  
	```bash
	npm pack
	```
1. Upload the resulting file to your ioBroker host
1. Install it locally (The paths are different on Windows):
	```bash
	cd /opt/iobroker
	npm i /path/to/tarball.tgz
	```

For later updates, the above procedure is not necessary. Just do the following:
1. Overwrite the changed files in the adapter directory (`/opt/iobroker/node_modules/iobroker.smarthome_webots`)
1. Execute `iobroker upload smarthome_webots` on the ioBroker host -->

## Changelog
<!--
	Placeholder for the next version (at the beginning of the line):
	### **WORK IN PROGRESS**
-->
### 0.0.2-beta.0 (2023-04-10)
* (goch) initial release

## License
MIT License

Copyright (c) 2023 goch <gollok@fh-aachen.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
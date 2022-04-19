"use strict";

/*
 * Created with @iobroker/create-adapter v1.34.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const { randomInt } = require("crypto");

// Load your modules here, e.g.:
// const fs = require("fs");
const socketIO    = require('./lib/socket.io.min.js');
const WebSocketClient = require('websocket').w3cwebsocket;



class MaskorWebots extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "maskor_webots",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));

		//placeholder for socket connection
		this.socket = null;
		this.reconnectTimer = null;
		this.devices = {};
		
	}

	connect_webots(url){
		this.log.info("connect to Websocket Server");
		//TODO: remove hardcoded uri
		this.socket = new WebSocketClient(url);
		var that = this;
		this.socket.onerror = function() {
			that.log.error('Connection Error');
		};

		this.socket.onopen = function() {
			clearInterval(that.reconnectTimer);
			that.log.info('WebSocket Client Connected');
			that.sendWebots("Hello Webots");
		};

		this.socket.onclose = function() {
			that.log.info('Client Closed');
			that.log.warn('Socket is closed. Reconnect will be attempted in 3 seconds.');
			that.reconnectTimer = setTimeout(function() {
			that.connect_webots(url);
			}, 3000);
		};

		this.socket.onmessage = function(e) {
			that.log.info("Received: '" + e.data + "'");
			try{
				const msg = JSON.parse(e.data);
				that.log.info(msg)
				that.add_device(msg);
			} catch (e) {
				that.log.warn("not JSON");
			}

			if (typeof e.data === 'string') {				
				if (e.data == "RESET-SH"){
					that.reset();
				}
			}
		};	
	}

	sendWebots(msg){
		if ( this.socket != null && this.socket.readyState === this.socket.OPEN) {
			this.socket.send(JSON.stringify(msg));
		}
	}

	async reset(){
		this.log.info("Reseting Devices");
		
		for (const [name, data] of Object.entries(this.devices)) {
			this.log.info(name)
		await this.deleteDeviceAsync(name);
		  }
	}

	async add_device(dict){
		this.log.info("Add new Device:" + dict["name"])
		var dev_name = dict["name"]
		this.devices[dev_name] = dict["data"]
		
		this.log.info("Add Device Entry to tree:")
		await this.createDeviceAsync(dev_name);

		for (const [state_name, data] of Object.entries(this.devices[dev_name])) {
			this.log.info("Add State: " +state_name + " Data: " +data + " type: " +typeof(data))
			await this.setObjectNotExistsAsync(dev_name +"."+ state_name, {
				type: "state",
				common: {
					name: state_name,
					type: typeof(data),
					role: "state",
					read: true,
					write: true,
				},
				native: {},
			});
		}
		this.subscribeStates(dev_name+".*");


	}

	

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info("config webots_url: " + this.config.webots_url);


		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectNotExistsAsync("testVariable", {
			type: "state",
			common: {
				name: "testVariable",
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});
		
		

		
		

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		this.subscribeStates("testVariable");
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw iobroker: " + result);

		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result);


		this.connect_webots(this.config.webots_url);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 * @param {() => void} callback
	 */
	onUnload(callback) {
		try {
			// Here you must clear all timeouts or intervals that may still be active
			// clearTimeout(timeout1);
			// clearTimeout(timeout2);
			// ...
			// clearInterval(interval1);

			callback();
		} catch (e) {
			callback();
		}
	}

	// If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
	// You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
	// /**
	//  * Is called if a subscribed object changes
	//  * @param {string} id
	//  * @param {ioBroker.Object | null | undefined} obj
	//  */
	onObjectChange(id, obj) {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 * @param {string} id
	 * @param {ioBroker.State | null | undefined} state
	 */
	onStateChange(id, state) {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
			
			var devname = id.split('.');
			var msg = {
				name: devname[devname.length-2],
				property: devname[devname.length-1],
				value: state.val
			};
			
			this.sendWebots(msg);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	// If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
	// /**
	//  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
	//  * Using this method requires "common.messagebox" property to be set to true in io-package.json
	//  * @param {ioBroker.Message} obj
	//  */
	// onMessage(obj) {
	// 	if (typeof obj === "object" && obj.message) {
	// 		if (obj.command === "send") {
	// 			// e.g. send email or pushover or whatever
	// 			this.log.info("send command");

	// 			// Send response in callback if required
	// 			if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
	// 		}
	// 	}
	// }

}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new MaskorWebots(options);
} else {
	// otherwise start the instance directly
	new MaskorWebots();
}
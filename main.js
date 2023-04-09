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
const WebSocketServer = require('ws');
//const wsServer = require('ws').WebserverServer;


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
		

		//placeholder for server connection
		this.server = null;
		this.reconnectTimer = null;
		this.pingInterval = null;
		this.devices = {};
		this.clients = {};
		this.lock = false;
		
	}

	heartbeat() {
		this.isAlive = true;
	}

	connect_webots(port){
		this.log.info("Starting webserver server on port: " + port);

		
		var that = this;
		that.server = new WebSocketServer.Server({ port: port })

		that.server.on('connection', function connection(ws) {
			clearInterval(that.reconnectTimer);
			that.log.info('Webserver Client Connected');
			
			ws.isAlive = true;
			ws.on('pong', that.heartbeat);
			ws.on('message', function message(data) {
				//that.log.info("Received: '" + data + "'");
				
				try{
					const msg = JSON.parse(data);
					
					switch (msg['type']) {
						case 'object':
							that.add_client(msg['name'],ws);
							that.addDevice(msg);
							break;
						case 'state':
							that.updateState(msg['name'], msg['data']['name'],msg['data']['value'] )
							break;
						case 'reset':
							that.deleteSHDevice(msg['name']);
							break;					
						default:
							break;
					}

				} catch (e) {
					that.log.warn("not JSON: " + e.stack + " -> " + data );
				}

				if (typeof data === 'string') {				
					if (data == "RESET-SH"){
						that.reset();
					}
				}
				});
		  });
		  
		  const interval = setInterval(function ping() {
			that.server.clients.forEach(function each(ws) {
			  if (ws.isAlive === false) return ws.terminate();
		  
			  ws.isAlive = false;
			  ws.ping();
			});
		  }, 30000);
		  
		  that.server.on('close', function close() {
			clearInterval(interval);
			that.log.info('Client Closed');
			that.log.warn('server is closed. Reconnect will be attempted in 3 seconds.');
			that.reconnectTimer = setTimeout(function() {
			that.connect_webots(port);
			}, 3000);
		  });
	}

	sendWebots(name,msg){
		//this.log.info("Sending Message to Client [" + name + "]: " + msg);
		var client = this.clients[name];
		if (client != null){
			if ( this.server != null && client.isAlive) {
				client.send(JSON.stringify(msg));
			}
		}else this.log.warn("Client " + name + " is not connected" )
	}

	async reset(){
		this.log.info("Reseting Devices");
		
		for (const [name, data] of Object.entries(this.devices)) {
			this.log.info(name)
		await this.deleteDeviceAsync(name);
		  }
	}

	async deleteSHDevice(name){
		await this.deleteDeviceAsync(name);
		if (this.devices.hasOwnProperty(name)){
			delete this.devices[name]
		}

	}

	async deleteAllDevices(){
		var that = this;
		this.getDevices(function (err, devices) {
			that.log.info("Devices found: " + devices.length)
			for(var d = 0; d < devices.length; d++) {
				var device = devices[d];
				that.log.info("remove device "+ device._id);  
				
				 that.getStatesOf(device._id,function(error,states){
				 	that.log.info("StatesFound: " + states.length)
				 	for(var s = 0; s < states.length; s++) {
						that.log.info("remove device "+ states[s]._id);
						that.deleteState(states[s]._id);
				 	}
				 })
				
			}
		});
	}

	async addDevice(dict){
		var dev_name = dict["name"];

		//check if device has to be created exists
		if(!(dev_name in this.devices)){
			// create new Device entry
			this.log.info("Add Device: " + dev_name);
			this.devices[dev_name] = dict["data"];
			await this.deleteDeviceAsync(dev_name)
			await this.createDeviceAsync(dev_name);

			for (const [state_name, data] of Object.entries(this.devices[dev_name])) {
				if (data['remap'] != null){
					this.log.warn("Skip State: " + state_name + " remapped -> " + data['remap']);
					continue;
				}
					
				this.log.info("Add State: " +state_name + " Data: " +data['value'] + " type: " +typeof(data['value']))
				

				let state = {};
				state.role = "state";
				state.name = state_name;
				state.desc = data['description'];
				state.def = data['value'];
				state.type = typeof(data['value']);
				state.read = data['read'];
				state.write = data['write'];
				
				if (data['min'] != null)
					state.min = data['min'];  
				if (data['max'] != null)
					state.max = data['max'];  
				
				state.unit = data["unit"];
				
				
				
				await this.setObjectAsync(dev_name +"."+ state_name, {
					type: "state",
					common: state,
					native: {},
				});
			}
			this.subscribeStates(dev_name+".*");
		}	
	}

	add_client(name,ws){
		this.clients[name] = ws;
	}

	async updateState(device, name, value){
		this.setStateAsync(device +"."+ name, value, true);
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
		
		// await this.setObjectNotExistsAsync("testVariable", {
		// 	type: "state",
		// 	common: {
		// 		name: "testVariable",
		// 		type: "boolean",
		// 		role: "indicator",
		// 		read: true,
		// 		write: true,
		// 	},
		// 	native: {},
		// });
		
		

		
		

		// In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
		// this.subscribeStates("testVariable");
		// You can also add a subscription for multiple states. The following line watches all states starting with "lights."
		// this.subscribeStates("lights.*");
		// Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
		// this.subscribeStates("*");

		/*
			setState examples
			you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		// await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		// await this.setStateAsync("testVariable", { val: true, ack: true });

		// // same thing, but the state is deleted after 30s (getState will return null afterwards)
		// await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		// examples for the checkPassword/checkGroup functions
		// let result = await this.checkPasswordAsync("admin", "iobroker");
		// this.log.info("check user admin pw iobroker: " + result);

		// result = await this.checkGroupAsync("admin", "admin");
		// this.log.info("check group user admin group admin: " + result);


		this.connect_webots(this.config.webots_url);
		// this.log.info("Devices: "  + this.devices.length);
		// this.log.info("Connections: "  + this.clients.length);
		// this.log.info("Lock: " + this.lock);
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
			this.log.info("Unloading Adapter");
			this.log.info("CLEANUP SH DEVICES")
			this.deleteAllDevices();
			
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
			//this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			//this.log.info(`object ${id} deleted`);
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
			//this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
			
			if (!state.ack){
				// send only if state is updated from iobrokers side
			var devname = id.split('.');
			var msg = {
				name: devname[devname.length-2],
				property: devname[devname.length-1],
				value: state.val
			};
			
			
			this.sendWebots(msg.name,msg);
			}
		//}
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
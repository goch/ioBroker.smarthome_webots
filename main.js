"use strict";

/*
 * Created with @iobroker/create-adapter v1.34.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");

// Load your modules here, e.g.:
// const fs = require("fs");
const WebSocketServer = require('ws');


class SmarthomeWebots extends utils.Adapter {

	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	constructor(options) {
		super({
			...options,
			name: "smarthome_webots",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));

		this.server = null;
		this.reconnectTimer = null;
		this.pingInterval = null;
		this.devices = {};
		this.clients = {};
		this.lock = false;
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	async onReady() {
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		this.log.info("Cleanup devices on start: " +this.config.cleanup_devices);
		this.log.info("config webots_url: " + this.config.webots_port);
		if (this.config.cleanup_devices){
			this.deleteAllDevices();
		}

		this.connect_webots(this.config.webots_port);
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
			//if (!this.lock){
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

	async deleteAllDevices(){
	
		this.log.info("delete all devices");
			const objects = await this.getAdapterObjectsAsync(); // Alle folder, device, channel und state Objekte
			
			// Loop through all objects and devices and delete them
			for (const id in objects) {
				this.delObject(id, (err) => {
					if (err) {
						this.log.error(`Error deleting object ${id}: ${err}`);
					}
				});
			}
	}

	heartbeat() {
		this.isAlive = true;
	}

	connect_webots(port){
		this.log.info("Starting websocket server on port: " + port);

		
		var that = this;
		that.server = new WebSocketServer.Server({ port: port })

		that.server.on('connection', function connection(ws) {
			clearInterval(that.reconnectTimer);
			that.log.info('Device connected');
			
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
		this.log.info("Sending Message to Client [" + name + "]: " + msg);
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

	async update_device(dict){
		this.log.info("Update Device:" + dict["name"]);
		var dev_name = dict["name"];

		// this.log.info("LOCK DEVICE:" + dict["name"]);
		// await this.unsubscribeStatesAsync(dev_name+".*");
		// this.lock = true;
		//check if device has to be created exists
		if(!(dev_name in this.devices)){
			// create new Device entry
			this.log.info("Add Device: " + dev_name);
			this.devices[dev_name] = dict["data"];

			Object.entries(dict).forEach(([key, value]) => {
				this.log.info(`${key}: ${value}`);
			  });

			await this.createDeviceAsync(dev_name);

			for (const [state_name, data] of Object.entries(this.devices[dev_name])) {
				this.log.info("Add State: " +state_name + " Data: " +data + " type: " +typeof(data["value"]))
				await this.setObjectAsync(dev_name +"."+ state_name, {
					type: "state",
					common: {
						name: state_name,
						type: typeof(data["value"]),
						role: "value",
						read: true,
						write: true,
						def: data["value"],
					},
					native: {},
				});
			}
			this.subscribeStates(dev_name+".*");
		}else{
			// update states
			this.devices[dev_name] = dict["data"];
			const state_name = this.devices[dev_name]["name"];
			const value = this.devices[dev_name]["value"];
			//for (const [state_name, data] of Object.entries(this.devices[dev_name])) {
			
			this.log.info("SetState: " + dev_name +"."+state_name +  " to " + value);

				await this.setStateAsync(dev_name +"."+ state_name, {val: value , ack:true});
		}
	}

		
		// await this.subscribeStatesAsync(dev_name+".*");
		// this.lock = false	
		// this.log.info("UNLOCK DEVICE:" + dict["name"]);
	

	add_client(name,ws){
		this.clients[name] = ws
	}

	async updateState(device, name, value){
		this.setStateAsync(device +"."+ name, value, true);
	}


}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options={}]
	 */
	module.exports = (options) => new SmarthomeWebots(options);
} else {
	// otherwise start the instance directly
	new SmarthomeWebots();
}
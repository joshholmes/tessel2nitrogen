# Nitrogen MQTT Tessel sample

This MQTT sample app allows you to connect to the Nitrogen MQTT gateway from a Tessel. 

## Running the sample:

1. Clone or fork this repo: `https://github.com/joshholmes/tessel2nitrogen`
2. Fetch and install its node.js dependencies: `npm install`
3. Edit `config.js` to change defaults as necessary.
4. `npm start`

## Prerequisites 

You will need: 
1. [Tessel](https://tessel.io/). 
2. And you'll need to do a [Tessel Climate Module](https://tessel.io/docs/climate). 
3. Then you'll need to go through their [starting guide](http://start.tessel.io/install). 

The next bit that you'll need is on the Nitrogen side. 

1. You'll need to create an account. 
2. You'll need to install the Nitrogen client library for your laptop so you can prevision devices and send command. See the [Nitrogen starting guide](http://nitrogen.io/guides/start/setup.html) for more details. 


## Provisioning a device

The next thing that you need to do is create the device in Nitrogen. 

To provision a device to use the MQTT gateway:
1. Create the device with the command line tool:

use the `> n2 apikeys ls` command to find your api key then run the following command.

`> n2 principal create --type device --name 'my device' --apiKey 'API KEY HERE'`

The ID of the created device is the username that this device should use to authenticate with the service.

2. Provision a long lived access token for the device using the command line tool:

`> n2 principal accesstoken <device_id>`

This will create a long lived accesstoken with the service that should be used as the password during MQTT authentication.  For example, using the 'mqtt' module in node.js, interacting with the gateway would look something like this:

``` javascript
var deviceId = <device id you just created>;
var password = <access token you just created>;

var mqtt = require('mqtt')
  // Make sure to replace this line with the IP Address of your MQTT server
  , brokerIP = 'n-mqtt-gw.cloudapp.net' // or where ever your MQTT gateway lives at the moment. 
  , brokerPort = 1883
  , client = mqtt.createClient(brokerPort, brokerIP, {
    'username': deviceId,
    'password': password
    })
  , tessel = require('tessel')
  , climate = require('climate-si7005').use(tessel.port['A']);

var subscription = '{"to": \"'+deviceId+'\" }';
client.subscribe(subscription);


climate.on('ready', function ready() {
  console.log('climate ready');
  // We will set an interval of 10 seconds to make sure we don't use up all of Tessel's 4 sockets
  setInterval(function() {
    // Read the temperature
    climate.readTemperature(function(err, temperature) {
      // If there was no error
      if (!err) {
        console.log('publishing temp', temperature.toFixed(4));
        // Publish the string representation of the temperature
        client.publish(subscription, JSON.stringify({
              type:'_temperature',
              body: {
                 temperature: temperature.toFixed(4)
              }
          }));
      }
    });
  }, 10000);
});

client.on('message', function (topic, data) {
  console.log("Recieved a message and topic is: " + topic + " and the data is " + data);

  var message = JSON.parse(data);

  if (message.send === 'humidity'){
    climate.readHumidity(function (err, humid) {
        console.log('Humidity:', humid.toFixed(4) + '%RH');
        client.publish(subscription, JSON.stringify({
              type:'_humidity',
              body: {
                 humidity: humid.toFixed(4) + '%RH'
              }
          }));
      });
  }
});
```

Then run this on your Tessel with the following command:

'tessel run sample.js'

To send a command to your Tessel, use the n2 command line as follows:

`> n2 message send '{"type": "_custom", "tags":["command:<device id>"], "body": {"send": "humidity"}, "from":"<principal id>", "to":"<device id>"}'`

Log into the [Web Admin Message center](https://admin.nitrogen.io/#/messages/skip/0/sort/ts/direction/-1) to see your messages. 

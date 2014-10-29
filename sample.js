var deviceId = '5450350ff8268c8904d181c2';
var password = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI1NDUwMzUwZmY4MjY4Yzg5MDRkMTgxYzIiLCJpYXQiOjE0MTQ1NDQ1MDAsImV4cCI6MTQxNDYzMDkwMH0.ubwxfXWUl1_0p1Pz_CrxlSPu1Np75yHbxdcuN9_gk9E'


var mqtt = require('mqtt')
  // Make sure to replace this line with the IP Address of your MQTT server
  , brokerIP = 'n-mqtt-gw.cloudapp.net'
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

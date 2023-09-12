import * as Mqtt from 'mqtt'
import 'dotenv/config';

var brokerUrl: any = process.env.MQTT_BROKER_URL
var mqttTopic: any = process.env.MQTT_TOPIC
var options: any = {
  clientId: process.env.MQTT_CLIENT_ID,
  port: parseInt(process.env.MQTT_PORT || '1883'),
  keepalive: parseInt(process.env.MQTT_KEEP_ALIVE || '60'),
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD,
};

class MqttHandler {
  public mqttClient: any
  
  connect() {
    // Connect mqtt with credentials (in case of needed, otherwise we can omit 2nd param)
    this.mqttClient = Mqtt.connect(brokerUrl, options);

    // Mqtt error calback
    this.mqttClient.on('error', (err: any) => {
      console.log(err);
      this.mqttClient.end();
    });

    // Connection callback
    this.mqttClient.on('connect', () => {
      console.log(`mqtt client connected`);
      this.mqttClient.subscribe(mqttTopic, function mqttSubribe(err: any, granted: any) {
        console.log('Subscribed to ' + mqttTopic)
      });
    });

    // mqtt subscriptions

    // When a message arrives, console.log it
    this.mqttClient.on('message', function (topic: any, message: any) {
      console.log(message.toString());
      const jsonString = JSON.parse(message.toString());
      console.log('jsonString : ',jsonString['uuid'])

      //process insert to DB
    });

    this.mqttClient.on('close', () => {
      console.log(`mqtt client disconnected`);
    });
  }

}

export = MqttHandler;
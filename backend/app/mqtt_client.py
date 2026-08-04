class MQTTClient:
    def connect(self):
        return True

    def publish(self, topic: str, payload: str):
        print(f"MQTT publish -> {topic}: {payload}")

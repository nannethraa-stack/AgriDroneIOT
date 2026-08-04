import os

class Settings:
    APP_NAME = os.getenv("APP_NAME", "AgriDroneIOT Backend")
    ENV = os.getenv("ENV", "development")
    MQTT_BROKER = os.getenv("MQTT_BROKER", "localhost")
    MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./agri.db")

settings = Settings()

def fuse_sensor_data(data: dict) -> dict:
    return {
        "device_id": data.get("device_id"),
        "temperature": data.get("temperature"),
        "humidity": data.get("humidity"),
        "soil_moisture": data.get("soil_moisture"),
    }

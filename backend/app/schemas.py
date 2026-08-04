from pydantic import BaseModel

class SensorReadingBase(BaseModel):
    device_id: str
    temperature: float | None = None
    humidity: float | None = None
    soil_moisture: float | None = None

class SensorReadingCreate(SensorReadingBase):
    pass

class SensorReadingRead(SensorReadingBase):
    id: int

    class Config:
        from_attributes = True

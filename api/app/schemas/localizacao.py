from pydantic import BaseModel


class CoordenadasOut(BaseModel):
    latitude: float
    longitude: float
    endereco: str

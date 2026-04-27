from pydantic import BaseModel

class InputSchema(BaseModel):
    gamename: str
    preset: str
    resolution: str
    upscaling: str
    gpu: str
    cpu: str
    ram: str

class ModelOutputSchema(BaseModel):
    avg_fps: int
    min_fps: int
    max_fps: int

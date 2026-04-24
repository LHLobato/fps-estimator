from pydantic import BaseModel

class BenchmarkResult(BaseModel):
    avg_fps: int
    min_fps: int
    max_fps: int

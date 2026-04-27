from pydantic import BaseModel

class BenchmarkResult(BaseModel):
    """
    LLM Response Schema for avg, min and max FPS return.
    """
    avg_fps: int
    min_fps: int
    max_fps: int

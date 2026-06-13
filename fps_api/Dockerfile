FROM python:3.11-slim
WORKDIR /app
COPY fps_api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY fps_api/ ./fps_api/
COPY model/ ./model/
COPY data/ ./data/
ENV PYTHONPATH=/app
EXPOSE 8000
CMD ["uvicorn", "fps_api.app:app", "--host", "0.0.0.0", "--port", "8000"]

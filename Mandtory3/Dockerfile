FROM python:3.14.10-slim
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . . 
EXPOSE 5000

CMD ["python", "football_prediction_backend.py"]

FROM python:3.12-slim
WORKDIR /app
COPY services/ml/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/ml/src ./src
EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]

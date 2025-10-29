FROM python:3.11-alpine

RUN apk add --no-cache gcc musl-dev postgresql-dev

WORKDIR /app
COPY src/ .
COPY requirements.txt .
COPY cookies.txt .

RUN pip install --no-cache-dir -r requirements.txt

CMD ["python", "index.py"]

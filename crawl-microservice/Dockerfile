FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

RUN crawl4ai-setup

RUN python -m playwright install chromium

COPY app.py /app/app.py

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]


# torun the docker container, use the following commands:
#
# docker build -t crawler-ms .
# docker run --name crawler-ms -p 8001:8001 crawler-ms
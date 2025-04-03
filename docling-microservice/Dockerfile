FROM python:3.10-slim

WORKDIR /app

COPY ./requirements.txt /app/requirements.txt
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY ./app.py /app/app.py

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

# torun the docker container, use the following commands:
#
# docker build -t docling-ms .
# docker run --name docling-ms -p 8000:8000 docling-ms
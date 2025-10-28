FROM public.ecr.aws/lambda/python:3.11

RUN yum install -y postgresql-devel gcc python3-devel

WORKDIR ${LAMBDA_TASK_ROOT}
COPY src/worker.py worker.py
COPY requirements.txt .
COPY cookies.txt .

RUN pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

CMD ["worker.handler"]

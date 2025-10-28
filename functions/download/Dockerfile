FROM public.ecr.aws/lambda/python:3.11

RUN yum install -y postgresql-devel gcc python3-devel

WORKDIR ${LAMBDA_TASK_ROOT}
COPY src/index.py index.py
COPY requirements.txt .
COPY cookies.txt .

RUN pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

CMD ["index.handler"]

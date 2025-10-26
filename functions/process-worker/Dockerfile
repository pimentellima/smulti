ARG PYTHON_VERSION=3.11
FROM public.ecr.aws/lambda/python:${PYTHON_VERSION}

RUN yum install -y postgresql-devel gcc python3-devel

RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    mv ~/.local/bin/uv /usr/local/bin/uv

WORKDIR ${LAMBDA_TASK_ROOT}

COPY pyproject.toml .
COPY uv.lock .  # opcional, se existir

RUN uv pip install --system --target "${LAMBDA_TASK_ROOT}"

COPY src/handler.py handler.py
COPY cookies.txt .

CMD ["handler.lambda_handler"]

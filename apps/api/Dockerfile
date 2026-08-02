# RigScout FastAPI — production image (Railway / Fly / any container host)
# Build context: apps/api
FROM python:3.12-slim

WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    ENVIRONMENT=production

COPY pyproject.toml uv.lock README.md ./
COPY src ./src

# Install uv from PyPI (avoids a hard dependency on ghcr.io mirrors)
RUN pip install --no-cache-dir uv \
    && uv sync --frozen --no-dev

EXPOSE 8000

# Railway / Render inject PORT; default to 8000 locally
CMD ["sh", "-c", "uv run uvicorn src.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

WORKDIR /app

# Install small build deps (kept minimal). Adjust if your requirements need more.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential gcc libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (cache this layer by copying only requirements first)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . /app

# Create and switch to a non-root user
RUN addgroup --system app && adduser --system --ingroup app app
USER app

EXPOSE 8000

# Run the app with Uvicorn (expects `main:app`).
# If your entrypoint differs, update this line.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

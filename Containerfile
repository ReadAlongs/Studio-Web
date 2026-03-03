# Containerfile for doing CI tests locally
FROM mcr.microsoft.com/playwright:v1.57.0-noble

RUN apt-get update
RUN apt-get install -y python3-venv
RUN python3 -m venv /RAS-venv
RUN . /RAS-venv/bin/activate && pip install "readalongs[api]"

RUN useradd -ms /bin/bash ras

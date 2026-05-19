# PostgreSQL with zhparser for Chinese full-text search
FROM postgres:16-bookworm

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    postgresql-server-dev-16 \
  && git clone --depth 1 https://github.com/amutu/zhparser.git /tmp/zhparser \
  && cd /tmp/zhparser && make && make install \
  && rm -rf /tmp/zhparser \
  && apt-get purge -y git build-essential postgresql-server-dev-16 \
  && apt-get autoremove -y \
  && rm -rf /var/lib/apt/lists/*

COPY init/ /docker-entrypoint-initdb.d/

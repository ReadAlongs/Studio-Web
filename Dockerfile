FROM ubuntu:latest

RUN apt-get update && apt-get -y install curl xz-utils git
WORKDIR /root
RUN curl https://nodejs.org/dist/v18.13.0/node-v18.13.0-linux-x64.tar.xz | tar Jxf -
RUN mkdir /root/Web-Component
COPY .git/ /root/Web-Component/.git/
WORKDIR /root/Web-Component
RUN git checkout dev.monorepo && git restore .
RUN git submodule update --init
RUN PATH=/root/node-v18.13.0-linux-x64/bin:$PATH npm install --force
RUN PATH=/root/node-v18.13.0-linux-x64/bin:$PATH npx nx build web-component

FROM ubuntu:14.04

RUN apt-get update
RUN apt-get install -y python gcc make g++ git
RUN apt-get install -y wget

RUN wget https://nodejs.org/dist/v4.4.4/node-v4.4.4-linux-x64.tar.gz
RUN tar -C /usr/local -zxf node-v4.4.4-linux-x64.tar.gz --strip 1

RUN npm install -g npm3

RUN mkdir -p /orbit

WORKDIR /orbit

RUN git clone -b orbitdbrefactor https://github.com/haadcode/orbit.git

WORKDIR /orbit/orbit

RUN npm3 install

EXPOSE 3001

CMD node index

FROM node:14-stretch-slim

# Create app directory
WORKDIR /usr/src/app

COPY . ./

RUN npm install

# Bundle app source
# COPY . .

EXPOSE 3009
CMD [ "node", "main.js" ]
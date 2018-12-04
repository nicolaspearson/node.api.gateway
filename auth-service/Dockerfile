# Step 1 : Builder image
FROM node:10-slim AS builder

# Create app user
RUN groupadd -r app && useradd -r -g app -s /bin/false app
ENV HOME=/home/app

# Create app directory
COPY --chown=app:app package.json $HOME/node/

# Install app dependencies
USER app
WORKDIR $HOME/node
RUN npm install

# Bundle app source
USER root
COPY --chown=app:app . $HOME/node/

USER app
RUN npm run build

# Step 2 : Run image
FROM node:10-slim

# Create app user
RUN groupadd -r app && useradd -r -g app -s /bin/false app
ENV HOME=/home/app

# Create app directory
COPY --chown=app:app package.json $HOME/node/

# Install app dependencies
USER app
WORKDIR $HOME/node
RUN npm install --only=production

COPY --from=builder $HOME/node/dist/ $HOME/node/dist

CMD [ "node", "." ]

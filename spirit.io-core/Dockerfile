FROM docker.bbuzcloud.com/vendors/node-bee:8.15.0-stretch-1

# Create app directory
WORKDIR /home/bee/app/cpos/packages/services/bee-job-scheduler-service

# Bundle app source
COPY --chown=bee index.js .
COPY --chown=bee package.json .
COPY --chown=bee build-info.json .
COPY --chown=bee build build
COPY --chown=bee node_modules node_modules

CMD [ "node", "build/main.js" ]

const { , validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'default',
  service: 'cics-task-management',
  location: 'us-central1'
};
exports.connectorConfig = connectorConfig;


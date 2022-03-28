export const environment = {
  production: false,
  port: 4333,
  redis_port: 6390,
  redis_host: '10.11.30.22',
  redis_password: 'UTrKE86N5esPz9v2',
  activemq_port: 61613,
  activemq_host: '10.11.30.22',
  activemq_connect_host: '/',
  activemq_connect_login: 'admin',
  activemq_connect_passcode: 'admin',
  activemq_connect_heart_beat: '5000,5000',
  mongodb_query_url: 'mongodb://10.11.30.3:27017/loyalty_fv',
  mongodb_mutate_url: 'mongodb://10.11.30.3:27017/loyalty_fv',
  keycloak: {
    url: 'http://localhost:8080/auth',
    realm: 'eco_loyalty',
    client_id: 'nest_eco_loyalty',
    client_secret: '4EqSIdIe5nsZo3gAOrnJwUh2fNNkJeNA'
  }
};

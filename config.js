var config = {};

config.mongodb_endpoint = 'mongodb://botcoin';
config.mongodb_db = 'jub-dj';
config.auth = {
  token_len: '20'
}

//config.web.port = process.env.WEB_PORT || 9980;

module.exports = config;

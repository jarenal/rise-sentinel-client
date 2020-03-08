const settings = require("./settings");
const config = require(settings.nodeConfigPath);
const fs = require("fs");
const log4js = require("log4js");
const socket = require('socket.io-client')(settings.sentinelHost);

log4js.configure({
    appenders: {
        console: { type: 'console' }
    }, 
    categories: {
        default: { appenders: ['console'], level: 'debug' }
    }
});
const logger = log4js.getLogger('default');

socket.on('connect', function(){
    let role = config.forging.secret.length ? "master" : "slave";
    logger.info('Connected to ' + settings.sentinelHost + ' as ' + role);
    socket.emit('greeting', {...settings, "role": role});
});

socket.on('promote', function(){
    logger.info(settings.alias + ' will be promoted to master');
    config.forging.secret = [];
    fs.writeFileSync(settings.nodeConfigPath, JSON.stringify(config));
    config.forging.secret.push("one two three")
    fs.writeFileSync(settings.nodeConfigPath, JSON.stringify(config));
});

socket.on('demote', function(){
    logger.info(settings.alias + ' will be promoted to slave');
    config.forging.secret = [];
    fs.writeFileSync(settings.nodeConfigPath, JSON.stringify(config));
});

socket.on('disconnect', function(){
    logger.error('Disconnected from ' + settings.sentinelHost);
});
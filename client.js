const settings = require("./settings");
const config = require(settings.nodeConfigPath);
const fs = require("fs");
const log4js = require("log4js");
const socket = require('socket.io-client')(settings.sentinelHost);
const { exec } = require("child_process");

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
    config.forging.secret.push(settings.secret)
    fs.writeFileSync(settings.nodeConfigPath, JSON.stringify(config));
    reloadNode();
});

socket.on('demote', function(){
    logger.info(settings.alias + ' will be promoted to slave');
    config.forging.secret = [];
    fs.writeFileSync(settings.nodeConfigPath, JSON.stringify(config));
    reloadNode();
});

socket.on('disconnect', function(){
    logger.error('Disconnected from ' + settings.sentinelHost);
});

let reloadNode = () => {
    exec("/home/rise/rise/./manager.sh reload node", (error, stdout, stderr) => {
        if (error || stderr) {
            logger.error(`Error trying to reload node ${settings.alias}`);
            if (error) {
                logger.error(error.message);
            }

            if (stderr) {
                logger.error(stderr);
            }
            return;
        }

        logger.info(`Node ${settings.alias} reloaded successfully`);
        logger.info(stdout);
    });
};
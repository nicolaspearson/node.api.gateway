import HemeraJoi from 'hemera-joi';
import HemeraRedisCache from 'hemera-redis-cache';
import * as Nats from 'nats';
import Hemera from 'nats-hemera';

import * as config from './environments';

// Setup environment config
config.init();

const nats = Nats.connect({
	url: config.getServerConfig().NATS_URL,
	user: config.getServerConfig().NATS_USER,
	pass: config.getServerConfig().NATS_PW
});

const hemeraLogLevel: any = config.getServerConfig().HEMERA_LOG_LEVEL;
const hemera = new Hemera(nats, {
	logLevel: hemeraLogLevel,
	childLogger: true,
	tag: 'hemera-cache'
});

hemera.use(HemeraJoi);
hemera.use(HemeraRedisCache, {
	redis: {
		host: config.getServerConfig().REDIS_URL,
		port: config.getServerConfig().REDIS_PORT
	}
});

// tslint:disable no-console
hemera
	.ready()
	.then(() => console.log('Cache service listening ...'))
	.catch(err => console.error(err, 'Cache service error'));

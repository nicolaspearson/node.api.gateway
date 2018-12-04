import nconf from 'nconf';
import * as path from 'path';

export function init() {
	nconf.argv().env();
	const environment = nconf.get('NODE_ENV') || 'development';
	nconf.file(
		environment,
		path.resolve(`dist/environments/config.${environment.toLowerCase()}.json`)
	);
	nconf.file('default', path.resolve(`dist/environments/config.default.json`));
}

export interface IServerConfigurations {
	API_HOST: string | number;
	API_PORT: string | number;
	HEMERA_LOG_LEVEL: string;
	JWT_SECRET: string;
	NATS_URL: string;
	NATS_USER: string;
	NATS_PW: string;
	ROUTE_PREFIX: string;
}

export function getServerConfig(): IServerConfigurations {
	return nconf.get();
}

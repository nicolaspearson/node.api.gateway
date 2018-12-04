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
	ACCESS_TOKEN: string;
	DB_HOST: string;
	DB_PORT: number;
	DB_NAME: string;
	DB_LOGGING:
		| boolean
		| 'all'
		| Array<'query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration'>;
	DB_CONNECTION_NAME: string;
	DB_SCHEMA: string;
	DB_PASSWORD: string;
	DB_USERNAME: string;
	HEMERA_LOG_LEVEL: string;
	JAEGER_URL: string;
	NATS_URL: string;
	NATS_USER: string;
	NATS_PW: string;
	RECAPTCHA_URL: string;
	RECAPTCHA_SECRET: string;
	RECAPTCHA_INVISIBLE_SECRET: string;
}

export function getServerConfig(): IServerConfigurations {
	return nconf.get();
}

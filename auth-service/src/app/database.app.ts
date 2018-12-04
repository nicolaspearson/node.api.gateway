import * as path from 'path';
import { Connection, ConnectionOptions, createConnection } from 'typeorm';

import { getServerConfig } from '@environments';
import AppLogger from '@logger/app.logger';

export class Database {
	private connection: Connection;

	constructor() {
		// Empty constructor
	}

	public async setupDatabase(): Promise<Connection> {
		// Create the database connection
		AppLogger.logger.debug(`Database: Connecting`);
		try {
			if (!this.connection) {
				this.connection = await createConnection(this.getConnectionOptions());
			}
		} catch (error) {
			AppLogger.logger.error(`Database: Error connecting: ${JSON.stringify(error)}`);
			throw error;
		}
		AppLogger.logger.debug(`Database: Connected`);
		return this.connection;
	}

	private getConnectionOptions(): ConnectionOptions {
		const options: ConnectionOptions = {
			database: getServerConfig().DB_NAME,
			entities: [path.resolve('dist/models/*.js')],
			host: getServerConfig().DB_HOST,
			logging: this.getDatabaseLogLevel(),
			name: getServerConfig().DB_CONNECTION_NAME,
			password: getServerConfig().DB_PASSWORD,
			port: getServerConfig().DB_PORT,
			schema: getServerConfig().DB_SCHEMA,
			type: 'postgres',
			username: getServerConfig().DB_USERNAME
		};
		if (process.env.NODE_ENV !== 'production') {
			AppLogger.logger.debug(`Database: Connection Options: ${JSON.stringify(options)}`);
		}
		return options;
	}

	// Get the desired log level from config, unfortunately the type is not exposed
	// therefore we need to compose an ugly type definition in the declaration
	private getDatabaseLogLevel() {
		let logLevel = false as
			| boolean
			| 'all'
			| Array<'query' | 'schema' | 'error' | 'warn' | 'info' | 'log' | 'migration'>;
		if (getServerConfig().DB_LOGGING) {
			logLevel = getServerConfig().DB_LOGGING;
		}
		return logLevel;
	}
}

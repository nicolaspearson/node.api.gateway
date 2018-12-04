import 'module-alias/register';

import * as Blipp from 'blipp';
import Hapi from 'hapi';
import HapiHemera from 'hapi-hemera';
import * as HapiSwagger from 'hapi-swagger';
import HemeraJaeger from 'hemera-jaeger';
import * as Inert from 'inert';
import * as path from 'path';
import * as Vision from 'vision';

import * as config from '@environments';
import AppLogger from '@logger/app.logger';

async function init() {
	// Setup environment config
	config.init();

	const hapiHost: any = config.getServerConfig().API_HOST;
	const hapiPort: any = config.getServerConfig().API_PORT;

	// Create the Hapi server
	const server: Hapi.Server = new Hapi.Server({
		port: hapiPort,
		host: hapiHost,
		debug: { request: ['error'] },
		routes: {
			cors: {
				additionalHeaders: ['x-access-token'],
				origin: [
					'http://localhost:3000',
					'http://localhost:3001',
					'http://localhost:4444',
					'http://react.client.localhost'
				]
			}
		}
	});

	// Configure the logger
	const appLogger = new AppLogger();
	appLogger.setupAppLogger();

	// Use JWT authentication
	await server.register(require('hapi-auth-jwt2'));

	server.auth.strategy('jwt', 'jwt', {
		key: config.getServerConfig().JWT_SECRET,
		validate: async (decoded: any, request: any) => {
			const res = await server.inject({
				method: 'get',
				url: `${config.getServerConfig().ROUTE_PREFIX}/auth/authorize`,
				headers: request.headers
			});
			return res.result;
		}
	});

	server.auth.default('jwt');

	// Register Hemera
	const hemeraLogLevel: any = config.getServerConfig().HEMERA_LOG_LEVEL;
	await server.register({
		plugin: HapiHemera,
		options: {
			hemera: {
				name: 'api-gateway',
				logLevel: hemeraLogLevel,
				childLogger: true,
				tag: 'hemera-api-gw-1'
			},
			nats: {
				url: config.getServerConfig().NATS_URL,
				user: config.getServerConfig().NATS_USER,
				pass: config.getServerConfig().NATS_PW
			},
			plugins: [
				{
					register: HemeraJaeger,
					options: {
						serviceName: 'api',
						jaeger: {
							sampler: {
								type: 'Const',
								options: true
							},
							options: {
								tags: {
									'nodejs.version': process.versions.node
								}
							},
							reporter: {
								host: process.env.JAEGER_URL
							}
						}
					}
				}
			]
		}
	});

	// Auto route discovery
	await server.register(
		{
			plugin: require('wurst'),
			options: {
				routes: '*.routes.js',
				cwd: path.join(__dirname, 'routes')
			}
		},
		{
			routes: {
				prefix: config.getServerConfig().ROUTE_PREFIX
			}
		}
	);

	// Route table console output
	await server.register(Blipp);

	// Swagger Plugins
	await server.register(Inert);
	await server.register(Vision);
	await server.register(HapiSwagger);

	// Enriched console output
	await server.register({
		plugin: require('good'),
		options: {
			reporters: {
				console: [
					{
						module: 'good-squeeze',
						name: 'Squeeze',
						args: [
							{
								log: '*',
								request: '*',
								response: '*',
								error: '*'
							}
						]
					},
					{
						module: 'good-console'
					},
					'stdout'
				]
			}
		}
	});

	await server.start();
	return server;
}

init()
	.then(server => {
		AppLogger.logger.debug(`Server running at: ${server.info.uri}`);
	})
	.catch(error => {
		AppLogger.logger.error(`Server failed: ${JSON.stringify(error)}`);
	});

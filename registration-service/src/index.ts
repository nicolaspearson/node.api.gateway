import 'module-alias/register';
import 'reflect-metadata';

import HemeraJaeger from 'hemera-jaeger';
import HemeraJoi from 'hemera-joi';
import * as Nats from 'nats';
import Hemera from 'nats-hemera';

import { Database } from '@app/database.app';
import * as config from '@environments';
import AppLogger from '@logger/app.logger';
import { SharedLogic } from '@logic/shared.logic';
import { SystemUtils } from '@utils/system.utils';

import ContactUsRepository from '@repositories/contact-us.repository';
import ContactUsService from '@services/contact-us.service';

import EarlyAccessRepository from '@repositories/early-access.repository';
import EarlyAccessService from '@services/early-access.service';

import { ContactUsActions, EarlyAccessActions } from '@actions';

// Setup environment config
config.init();

const nats = Nats.connect({
	url: config.getServerConfig().NATS_URL,
	user: config.getServerConfig().NATS_USER,
	pass: config.getServerConfig().NATS_PW
});

const hemeraLogLevel: any = config.getServerConfig().HEMERA_LOG_LEVEL;
const hemera: any = new Hemera(nats, {
	logLevel: hemeraLogLevel,
	childLogger: true,
	tag: 'hemera-registration'
});

async function init() {
	// Setup the logger
	const appLogger = new AppLogger();
	appLogger.setupAppLogger();

	if (process.env.NODE_ENV === 'staging' || process.env.NODE_ENV === 'production') {
		AppLogger.logger.debug('Waiting 30 seconds for database...');
		await SystemUtils.sleep(30000);
	} else {
		AppLogger.logger.debug(
			`Registration service config: ${JSON.stringify(config.getServerConfig())}`
		);
	}

	// Connect to the database
	const database: Database = new Database();
	try {
		await database.setupDatabase();
	} catch (error) {
		AppLogger.logger.error(`Database connection failed: ${JSON.stringify(error)}`);
	}
}

async function start() {
	await init();

	hemera.use(HemeraJoi);
	hemera.use(HemeraJaeger, {
		serviceName: 'registration',
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
				host: config.getServerConfig().JAEGER_URL
			}
		}
	});

	await hemera.ready(() => {
		const sharedLogic = new SharedLogic();

		const contactUsRepository = new ContactUsRepository();
		const contactUsService = new ContactUsService(contactUsRepository);

		const earlyAccessRepository = new EarlyAccessRepository();
		const earlyAccessService = new EarlyAccessService(earlyAccessRepository);

		// Register service actions
		const contactUsActions = new ContactUsActions(
			hemera,
			hemera.joi,
			sharedLogic,
			contactUsService
		);
		contactUsActions.registerActions();

		const earlyAccessActions = new EarlyAccessActions(
			hemera,
			hemera.joi,
			sharedLogic,
			earlyAccessService
		);
		earlyAccessActions.registerActions();

		AppLogger.logger.debug('Registration service listening...');
	});
}

start();

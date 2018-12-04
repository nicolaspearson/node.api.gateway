import Boom from 'boom';
import * as Hemera from 'nats-hemera';

import { getServerConfig } from '@environments';
import AppLogger from '@logger/app.logger';
import { SharedLogic } from '@logic/shared.logic';

import { EarlyAccess } from '@models/early-access.model';
import EarlyAccessService from '@services/early-access.service';

import IRecaptchaResponse from '@models/recaptcha-response.model';

export class EarlyAccessActions {
	constructor(
		private hemera: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
		private joi: any,
		private sharedLogic: SharedLogic,
		private earlyAccessService: EarlyAccessService
	) {
		// Empty constructor
	}

	public registerActions() {
		const shared = this.sharedLogic;
		const earlyAccessService = this.earlyAccessService;

		this.hemera.add(
			{
				topic: 'registration',
				cmd: 'find-early-access-user',
				params: this.joi.any(),
				emailAddress: this.joi.string(),
				refresh: this.joi.boolean().default(false)
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<EarlyAccess> {
				if (request.emailAddress && request.emailAddress.length > 0) {
					let path = 'registration/find-early-access-by-email';
					if (request.params && request.params.path) {
						path = `${path}/${request.params.path}`;
					}
					try {
						const result = await shared.hitCache(this, request, path);
						AppLogger.logger.debug('Cache Hit...');
						return EarlyAccess.newEarlyAccess(result);
					} catch (error) {
						AppLogger.logger.debug('Cache missed. Continue...');
					}
					const earlyAccess: EarlyAccess = await earlyAccessService.findOneByFilter({
						where: { emailAddress: request.emailAddress }
					});
					shared.saveToCache(this, request, path, earlyAccess);
					return earlyAccess;
				}
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
		);

		// Uses X-ACCESS-TOKEN to validate access
		this.hemera.add(
			{
				topic: 'registration',
				cmd: 'save-early-access',
				payload: this.joi.any()
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<EarlyAccess> {
				if (
					!request.headers['x-access-token'] ||
					!(request.headers['x-access-token'] === getServerConfig().ACCESS_TOKEN)
				) {
					throw Boom.unauthorized('Invalid API token');
				}

				let emailAddress: string | undefined;
				let captcha: string | undefined;
				if (request.payload) {
					if (request.payload.emailAddress) {
						emailAddress = request.payload.emailAddress;
					}
					if (request.payload.captcha) {
						captcha = request.payload.captcha;
					}
				}

				if (captcha) {
					let captchaResult: IRecaptchaResponse | undefined;
					try {
						captchaResult = await shared.getCaptchaResult(this, request, captcha, true);
					} catch (error) {
						AppLogger.logger.error(error);
					}
					if (!captchaResult || !(captchaResult.success === true)) {
						throw Boom.unauthorized('Captcha verification failed!');
					}
				} else {
					throw Boom.badRequest('Missing captcha code!');
				}

				if (emailAddress) {
					return await earlyAccessService.signUp(
						EarlyAccess.newEarlyAccess({ emailAddress })
					);
				}
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
		);
	}
}

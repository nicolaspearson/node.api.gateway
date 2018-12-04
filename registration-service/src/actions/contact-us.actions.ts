import Boom from 'boom';
import * as Hemera from 'nats-hemera';

import { getServerConfig } from '@environments';
import AppLogger from '@logger/app.logger';
import { SharedLogic } from '@logic/shared.logic';

import { ContactUs } from '@models/contact-us.model';
import ContactUsService from '@services/contact-us.service';

import IRecaptchaResponse from '@models/recaptcha-response.model';

export class ContactUsActions {
	constructor(
		private hemera: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
		private joi: any,
		private sharedLogic: SharedLogic,
		private contactUsService: ContactUsService
	) {
		// Empty constructor
	}

	public registerActions() {
		const shared = this.sharedLogic;
		const contactUsService = this.contactUsService;

		this.hemera.add(
			{
				topic: 'registration',
				cmd: 'find-contact-us-item-by-email',
				params: this.joi.any(),
				emailAddress: this.joi.string(),
				refresh: this.joi.boolean().default(false)
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<ContactUs> {
				if (request.emailAddress && request.emailAddress.length > 0) {
					let path = 'registration/find-contact-us-item-by-email';
					if (request.params && request.params.path) {
						path = `${path}/${request.params.path}`;
					}
					try {
						const result = await shared.hitCache(this, request, path);
						AppLogger.logger.debug('Cache Hit...');
						return ContactUs.newContactUs(result);
					} catch (error) {
						AppLogger.logger.debug('Cache missed. Continue...');
					}
					const contactUs: ContactUs = await contactUsService.findOneByFilter({
						where: { emailAddress: request.emailAddress }
					});
					shared.saveToCache(this, request, path, contactUs);
					return contactUs;
				}
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
		);

		// Uses X-ACCESS-TOKEN to validate access
		this.hemera.add(
			{
				topic: 'registration',
				cmd: 'save-contact-us-item',
				payload: this.joi.any()
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<ContactUs> {
				if (
					!request.headers['x-access-token'] ||
					!(request.headers['x-access-token'] === getServerConfig().ACCESS_TOKEN)
				) {
					throw Boom.unauthorized('Invalid API token');
				}

				let firstName: string | undefined;
				let lastName: string | undefined;
				let emailAddress: string | undefined;
				let message: string | undefined;
				let captcha: string | undefined;
				if (request.payload) {
					if (request.payload.firstName) {
						firstName = request.payload.firstName;
					}
					if (request.payload.lastName) {
						lastName = request.payload.lastName;
					}
					if (request.payload.emailAddress) {
						emailAddress = request.payload.emailAddress;
					}
					if (request.payload.message) {
						message = request.payload.message;
					}
					if (request.payload.captcha) {
						captcha = request.payload.captcha;
					}
				}

				if (captcha) {
					let captchaResult: IRecaptchaResponse | undefined;
					try {
						captchaResult = await shared.getCaptchaResult(
							this,
							request,
							captcha,
							false
						);
					} catch (error) {
						AppLogger.logger.error(error);
					}
					if (!captchaResult || !(captchaResult.success === true)) {
						throw Boom.unauthorized('Captcha verification failed!');
					}
				} else {
					throw Boom.badRequest('Missing captcha code!');
				}

				if (firstName && lastName && emailAddress && message) {
					return await contactUsService.save(
						ContactUs.newContactUs({ firstName, lastName, emailAddress, message })
					);
				}
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
		);
	}
}

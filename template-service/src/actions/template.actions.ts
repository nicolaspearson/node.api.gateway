import * as Hemera from 'nats-hemera';

import { SharedLogic } from '@logic/shared.logic';

export class TemplateActions {
	constructor(
		private hemera: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
		private joi: any,
		private sharedLogic: SharedLogic
	) {
		// Empty constructor
	}

	public registerActions() {
		const shared = this.sharedLogic;
		this.hemera.add(
			{
				topic: 'template',
				cmd: 'stub',
				headers: this.joi.any(),
				method: this.joi.any(),
				params: this.joi.any(),
				path: this.joi.any(),
				payload: this.joi.any(),
				query: this.joi.any(),
				refresh: this.joi.boolean().default(false)
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			) {
				let path = 'template/stub';
				if (request.params && request.params.path) {
					path = `${path}/${request.params.path}`;
				}
				try {
					// Cache Hit...
					const result = await shared.hitCache(this, request, path);
					return result;
				} catch (error) {
					// Cache missed. Continue...
				}
				const message: object = { message: 'stub' };
				shared.saveToCache(this, request, path, message);
				return JSON.parse(`${message}`);
			}
		);
	}
}

import Hemera from 'nats-hemera';

import AppLogger from '@logger/app.logger';

export class SharedLogic {
	public generateKey(request: Hemera.ServerPattern, path: string): string {
		let key = `auth:${path.replace(/\//g, '_')}`;
		if (request.method) {
			key = `_${key}_${request.method}`;
		}
		if (request.params && Object.keys(request.params).length > 0) {
			key = `_${key}_${JSON.stringify(request.params)}`;
		}
		if (request.query && Object.keys(request.query).length > 0) {
			key = `_${key}_${JSON.stringify(request.query)}`;
		}
		return key;
	}

	public async hitCache(
		hemeraObject: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
		request: Hemera.ServerPattern,
		path: string
	): Promise<object> {
		const key = this.generateKey(request, path);
		if (!request.refresh && request.method === 'get') {
			// Check cache
			const resp = await hemeraObject.act({
				topic: 'redis-cache',
				cmd: 'get',
				key
			});

			if (resp && resp.data) {
				// Mark this request as cached for zipkin
				hemeraObject.delegate$.cache = 'Redis:HIT';
				try {
					// Return the cached result
					return JSON.parse(resp.data);
				} catch (error) {
					// Log caching error
					AppLogger.logger.error(`Failed hitting cache: ${JSON.stringify(error)}`);
				}
			}
		}
		throw new Error('Cache missed. Request from data source instead.');
	}

	public async saveToCache(
		hemeraObject: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
		request: Hemera.ServerPattern,
		path: string,
		result: object
	): Promise<void> {
		const key = this.generateKey(request, path);
		if (request.method === 'get') {
			try {
				// Update cache
				await hemeraObject.act({
					topic: 'redis-cache',
					cmd: 'set',
					key,
					value: JSON.stringify(result)
				});
			} catch (error) {
				// Log caching error
				AppLogger.logger.error(`Failed saving to cache: ${JSON.stringify(error)}`);
			}
		}
	}
}

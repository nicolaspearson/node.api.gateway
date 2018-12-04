import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import Hemera from 'nats-hemera';

import { getServerConfig } from '@environments';
import AppLogger from '@logger/app.logger';
import IRecapatchaRequest from '@models/recaptcha-request.model';
import IRecaptchaResponse from '@models/recaptcha-response.model';

export class SharedLogic {
	public generateKey(request: Hemera.ServerPattern, path: string): string {
		let key = `registration:${path.replace(/\//g, '_')}`;
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

	public async proxyRequest(
		request: Hemera.ServerPattern,
		url: string,
		path?: string
	): Promise<AxiosResponse> {
		let endpoint = `${url}`;
		if (path) {
			endpoint = `${endpoint}/${path}`;
		}

		// Create the configuration
		const requestConfig: AxiosRequestConfig = {
			method: request.method,
			url: endpoint,
			headers: request.headers,
			params: request.query,
			data: request.payload
		};
		AppLogger.logger.debug(`SharedLogic: proxyRequest: ${JSON.stringify(requestConfig)}`);
		// Execute the request
		return axios(requestConfig);
	}

	public async getProxyResult(
		hemeraObject: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
		request: Hemera.ServerPattern,
		url: string,
		path?: string
	): Promise<any> {
		const key: string | undefined = path ? this.generateKey(request, path) : undefined;
		let result;

		if (!request.refresh && request.method === 'get' && key) {
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

		// No cache - Execute request
		const response: AxiosResponse = await this.proxyRequest(request, url, path);
		if (response && response.data) {
			result = response.data;
		}

		if (request.method === 'get' && key) {
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
		AppLogger.logger.debug(`Proxy Result: ${JSON.stringify(result)}`);
		return result;
	}

	public async getCaptchaResult(
		hemeraObject: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
		request: Hemera.ServerPattern,
		captcha: string,
		invisibleCaptcha: boolean
	): Promise<IRecaptchaResponse> {
		request.headers = {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Cache-Control': 'no-cache'
		};
		const payload: IRecapatchaRequest = {
			secret: invisibleCaptcha
				? getServerConfig().RECAPTCHA_INVISIBLE_SECRET
				: getServerConfig().RECAPTCHA_SECRET,
			response: captcha
		};
		request.query = payload;
		const proxyResult = await this.getProxyResult(
			hemeraObject,
			request,
			getServerConfig().RECAPTCHA_URL
		);
		// tslint:disable no-string-literal
		const captchaResult: IRecaptchaResponse = {
			success: proxyResult.success,
			challenge_ts: proxyResult['challenge_ts'],
			hostname: proxyResult.hostname,
			'error-codes': proxyResult['error-codes']
		};
		AppLogger.logger.debug(`Captcha Result: ${JSON.stringify(captchaResult)}`);
		return captchaResult;
	}
}

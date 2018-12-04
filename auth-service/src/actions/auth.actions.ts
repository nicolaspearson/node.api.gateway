import Boom from 'boom';
import * as Hemera from 'nats-hemera';

import { getServerConfig } from '@environments';
import AppLogger from '@logger/app.logger';
import { SharedLogic } from '@logic/shared.logic';
import Token from '@models/internal/token.internal';
import { User } from '@models/user.model';
import UserService from '@services/user.service';
import { AuthUtils } from '@utils/auth.utils';

export class AuthActions {
	constructor(
		private hemera: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
		private joi: any,
		private sharedLogic: SharedLogic,
		private userService: UserService
	) {
		// Empty constructor
	}

	public registerActions() {
		const shared = this.sharedLogic;
		const userService = this.userService;

		this.hemera.add(
			{
				topic: 'auth',
				cmd: 'authorize',
				headers: this.joi.any()
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<object> {
				AppLogger.logger.debug(JSON.stringify(request.headers));
				if (!request.headers.authorization) {
					return { isValid: false };
				}
				try {
					const authToken = AuthUtils.verifyAuthHeader(request.headers.authorization);
					if (authToken) {
						const token: Token = new Token(authToken);
						const path = `auth/authorize/${authToken}`;
						if (token) {
							try {
								token.verifyToken();
							} catch (error) {
								// Token Expired
								return { isValid: false };
							}
							try {
								const resultCache: any = await shared.hitCache(this, request, path);
								const userCache = User.newUser(resultCache.user);
								AppLogger.logger.debug('Cache Hit...');
								return { isValid: true, user: userCache };
							} catch (error) {
								AppLogger.logger.debug('Cache missed. Continue...');
							}

							const user: User = await userService.authorize(token);
							if (user && user.id && user.enabled) {
								const result = { isValid: true, user };
								shared.saveToCache(this, request, path, result);
								return result;
							}
						}
					}
				} catch (error) {
					AppLogger.logger.error(`Authorization failed: ${JSON.stringify(error)}`);
				}
				return { isValid: false };
			}
		);

		// Uses X-ACCESS-TOKEN to validate access, and returns a JWT token
		this.hemera.add(
			{
				topic: 'auth',
				cmd: 'login',
				headers: this.joi.any(),
				params: this.joi.any(),
				payload: this.joi.any()
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<object> {
				if (
					!request.headers['x-access-token'] ||
					!(request.headers['x-access-token'] === getServerConfig().ACCESS_TOKEN)
				) {
					throw Boom.unauthorized('Invalid API token');
				}

				let username: string | undefined;
				let password: string | undefined;
				let emailAddress: string | undefined;
				if (request.payload) {
					if (request.payload.username) {
						username = request.payload.username;
					}
					if (request.payload.password) {
						password = request.payload.password;
					}
					if (request.payload.emailAddress) {
						emailAddress = request.payload.emailAddress;
					}
				}
				if (password && (username || emailAddress)) {
					return await userService.login(password, username, emailAddress);
				}
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
		);

		this.hemera.add(
			{
				topic: 'auth',
				cmd: 'find-user-by-id',
				params: this.joi.any(),
				id: this.joi.number(),
				refresh: this.joi.boolean().default(false)
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<User> {
				if (request.id && request.id > 0) {
					let path = 'auth/find-user-by-id';
					if (request.params && request.params.path) {
						path = `${path}/${request.params.path}`;
					}
					try {
						const result = await shared.hitCache(this, request, path);
						AppLogger.logger.debug('Cache Hit...');
						return User.newUser(result);
					} catch (error) {
						AppLogger.logger.debug('Cache missed. Continue...');
					}
					const user: User = await userService.findOneById(request.id);
					shared.saveToCache(this, request, path, user);
					return user;
				}
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
		);

		this.hemera.add(
			{
				topic: 'auth',
				cmd: 'search-user',
				payload: this.joi.any()
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<User[]> {
				if (request.payload && request.payload.limit && request.payload.terms) {
					return await userService.search(request.payload.limit, request.payload.terms);
				}
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
		);

		// Uses X-ACCESS-TOKEN to validate access, and returns a JWT token
		this.hemera.add(
			{
				topic: 'auth',
				cmd: 'save-user',
				headers: this.joi.any(),
				payload: this.joi.any()
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<object> {
				if (
					!request.headers['x-access-token'] ||
					!(request.headers['x-access-token'] === getServerConfig().ACCESS_TOKEN)
				) {
					throw Boom.unauthorized('Invalid API token');
				}

				if (request.payload && request.payload.user) {
					const user: User = User.newUser(request.payload.user);
					if (user) {
						return await userService.signUp(user);
					}
				}
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
		);

		this.hemera.add(
			{
				topic: 'auth',
				cmd: 'change-user-password',
				payload: this.joi.any()
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<object> {
				if (request.payload && request.payload.user && request.payload.newPassword) {
					const user: User = User.newUser(request.payload.user);
					if (user) {
						return await userService.changePassword(user, request.payload.newPassword);
					}
				}
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
		);

		this.hemera.add(
			{
				topic: 'auth',
				cmd: 'update-user',
				params: this.joi.any(),
				payload: this.joi.any()
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<User> {
				if (
					request.payload &&
					request.payload.user &&
					request.params &&
					request.params.id
				) {
					const user: User = User.newUser(request.payload.user);
					if (user) {
						if (String(request.params.id) !== String(user.id)) {
							throw Boom.badRequest(
								'An id mismatch error occurred. The id supplied as a url parameter does not match the supplied user'
							);
						}
						return await userService.update(user);
					}
				}
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
		);

		this.hemera.add(
			{
				topic: 'auth',
				cmd: 'delete-user',
				params: this.joi.any()
			},
			async function(
				this: Hemera<Hemera.ServerRequest, Hemera.ServerResponse>,
				request: Hemera.ServerPattern
			): Promise<User> {
				if (request.params && request.params.id) {
					return await userService.delete(request.params.id);
				}
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
		);
	}
}

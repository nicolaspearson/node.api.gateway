import Hapi from 'hapi';

const routes = [
	{
		config: { auth: 'jwt' },
		method: 'get',
		path: '/registration/find-contact-us-item/{emailAddress}',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'registration',
				cmd: 'find-contact-us-item-by-email',
				headers: request.headers,
				method: request.method,
				params: request.params,
				emailAddress: request.params.emailAddress,
				refresh: request.query.refresh ? request.query.refresh : false
			})
	},
	{
		config: { auth: false },
		method: 'post',
		path: '/registration/contact-us',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'registration',
				cmd: 'save-contact-us-item',
				headers: request.headers,
				method: request.method,
				payload: request.payload
			})
	},
	{
		config: { auth: 'jwt' },
		method: 'get',
		path: '/registration/find-early-access-user/{emailAddress}',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'registration',
				cmd: 'find-early-access-user',
				headers: request.headers,
				method: request.method,
				params: request.params,
				emailAddress: request.params.emailAddress,
				refresh: request.query.refresh ? request.query.refresh : false
			})
	},
	{
		config: { auth: false },
		method: 'post',
		path: '/registration/early-access',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'registration',
				cmd: 'save-early-access',
				headers: request.headers,
				method: request.method,
				payload: request.payload
			})
	}
];

module.exports = routes;

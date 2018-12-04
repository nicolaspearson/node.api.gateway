import Hapi from 'hapi';

const routes = [
	{
		config: { auth: false },
		method: 'get',
		path: '/auth/authorize',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'auth',
				cmd: 'authorize',
				headers: request.headers,
				method: request.method
			})
	},
	{
		config: { auth: false },
		method: 'post',
		path: '/auth/login',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'auth',
				cmd: 'login',
				headers: request.headers,
				payload: request.payload
			})
	},
	{
		config: { auth: 'jwt' },
		method: 'get',
		path: '/auth/find-user-by-id/{id}',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'auth',
				cmd: 'find-user-by-id',
				headers: request.headers,
				method: request.method,
				params: request.params,
				id: request.params.id,
				refresh: request.query.refresh ? request.query.refresh : false
			})
	},
	{
		config: { auth: 'jwt' },
		method: 'post',
		path: '/auth/search-user',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'auth',
				cmd: 'search-user',
				headers: request.headers,
				payload: request.payload
			})
	},
	{
		config: { auth: false },
		method: 'post',
		path: '/auth/sign-up',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'auth',
				cmd: 'save-user',
				headers: request.headers,
				payload: request.payload
			})
	},
	{
		config: { auth: 'jwt' },
		method: 'post',
		path: '/auth/change-password',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'auth',
				cmd: 'change-password',
				payload: request.payload
			})
	},
	{
		config: { auth: 'jwt' },
		method: 'put',
		path: '/auth/update-user/{id}',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'auth',
				cmd: 'update-user',
				params: request.params,
				payload: request.payload
			})
	},
	{
		config: { auth: 'jwt' },
		method: 'delete',
		path: '/auth/delete-user/{id}',
		handler: async (request: any, hapi: Hapi.ResponseToolkit) =>
			request.hemera.act({
				topic: 'auth',
				cmd: 'delete-user',
				params: request.params
			})
	}
];

module.exports = routes;

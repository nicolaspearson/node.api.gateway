import * as jwt from 'jsonwebtoken';

import { getServerConfig } from '@environments';

export default class Token {
	constructor(token?: string) {
		if (token) {
			this.token = token;
		}
	}
	public token: string;

	public generateToken(id: number) {
		this.token = jwt.sign({ id }, getServerConfig().JWT_SECRET, this.getTokenSigningOptions());
	}

	private getTokenSigningOptions(): jwt.SignOptions {
		return { expiresIn: getServerConfig().JWT_EXPIRATION };
	}

	public verifyToken() {
		return jwt.verify(this.token, getServerConfig().JWT_SECRET, { ignoreExpiration: false });
	}
}

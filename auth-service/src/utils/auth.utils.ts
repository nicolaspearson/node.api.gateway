export class AuthUtils {
	public static verifyAuthHeader(header: string): string {
		if (!header) {
			return '';
		}
		const parts = header.split(' ');
		if (parts.length !== 2) {
			return '';
		}
		const scheme = parts[0];
		const token = parts[1];
		if (/^Bearer$/i.test(scheme)) {
			return token;
		}
		return '';
	}
}

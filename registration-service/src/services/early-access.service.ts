import Boom from 'boom';
import { BaseService } from 'typeorm-infrastructure';

import { EarlyAccess } from '@models/early-access.model';
import EarlyAccessRepository from '@repositories/early-access.repository';

export default class EarlyAccessService extends BaseService<EarlyAccess> {
	constructor(private earlyAccessRepository: EarlyAccessRepository) {
		super(earlyAccessRepository);
	}

	public async signUp(earlyAccess: EarlyAccess): Promise<EarlyAccess> {
		try {
			// Check if the earlyAccess object is valid
			const earlyAccessIsValid = await earlyAccess.isValid();
			if (!earlyAccessIsValid) {
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}

			// Make sure the earlyAccess object does not exist
			try {
				const testEarlyAccess: EarlyAccess = await this.findOneWithQueryBuilder({
					where: `email_address = '${earlyAccess.emailAddress}'`
				});
				if (testEarlyAccess && EarlyAccess.validId(testEarlyAccess.id)) {
					throw Boom.badRequest('The provided email address is already registered.');
				}
			} catch (error) {
				if (Boom.isBoom(error) && Boom.boomify(error).output.statusCode === 400) {
					throw Boom.boomify(error);
				}
				// earlyAccess object not found - Continue...
			}

			// Save the earlyAccess object to the database
			return await this.save(earlyAccess);
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}

	public async deleteSoft(id: number): Promise<EarlyAccess> {
		try {
			if (!EarlyAccess.validId(id)) {
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
			// Do a soft delete
			const earlyAccessResult: EarlyAccess = await this.earlyAccessRepository.findOneById(id);
			earlyAccessResult.deletedAt = new Date();

			await this.earlyAccessRepository.save(earlyAccessResult);
			return earlyAccessResult.sanitize();
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}
}

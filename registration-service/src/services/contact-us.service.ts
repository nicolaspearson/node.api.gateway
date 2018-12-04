import Boom from 'boom';
import { BaseService } from 'typeorm-infrastructure';

import { ContactUs } from '@models/contact-us.model';
import ContactUsRepository from '@repositories/contact-us.repository';

export default class ContactUsService extends BaseService<ContactUs> {
	constructor(private contactUsRepository: ContactUsRepository) {
		super(contactUsRepository);
	}

	public async deleteSoft(id: number): Promise<ContactUs> {
		try {
			if (!ContactUs.validId(id)) {
				throw Boom.badRequest('Incorrect / invalid parameters supplied');
			}
			// Do a soft delete
			const contactUsResult: ContactUs = await this.contactUsRepository.findOneById(id);
			contactUsResult.deletedAt = new Date();

			await this.contactUsRepository.save(contactUsResult);
			return contactUsResult.sanitize();
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.internal(error);
		}
	}
}

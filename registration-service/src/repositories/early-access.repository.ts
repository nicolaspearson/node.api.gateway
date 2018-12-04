import { BaseRepository } from 'typeorm-infrastructure';

import { EarlyAccess } from '@models/early-access.model';

export default class EarlyAccessRepository extends BaseRepository<EarlyAccess> {
	constructor() {
		super(EarlyAccess.name);
	}
}

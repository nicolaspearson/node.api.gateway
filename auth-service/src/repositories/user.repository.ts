import { BaseRepository } from 'typeorm-infrastructure';

import { User } from '@models/user.model';

export default class UserRepository extends BaseRepository<User> {
	constructor() {
		super(User.name);
	}
}

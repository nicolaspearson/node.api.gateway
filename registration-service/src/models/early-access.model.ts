import Boom from 'boom';
import { IsEmail, validate, ValidationArguments, ValidationError } from 'class-validator';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'early_access' })
export class EarlyAccess {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ name: 'email_address', length: 500 })
	@IsEmail(
		{},
		{
			message: 'Must be a valid email address'
		}
	)
	public emailAddress: string;

	@CreateDateColumn({ name: 'created_at' })
	public createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	public updatedAt: Date;

	@Column({ name: 'deleted_at' })
	public deletedAt: Date;

	public static newEarlyAccess(obj: {
		id?: number;
		emailAddress?: string;
		createdAt?: Date;
		updatedAt?: Date;
		deletedAt?: Date;
	}) {
		const newEarlyAccess = new EarlyAccess();
		if (obj.id) {
			newEarlyAccess.id = obj.id;
		}
		if (obj.emailAddress) {
			newEarlyAccess.emailAddress = obj.emailAddress;
		}
		if (obj.createdAt) {
			newEarlyAccess.createdAt = obj.createdAt;
		}
		if (obj.updatedAt) {
			newEarlyAccess.updatedAt = obj.updatedAt;
		}
		if (obj.deletedAt) {
			newEarlyAccess.deletedAt = obj.deletedAt;
		}
		return newEarlyAccess;
	}

	public static validId(id: number): boolean {
		return id !== undefined && id > 0;
	}

	public async isValid(): Promise<boolean> {
		try {
			const errors: ValidationError[] = await validate(this, {
				validationError: { target: false, value: false }
			});
			if (errors.length > 0) {
				throw Boom.badRequest('Validation failed on the provided request', errors);
			}
			return true;
		} catch (error) {
			if (Boom.isBoom(error)) {
				throw Boom.boomify(error);
			}
			throw Boom.badRequest('Unable to validate request: ' + error);
		}
	}

	public sanitize(): EarlyAccess {
		delete this.createdAt;
		delete this.updatedAt;
		delete this.deletedAt;
		return this;
	}

	public static getGenericValidationLengthMessage(args: ValidationArguments) {
		return 'Incorrect length: Found ' + args.constraints[0] + ' characters';
	}
}

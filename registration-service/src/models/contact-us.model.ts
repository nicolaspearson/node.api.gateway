import Boom from 'boom';
import { IsEmail, Length, validate, ValidationArguments, ValidationError } from 'class-validator';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'contact_us' })
export class ContactUs {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ name: 'first_name', length: 255 })
	@Length(1, 255, {
		message: (args: ValidationArguments) => {
			return ContactUs.getGenericValidationLengthMessage(args);
		}
	})
	public firstName: string;

	@Column({ name: 'last_name', length: 255 })
	@Length(1, 255, {
		message: (args: ValidationArguments) => {
			return ContactUs.getGenericValidationLengthMessage(args);
		}
	})
	public lastName: string;

	@Column({ name: 'email_address', length: 255 })
	@IsEmail(undefined, {
		message: 'Must be a valid email address'
	})
	public emailAddress: string;

	@Column({ name: 'message', length: 255 })
	@Length(1, 5000, {
		message: (args: ValidationArguments) => {
			return ContactUs.getGenericValidationLengthMessage(args);
		}
	})
	public message: string;

	@CreateDateColumn({ name: 'created_at' })
	public createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	public updatedAt: Date;

	@Column({ name: 'deleted_at' })
	public deletedAt: Date;

	public static newContactUs(obj: {
		id?: number;
		firstName?: string;
		lastName?: string;
		emailAddress?: string;
		message?: string;
		createdAt?: Date;
		updatedAt?: Date;
		deletedAt?: Date;
	}) {
		const newContactUs = new ContactUs();
		if (obj.id) {
			newContactUs.id = obj.id;
		}
		if (obj.firstName) {
			newContactUs.firstName = obj.firstName;
		}
		if (obj.lastName) {
			newContactUs.lastName = obj.lastName;
		}
		if (obj.emailAddress) {
			newContactUs.emailAddress = obj.emailAddress;
		}
		if (obj.message) {
			newContactUs.message = obj.message;
		}
		if (obj.createdAt) {
			newContactUs.createdAt = obj.createdAt;
		}
		if (obj.updatedAt) {
			newContactUs.updatedAt = obj.updatedAt;
		}
		if (obj.deletedAt) {
			newContactUs.deletedAt = obj.deletedAt;
		}
		return newContactUs;
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

	public sanitize(): ContactUs {
		delete this.createdAt;
		delete this.updatedAt;
		delete this.deletedAt;
		return this;
	}

	public static getGenericValidationLengthMessage(args: ValidationArguments) {
		return 'Incorrect length: Found ' + args.constraints[0] + ' characters';
	}
}

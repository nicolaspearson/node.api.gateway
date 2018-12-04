import * as bcrypt from 'bcrypt';
import Boom from 'boom';
import {
	IsEmail,
	IsOptional,
	Length,
	validate,
	ValidationArguments,
	ValidationError
} from 'class-validator';
import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';

@Entity()
export class User {
	@PrimaryGeneratedColumn()
	public id: number;

	@Column({ name: 'first_name', length: 255 })
	@Length(1, 255, {
		message: (args: ValidationArguments) => {
			return User.getGenericValidationLengthMessage(args);
		}
	})
	public firstName: string;

	@Column({ name: 'last_name', length: 255 })
	@Length(1, 255, {
		message: (args: ValidationArguments) => {
			return User.getGenericValidationLengthMessage(args);
		}
	})
	public lastName: string;

	@Column({ name: 'username', length: 255 })
	@Length(3, 255, {
		message: (args: ValidationArguments) => {
			return User.getGenericValidationLengthMessage(args);
		}
	})
	public username: string;

	@Column({ name: 'password', length: 255 })
	@Length(4, 255, {
		message: (args: ValidationArguments) => {
			return User.getGenericValidationLengthMessage(args);
		}
	})
	@IsOptional()
	public password: string;

	@Column({ name: 'email_address', length: 255 })
	@IsEmail(
		{},
		{
			message: 'Must be a valid email address'
		}
	)
	public emailAddress: string;

	@Column({ name: 'enabled' })
	public enabled: boolean;

	@Column({ name: 'last_logged_in_at' })
	public lastLoggedInAt: Date;

	@CreateDateColumn({ name: 'created_at' })
	public createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	public updatedAt: Date;

	@Column({ name: 'deleted_at' })
	public deletedAt: Date;

	public static newUser(obj: {
		id?: number;
		firstName?: string;
		lastName?: string;
		username?: string;
		emailAddress?: string;
		password?: string;
		enabled?: boolean;
		lastLoggedInAt?: Date;
		createdAt?: Date;
		updatedAt?: Date;
		deletedAt?: Date;
	}) {
		const newUser = new User();
		if (obj.id) {
			newUser.id = obj.id;
		}
		if (obj.firstName) {
			newUser.firstName = obj.firstName;
		}
		if (obj.lastName) {
			newUser.lastName = obj.lastName;
		}
		if (obj.username) {
			newUser.username = obj.username;
		}
		if (obj.emailAddress) {
			newUser.emailAddress = obj.emailAddress;
		}
		if (obj.password) {
			newUser.password = obj.password;
		}
		if (obj.enabled) {
			newUser.enabled = obj.enabled;
		}
		if (obj.lastLoggedInAt) {
			newUser.lastLoggedInAt = obj.lastLoggedInAt;
		}
		if (obj.createdAt) {
			newUser.createdAt = obj.createdAt;
		}
		if (obj.updatedAt) {
			newUser.updatedAt = obj.updatedAt;
		}
		if (obj.deletedAt) {
			newUser.deletedAt = obj.deletedAt;
		}
		return newUser;
	}

	public static cloneUser(obj: User) {
		const newUser = new User();
		if (obj.id) {
			newUser.id = obj.id;
		}
		if (obj.firstName) {
			newUser.firstName = obj.firstName;
		}
		if (obj.lastName) {
			newUser.lastName = obj.lastName;
		}
		if (obj.username) {
			newUser.username = obj.username;
		}
		if (obj.emailAddress) {
			newUser.emailAddress = obj.emailAddress;
		}
		if (obj.password) {
			newUser.password = obj.password;
		}
		if (obj.enabled) {
			newUser.enabled = obj.enabled;
		}
		if (obj.lastLoggedInAt) {
			newUser.lastLoggedInAt = obj.lastLoggedInAt;
		}
		return newUser;
	}

	public static async encryptPassword(password: string): Promise<string> {
		try {
			const salt: string = await bcrypt.genSalt(10);
			const hash: string = await bcrypt.hash(password, salt);
			return hash;
		} catch (error) {
			throw error;
		}
	}

	public async encryptUserPassword(): Promise<string> {
		try {
			this.password = await User.encryptPassword(this.password);
			return this.password;
		} catch (error) {
			throw error;
		}
	}

	public async validatePassword(password: string): Promise<boolean> {
		try {
			const isMatch: boolean = await bcrypt.compare(password, this.password);
			return isMatch;
		} catch (error) {
			throw error;
		}
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

	public sanitize(): User {
		delete this.password;
		delete this.createdAt;
		delete this.updatedAt;
		delete this.deletedAt;
		return this;
	}

	public static getGenericValidationLengthMessage(args: ValidationArguments) {
		return 'Incorrect length: Found ' + args.constraints[0] + ' characters';
	}
}

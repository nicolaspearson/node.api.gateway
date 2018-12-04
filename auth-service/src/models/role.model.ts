import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';

@Entity()
export class Role {
	@PrimaryGeneratedColumn() public id: number;

	@Column({ name: 'name', length: 255 })
	public name: string;

	@Column({ name: 'value', length: 255 })
	public value: string;

	@CreateDateColumn({ name: 'created_at' })
	public createdAt: Date;

	@UpdateDateColumn({ name: 'updated_at' })
	public updatedAt: Date;

	@Column({ name: 'deleted_at' })
	public deletedAt: Date;
}

import {
	Column,
	DataSource,
	Entity,
	EntityManager,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { assertEquals } from '@std/assert';

Deno.test('test', async () => {
	const dataSource = await testDataSource([Entity1]);

	try {
		const { promise: wait, resolve: endWait } = Promise.withResolvers<
			void
		>();

		const t1 = transaction(dataSource, async (em) => {
			await em.save(new Entity1('a1'));
			endWait();
			await t2.catch(() => {});
		});
		const t2 = transaction(dataSource, async (em) => {
			await em.save(new Entity1('a2'));
			await wait;
			throw new Error('rollback transaction 2');
		});

		const [r1, r2] = await Promise.allSettled([t1, t2]);
		const entities = await dataSource.getRepository(Entity1).find();

		assertEquals(r1.status, 'fulfilled');
		assertEquals(r2.status, 'rejected');

		assertEquals(
			entities.length,
			1,
			'entity from transaction 1 should be saved',
		);
		assertEquals(
			entities[0].field,
			'a1',
			'should be entity from transaction 1',
		);
	} finally {
		await dataSource.destroy();
	}
});

@Entity()
class Entity1 {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: 'varchar' })
	field: string;

	constructor(field: string) {
		this.field = field;
	}
}

async function transaction<T>(
	dataSource: DataSource,
	work: (em: EntityManager) => Promise<T>,
): Promise<T> {
	const queryRunner = dataSource.createQueryRunner();
	await queryRunner.startTransaction();

	try {
		const result = await work(queryRunner.manager);
		await queryRunner.commitTransaction();

		return result;
	} catch (error) {
		await queryRunner.rollbackTransaction();
		throw error;
	} finally {
		await queryRunner.release();
	}
}

async function testDataSource(entities: Function[]) {
	const dataSource = new DataSource({
		type: 'sqlite',
		database: ':memory:',
		entities,
		synchronize: true,
	});

	return await dataSource.initialize();
}

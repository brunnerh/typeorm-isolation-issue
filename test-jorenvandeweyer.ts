import { randomBytes } from 'node:crypto';
import { Entity, PrimaryGeneratedColumn, Column, DataSource, EntityManager } from 'typeorm';

@Entity()
class Role {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

const dataSource = new DataSource({
  type: 'sqlite',
  database: ':memory:',
  entities: [Role],
  synchronize: true,
});

await dataSource.initialize();

////////////////////////////////////////////////

const roleRepository = dataSource.getRepository(Role)

const { promise: wait, resolve: endWait } = Promise.withResolvers<void>()

const t1 = transaction(dataSource, async (em) => {
  const role1 = roleRepository.create({ name: randomBytes(8).toString('hex') })

  await em.save(role1)

  endWait()
  await t2.catch(() => {})
})

const t2 = transaction(dataSource, async (em) => {
  const role2 = roleRepository.create({ name: randomBytes(8).toString('hex') })

  await em.save(role2)
  await wait

  throw new Error('rollback transaction 2')
})

const [r1, r2] = await Promise.allSettled([t1, t2])
const entities = await roleRepository.find()

console.log(entities)
console.log(r1, r2)

async function transaction<T> (
  dataSource: DataSource,
  work: (em: EntityManager) => Promise<T>
): Promise<T> {
  const queryRunner = dataSource.createQueryRunner()

  await queryRunner.startTransaction()

  try {
    const result = await work(queryRunner.manager)

    await queryRunner.commitTransaction()

    return result
  } catch (error) {
    await queryRunner.rollbackTransaction()

    throw error
  } finally {
    await queryRunner.release()
  }
}

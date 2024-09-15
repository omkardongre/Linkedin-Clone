import { DataSource } from 'typeorm';

export async function cleanupDatabase(dataSource: DataSource): Promise<void> {
  const entities = dataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = dataSource.getRepository(entity.name);
    await repository.query(
      `TRUNCATE "${entity.tableName}" RESTART IDENTITY CASCADE;`,
    );
  }
}

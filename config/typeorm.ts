import { ConfigModule, registerAs } from '@nestjs/config'
import { DataSource, DataSourceOptions } from 'typeorm'
import { SnakeNamingStrategy } from 'typeorm-naming-strategies'

interface SetupResult {
  config: DataSourceOptions
  connectionSource: DataSource
}

export async function setup(): Promise<SetupResult> {
  await ConfigModule.envVariablesLoaded

  const config: any = {
    type: 'mariadb',
    host: `${process.env.DB_HOST}`,
    port: +`${process.env.DB_PORT}`,
    username: `${process.env.DB_USERNAME}`,
    password: `${process.env.DB_PASSWORD}`,
    database: `${process.env.DB_NAME}`,
    entities: ['dist/**/*.entity{.ts,.js}'],
    migrations: ['dist/migrations/*{.ts,.js}'],
    synchronize: process.env.NODE_ENV === 'test' ? true : false,
    autoLoadEntities: true,
    logging: process.env.NODE_ENV === 'development',
    namingStrategy: new SnakeNamingStrategy(),
  }

  const connectionSource = new DataSource(config)
  await connectionSource.initialize()

  return { config, connectionSource }
}

export default registerAs('typeorm', async () => (await setup()).config)
export const connectionSource = (async () => (await setup()).connectionSource)()

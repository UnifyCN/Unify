import { defineConfig } from '@mikro-orm/sqlite';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

export default defineConfig({
   dbName: 'sqlite.db',  // using sqlite for testing for now, will be updating to postgres and mongo after set up test
   entities: ['dist/**/*.entity.js'],
   entitiesTs: ['src/**/*.entity.ts'],   
   metadataProvider: TsMorphMetadataProvider,
   debug: true,
});
import { MikroORM } from '@mikro-orm/sqlite'; // change to postgres after

// initialize the ORM, loading the config file dynamically
const orm = await MikroORM.init();
console.log(orm.em); // access EntityManager via `em` property
console.log(orm.schema); // access SchemaGeneartor via `schema` property
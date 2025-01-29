import { Config, MikroORM } from '@mikro-orm/sqlite'; // change to postgres after
import { User } from './modules/user/user.entity.js'; 
import config from './mikro-orm.config.js';

// initialize the ORM, loading the config file dynamically
const orm = await MikroORM.init(config);
const user = new User();
user.email = 'foo@bar.com';
user.fullName = 'Foo Bar';
user.password = '123456';

const em = orm.em.fork();
await em.persist(user).flush();

console.log('user id is:', user.id);
import { MikroORM } from '@mikro-orm/sqlite'; // change to postgres after
import { User } from './modules/user/user.entity.js'; 

// initialize the ORM, loading the config file dynamically
const orm = await MikroORM.init();
const user = new User();
user.email = 'foo@bar.com';
user.fullName = 'Foo Bar';
user.password = '123456';

await orm.em.persist(user).flush();

console.log('user id is:', user.id);
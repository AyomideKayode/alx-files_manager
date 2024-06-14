# Project: 0x04. Files manager

This project is a summary of this back-end trimester: authentication, NodeJS, MongoDB, Redis, pagination and background processing.

The objective is to build a simple platform to upload and view files:

- User authentication via a token
- List all files
- Upload a new file
- Change permission of a file
- View a file
- Generate thumbnails for images

You will be guided step by step for building it, but you have some freedoms of implementation, split in more files etc… (`utils` folder will be your friend)

Of course, this kind of service already exists in the real life - it’s a learning purpose to assemble each piece and build a full product.

Enjoy!

## Resources

### Read or watch:-

- [Node JS getting started](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs)
- [Process API doc](https://node.readthedocs.io/en/latest/api/process/)
- [Express getting started](https://expressjs.com/en/starter/installing.html)
- [Mocha documentation](https://mochajs.org/)
- [Nodemon documentation](https://github.com/remy/nodemon#nodemon)
- [MongoDB](https://github.com/mongodb/node-mongodb-native)
- [Bull](https://github.com/OptimalBits/bull)
- [Image thumbnail](https://www.npmjs.com/package/image-thumbnail)
- [Mime-Types](https://www.npmjs.com/package/mime-types)
- [Redis](https://github.com/redis/node-redis)

## Tasks

### 0. [Redis utils](./utils/redis.js) :-

Inside the folder `utils`, create a file `redis.js` that contains the class `RedisClient`.

`RedisClient` should have:

- the constructor that creates a client to Redis:
  - any error of the redis client must be displayed in the console (you should use `on('error')` of the redis client)
- a function `isAlive` that returns `true` when the connection to Redis is a success otherwise, `false`
- an asynchronous function `get` that takes a string key as argument and returns the Redis value stored for this key
- an asynchronous function `set` that takes a string key, a value and a duration in second as arguments to store it in Redis (with an expiration set by the duration argument)
- an asynchronous function `del` that takes a string key as argument and remove the value in Redis for this key

After the class definition, create and export an instance of `RedisClient` called `redisClient`.

```bash
bob@dylan:~$ cat main.js
import redisClient from './utils/redis';

(async () => {
    console.log(redisClient.isAlive());
    console.log(await redisClient.get('myKey'));
    await redisClient.set('myKey', 12, 5);
    console.log(await redisClient.get('myKey'));

    setTimeout(async () => {
        console.log(await redisClient.get('myKey'));
    }, 1000*10)
})();

bob@dylan:~$ npm run dev main.js
true
null
12
null
bob@dylan:~$ 
```

### 1. [MongoDB utils](./utils/db.js) :-

Inside the folder `utils`, create a file `db.js` that contains the class `DBClient`.

`DBClient` should have:

- the constructor that creates a client to MongoDB:
  - host: from the environment variable `DB_HOST` or default: `localhost`
  - port: from the environment variable `DB_PORT` or default: `27017`
  - database: from the environment variable `DB_DATABASE` or default: `files_manager`
- a function `isAlive` that returns `true` when the connection to MongoDB is a success otherwise, `false`
- an asynchronous function `nbUsers` that returns the number of documents in the collection `users`
- an asynchronous function `nbFiles` that returns the number of documents in the collection `files`

After the class definition, create and export an instance of `DBClient` called `dbClient`.

```bash
bob@dylan:~$ cat main.js
import dbClient from './utils/db';

const waitConnection = () => {
    return new Promise((resolve, reject) => {
        let i = 0;
        const repeatFct = async () => {
            await setTimeout(() => {
                i += 1;
                if (i >= 10) {
                    reject()
                }
                else if(!dbClient.isAlive()) {
                    repeatFct()
                }
                else {
                    resolve()
                }
            }, 1000);
        };
        repeatFct();
    })
};

(async () => {
    console.log(dbClient.isAlive());
    await waitConnection();
    console.log(dbClient.isAlive());
    console.log(await dbClient.nbUsers());
    console.log(await dbClient.nbFiles());
})();

bob@dylan:~$ npm run dev main.js
false
true
4
30
bob@dylan:~$ 
```

| Task | File |
| ---- | ---- |
| 2. First API | [SOON](./) |
| 3. Create a new user | [SOON](./) |
| 4. Authenticate a user | [SOON](./) |
| 5. First file | [SOON](./) |
| 6. Get and list file | [SOON](./) |
| 7. File publish/unpublish | [SOON](./) |
| 8. File data | [SOON](./) |
| 9. Image Thumbnails | [SOON](./) |

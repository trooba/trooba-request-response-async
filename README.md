# trooba-request-response-async

[![Greenkeeper badge](https://badges.greenkeeper.io/trooba/trooba-request-response-async.svg)](https://greenkeeper.io/)

The plugin extends [request-response](https://github.com/trooba/trooba-request-response) trooba plugin to koa like execution template.

Requires trooba framework version 3+ and node 8+

## Install

```
npm install trooba -S
npm install trooba-request-response-async -S
```

## Usage


### Request/response example

```js
const Trooba = require('trooba');

Trooba
.use('trooba-request-response-async')
.use(async (ctx, next) => {
    console.log(ctx.request); // > ping
    // wait for response
    await next();
    console.log(ctx.response); // > pong
})
.use(ctx => {
    console.log(ctx.request); // > ping
    ctx.response = 'pong';
})
.build()
.create();

const response = await pipe.request('ping');
```

### Streaming data

```js
const Trooba = require('trooba');

Trooba
.use('trooba-request-response-async')
.use(async ctx => {
    console.log(ctx.request); // > ping
    const requestBody = readBody(ctx.stream);
    // set response metadata that will be flushed with the first chunk
    ctx.response = 'pong';
    // or you can also do ctx.response({status:200, headers: {...}})
    // Now write a stream using standard streams
    fs.createReadStream('large.txt')
        .pipe(ctx.stream);
    // or via writer
    // ctx.stream.write('bar').write('bar').end();
})
.build()
.create();

var ctx = pipe.request('ping');
// or you can do  pipe.request({ headers: {...}, path: 'path/to/resource' })
ctx.stream.write('foo').write('foo').end();

var response = await ctx.response;
console.log(response); // > pong
const body = readBody(ctx.stream)

async function readBody(stream) {
    var body = [];
    while(true) {
        const data = await stream.read();
        if (data === undefined) {
            break;
        }
        body.push(data);
    }
    return body;
}
```

### Throw error

```js
const Trooba = require('trooba');

var pipe = Trooba
.use('trooba-request-response-async')
.use(async (ctx, next) => {
    console.log(ctx.request); // > ping
    // wait for response
    try {
        await next();
    }
    catch (err) {
        throw err;
    }
})
.use(ctx => {
    console.log(ctx.request); // > ping
    ctx.response = 'pong';
})
.build()
.create();

pipe.request('ping'); // will throw error
```

### Retry

```js
const Trooba = require('trooba');

var retryCount = 1;
var pipe = Trooba
.use('trooba-request-response-async')
.use(async (ctx, next) => {
    console.log(ctx.request); // > ping
    // wait for response
    try {
        await next(); // will fail first time
    }
    catch (err) {
        // retry again
        await next();
    }
})
.use(ctx => {
    console.log(ctx.request); // > ping
    if (retryCount-- > 0) {
        throw new Error('Boom');
    }
    ctx.response = 'pong';
})
.build()
.create();

pipe.request('ping'); // will throw error
```

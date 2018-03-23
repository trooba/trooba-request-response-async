/*jslint esversion:6 */
'use strict';

const requestResponse = require('trooba-request-response');
const plugin = require('trooba-plugin');
const TroobaDuplexStream = require('trooba-streaming').TroobaDuplexStream;

const RUNTIME = 'async';

function decorate(pipe) {
    // asyncawait extends request-response protocol
    requestResponse.decorate(pipe);
    // let some handlers use koa via koa annotation
    pipe.runtimes[RUNTIME] = function asyncawaitRuntime(fn) {
        var pipe = this;
        pipe.on('request', function (request, next) {
            var context = pipe.context;
            var origResponse = context.response;
            context.request = request;
            context.throw = function (status, message, props) {
                var err = new Error(message);
                err.status = status;
                if (props) {
                    Object.assign(err, props);
                }
                pipe.throw(err);
            };

            // bidirectional stream
            context.stream = new TroobaDuplexStream(pipe);
            context.reader = 

            var callback = function () {
                // callback will represent next call
                // that must serve dual function
                // continue original flow
                // or initiate request retry if needed
                pipe.removeListener('error');
                pipe.removeListener('response');
                return new Promise(function (resolve, reject) {
                    pipe.once('response', function (response, next) {
                        context.response = response || context.response;
                        resolve();
                    });

                    pipe.once('error', reject);
                    context.response = undefined;
                    next();
                    next = () => {
                        pipe.retry(context.request);
                    };
                });
            };

            var ret;
            try {
                ret = fn(context, callback);
            }
            catch (err) {
                // if this happens, it would be sync function flow
                return pipe.throw(err);
            }

            if (ret instanceof Promise) {
                ret
                .then(function () {
                    pipe.continue(context.response);
                })
                .catch(function (err) {
                    pipe.throw(err);
                });
            }
            else {
                if (!origResponse) {
                    // first time response
                    pipe.respond(context.response);
                }
            }
        });
    };

    pipe.decorate('request', (original) => {
        return function (requestOptions) {
            var requestCtx = original.call(this, requestOptions);
            return {
                stream: new TroobaDuplexStream(requestCtx)
            };
        };
    }, true); // override default one

    // create a way to access response promise
    pipe.decorate('response', () => {
        return function () {
            return new Promise((resolve, reject) => {
                this.once('response', response => {
                    if (typeof response === 'string') {
                        return resolve(response);
                    }
                    response.stream = new TroobaDuplexStream(requestCtx)
                });
                resolve();
            });
        };
    });
}

module.exports = plugin({
    decorate: decorate
}, {
    troobaVersion: '^3'
});

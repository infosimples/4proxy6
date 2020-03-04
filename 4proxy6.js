#!/usr/bin/env node
'use strict';

// Required libs
const Commander = require('commander');
const Proxy = require('http-mitm-proxy');

// CLI helper
const program = new Commander.Command();

// Parse CLI arguments
program
    .requiredOption('-a, --address <address>', 'IPv6 address of the outgoing interface')
    .option('-b, --prefix_bits <number>', 'number of bits for IPv6 address prefix', 48)
    .option('-c, --credentials <user:password>', 'user and password for proxy authentication')
    .option('-m, --mode <string>', 'mode for IPv6 selection (uuid/ipv6/random)', 'uuid')
    .option('-p, --port <number>', 'port for listening', 3322)
    .option('-t, --ttl <seconds>', 'TTL for cache', 1800);
program.parse(process.argv);

// Sets the mode
let handleRequest;
try {
    handleRequest = require(`./modes/${program.mode}`).mode;
} catch (err) {
    console.error(`"${program.mode}" is not a valid mode`);
    process.exit(9);
}

// Set authentication key
const authKey = program.credentials ?
    `Basic ${Buffer.from(program.credentials).toString('base64')}` :
    null;

// MITM proxy
const proxy = Proxy();

// Only one CA will be generated at ./ca (generated once at first statup)
proxy.use(Proxy.wildcard);

// Handle errors
proxy.onError(function (ctx, err, errorKind) {
    console.error(err);
    ctx.proxyToClientResponse.writeHead(503);

    if (err.code === 'EADDRNOTAVAIL') {
        ctx.proxyToClientResponse.write(
            `4proxy6 could not bind to address ${ctx.proxyToServerRequestOptions.localAddress}\n`
        );
    }

    ctx.proxyToClientResponse.end();
});

function isAuthorized(ctx) {
    // If no authKey was set, then the request is authorized to proceed
    if (!authKey) {
        return true;
    }

    // Get proxy-authorization from header (first is for HTTPS, second for HTTP)
    let reqAuthKey;
    if (ctx.connectRequest.headers) {
        reqAuthKey = ctx.connectRequest.headers['proxy-authorization'];
    } else {
        reqAuthKey = ctx.clientToProxyRequest.headers['proxy-authorization'];
    }

    // Check if is authorization matches
    if (reqAuthKey !== authKey) {
        ctx.proxyToClientResponse.statusCode = 407;
        ctx.proxyToClientResponse.setHeader('proxy-authenticate', 'Basic');
        ctx.proxyToClientResponse.end();

        return false;
    } else {
        return true;
    }
}

// Intercept requests
proxy.onRequest(function (ctx, callback) {
    // Check for authorization
    if (!isAuthorized(ctx)) return;

    // handles the request
    if (handleRequest(ctx, program)) {
        // Continues with the request
        callback();
    } else {
        // Stops the request
        return;
    }
});

// Starts proxy
proxy.listen({
    port: program.port,
    sslCaDir: './ca'
});

console.info(`4proxy6 is now up in ${program.mode} mode`);
console.info(`Listening on port ${program.port}`);
console.info(`Forwarding to addresses in ${program.address}/${program.prefix_bits} subrange`);

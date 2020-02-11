'use strict';

// Required libs
const Commander = require('commander');
const NodeCache = require('node-cache');
const Proxy = require('http-mitm-proxy');
const randomIp = require('random-ip');

// CLI helper
const program = new Commander.Command();

// Parse CLI arguments
program
    .requiredOption('-a, --address <address>', 'IPv6 address of the outgoing interface')
    .option('-b, --prefix_bits <number>', 'number of bits for IPv6 address prefix', 48)
    .option('-p, --port <address>', 'port for listening', 3322)
    .option('-t, --ttl <TTL>', 'TTL for cache', 1800);
program.parse(process.argv);

// Cache for UUID <-> IPv6 (time in seconds)
const cache = new NodeCache({ stdTTL: program.ttl, checkperiod: Math.floor(program.ttl / 2) });

// MITM proxy
const proxy = Proxy();

// Only one CA will be generated at ./ca (generated once at first statup)
proxy.use(Proxy.wildcard);

// Handle errors
proxy.onError(function (ctx, err, errorKind) {
    console.error(err);
    ctx.proxyToClientResponse.writeHead(503);
    ctx.proxyToClientResponse.end();
});

// Intercept requests
proxy.onRequest(function (ctx, callback) {
    if (ctx.proxyToServerRequestOptions.headers['uuid']) {
        // Get the uuid from the headers and remove it
        const uuid = ctx.proxyToServerRequestOptions.headers['uuid'];
        delete ctx.proxyToServerRequestOptions.headers['uuid'];

        // Create or get an IPv6
        let ipv6;
        if (cache.has(uuid)) {
            ipv6 = cache.get(uuid);
        } else {
            ipv6 = randomIp(program.address, program.prefix_bits);;
            cache.set(uuid, ipv6);
        }

        // Set the address we wish to use
        ctx.proxyToServerRequestOptions.family = 6;
        ctx.proxyToServerRequestOptions.localAddress = ipv6;

        // Continue with the request
        callback();
    } else {
        // Answer with instructions
        ctx.proxyToClientResponse.writeHead(400);
        ctx.proxyToClientResponse.write('uuid header missing\n');
        ctx.proxyToClientResponse.end();
    }
});

// Starts proxy
proxy.listen({
    port: program.port,
    sslCaDir: './ca'
});

console.log('4proxy6 is now up!');
console.log(`Listening on port ${program.port}`);
console.log(`Forwarding to addresses in ${program.address}/${program.prefix_bits} subrange`);

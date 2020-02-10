'use strict';

const NodeCache = require('node-cache');
const Proxy = require('http-mitm-proxy');

const cache = new NodeCache({ stdTTL: 1800, checkperiod: 600 });
const proxy = Proxy();

const hexaChars = ['0', '1', '2', '3', '4', '5', '6', '7',
                   '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']

function generateIPv6() {
    // This is the 48 prefix
    let ipv6 = process.argv[2];

    for (let i=0; i<5; i++){
        ipv6 += ':';
        for (let j = 0; j < 4; j++) {
            ipv6 += hexaChars[Math.floor(Math.random() * hexaChars.length)];
        }
    }

    return ipv6;
}

proxy.use(Proxy.wildcard);

proxy.onError(function (ctx, err, errorKind) {
    console.error(err);
});

// Intercept requests
proxy.onRequest(function (ctx, callback) {
    if (ctx.clientToProxyRequest.headers['uuid']) {
        const uuid = ctx.clientToProxyRequest.headers['uuid']
        // Create or get an IPv6
        let ipv6;
        if (cache.has(uuid)) {
            ipv6 = cache.get(uuid);
        } else {
            ipv6 = generateIPv6();
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

proxy.listen({
    port: process.env.PORT || 3322,
    sslCaDir: './ca/'
});

console.log('Proxy is now up!');

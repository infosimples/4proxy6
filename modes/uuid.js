const NodeCache = require('node-cache');
const randomIp = require('random-ip');

// Cache for UUID <-> IPv6 (time in seconds)
let cache;

// This mode redirects all requests with same UUID to same IPv6
module.exports = {
    mode: uuidMode = function (ctx, program) {
        if (ctx.proxyToServerRequestOptions.headers['uuid']) {
            // Get the uuid from the headers and remove it
            const uuid = ctx.proxyToServerRequestOptions.headers['uuid'];
            delete ctx.proxyToServerRequestOptions.headers['uuid'];

            // Initialize cache if it wasn't already
            if (!cache) {
                cache = new NodeCache({
                    stdTTL: program.ttl,
                    checkperiod: Math.floor(program.ttl / 2)
                });
            }

            // Create or get an IPv6
            let ipv6;
            if (cache.has(uuid)) {
                ipv6 = cache.get(uuid);
            } else {
                ipv6 = randomIp(program.address, program.prefix_bits);
                cache.set(uuid, ipv6);
            }

            // Set the address we wish to use
            ctx.proxyToServerRequestOptions.family = 6;
            ctx.proxyToServerRequestOptions.localAddress = ipv6;

            return true;
        } else {
            // Answer with instructions
            ctx.proxyToClientResponse.statusCode = 400;
            ctx.proxyToClientResponse.write('uuid header missing\n');
            ctx.proxyToClientResponse.end();

            return false;
        }
    }
}

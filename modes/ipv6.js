const Address6 = require('ip-address').Address6;

// This mode redirects all requests with same UUID to same IPv6
module.exports = {
    mode: function (ctx, program) {
        if (!program.baseAddress) {
            program.baseAddress = new Address6(`${program.address}/${program.prefix_bits}`);
        }

        let ipv6;
        if (ctx.proxyToServerRequestOptions.headers['ipv6']) {
            // Get the ipv6 from the headers and remove it
            ipv6 = new Address6(ctx.proxyToServerRequestOptions.headers['ipv6']);
            delete ctx.proxyToServerRequestOptions.headers['ipv6'];
        } else {
            // Answer with instructions
            ctx.proxyToClientResponse.statusCode = 400;
            ctx.proxyToClientResponse.write('ipv6 header missing\n');
            ctx.proxyToClientResponse.end();

            return false;
        }

        if (ipv6.valid && ipv6.isInSubnet(program.baseAddress)) {
            // Set the address we wish to use
            ctx.proxyToServerRequestOptions.family = 6;
            ctx.proxyToServerRequestOptions.localAddress = ipv6.address;

            return true;
        } else {
            // Answer with instructions
            ctx.proxyToClientResponse.statusCode = 400;
            ctx.proxyToClientResponse.write('invalid ipv6\n');
            ctx.proxyToClientResponse.end();

            return false;
        }
    }
}

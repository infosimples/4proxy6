const ip = require('ip');

// This mode redirects all requests with same UUID to same IPv6
module.exports = {
    mode : function (ctx, program) {
        let ipv6;
        if (ctx.proxyToServerRequestOptions.headers['ipv6']) {
            // Get the ipv6 from the headers and remove it
            ipv6 = ctx.proxyToServerRequestOptions.headers['ipv6'];
            delete ctx.proxyToServerRequestOptions.headers['ipv6'];
        } else {
            // Answer with instructions
            ctx.proxyToClientResponse.statusCode = 400;
            ctx.proxyToClientResponse.write('ipv6 header missing\n');
            ctx.proxyToClientResponse.end();

            return false;
        }

        if (ip.isV6Format(ipv6)) {
            // Set the address we wish to use
            ctx.proxyToServerRequestOptions.family = 6;
            ctx.proxyToServerRequestOptions.localAddress = ipv6;

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

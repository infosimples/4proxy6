const randomIp = require('random-ip');

// This mode always use a different IPv6
module.exports = {
    mode: randomMode = function (ctx, program) {
        // Set the address we wish to use
        ctx.proxyToServerRequestOptions.family = 6;
        ctx.proxyToServerRequestOptions.localAddress = randomIp(program.address, program.prefix_bits);

        return true;
    }
}

# 4proxy6
![GitHub](https://img.shields.io/github/license/infosimples/4proxy6)

A MITM proxy application with incoming IPv4/IPv6 and random outgoing IPv6

___

## Description

**4proxy6** is a MITM proxy that redirects HTTP/HTTPS traffic to one random
IPv6 address attached in your network interfaces.

Each incoming HTTP request must have the `uuid` header. All HTTP requests made
with the same `uuid` header will use the same IPv6 exit address, within a
certain amount of time (default: 30 minutes).

___

## Usage

You may use this package with `node 4proxy6.js` or using one of the binaries
provided in the releases section.

```
Usage: 4proxy6 [options]

Options:
  -a, --address <address>     IPv6 address of the outgoing interface
  -b, --prefix_bits <number>  number of bits for IPv6 address prefix (default: 48)
  -p, --port <address>        port for listening (default: 3322)
  -t, --ttl <TTL>             TTL for cache (default: 1800)
  -h, --help                  output usage information
```

- `address`: base IPv6 address of the interface the proxy will use as exit.
- `prefix_bits`: number of bits in the IPv6 address that must not be changed.
  All other bits will be randomly generated. Example: `--address 2001:1234::`
  and `--prefix_bits 16` will generate random exit addresses between
  `2001:0000:0000:0000:0000:0000:0000:0000` and
  `2001:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF:FFFF`.
- `port`: TCP port for the proxy.
- `ttl`: amount of seconds a `uuid` will hold the same IPv6 address.

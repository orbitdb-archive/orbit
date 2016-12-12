// Ipfs daemon's default settings
export function defaultIpfsDaemonSettings(ipfsDataDir) {
  return {
    IpfsDataDir: ipfsDataDir,
    Addresses: {
      API: '/ip4/127.0.0.1/tcp/0',
      Swarm: [
        '/ip4/127.0.0.1/tcp/32333/ws',
        '/ip4/0.0.0.0/tcp/0'
      ],
      Gateway: '/ip4/0.0.0.0/tcp/0'
    },
    // Use local webrtc-star server: https://github.com/libp2p/js-libp2p-webrtc-star
    // SignalServer: '0.0.0.0:9090',
    SignalServer: '178.62.241.75',
    API: {
      HTTPHeaders: {
        "Access-Control-Allow-Origin": ['*'],
        "Access-Control-Allow-Methods": ["PUT", "GET", "POST"],
        "Access-Control-Allow-Credentials": ["true"]
      }
    }
  }
}

// Ipfs daemon's default settings
export function defaultIpfsDaemonSettings(ipfsDataDir) {
  return {
    IpfsDataDir: ipfsDataDir,
    Addresses: {
      API: '/ip4/127.0.0.1/tcp/0',
      Swarm: ['/ip4/0.0.0.0/tcp/0'],
      Gateway: '/ip4/0.0.0.0/tcp/0'
    },
    API: {
      HTTPHeaders: {
        "Access-Control-Allow-Origin": ['*'],
        "Access-Control-Allow-Methods": ["PUT", "GET", "POST"],
        "Access-Control-Allow-Credentials": ["true"]
      }
    }
  }
}

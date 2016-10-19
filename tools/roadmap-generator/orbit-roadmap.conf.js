'use strict'

module.exports = {
  // Name of the organization or project this roadmap is generated for
  organization: 'Orbit',

  // Include open and closed milestones where due date is after milestonesStartDate
  milestonesStartDate: '2016-10-01T00:00:00Z', // ISO formatted timestamp

  // Include open and closed milestones where due date is before milestonesEndDate
  milestonesEndDate: '2016-12-30T00:00:00Z', // ISO formatted timestamp

  // Github repository to open open a Pull Request with the generated roadmap
  targetRepo: "haadcode/orbit", // 'owner/repo'

  // List of projects that this roadmap covers
  projects: [
    {
      name: "orbit",
      // Repositories that this project consists of.
      repos: [
        "haadcode/orbit",
        "haadcode/orbit-core",
        "haadcode/orbit-textui",
        "haadcode/orbit-db",
        "haadcode/orbit-db-store",
        "haadcode/orbit-db-kvstore",
        "haadcode/orbit-db-eventstore",
        "haadcode/orbit-db-feedstore",
        "haadcode/orbit-db-counterstore",
        "haadcode/orbit-db-pubsub",
        "haadcode/orbit-crypto",
        "haadcode/ipfs-log",
        "haadcode/ipfs-post",
        "haadcode/crdts",
      ],
      // WIP
      links: {
        status: `## Status and Progress\n
[![Project Status](https://badge.waffle.io/haadcode/orbit.svg?label=Backlog&title=Backlog)](http://waffle.io/haadcode/orbit) [![Project Status](https://badge.waffle.io/haadcode/orbit.svg?label=In%20Progress&title=In%20Progress)](http://waffle.io/haadcode/orbit) [![Project Status](https://badge.waffle.io/haadcode/orbit.svg?label=Done&title=Done)](http://waffle.io/haadcode/orbit)\n
See details of current progress on [Orbit's project board](https://waffle.io/haadcode/orbit)\n\n`
      }
    },
  ]
}

const pictures = [
  "images/profile/beach.png",
  "images/profile/bridge.png",
  "images/profile/cape.png",
  "images/profile/castle.png",
  "images/profile/cityscape.png",
  "images/profile/desert-1.png",
  "images/profile/desert.png",
  "images/profile/fields-1.png",
  "images/profile/fields.png",
  "images/profile/forest.png",
  "images/profile/hills.png",
  "images/profile/home-1.png",
  "images/profile/home.png",
  "images/profile/iceberg.png",
  "images/profile/island.png",
  "images/profile/mill.png",
  "images/profile/mountains-1.png",
  "images/profile/mountains.png",
  "images/profile/nuclear-plant.png",
  "images/profile/river.png",
  "images/profile/ruins.png",
  "images/profile/sea.png",
  "images/profile/spruce.png",
  "images/profile/trees.png",
  "images/profile/village.png",
  "images/profile/waterfall-1.png",
  "images/profile/waterfall.png",
  "images/profile/windmills.png"
]

module.exports = {
  getPicture: (text) => {
    const i = Math.min(Math.max(0, text.toUpperCase().charCodeAt(0) - 65), 25)
    return pictures[i]
  }
}
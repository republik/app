# Generate app icons
# Run only once, on when icon changes
# WARNING: This script install global dependencies on your machine
npm install -g yo generator-rn-toolbox
brew install imagemagick
(cd .. && yo rn-toolbox:assets --icon ./icon.png)

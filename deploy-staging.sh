set -Eeuo pipefail

yarn
pushd ios && pod install && popd || exit 1

# Check that git is clean
git diff --exit-code || (echo "Error: please commit changes in git first."; exit 1)

# Test
yarn lint

# Bump version number, but do not commit
yarn version --no-git-tag-version || exit 1

# build and push to stores (remember error traps do not work on chained &&)
yarn deploy-ios-staging || exit 1
yarn deploy-android-staging || exit 1

# commit
# git add package.json
# export VERSION=$(node -p "require('./package.json').version")
# git commit -m "Version bump to ${VERSION}" && git push && git push --tags
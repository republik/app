module.exports = {
  root: true,
  extends: '@react-native',
  globals: {
    window: true,
    navigator: true,
    fetch: true,
  },
  rules: {
    'jsx-quotes': 0,
    'react/prop-types': 0,
    semi: 0,
  },
}

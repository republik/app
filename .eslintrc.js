module.exports = {
  'parser': 'babel-eslint',
  'extends': ['standard', 'standard-react'],
  "globals": {
    "window": true,
    "navigator": true,
    "fetch": true
  },
  'rules': {
    'jsx-quotes': 0,
    'react/prop-types': 0
  }
}

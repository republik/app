const parseParams = params => {
  if (!params || params === '') {
    return {}
  }

  return params.split('&').reduce((acc, param) => {
    const paramData = param.split('=')

    return {
      ...acc,
      [paramData[0]]: paramData[1]
    }
  }, {})
}

export const parseURL = value => {
  const URL_REGEX = /(.*?):\/\/(.+\/)?([^?]*)\??(.*)/g
  const match = URL_REGEX.exec(value)

  if (!match) {
    return {
      url: value,
      protocol: null,
      host: null,
      path: null,
      params: {
        toString: () => ''
      }
    }
  }

  return {
    url: match[0],
    protocol: match[1],
    host: match[2],
    path: match[3],
    params: {
      ...parseParams(match[4]),
      toString: () => match[4]
    }
  }
}

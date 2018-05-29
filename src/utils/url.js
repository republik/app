import parse from 'url-parse'

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

const normalize = url => url.replace('www.', '')

export const parseURL = value => {
  const match = parse(value)

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

  const params = match.query.substring(1)

  return {
    url: normalize(match.href),
    protocol: match.protocol,
    host: normalize(match.hostname),
    path: match.pathname,
    params: {
      ...parseParams(params),
      toString: () => params
    }
  }
}

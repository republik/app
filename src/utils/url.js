const URL_REGEX = /(.*?:\/\/)(.*)\?(.*)/g;

export const parseURL = value => {
  const [url, protocol, route, params] = URL_REGEX.exec(value);

  return {
    url,
    protocol,
    route,
    params
  };
}

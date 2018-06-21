import { ASSETS_SERVER_BASE_URL } from '../constants'

export const getPdfUrl = (meta, { images = true, download = false } = {}) => {
  const query = [
    !images && 'images=0',
    download && 'download=1'
  ].filter(Boolean)

  return `${ASSETS_SERVER_BASE_URL}/pdf${meta.path}.pdf${query.length ? `?${query.join('&')}` : ''}`
}

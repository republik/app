import React from 'react'
import { createFormatter } from '@project-r/styleguide/lib/lib/translate'

export const t = createFormatter(require('./translations.json').data)

export default (Component) => (props) => (
  <Component {...props} t={t} />
)

import isArray from 'lodash/isArray.js'
import mergeWith from 'lodash/mergeWith.js'

export default class Options {
  constructor (config) {
    Object.assign(this, config)
  }

  merge (config) {
    return mergeWith(this, config, (objValue, srcValue, key) => {
      if (isArray(objValue)) {
        if (srcValue.includes('__append__')) {
          return objValue.concat(srcValue.filter(v => v !== '__append__'))
        } else {
          return srcValue
        }
      }
    })
  }
}

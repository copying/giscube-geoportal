import Field from './Field'
import NumberWidget from './widgets/form/Number'

export default class NumberField extends Field {
  formWidget () {
    return NumberWidget
  }

  search (value) {
    return {
      key: this.name,
      value
    }
  }
}

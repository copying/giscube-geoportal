import HeaderDropdown from './HeaderDropdown'

export default {
  mixins: [HeaderDropdown],
  computed: {
    username () {
      return this.$store.state.auth.username
    },
    label () {
      return this.username || this.$t('tools.' + this.name + '.headerName')
    },
    noCaps () {
      return !!this.username
    },
    style () {
      return {
        'text-transform': this.username ? 'none' : undefined
      }
    }
  }
}

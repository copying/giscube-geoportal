<template>
  <q-item clickable
    v-if="supported"
    :to="to"
    @click="_onClick"
  >
    <q-item-section side>
      <q-icon :name="icon" />
    </q-item-section>
    <q-item-section>
      <q-item-label>{{ label }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import { QIcon, QItem, QItemSection, QItemLabel } from 'quasar'

export default {
  props: {
    name: {
      type: String,
      required: true
    },
    tool: {
      type: Object,
      required: true
    }
  },
  components: {
    QIcon,
    QItem,
    QItemLabel,
    QItemSection
  },
  computed: {
    icon () {
      return this._getOrCall(this.tool.icon)
    },
    label () {
      return this.$t('tools.' + this.name + '.headerName')
    },
    supported () {
      return !this.tool.supported || this.tool.supported.call(this, this.tool)
    },
    style () {
      return {}
    },
    to () {
      const value = this._getOrCall(this.tool.to)
      if (typeof value === 'string') {
        return { name: value }
      } else {
        return value
      }
    }
  },
  methods: {
    emit (event, value) {
      if (typeof event === 'string' && event) {
        this.$emit('event', { name: event, value })
      } else if (typeof event === 'object' && event.name.toString()) {
        this.$emit('event', event)
      } else {
        this.$except('[HeaderItemHolder.vue] Trying to emit an incorrectly configured event. Check your config.')
      }
    },
    _getOrCall (v) {
      if (v) {
        if (typeof v === 'function') {
          return v.call(this, this.tool)
        } else {
          return v
        }
      }
    },
    _onClick () {
      if (this.tool.to) {
        this.$emit('sidebar-visibility-changed', true)
      }
      if (this.tool.action) {
        this.tool.action.call(this, this.tool)
      }
      if (this.tool.emit) {
        this.emit(this._getOrCall(this.tool.emit))
      }
    },
    t (key) {
      return this.$t('tools.' + key + '.headerName')
    }
  }
}
</script>

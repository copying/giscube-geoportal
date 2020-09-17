<template>
  <q-btn-dropdown v-if="!menu"
    stack flat split stretch
    :icon="icon"
    :label="label"
    :no-caps="noCaps"
    :style="style"
    :to="to(tool)"
    @click="_onClick(tool)"
  >
    <q-list>
      <div
        v-for="(dropdownItem, i) in dropdownItems"
        :key="'menu-header-tools-' + dropdownItem.name + '-' + i"
      >
        <q-separator v-if="dropdownItem.separator"/>
        <component
          v-else
          :is="dropdownItemComponent(dropdownItem.tool)"
          v-bind:name="dropdownItem.name"
          v-bind:tool="dropdownItem.tool"
          v-on:event="emit"
        />
      </div>
    </q-list>
  </q-btn-dropdown>
  <div v-else>
    <q-item clickable v-close-popup
      :to="to(tool)"
      @click="_onClick"
    >
      <q-item-section side>
        <q-icon :name="_getOrCall(tool.icon, tool)" />
      </q-item-section>
      <q-item-section>{{ t(name) }}</q-item-section>
    </q-item>
    <div
      v-for="(item, i) in dropdownItems"
      :key="'menu-header-tools-' + item.name + '-' + i"
    >
      <q-item
        v-if="!item.separator"
        clickable
        v-close-popup
        :to="to(item.tool)"
        @click="_onClick(item.tool)"
      >
        <q-item-section side>
          <q-icon :name="_getOrCall(item.tool.icon, item.tool)" />
        </q-item-section>
        <q-item-section>{{ t(item.name) }}</q-item-section>
      </q-item>
    </div>
  </div>
</template>

<script>
import { ClosePopup, QBtnDropdown, QIcon, QItem, QItemSection, QList, QSeparator } from 'quasar'

export default {
  props: {
    name: {
      type: String,
      required: true
    },
    tool: {
      type: Object,
      required: true
    },
    menu: {
      type: Boolean,
      required: true
    },
    dropdown: {
      type: Array,
      required: true
    }
  },
  components: {
    QBtnDropdown,
    QIcon,
    QItem,
    QItemSection,
    QList,
    QSeparator
  },
  directives: {
    ClosePopup
  },
  computed: {
    dropdownItems () {
      return this.dropdown.filter(item => item.separator || !item.tool.supported || item.tool.supported.call(this, item.tool))
    },
    icon () {
      return this._getOrCall(this.tool.icon, this.tool)
    },
    label () {
      return this.$t('tools.' + this.name + '.headerName')
    },
    noCaps () {
      return false
    },
    style () {
      return {}
    }
  },
  methods: {
    dropdownItemComponent (tool) {
      return tool.headerComponent || require('./HeaderDropdownItem.vue').default
    },
    emit (event, value) {
      if (typeof event === 'string' && event) {
        this.$emit('event', { name: event, value })
      } else if (typeof event === 'object' && event.name.toString()) {
        this.$emit('event', event)
      } else {
        this.$except('[HeaderItemHolder.vue] Trying to emit an incorrectly configured event. Check your config.')
      }
    },
    _getOrCall (v, tool) {
      if (v) {
        if (typeof v === 'function') {
          return v.call(this, tool)
        } else {
          return v
        }
      }
    },
    _onClick (tool) {
      if (tool.to) {
        this.$emit('sidebar-visibility-changed', true)
      }
      if (tool.action) {
        tool.action.call(this, tool)
      }
      if (tool.emit) {
        this.emit(this._getOrCall(tool.emit, tool))
      }
    },
    t (key) {
      return this.$t('tools.' + key + '.headerName')
    },
    to (tool) {
      const value = this._getOrCall(tool.to, tool)
      if (typeof value === 'string') {
        return { name: value }
      } else {
        return value
      }
    }
  }
}
</script>

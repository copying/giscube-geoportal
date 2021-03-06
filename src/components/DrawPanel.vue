<template>
  <div class="panel">
    <div class="panel-content">
      <p class="panel-title">{{ t('title') }}</p>

      <p>{{ t('explanation') }}</p>

      <div class="row space-items-md">
        <q-btn-group class="no-shadow">
          <q-btn
            icon="place"
            v-show="!measuring"
            @click="addMarker"
          >
            <q-tooltip>
              {{ t('marker') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            icon="timeline"
            v-show="!measuring"
            @click="startMeasuring(false)"
          >
            <q-tooltip>
              {{ t('path') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            icon="fas fa-draw-polygon"
            v-show="!measuring"
            @click="startMeasuring(true)"
          >
            <q-tooltip>
              {{ t('area') }}
            </q-tooltip>
          </q-btn>
          <q-btn
            icon="save_alt"
            v-show="!measuring"
            @click="downloadGeoJSON"
          >
            <q-tooltip>
              {{ t('save') }}
            </q-tooltip>
          </q-btn>
        </q-btn-group>
        <q-btn
          outline
          v-show="measuring"
          @click="stopMapMeasuring"
        >
          {{ t('stop') }}
        </q-btn>
      </div>

      <div class="q-pt-md">
        <q-item tag="label" v-ripple class="q-pl-xs">
          <q-item-section avatar>
            <q-checkbox v-model="multi"/>
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ t('drawMulti') }}</q-item-label>
            <q-item-label caption>{{ t('drawMultiCaption') }}</q-item-label>
          </q-item-section>
        </q-item>
      </div>

      <div class='q-mt-md'>
        <div v-for='(layer, key) in sharedLayers' class='measure' :key="'shared-' + key">
          <q-chip
            color="primary"
            text-color="white"
            removable
            @remove="removeFromShared(layer)"
          >
            <span v-html="layerText(layer)"></span><draw-message-input :layer="layer" />
          </q-chip>
        </div>
        <div v-for='(measure, key) in measureControl.measures' class='measure' :key="key">
          <q-chip
            color="primary"
            text-color="white"
            removable
            @remove="removeMeasure(measure)"
          >
            <span v-html="measurementText(measure)"></span><draw-message-input :layer="measureLayer(measure)" />
          </q-chip>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { saveAs } from 'file-saver'
import { QBtn, QBtnGroup, QCheckbox, QChip, QItem, QItemLabel, QItemSection, QTooltip } from 'quasar'
import Vue from 'vue'
import { mapState } from 'vuex'
import length from '@turf/length'
import area from '@turf/area'
import L from 'src/lib/leaflet'
import { createLayer } from 'src/lib/geomUtils'

import DrawMessageInput from 'components/DrawMessageInput.vue'
import MeasureResultPopup from 'components/MeasureResultPopup.vue'

export default {
  components: {
    DrawMessageInput,
    QBtn,
    QBtnGroup,
    QCheckbox,
    QChip,
    QItem,
    QItemLabel,
    QItemSection,
    QTooltip
  },
  data () {
    return {
      multi: false,
      measuring: false,
      measureArea: null,
      sharedLayers: []
    }
  },
  computed: {
    ...mapState({
      map: state => state.map.mapObject
    }),
    measureControl () {
      if (this.map && this.map.measureControl) {
        return this.map.measureControl
      } else {
        return {}
      }
    },
    shared () {
      return this.$store.state.map.shared
    }
  },
  watch: {
    shared: {
      handler: 'updateSharedLayers',
      immediate: true
    }
  },
  destroyed () {
    this.stopMeasuring()
  },
  methods: {
    t (key) {
      return this.$t('tools.draw.' + key)
    },
    updateSharedLayers () {
      this.$nextTick(() => {
        this.sharedLayers = this.shared.getLayers()
      })
    },
    layerText (layer) {
      if (layer instanceof L.Marker) {
        const latlng = layer.getLatLng()
        const lat = this.$n(latlng.lat, { maximumFractionDigits: 6, minimumFractionDigits: 6 })
        const lng = this.$n(latlng.lng, { maximumFractionDigits: 6, minimumFractionDigits: 6 })
        return lat + ' ' + lng
      } else if (layer instanceof L.CircleMarker || layer instanceof L.Circle) {
        const latlng = layer.getLatLng()
        const lat = this.$n(latlng.lat, { maximumFractionDigits: 6, minimumFractionDigits: 6 })
        const lng = this.$n(latlng.lng, { maximumFractionDigits: 6, minimumFractionDigits: 6 })
        return lat + ' ' + lng + ' r' + layer.getRadius()
      } else if (layer instanceof L.Polygon) {
        const value = this.$n(Math.round(area(layer.toGeoJSON(), { units: 'meters' })))
        return value + ' ' + this.$t('units.meters') + '<sup>2</sup>'
      } else if (layer instanceof L.Polyline) {
        const value = this.$n(Math.round(length(layer.toGeoJSON(), { units: 'meters' })))
        return value + ' ' + this.$t('units.meters')
      } else {
        return '<span style="width: 8ch"></span>'
      }
    },
    measurementText (measure) {
      let result = ''
      result += measure.area || measure.length
      result += ' ' + this.$t('units.' + measure.units_desc)
      if (measure.area) {
        result += '<sup>2</sup>'
      }
      return result
    },
    measureLayer (measure) {
      return measure.layer.getLayers()[0]
    },
    addPopupToLayer (measure) {
      let PopupContent = Vue.extend(MeasureResultPopup)
      let popup = new PopupContent({
        propsData: {
          measure: measure
        }
      })
      for (let layerId in measure.layer._layers) {
        measure.layer._layers[layerId].bindPopup(popup.$mount().$el)
      }
    },
    finishedpath () {
      if (this.multi) {
        requestAnimationFrame(() => this.startMeasuring(this.measureArea))
      } else {
        this.stopMapMeasuring()
      }
    },
    startMeasuring (measureArea) {
      this.measureArea = measureArea
      if (!this.map) {
        this.$except('Measure control is missing the map property')
        return
      }
      if (!this.map.measureControl) {
        this.$except('Measure control is missing the map measureControl')
        return
      }
      this.measuring = true
      this.$store.commit('setCurrentTool', this.map.measureControl)
      this.map.on('measure:measurestop', this.stopMeasuring)
      this.map.on('measure:finishedpath', this.finishedpath)
      this.$nextTick(_ => {
        this.map.measureControl.startMeasuring({ measureArea })
      })
    },
    addMarker () {
      this.measuring = true
      this.$store.commit('setCurrentTool', this.map.measureControl)
      createLayer({
        map: this.map,
        type: 'point'
      })
        .then(marker => this.finishAddMarker(marker))
        .catch(_ => this.stopMeasuring())
    },
    finishAddMarker (marker) {
      this.$store.dispatch('map/addSharedMarker', marker)
      this.updateSharedLayers()
      this.stopMeasuring()
      if (this.multi) {
        requestAnimationFrame(() => this.addMarker())
      }
    },
    stopMapMeasuring () {
      this.$store.dispatch('map/stopDrawing')
      this.$nextTick(_ => {
        // $nextTick needed to prevent infinite event loop
        this.map.measureControl.stopMeasuring()
      })
    },
    stopMeasuring () {
      if (!this.measuring) {
        return
      }
      this.measuring = false
      this.map.off('measure:measurestop', this.stopMeasuring)
      this.map.off('measure:finishedpath', this.finishedpath)
      // FIXME: hardcoded 300ms value from QueryOnClick, get from config
      setTimeout(() => {
        this.$store.commit('setCurrentTool', null)
      }, 300)
    },
    removeMeasure (measure) {
      measure.layer.remove()
    },
    removeFromShared (layer) {
      this.shared.removeLayer(layer)
      this.updateSharedLayers()
    },
    downloadGeoJSON () {
      const features = [
        ...this.shared.getLayers().map(layer => layer.toGeoJSON()),
        ...this.measureControl.measures.map(measure => {
          let layer = measure.layer.getLayers()[0]
          if (layer instanceof L.LayerGroup) {
            // Area
            layer = layer.getLayers()[0]
          }
          return layer.toGeoJSON()
        })
      ]
      const geoJSON = JSON.stringify({ type: 'FeatureCollection', features })
      const blob = new Blob([geoJSON], { type: 'application/geo+json;charset=utf-8' })
      saveAs(blob, 'drawn-in-geoportal.geojson')
    }
  }
}
</script>

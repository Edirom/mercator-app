<template>
  <div id="osdContainer" :class="{'fullWidth': !measureListVisible}"></div>
</template>

<script>
import OpenSeadragon from 'openseadragon'
import * as Annotorious from '@recogito/annotorious-openseadragon'
import '@recogito/annotorious-openseadragon/dist/annotorious.min.css'
import { uuid } from '@/tools/uuid.js'

import { mode as allowedModes } from '@/store/constants.js'

export default {
  name: 'OsdComponent',
  components: {

  },
  computed: {
    imageArray: function () {
      return this.$store.getters.imageArray
    },
    mode: function () {
      return this.$store.getters.mode
    },
    measureListVisible: function () {
      return this.$store.getters.showMeasureList
    }
  },
  methods: {
  
    renderZones: function () {
      this.viewer.clearOverlays()
      const annots = this.$store.getters.zonesOnCurrentPage
      annots.forEach(annot => {
        // console.log('trying to render zone based on: ')
        // console.log(annot)
        const rawDimensions = annot.target.selector.value.substr(11).split(',')
        console.log("raw dimention is ", rawDimensions)
        const xywh = {
          x: Math.round(rawDimensions[0]),
          y: Math.round(rawDimensions[1]),
          w: Math.round(rawDimensions[2]),
          h: Math.round(rawDimensions[3])
        }
        const zoneId = annot.id.replace(/#/, '')
        const measureCssLink = annot.body.find(body => body.type === 'Dataset' && body.selector.value.startsWith('measure'))?.selector.value
        const mdivCssLink = annot.body.find(body => body.type === 'Dataset' && body.selector.value.startsWith('mdiv'))?.selector.value
        const mdivIndizes = annot.body.find(body => body.type === 'Dataset' && body.selector.value.startsWith('mov_'))?.selector.value
        
        console.log("this is xywh " , "", xywh.x,"", xywh.y, "", xywh.w, "", xywh.h)


        const overlay = document.createElement('div')
        overlay.id = zoneId
        overlay.classList.add('zone')
        try { mdivIndizes.split(' ').forEach(mov => { overlay.classList.add(mov) }) } catch (err) {}
        overlay.setAttribute('data-measure', measureCssLink)
        overlay.setAttribute('data-mdiv', mdivCssLink)

        const labelContent = annot.body.find(body => body.type === 'TextualBody')?.value

        const label = document.createElement('div')
        label.classList.add('zoneLabel')
        label.textContent = labelContent

        label.addEventListener('dblclick', (e) => {
          this.$store.dispatch('clickMeasureLabel', zoneId)
          e.preventDefault()
          e.stopPropagation()
        })

        overlay.appendChild(label)
        overlay.addEventListener('mouseout', (e) => {
         console.log('mouseout')
         
          this.$store.dispatch('unhoverZone', zoneId)
          e.preventDefault()
          e.stopPropagation()
        })
        overlay.addEventListener('mouseenter', (e) => {
          console.log("this is e " , "", e.x,"", e.y, "", xywh.w, "", xywh.h, "scree x", e.x)

          console.log('mousenter')
          
          this.$store.dispatch('hoverZone', zoneId)
          e.preventDefault()
          e.stopPropagation()
        })
        overlay.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          overlay.click();

        })
        overlay.addEventListener('click', (e) => {
          console.log('clicked')
          this.$store.dispatch('clickZone', zoneId)
          e.preventDefault()
          e.stopPropagation()
        })



        this.viewer.addOverlay({
          element: overlay,
          location: new OpenSeadragon.Rect(xywh.x, xywh.y, xywh.w, xywh.h)
        })
      })
      // this.anno.setAnnotations(annots)
    },
    toggleSelection: function (mode) {
      const activeModes = [allowedModes.manualRect, allowedModes.additionalZone]
      this.anno.readOnly = activeModes.indexOf(mode) === -1
    }
  },
  mounted: function () {
    this.viewer = OpenSeadragon({
      id: 'osdContainer',
      preserveViewport: false,
      visibilityRatio: 0.8,
      sequenceMode: true,
      showNavigator: false,
      showZoomControl: false,
      showHomeControl: false,
      showFullPageControl: false,
      showSequenceControl: false,
      gestureSettingsMouse: {
        clickToZoom: false,
      },
      silenceMultiImageWarnings: true
      // navigatorId: 'someId',
      //
      /* homeButton: 'zoomHome',
      zoomInButton: 'zoomIn',
      zoomOutButton: 'zoomOut',
      previousButton: 'pageLeft',
      nextButton: 'pageRight' */
    })

    const annotoriousConfig = {
      disableEditor: true,
    }

    // Initialize the Annotorious plugin
    this.anno = Annotorious(this.viewer, annotoriousConfig)
    this.anno.setDrawingEnabled(true)


    // Load annotations in W3C WebAnnotation format
    // anno.loadAnnotations('annotations.w3c.json');

    const annoLayer = document.querySelector('.a9s-annotationlayer.a9s-osd-annotationlayer')
    const shiftKeyDown = (e) => {
      if (e.keyCode === 16) {
        annoLayer.classList.add('activeSelection')
        console.log("anno layer " + annoLayer)

      }
    } 
    const shiftKeyUp = (e) => {
      if (e.keyCode === 16) {
        annoLayer.classList.remove('activeSelection')
      }
    }
    document.addEventListener('keydown', shiftKeyDown)
    document.addEventListener('keyup', shiftKeyUp)

    this.anno.on('createSelection', async (selection) => {
      // The user has created a new shape...

      // it is necessary to have some type of body, or it will not save
      selection.body = [{
        type: 'TextualBody',
        purpose: 'tagging',
        value: 'measure'
      }]

      await this.anno.updateSelected(selection)
      this.anno.saveSelected()
    })

    this.anno.on('selectAnnotation', async (annotation) => {
      // The users has selected an existing annotation
      // console.log('selected annotation')
      // console.log(annotation)
      console.log("anno is clicked")  

    })

    this.anno.on('createAnnotation', (annotation) => {
      // The users has created a new annotation
      const newId = 'z' + uuid()
      annotation.id = newId
      this.$store.dispatch('createZone', annotation)
      this.$store.dispatch('selectZone', null)
      this.anno.clearAnnotations()
      this.renderZones()
    })

    this.anno.on('updateAnnotation', (annotation) => {
      // The users has selected an existing annotation
      this.$store.dispatch('updateZone', annotation)
      this.$store.dispatch('selectZone', null)
      this.anno.clearAnnotations()
      this.renderZones()
    })

    this.viewer.addHandler('open', (data) => {
      this.anno.clearAnnotations()
      this.renderZones()
    })

    this.viewer.addHandler('page', (data) => {
      this.anno.clearAnnotations()
      this.renderZones()
    })

    this.unwatchPages = this.$store.watch((state, getters) => getters.pages,
      (newArr, oldArr) => {
        this.viewer.open(newArr)
        this.$store.dispatch('setCurrentPage', 0)
      })

    this.unwatchCurrentPage = this.$store.watch((state, getters) => getters.currentPageIndexZeroBased,
      (newPage, oldPage) => {
        this.viewer.goToPage(newPage)
      })

    this.unwatchZonesOnCurrentPage = this.$store.watch((state, getters) => getters.zonesOnCurrentPage,
      (newArr, oldArr) => {
        this.renderZones()
      })

    this.unwatchMode = this.$store.watch((state, getters) => getters.mode,
      (newMode, oldMode) => {
        this.toggleSelection(newMode)
      })

    this.unwatchSelectedZone = this.$store.watch((state, getters) => getters.selectedZone,
      (newZone, oldZone) => {
        if (newZone !== null) {
          this.anno.setAnnotations([newZone])
          this.anno.selectAnnotation(newZone)
        }
      })
  },
  beforeUnmount () {
    this.unwatchPages()
    this.unwatchCurrentPage()
    this.unwatchZonesOnCurrentPage()
    this.unwatchSelectedZone()
    this.unwatchMode()
  }
}
</script>

<style lang="scss">
@import '@/css/_variables.scss';

$thinLineColor: #e5e5e566; // #ffffff33;
$thickLineColor: #cccccc66; // #ffffff99;

#osdContainer {
  height: calc(100vh - $appHeaderHeight - $appFooterHeight);
  width: calc(100% - $appSidebarWidth - $contentPreviewPaneWidth);

  &.fullWidth {
    width: calc(100% - $appSidebarWidth);
  }

  float: left;
  box-shadow: 0 0 1rem #00000066 inset;

  background-color: #ffffff; // #8a8aff;
  background-size: 100px 100px, 100px 100px, 20px 20px, 20px 20px;
  background-position: -2px -2px, -2px -2px, -1px -1px, -1px -1px;
  background-image: linear-gradient($thickLineColor 2px, transparent 2px),
                    linear-gradient(90deg, $thickLineColor 2px, transparent 2px),
                    linear-gradient($thinLineColor 1px, transparent 1px),
                    linear-gradient(90deg, $thinLineColor 1px, transparent 1px);

  .a9s-annotationlayer.a9s-osd-annotationlayer.activeSelection {
    z-index: 12;
  }

  .zone {
    background-color: rgba(255,255,255,.1);
    z-index: 10;

    &.mov_0 {
      background-color: transparentize($mdiv0ZoneColor, .8);
      outline: 1px solid transparentize($mdiv0ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv0ZoneColor, .6);
        outline: 1px solid transparentize($mdiv0ZoneColor, .4);
      }
    }

    &.mov_1 {
      background-color: transparentize($mdiv1ZoneColor, .8);
      outline: 1px solid transparentize($mdiv1ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv1ZoneColor, .6);
        outline: 1px solid transparentize($mdiv1ZoneColor, .4);
      }
    }

    &.mov_2 {
      background-color: transparentize($mdiv2ZoneColor, .8);
      outline: 1px solid transparentize($mdiv2ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv2ZoneColor, .6);
        outline: 1px solid transparentize($mdiv2ZoneColor, .4);
      }
    }

    &.mov_3 {
      background-color: transparentize($mdiv3ZoneColor, .8);
      outline: 1px solid transparentize($mdiv3ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv3ZoneColor, .6);
        outline: 1px solid transparentize($mdiv3ZoneColor, .4);
      }
    }

    &.mov_4 {
      background-color: transparentize($mdiv4ZoneColor, .8);
      outline: 1px solid transparentize($mdiv4ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv4ZoneColor, .6);
        outline: 1px solid transparentize($mdiv4ZoneColor, .4);
      }
    }

    &.mov_5 {
      background-color: transparentize($mdiv5ZoneColor, .8);
      outline: 1px solid transparentize($mdiv5ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv5ZoneColor, .6);
        outline: 1px solid transparentize($mdiv5ZoneColor, .4);
      }
    }

    &.mov_6 {
      background-color: transparentize($mdiv6ZoneColor, .8);
      outline: 1px solid transparentize($mdiv6ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv6ZoneColor, .6);
        outline: 1px solid transparentize($mdiv6ZoneColor, .4);
      }
    }

    &.mov_7 {
      background-color: transparentize($mdiv7ZoneColor, .8);
      outline: 1px solid transparentize($mdiv7ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv7ZoneColor, .6);
        outline: 1px solid transparentize($mdiv7ZoneColor, .4);
      }
    }

    &.mov_8 {
      background-color: transparentize($mdiv8ZoneColor, .8);
      outline: 1px solid transparentize($mdiv8ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv8ZoneColor, .6);
        outline: 1px solid transparentize($mdiv8ZoneColor, .4);
      }
    }

    &.mov_9 {
      background-color: transparentize($mdiv9ZoneColor, .8);
      outline: 1px solid transparentize($mdiv9ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv9ZoneColor, .6);
        outline: 1px solid transparentize($mdiv9ZoneColor, .4);
      }
    }

    &.mov_10 {
      background-color: transparentize($mdiv10ZoneColor, .8);
      outline: 1px solid transparentize($mdiv10ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv10ZoneColor, .6);
        outline: 1px solid transparentize($mdiv10ZoneColor, .4);
      }
    }

    &.mov_11 {
      background-color: transparentize($mdiv11ZoneColor, .8);
      outline: 1px solid transparentize($mdiv11ZoneColor, .4);

      &:hover {
        background-color: transparentize($mdiv11ZoneColor, .6);
        outline: 1px solid transparentize($mdiv11ZoneColor, .4);
      }
    }

    .zoneLabel {
      text-align: center;
      position: absolute;
      top: calc(50% - 0.4rem);
      left: 0;
      right: 0;
      color: #000000;
      font-weight: 900;
      font-size: 0.8rem;
      line-height: 0.8rem;
    }
  }
}
</style>

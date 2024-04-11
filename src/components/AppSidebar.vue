<template>
  <div class="appSidebar">
    <!-- SELECT -->
    <button class="btn btn-action" :class="{'activeMode': mode === 'selection'}"
      title="select measure" :disabled="!isReady"
      @click="activateMode('selection')">
      <font-awesome-icon icon="fa-solid fa-arrow-pointer"/>
    </button>

    <!-- DRAW -->
    <button class="btn btn-action"  :class="{'activeMode': mode === 'manualRect'}"
      title="draw measures" :disabled="!isReady"
      @click="activateMode('manualRect')">
      <font-awesome-icon icon="fa-solid fa-pen"/>
    </button>

    <!-- RECTANGLE -->
    <!-- <button class="btn btn-action" title="draw rectangle" :disabled="!isReady">
      <font-awesome-icon icon="fa-solid fa-crop-simple"/>
    </button> -->

    <!-- SPLIT HORIZONTALLY -->
    <!-- button class="btn btn-action"  :class="{'activeMode': mode === 'splitHorizontal'}"
      title="split measure horizontally" :disabled="!isReady"
      @click="activateMode('splitHorizontal')">
      <font-awesome-icon icon="fa-solid fa-scissors"/>
    </button> -->

    <!-- SPLIT VERTICALLY -->
    <!-- <button class="btn btn-action"  :class="{'activeMode': mode === 'splitVertical'}"
      title="split measure vertically" :disabled="!isReady"
      @click="activateMode('splitVertical')">
      <font-awesome-icon icon="fa-solid fa-scissors" rotation="270"/>
    </button> -->

    <!-- ADDITIONAL ZONE PER MEASURE -->
    <button class="btn btn-action"  :class="{'activeMode': mode === 'additionalZone'}"
      title="add zone to last measure" :disabled="!isReady"
      @click="activateMode('additionalZone')">
      <template v-if="mode === 'additionalZone'">
        <font-awesome-icon icon="fa-solid fa-square-plus"/>
      </template>
      <template v-else>
        <font-awesome-icon icon="fa-regular fa-square-plus"/>
      </template>
    </button>

    <!-- DELETE MEASURE -->
    <button class="btn btn-action"  :class="{'activeMode': mode === 'deletion'}"
      title="delete measure" :disabled="!isReady"
      @click="activateMode('deletion')">
      <font-awesome-icon icon="fa-solid fa-eraser"/>
    </button>
    <!-- MDIV -->
    <!-- <button class="btn btn-action"  :class="{'activeMode': mode === 'mdiv'}"
      title="select movement" :disabled="!isReady"
      @click="activateMode('mdiv')">
      <font-awesome-icon icon="fa-solid fa-sitemap"/>
    </button> -->

    <div class="automaticTools">
      <!-- AUTODETECT ON CURRENT PAGE -->
      <button class="btn btn-action" title="Autodetect measures on current page"
        :disabled="!isReady"
        @click="autoDetect">
        <font-awesome-layers>
          <font-awesome-icon icon="fa-solid fa-wand-sparkles" transform="flip-h down-5 right-5 shrink-3"/>
          <font-awesome-icon icon="fa-regular fa-clone" transform="up-5 left-5"/>
        </font-awesome-layers>
      </button>
        <!-- AUTODETECT ON ALL PAGE
        <button class="btn btn-action" title="Autodetect measures on current page"
          :disabled="!isReady"
          @click="autoDetectAll">
          <font-awesome-layers>
            <font-awesome-icon icon="fa-solid fa-wand-sparkles" transform="flip-h down-5 right-5 shrink-3"/>
            <font-awesome-icon icon="fa-regular fa-clone" transform="up-5 left-5"/>
            <font-awesome-icon icon="fa-regular fa-square" transform="up-7.5 right-6.5 shrink-3"/>
          </font-awesome-layers>
      </button> -->

      <!-- AUTODETECT ALL PAGES -->
      <!-- <button class="btn btn-action" title="Autodetect measures throughout document"
      :disabled="!isReady"
      @click="autoDetectAll">
        <font-awesome-layers>
          <font-awesome-icon icon="fa-solid fa-wand-sparkles" transform="flip-h down-5 right-5 shrink-3"/>
          <font-awesome-icon icon="fa-regular fa-clone" transform="up-5 left-5"/>
          <font-awesome-icon icon="fa-regular fa-square" transform="up-7.5 right-6.5 shrink-3"/>
        </font-awesome-layers>
      </button> -->

    </div>

    <div class="pageNav">
      <label>Page</label>
      <span class="currentPage">{{ currentPage }}</span>
      <span class="maxPage">of {{ maxPage }}</span>
      <span class="pageBtn" @click="showPrevPage" :disabled="!prevAvailable">
        <font-awesome-icon icon="fa-solid fa-angle-left" />
      </span>
      <span class="pageBtn" @click="showNextPage" :disabled="!nextAvailable">
        <font-awesome-icon icon="fa-solid fa-angle-right" />
      </span>
    </div>
    <!-- this could be used for score setup
    <button class="btn btn-action">
      <font-awesome-layers>
        <font-awesome-icon icon="fa-solid fa-guitar" transform="up-8 shrink-5"/>
        <font-awesome-icon icon="fa-solid fa-guitar" transform="shrink-5"/>
        <font-awesome-icon icon="fa-solid fa-guitar" transform="down-8 shrink-5"/>
      </font-awesome-layers>
    </button>-->
    <!-- these could be used for score vs. parts
    <button class="btn btn-action">
      <font-awesome-icon icon="fa-solid fa-stop"/>
    </button>
    <button class="btn btn-action">
      <font-awesome-icon icon="fa-solid fa-layer-group"/>
    </button>-->

    <!--<button class="btn btn-action">
      <font-awesome-layers>
        <font-awesome-icon icon="fa-solid fa-wand-sparkles" transform="flip-h down-5 right-5 shrink-3"/>
        <font-awesome-icon icon="fa-regular fa-clone" transform="up-5 left-5"/>
        <font-awesome-icon icon="fa-regular fa-square" transform="up-7.5 right-6.5 shrink-3"/>
      </font-awesome-layers>
    </button>-->
  </div>
</template>

<script>
import { mode as allowedModes } from '@/store/constants.js'

export default {
  name: 'AppSidebar',
  components: {

  },
  computed: {
    isReady: function () {
      return this.$store.getters.isReady
    },
    multiZone: function () {
      return this.$store.getters.multiZoneActive
    },
    currentPage: function () {
      return this.$store.getters.currentPageIndexOneBased
    },
    maxPage: function () {
      return this.$store.getters.maxPageNumber
    },
    prevAvailable: function () {
      return this.$store.getters.currentPageIndexZeroBased > 0
    },
    nextAvailable: function () {
      return this.$store.getters.currentPageIndexOneBased < this.$store.getters.maxPageNumber
    },
    mode: function () {
      return this.$store.getters.mode
    }
    /* visible: function() {
      return this.$store.getters.imageSelectionModalVisible
    } */
  },
  methods: {
    showPrevPage: function () {
      this.$store.dispatch('setCurrentPage', this.$store.getters.currentPageIndexZeroBased - 1)
    },
    showNextPage: function () {
      this.$store.dispatch('setCurrentPage', this.$store.getters.currentPageIndexZeroBased + 1)
    },
    autoDetect: function () {
      this.$store.dispatch('autoDetectZonesOnCurrentPage')
    },
    autoDetectAll: function () {
      this.$store.dispatch('autoDetectZonesOnAllPage')
    },
    activateMode: function (mode) {
      if (mode in allowedModes) {
        if (mode === allowedModes.additionalZone && mode === this.mode) {
          this.$store.dispatch('setMode', allowedModes.manualRect)
        } else {
          this.$store.dispatch('setMode', mode)
        }
        if (mode === allowedModes.deletion) {
          this.$store.dispatch('setMode', mode)
        }
        if (mode === allowedModes.login) {
          this.$store.dispatch('setMode', mode)
        }
      } else {
        console.error('mode ' + mode + ' is not known. Please check AppSidebar.vue and @/store/index.js.')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/css/_variables.scss';

.appSidebar {
  height: calc(100vh - $appHeaderHeight - $appFooterHeight);
  width: $appSidebarWidth;
  background-color: $appColor;
  float: right;
  padding-top: .4rem;

  button {
    color: $fontColorDark;
    border-color: $fontColorDark;
  }

  .btn-action {
    margin: 0 0 .2rem 0;

    &.activeMode {
      background-color: #a6e9fd;
      box-shadow: 0 0.01rem 0.2rem rgba(0, 0, 0, 0.3) inset;
    }
  }

  .automaticTools {
    margin: .5rem 0;
  }

  .pageNav {
    background-color: #ffffff;
    border: 0.05rem solid #000000;
    border-radius: 2px;
    margin: 0 .35rem .2rem .35rem;
    // display: none;
    label {
      display: block;
      font-weight: 100;
      font-size: .5rem;
    }
    .currentPage {
      display: block;
      font-weight: 300;
    }

    .maxPage {
      display: block;
      font-weight: 100;
      font-size: .5rem;
      line-height: .6rem;
    }

    .pageBtn {
      padding: 0 .1rem;
    }
  }
}
</style>

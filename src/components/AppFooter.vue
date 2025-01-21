<template>
  <div class="appFooter">

    <div class="container gapless oneline">
      <div class="columns">
        <div class="column col-4 text-left">
          <span @click="showMdivModal" v-if="mdivLabel !== ''">
            <font-awesome-icon icon="fa-solid fa-sitemap" /> {{ mdivLabel }}
          </span>
        </div>
        <div class="column col-4">
          <span @click="showPrevPage" :disabled="!prevAvailable">
            <font-awesome-icon icon="fa-solid fa-angle-left" />
          </span>
          {{ currentPage }} / {{ maxPage }}
          <span @click="showNextPage" :disabled="!nextAvailable">
            <font-awesome-icon icon="fa-solid fa-angle-right" />
          </span>
        </div>
        <div class="column col-3">
          zones: {{ zonesCount }}
        </div>
        <div class="column col-1">
          <progress v-if="isLoading" class="progress" max="100"></progress>
        </div>
      </div>
    </div>

  </div>
</template>

<script>

/**
 * Represents a book.
 * @constructor
 * @param {string} title - The title of the book.
 * @param {string} author - The author of the book.
 */

export default {
  name: 'AppFooter',
  components: {

  },
  computed: {
    currentPage: function () {
      return this.$store.getters.currentPageIndexOneBased
    },
    maxPage: function () {
      return this.$store.getters.maxPageNumber
    },
    isReady: function () {
      return this.$store.getters.isReady
    },
    isLoading: function () {
      return this.$store.getters.isLoading
    },
    prevAvailable: function () {
      return this.$store.getters.currentPageIndexZeroBased > 0
    },
    nextAvailable: function () {
      return this.$store.getters.currentPageIndexOneBased < this.$store.getters.maxPageNumber
    },
    zonesCount: function () {
      return this.$store.getters.zonesOnCurrentPage.length
    },
    mdivLabel: function () {
      const mdiv = this.$store.getters.currentMdiv
      if (mdiv === null) {
        return ''
      }
      return (mdiv.index + 1) + ': ' + mdiv.label
    }
  },
  methods: {
    showPrevPage: function () {
      this.$store.dispatch('setCurrentPage', this.$store.getters.currentPageIndexZeroBased - 1)
      this.$store.dispatch('setCurrentPageZone', this.$store.getters.zonesOnCurrentPage.length)
    },
    showNextPage: function () {
      this.$store.dispatch('setCurrentPage', this.$store.getters.currentPageIndexZeroBased + 1)
    },
    showMdivModal: function () {
      this.$store.dispatch('toggleMdivModal')
    }
    /* showImageSelectionOverlay: function () {
      this.$store.dispatch('showImageSelectionModal')
    } */
  }
}
</script>

<style lang="scss" scoped>
@import '@/css/_variables.scss';

.appFooter {
  position: absolute;
  bottom: 0;
  height: $appFooterHeight;
  width: 100vw;
  background-color: $appColor;
  border-top: $thickBorder;
  box-sizing: border-box;

  font-size: .7rem;
  font-weight: 300;

  progress {
    color: $fontColorDark;
    height: .3rem;
    position: relative;
    top: -3px;
    border: $thinBorder;
    background: #eef0f3 linear-gradient(to right, #999999 30%, #eef0f3 30%) top left/150% 150% no-repeat;
  }
}
</style>

/**
 * @author Jane Smith &lt;jsmith@example.com>
 */

import { createStore } from 'vuex' //  Importing createStore method from Vuex   
import { iiifManifest2mei, checkIiifManifest, getPageArray } from '@/tools/iiif.js' // import helper functions for IIIF import
import { meiZone2annotorious, annotorious2meiZone, measureDetector2meiZone, generateMeasure, insertMeasure, addZoneToLastMeasure, deleteZone, setMultiRest, createNewMdiv, moveContentToMdiv, toggleAdditionalZone, addImportedPage } from '@/tools/meiMappings.js'   // import helper functions for MEI mappings
import { toRaw } from 'vue';  // Importing toRaw method from Vue

import { mode as allowedModes } from '@/store/constants.js'   // Importing mode from constants.js 
import qs from 'qs'; // Importing qs from query-string
import { Octokit } from '@octokit/rest'  // Importing Octokit from @octokit/rest

import CLIENT_ID from './client_id'; // Importing CLIENT_ID from client_id
import CALL_BACK from './call_back'; // Importing CALL_BACK from call_back
import CLIENT_SECRET from './client_secret'; // Importing CLIENT_SECRET from client_secret



import { Base64 } from 'js-base64'; // Importing Base64 from js-base64 
const parser = new DOMParser()   /**  @var {object}  parser   - Parser object to parse an DOM.  */  // Creating a new DOMParser object
const serializer = new XMLSerializer()  /**  @var {object}  parser   - Serializer object to serialize an XML file.  */ // Creating a new XMLSerializer object 

export default createStore({  /** @function createStore - This function is used to create a centralized store for managing the state of a Vue application. */ 

  state: {  /** @var {Object} state - The state object contains the data that needs to be shared across multiple components. */
    accessToken: null, /**  @var {string|null}  accessToken   - Access Token for Github authentication.  */ 
    anno: null, /** @var {string|null} anno - Zone annotation using 'anotorious', assigned in createZone method dispatched from OsdComponent */
    currentMdivId: null, /**  @var {string|null}  currentMdivId - The current MDIV */ 
    currentheight: "",  /** @var {string|null} currentheight - Height of the current page */
    currentMeasureId: null,   /** @var {string|null} currentMeasureId - ID of the current measure element */
    currentPage: -1, /** @var {number} currentPage @kind constant - Index of the current page */
    currentwidth: "",  /** @var {string|null} currentwidth - Width of the current page */       
    deleteZoneId: null,   /** @var {string|null} deleteZoneId -  of the zone to be deleted */
    existingMusicMode: false,  /** @var {boolean} existingMusicMode - Flag for existing music mode */
    hoveredZoneId: null, /** @var {string|null} hoveredZoneId - Id of the zone currently hovered over */
    importingImages: [],   /** @var {Array<{index: number, url: string, width: number|null, height: number|null, status: string}>} importingImages - Array of image import objects */
    loading: false,   /** @var {boolean} loading - Flag for loading state */
    logedin: false,   /** @var {boolean} logedin - Flag for login state */  
    mode: allowedModes.selection,  /** @var {string} mode - Current mode */
    octokit: null,  /** @var {Octokit|null} octokit - Octokit instance */    
    owner: null,  /** @var {string|null} owner - Owner of the repository */
    pages: [],    /** @var {Array<{uri: string, id: string, n: string, label: string, width: number, height: number, hasSvg: boolean, hasZones: boolean}>} pages - Array of page objects */
    path: null,  /** @var {string|null} path - Path to the current directory */
    processing: false, /** @var {boolean} processing - Flag for processing state */
    repo: null, /** @var {string|null} repo - Name of the selected Github repository */
    repositories: null,   /** @var {Array<{name: string, full_name: string, owner: {login: string}}> | null} repositories - Array of Github repository objects */
    selectedDirectory: null, /** @var {string|null} selectedDirectory - Name of the selected Github directory */
    selectedZoneId: null, /** @var {string|null} selectedZoneId - ID of the selected zone */   
    sha: null, /** @var {string|null} sha - SHA of the current file */
    showLoadXMLModal: false, /** @var {boolean} showLoadXMLModal - Flag for showing the load XML modal */
    showLoadIIIFModal: false, /** @var {boolean} showLoadIIIFModal - Flag for showing the load IIIF modal */
    showLoadGitModal: false,  /** @var {boolean} showLoadGitModal - Flag for showing the load Git modal */
    showMdivModal: false, /** @var {boolean} showMdivModal - Flag for showing the mdiv modal */
    showMeasureList: false, /** @var {boolean} showMeasureList - Flag for showing the measure list */
    showMeasureModal: false, /** @var {boolean} showMeasureModal - Flag for showing the measure modal */
    showPagesModal: false, /** @var {boolean} showPagesModal - Flag for showing the pages modal */
    showPageImportModal: false, /** @var {boolean} showPageImportModal - Flag for showing the page import modal */
    totalZones: 0, /** @var {number} totalZones - Total number of zones */
    username: null,   /** @var {string|null} username - Username of the authenticated user */
    xmlDoc: null, /** @var {Document|null} xmlDoc -  MEI XML document */

  },
  mutations: {  
    /**
      * @description Mutations in Vuex are synchronous functions used to directly modify the state.
      * They receive the current state as their first argument and optionally a payload as the second.
      * Mutations are called by actions.
      * Official Vue.js documentation: https://vuex.vuejs.org/guide/mutations.html
    */
       
    /**
     * Toggles the visibility of the Load XML Modal.
     *
     * This mutation updates the `showLoadXMLModal` state property by inverting its current boolean value.
     * It is used to show or hide the modal for loading XML content.
     * @function 
     * @name TOGGLE_LOADXML_MODAL
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
     * @param {Object} state - The Vuex state object, which contains the `showLoadXMLModal` property.
     */
    
    TOGGLE_LOADXML_MODAL(state) {
      state.showLoadXMLModal = !state.showLoadXMLModal;
    },
  
    /**
       * Sets the access token and initializes the Octokit instance for GitHub API interaction.
       * This asynchronous mutation updates the `accessToken` state with the provided authentication token
       * and initializes a new instance of Octokit, which is configured to use the updated token for 
       * authenticated API requests.
       * @function 
       * @name SET_ACCESS_TOKEN
       * @async
       * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
       * @param {Object} state - The Vuex state object, containing `accessToken` and `octokit`.
       * @param {string} payload.auth - The authentication token used for GitHub API requests.
     */
    async SET_ACCESS_TOKEN(state, { auth }) {
      state.accessToken = auth
      state.octokit = new Octokit({ auth: state.accessToken })
    },
    
    /**
       * Toggles the visibility of the Load IIIF Modal.
       *
       * This mutation updates the `showLoadIIIFModal` state property by inverting its current boolean value.
       * It is used to show or hide the modal for loading IIIF content.
       * @function 
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @name TOGGLE_LOADIIIF_MODAL
       * @param {Object} state - The Vuex state object, which contains the `showLoadIIIFModal` property.
    */
    TOGGLE_LOADIIIF_MODAL(state) {
      state.showLoadIIIFModal = !state.showLoadIIIFModal;
    }, 
   
    /**
     * Toggles the visibility of the Load Git Modal.
     * @function TOGGLE_LOADGIT_MODAL
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
     * @param {Object} state - The Vuex state object.
    */
      TOGGLE_LOADGIT_MODAL(state) {
        state.showLoadGitModal = !state.showLoadGitModal;
      },
  
      /**
       * Toggles the visibility of the Measure Modal.
       * @function TOGGLE_MEASURE_MODAL
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       */
      TOGGLE_MEASURE_MODAL(state) {
        state.showMeasureModal = !state.showMeasureModal;
      },
  
      /**
       * Toggles the visibility of the Pages Modal.
       * @function TOGGLE_PAGES_MODAL
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       */
      TOGGLE_PAGES_MODAL(state) {
        state.showPagesModal = !state.showPagesModal;
      },
  
      /**
       * Toggles the visibility of the Page Import Modal.
       * @function TOGGLE_PAGE_IMPORT_MODAL
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       */
      TOGGLE_PAGE_IMPORT_MODAL(state) {
        state.showPageImportModal = !state.showPageImportModal;
      },
  
      /**
       * Toggles the visibility of the MDiv Modal.
       * @function TOGGLE_MDIV_MODAL
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       */
      TOGGLE_MDIV_MODAL(state) {
        state.showMdivModal = !state.showMdivModal;
      },
  
      /**
       * Hides all modals by setting their visibility state to false.
       * @function HIDE_MODALS
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       */
      HIDE_MODALS(state) {
        state.showMeasureModal = false;
        state.showMdivModal = false;
      },
  
      /**
       * Toggles the visibility of the Measure List.
       * @function TOGGLE_MEASURE_LIST
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       */
      TOGGLE_MEASURE_LIST(state) {
        state.showMeasureList = !state.showMeasureList;
      },
  
      /**
       * Sets the annotation data in the state.
       * @function SET_ANNO
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {Object} anno - The annotation data to set.
       */
      SET_ANNO(state, anno) {
        state.anno = anno;
      },
  
      /**
       * Sets the selected directory for Git operations.
       * @function SET_SELECTED_DIRECTORY
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {string} gitdirec - The directory path to set.
       */
      SET_SELECTED_DIRECTORY(state, gitdirec) {
        state.selectedDirectory = gitdirec;
      },
  
      /**
       * Sets the XML document and resets the current page index.
       * @function SET_XML_DOC
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {Document} xmlDoc - The XML document to set.
       */
      SET_XML_DOC(state, xmlDoc) {
        state.xmlDoc = xmlDoc;
        state.currentPage = 0;
      },
  
      /**
       * Sets the pages array in the state.
       * @function SET_PAGES
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {Array} pageArray - The array of pages to set.
       */
      SET_PAGES(state, pageArray) {
        state.pages = pageArray;
      },
  
      /**
       * Sets the username in the state.
       * @function SET_USERNAME
       * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {string} username - The username to set.
       */
      SET_USERNAME(state, username) {
        state.username = username;
      },
  
      /**
       * Updates the current height value in the state.
       * @function SET_CURRENT_HEIGHT
       * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {number} height - The new height value.
       */
      SET_CURRENT_HEIGHT(state, height) {
        state.currentheight = height;
      },
  
      /**
       * Updates the current width value in the state.
       * @function SET_CURRENT_WIDTH
       * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {number} width - The new width value.
       */
      SET_CURRENT_WIDTH(state, width) {
        state.currentwidth = width;
      },
  
      /**
       * Updates the pages array in the state with a raw copy of the provided array.
       * @function SET_PAGE_ARRAY
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {Array} updatedArray - The updated array of pages.
       */
      SET_PAGE_ARRAY(state, updatedArray) {
        state.pages = toRaw(updatedArray);
      },
  
      /**
       * Sets the current page index if the index is within range.
       * @function SET_CURRENT_PAGE
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {number} i - The page index to set.
       */
      SET_CURRENT_PAGE(state, i) {
        if (i > -1 && i < state.pages.length) {
          state.currentPage = i;
        }
      },
  
      /**
       * Updates the total zones count by adding the given value.
       * @function SET_TOTAL_ZONES_COUNT
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {number} j - The value to add to the total zones count.
       */
      SET_TOTAL_ZONES_COUNT(state, j) {
        state.totalZones = state.totalZones + j;
      },
  
      /**
       * Sets the loading state to the provided boolean value.
       * @function SET_LOADING
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {boolean} bool - The loading state.
       */
      SET_LOADING(state, bool) {
        state.loading = bool;
      },
  
      /**
       * Sets the processing state to the provided boolean value.
       * @function SET_PROCESSING
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {boolean} bool - The processing state.
       */
      SET_PROCESSING(state, bool) {
        state.processing = bool;
      },
  
      /**
       * Sets the selected zone ID.
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @function SELECT_ZONE
       * @param {Object} state - The Vuex state object.
       * @param {string} id - The ID of the selected zone.
       */
      SELECT_ZONE(state, id) {
        state.selectedZoneId = id;
      },
  
      /**
       * Sets the hovered zone ID.
       * @function HOVER_ZONE
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {string} id - The ID of the hovered zone.
       */
      HOVER_ZONE(state, id) {
        state.hoveredZoneId = id;
      },
  
      /**
       * Sets the access token for API authentication.
       * @function setAccessToken
       * @author  Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {string} accessToken - The new access token.
       */
      setAccessToken(state, accessToken) {
        state.accessToken = accessToken;
      },
  
      /**
       * Creates a new zone from an annotation and updates the XML document accordingly.
       * Handles different modes for assigning the zone to measures or creating new measures.
       * @function CREATE_ZONE_FROM_ANNOTORIOUS
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>
       * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
       * @param {Object} state - The Vuex state object.
       * @param {Object} annot - The annotation object representing the zone.
       */
      CREATE_ZONE_FROM_ANNOTORIOUS(state, annot) {
        if (state.mode !== allowedModes.selection) {
          const xmlDoc = state.xmlDoc.cloneNode(true);
          const index = state.currentPage + 1;
          const surface = xmlDoc.querySelector('surface:nth-child(' + index + ')');
          const zone = annotorious2meiZone(annot);
          surface.appendChild(zone);
  
          if (state.existingMusicMode) {
            if (state.mode === allowedModes.manualRect) {
              const lastMeasureWithoutZone = xmlDoc.querySelector('music measure:not([facs])');
              if (lastMeasureWithoutZone !== null) {
                state.currentMdivId = lastMeasureWithoutZone.closest('mdiv').getAttribute('xml:id');
                lastMeasureWithoutZone.setAttribute('facs', '#' + zone.getAttribute('xml:id'));
              }
            } else if (state.mode === allowedModes.additionalZone) {
              const lastMeasureWithZone = [...xmlDoc.querySelectorAll('music measure[facs]')].at(-1);
              if (lastMeasureWithZone !== null) {
                state.currentMdivId = lastMeasureWithZone.closest('mdiv').getAttribute('xml:id');
                lastMeasureWithZone.setAttribute('facs', lastMeasureWithZone.getAttribute('facs') + ' #' + zone.getAttribute('xml:id'));
              }
            }
          } else {
            if (state.mode === allowedModes.manualRect) {
              const measure = generateMeasure();
              measure.setAttribute('facs', '#' + zone.getAttribute('xml:id'));
              insertMeasure(xmlDoc, measure, state, zone, state.currentPage);
            } else if (state.mode === allowedModes.additionalZone && state.selectedZoneId === null) {
              addZoneToLastMeasure(xmlDoc, zone.getAttribute('xml:id'));
            }
          }
  
          state.xmlDoc = xmlDoc;
        }
      },  
    /**
     * Creates zones from detected measures on a specified page and updates the XML document accordingly.
     * @function CREATE_ZONES_FROM_MEASURE_DETECTOR_ON_PAGE
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Object} state - The Vuex state object.
     * @param {Object} payload - The payload containing rectangles and the page index.
     * @param {Array} payload.rects - Array of rectangle objects representing detected measures.
     * @param {number} payload.pageIndex - Zero-based index of the page where measures are detected.
     */
    CREATE_ZONES_FROM_MEASURE_DETECTOR_ON_PAGE(state, { rects, pageIndex }) {
      // Clone the current XML document to avoid direct mutations
      const xmlDoc = state.xmlDoc.cloneNode(true);
      // Calculate the one-based page index for querying the XML
      const index = pageIndex + 1;
      // Select the corresponding surface element for the specified page
      const surface = xmlDoc.querySelector('surface:nth-child(' + index + ')');

      // Iterate over each detected rectangle to create and append zones
      rects.forEach(rect => {
        // Convert the detected rectangle into an MEI zone element
        const zone = measureDetector2meiZone(rect);
        // Append the new zone to the surface element
        surface.appendChild(zone);

        if (!state.existingMusicMode) {
          // If not in existing music mode, generate a new measure
          const measure = generateMeasure();
          // Associate the new zone with the measure
          measure.setAttribute('facs', '#' + zone.getAttribute('xml:id'));
          // Insert the measure into the XML document
          insertMeasure(xmlDoc, measure, state, zone, pageIndex);
        } else {
          // In existing music mode, find the last measure without an associated zone
          const lastMeasureWithoutZone = xmlDoc.querySelector('music measure:not([facs])');
          if (lastMeasureWithoutZone !== null) {
            // Set the current mdiv ID to the parent mdiv of the measure
            state.currentMdivId = lastMeasureWithoutZone.closest('mdiv').getAttribute('xml:id');
            // Associate the new zone with the measure
            lastMeasureWithoutZone.setAttribute('facs', '#' + zone.getAttribute('xml:id'));
          }
        }
      });

      // Update the state with the modified XML document
      state.xmlDoc = xmlDoc;
    },

    /**
     * Updates an existing zone in the XML document based on annotation data.
     * @function UPDATE_ZONE_FROM_ANNOTORIOUS
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} state - The Vuex state object.
     * @param {Object} annot - The annotation data containing updated zone information.
     */
    UPDATE_ZONE_FROM_ANNOTORIOUS(state, annot) {
      // Clone the current XML document to avoid direct mutations
      const xmlDoc = state.xmlDoc.cloneNode(true);
      // Convert the annotation data into an MEI zone element
      const newZone = annotorious2meiZone(annot);
      console.log("annotation is ", annot);

      // Calculate the one-based page index for querying the XML
      const pageIndex = state.currentPage + 1;
      // Select the corresponding surface element for the current page
      const surface = xmlDoc.querySelector('surface:nth-child(' + pageIndex + ')');
      // Retrieve all zone elements within the surface
      const zones = surface.querySelectorAll('zone');
      // Find the existing zone that matches the new zone's ID
      const existingZone = [...zones].find(zone => zone.getAttribute('xml:id') === newZone.getAttribute('xml:id'));

      if (existingZone) {
        // Update the coordinates of the existing zone with the new values
        existingZone.setAttribute('ulx', newZone.getAttribute('ulx'));
        existingZone.setAttribute('uly', newZone.getAttribute('uly'));
        existingZone.setAttribute('lrx', newZone.getAttribute('lrx'));
        existingZone.setAttribute('lry', newZone.getAttribute('lry'));
      }

      // Update the state with the modified XML document
      state.xmlDoc = xmlDoc;
    },

    /**
     * Sets the current mode of the application if the provided mode is allowed.
     * @function SET_MODE
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Object} state - The Vuex state object.
     * @param {string} mode - The mode to set, which should be one of the allowed modes.
     */

    SET_MODE(state, mode) {
      // Check if the provided mode is in the list of allowed modes
      if (mode in allowedModes) {
        // Set the application mode to the provided value
        state.mode = mode;
      }
    },

    /**
     * Toggles the existing music mode state between true and false.
     * @function TOGGLE_EXISTING_MUSIC_MODE
     *  @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Object} state - The Vuex state object.
     */
    TOGGLE_EXISTING_MUSIC_MODE(state) {
      // Invert the current value of existingMusicMode
      state.existingMusicMode = !state.existingMusicMode;
    },

    /**
     * Sets the current measure ID in the state based on the provided ID.
     * If the ID is null, it clears the current measure ID.
     * @function SET_CURRENT_MEASURE_ID
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} state - The Vuex state object.
     * @param {string|null} id - The ID of the measure to set as current, or null to clear.
     */
    SET_CURRENT_MEASURE_ID(state, id) {
      if (id === null) {
        // Clear the current measure ID
        state.currentMeasureId = null;
      } else {
        // Find the measure with the specified ID
        let measure = [...state.xmlDoc.querySelectorAll('measure')].find(measure => measure.getAttribute('xml:id') === id);
        if (!measure) {
          // If not found, try to find a measure associated with the given zone ID
          measure = state.xmlDoc.querySelector('measure[facs~="#' + id + '"]');
        }
        if (measure) {
          // Set the current measure ID to the found measure's ID
          state.currentMeasureId = measure.getAttribute('xml:id');
        }
      }
    },

    /**
     * Sets the label of the current measure in the MEI XML document.
     * If the provided label is null, it removes the label attribute from the measure.
     * @function SET_CURRENT_MEASURE_LABEL
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} state - The Vuex state object.
     * @param {string|null} val - The label value to set; if null, the label attribute is removed.
     */
    SET_CURRENT_MEASURE_LABEL(state, val) {
      if (state.currentMeasureId !== null) {
        // Clone the current XML document to avoid direct mutations
        const xmlDoc = state.xmlDoc.cloneNode(true);
        // Find the mdiv element with the current mdiv ID
        const mdiv = [...xmlDoc.querySelectorAll('mdiv')]
          .find(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId);
        // Find the measure element with the current measure ID within the mdiv
        const measure = [...mdiv.querySelectorAll('measure')]
          .find(measure => measure.getAttribute('xml:id') === state.currentMeasureId);

        if (measure) {
          if (val === null) {
            // Remove the label attribute if val is null
            measure.removeAttribute('label');
          } else {
            // Set the label attribute to the provided value
            measure.setAttribute('label', val);
          }
          // Update the state with the modified XML document
          state.xmlDoc = xmlDoc;
        }
      }
    },

    /**
     * Sets or removes the multi-rest attribute for the current measure in the MEI XML document.
     * @function SET_CURRENT_MEASURE_MULTI_REST
     * @param {Object} state - The Vuex state object.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {string|null} val - The value to set for the multi-rest attribute; if null, the attribute is removed.
     */
    SET_CURRENT_MEASURE_MULTI_REST(state, val) {
      if (state.currentMeasureId !== null) {
        // Clone the current XML document to avoid direct mutations
        const xmlDoc = state.xmlDoc.cloneNode(true);
        // Find the mdiv element with the current mdiv ID
        const mdiv = [...xmlDoc.querySelectorAll('mdiv')]
          .find(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId);
        // Find the measure element with the current measure ID within the mdiv
        const measure = [...mdiv.querySelectorAll('measure')]
          .find(measure => measure.getAttribute('xml:id') === state.currentMeasureId);

        if (measure) {
          // Set or remove the multi-rest attribute using the provided value
          setMultiRest(measure, val);
          // Update the state with the modified XML document
          state.xmlDoc = xmlDoc;
        }
      }
    },

    /**
     * Sets the label of a specific page (surface) in the MEI XML document.
     * @function SET_PAGE_LABEL
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Object} state - The Vuex state object.
     * @param {Object} payload - The payload containing the page index and label value.
     * @param {number} payload.index - The zero-based index of the page to label.
     * @param {string} payload.val - The label value to set for the page.
     */
    SET_PAGE_LABEL(state, { index, val }) {
      // Clone the current XML document to avoid direct mutations
      const xmlDoc = state.xmlDoc.cloneNode(true);
      // Select the surface element corresponding to the specified page index
      const surface = xmlDoc.querySelectorAll('surface')[index];

      if (surface) {
        // Set the label attribute to the provided value
        surface.setAttribute('label', val);
        // Update the state with the modified XML document
        state.xmlDoc = xmlDoc;
      }
    },

    /**
     * Sets the label of the current mdiv (musical division) in the MEI XML document.
     * @function SET_CURRENT_MDIV_LABEL
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Object} state - The Vuex state object.
     * @param {string} val - The label value to set for the current mdiv.
     */
    SET_CURRENT_MDIV_LABEL(state, val) {
      if (state.currentMdivId !== null && state.xmlDoc !== null) {
        // Clone the current XML document to avoid direct mutations
        const xmlDoc = state.xmlDoc.cloneNode(true);
        // Find the mdiv element with the current mdiv ID
        const mdiv = [...xmlDoc.querySelectorAll('mdiv')]
          .find(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId);

        if (mdiv) {
          // Set the label attribute to the provided value
          mdiv.setAttribute('label', val);
          // Update the state with the modified XML document
          state.xmlDoc = xmlDoc;
        }
      }
    },

    /**
     * Sets the dimensions (width and height) of a specific page in the state.
     * Ensures that the update is reactive.
     * @function SET_PAGE_DIMENSIONS
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} state - The Vuex state object.
     * @param {Object} payload - The payload containing the page index and dimensions.
     * @param {number} payload.index - The zero-based index of the page to update.
     * @param {number} payload.width - The width to set for the page.
     * @param {number} payload.height - The height to set for the page.
     */
    SET_PAGE_DIMENSIONS(state, { index, width, height }) {
      // Ensure the update is reactive by using Vue.set or a similar method
      if (state.pages[index]) {
        state.pages[index].width = width;
        state.pages[index].height = height;
      }
    },

    /**
     * Creates a new mdiv (musical division) in the MEI XML document and moves content to it.
     * Updates the current mdiv ID to the newly created mdiv.
     * @function CREATE_NEW_MDIV
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Object} state - The Vuex state object.
     * 
     */
    CREATE_NEW_MDIV(state) {
      // Clone the current XML document to avoid direct mutations
      const xmlDoc = state.xmlDoc.cloneNode(true);
      // Create a new mdiv and update the current mdiv ID
      state.currentMdivId = createNewMdiv(xmlDoc, state.currentMdivId);
      // Move content to the newly created mdiv
      moveContentToMdiv(xmlDoc, state.currentMeasureId, state.currentMdivId, state);
      // Update the state with the modified XML document
      state.xmlDoc = xmlDoc;
    },
    /**
     * Moves the content associated with the current measure to a specified mdiv (musical division).
     * @function SELECT_MDIV
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Object} state - The Vuex state object.
     * @param {string} id - The ID of the target mdiv to which the content should be moved.
     */
    SELECT_MDIV(state, id) {
      if (state.currentMeasureId !== null) {
        // Clone the current XML document to avoid direct mutations
        const xmlDoc = state.xmlDoc.cloneNode(true);
        // Move the content of the current measure to the specified mdiv
        moveContentToMdiv(xmlDoc, state.currentMeasureId, id, state);
        // Update the current mdiv ID in the state
        state.currentMdivId = id;
        // Update the state with the modified XML document
        state.xmlDoc = xmlDoc;
      }
    },

    /**
     * Sets the current mdiv (musical division) ID in the state.
     * @function SET_CURRENT_MDIV
     * @param {Object} state - The Vuex state object.
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {string} id - The ID to set as the current mdiv.
     */
    SET_CURRENT_MDIV(state, id) {
      state.currentMdivId = id;
    },

    /**
     * Registers an image import by adding it to the importingImages array in the state.
     * @function REGISTER_IMAGE_IMPORT
     *  @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Object} state - The Vuex state object.
     * @param {Object} payload - The payload containing the image URL and index.
     * @param {string} payload.url - The URL of the image to import.
     * @param {number} payload.index - The index at which to insert the image in the importingImages array.
     */
    REGISTER_IMAGE_IMPORT(state, { url, index }) {
      // Add the image to the importingImages array with initial loading status
      state.importingImages[index] = { index, url, width: null, height: null, status: 'loading' };
    },

    /**
     * Updates the status and dimensions of an imported image upon successful loading.
     * @function RECEIVE_IMAGE_IMPORT
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Object} state - The Vuex state object.
     * @param {Object} payload - The payload containing the image URL, index, and JSON data with dimensions.
     * @param {string} payload.url - The URL of the imported image.
     * @param {number} payload.index - The index of the image in the importingImages array.
     * @param {Object} payload.json - The JSON data containing the image's width and height.
     */
    RECEIVE_IMAGE_IMPORT(state, { url, index, json }) {
      // Update the importing image's status to success and set its dimensions
      state.importingImages[index].status = 'success';
      state.importingImages[index].width = json.width;
      state.importingImages[index].height = json.height;
    },

    /**
     * Marks an image import as failed in the importingImages array.
     * @function FAILED_IMAGE_IMPORT
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Object} state - The Vuex state object.
     * @param {Object} payload - The payload containing the image URL and index.
     * @param {string} payload.url - The URL of the image that failed to import.
     * @param {number} payload.index - The index of the image in the importingImages array.
     */
    FAILED_IMAGE_IMPORT(state, { url, index }) {
      // Update the importing image's status to failed
      state.importingImages[index].status = 'failed';
    },

    /**
     * Sets the list of Git repositories in the state.
     * @function SET_GIT_DIRECTORIES
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} state - The Vuex state object.
     *  @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Array} repositories - An array of repository objects to set in the state.
     */
    SET_GIT_DIRECTORIES(state, repositories) {
      state.repositories = repositories;
    },

    /**
     * Finalizes the image import process by adding imported pages to the XML document and updating the state.
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @function ACCEPT_IMAGE_IMPORTS
     * @param {Object} state - The Vuex state object.
     */
    ACCEPT_IMAGE_IMPORTS(state) {
      // Clone the current XML document to avoid direct mutations
      const xmlDoc = state.xmlDoc.cloneNode(true);
      // Iterate over each importing image and add it as a new page in the XML document
      state.importingImages.forEach(page => {
        addImportedPage(xmlDoc, page.index, page.url, page.width, page.height);
      });
      // Update the pages array in the state based on the modified XML document
      const pageArray = getPageArray(xmlDoc, state);
      state.pages = pageArray;
      // Clear the importingImages array and close the import modal
      state.importingImages = [];
      state.showPagesImportModal = false;
      // Update the state with the modified XML document
      state.xmlDoc = xmlDoc;
    },

    /**
     * Cancels the image import process by clearing the importingImages array and closing the import modal.
     * @function CANCEL_IMAGE_IMPORTS
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Object} state - The Vuex state object.
     */
    CANCEL_IMAGE_IMPORTS(state) {
      // Clear the importingImages array
      state.importingImages = [];
      // Close the import modal
      state.showPagesImportModal = false;
      console.log('cancel imports');
    },

    /**
     * Sets the login status in the state.
     * @function SET_LOGIN_STATUS
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} state - The Vuex state object.
     * @param {boolean} bool - The login status to set (true for logged in, false for logged out).
     */
    SET_LOGIN_STATUS(state, bool) {
      state.logedin = bool;
    },

    /**
     * Sets the current Github repository in the state.
     * @function SET_REPO
     *  @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} state - The Vuex state object.
     * @param {string} repo - The name of the repository to set.
     */
    SET_REPO(state, repo) {
      state.repo = repo;
    },

    /**
     * Sets the current path in the state.
     * @function SET_PATH
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} state - The Vuex state object.
     * @param {string} path - The path to set in the state.
     */
    SET_PATH(state, path) {
      state.path = path;
    },

    /**
     * Sets the current SHA (commit hash) in the state.
     * @function SET_SHA
    * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} state - The Vuex state object.
     * @param {string} sha - The SHA to set in the state.
     */
    SET_SHA(state, sha) {
      state.sha = sha;
    },

    /**
     * Initializes the Octokit instance for GitHub API interaction and updates the state.
     * @function SET_OCTOKIT
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} state - The Vuex state object.
     * @param {Object} octokit - The Octokit instance to set in the state.
     */
    async SET_OCTOKIT(state, octokit) {
      state.octokit = octokit;
      // Fetch the list of repositories for the authenticated user
      const repos = await octokit.rest.repos.listForAuthenticatedUser();
      // Additional logic can be added here to handle the fetched repositories
    },
    SET_REPOS(state, repos) {
      state.repos = repos
    },
  /**
   * Asynchronously retrieves and sets the authenticated user's login as the owner in the state.
   * @function SET_OWNER
   * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
   * @async
   * @param {Object} state - The Vuex state object.
   * @param {string} owner - The owner to set (not used in this function).
   */
  async SET_OWNER(state, owner) {
    // Initiate the request to get the authenticated user's information
    const resultPromise = state.octokit.rest.users.getAuthenticated();
    console.log("result promise ", resultPromise);
    
    // Await the result of the promise
    const result = await resultPromise;
    
    // Destructure the user data from the result
    const { data: user } = await result;
    
    // Set the owner's login in the state
    state.owner = user.login;
  },

  /**
   * Sets the current branch in the state.
   * @function SET_BRANCH
   * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
   * @param {Object} state - The Vuex state object.
   * @param {string} branch - The name of the branch to set.
   */
  SET_BRANCH(state, branch) {
    // Update the branch in the state
    state.branch = branch;
  },

    
  },
  actions: {
    /**
     * Fetches directories from the GitHub repository.
     * @param {Object} context - Vuex context object.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} context.state - Vuex state.
     * @param {Function} context.commit - Vuex commit method.
     */
    async fetchDirectories({ state, commit }) {
      try {
        const url = `https://api.github.com/repos/${state.username}/${state.repository}/contents/${state.path}`;
        const headers = { Authorization: `token ${state.accessToken}` };
      } catch (error) {
        console.error(error);
      }
    },
  
    /**
     * Exports the selected directory and fetches its files from GitHub.
     * @param {Object} context - Vuex context object.
     * @param {Object} context.state - Vuex state.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @returns {Promise<Array>} A promise that resolves to an array of file objects.
     */
    exportDirectory({ state }) {
      return axios
        .get(`https://api.github.com/repos/:owner/:repo/contents/${state.selectedDirectory}`, {
          headers: {
            Authorization: `token ${state.accessToken}`
          }
        })
        .then(response => {
          const files = response.data.filter(file => file.type === 'file');
          return files;
        })
        .catch(error => {
          console.error(error);
        });
    },
  
    /**
     * Sets the login status to true.
     * @param {Object} state - Vuex state.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     */
    setLOGIN(state) {
      commit('SET_LOGIN_STATUS', true);
    },
  
    /**
     * Toggles the Load XML Modal visibility.
     * @param {Object} context - Vuex context object.
     * 
     * @param {Function} context.commit - Vuex commit method.
     */
    toggleLoadXMLModal({ commit }) {
      commit('TOGGLE_LOADXML_MODAL');
    },
  
    /**
     * Toggles the Load IIIF Modal visibility.
     * @param {Object} context - Vuex context object.
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Function} context.commit - Vuex commit method.
     */
    toggleLoadIIIFModal({ commit }) {
      commit('TOGGLE_LOADIIIF_MODAL');
    },
  
    /**
     * Toggles the Load Git Modal and fetches GitHub repositories.
     * @param {Object} context - Vuex context object.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Function} context.commit - Vuex commit method.
     * @param {Function} context.getters - Vuex getters.
     */
    async toggleLoadGitModal({ commit, getters }) {
      const octokit = getters.octokit;
      const { data: repositories } = await octokit.repos.listForAuthenticatedUser();
      commit('SET_GIT_DIRECTORIES', repositories);
      commit('TOGGLE_LOADGIT_MODAL');
    },
  
    /**
     * Authenticates the user with GitHub OAuth.
     * @param {Object} context - Vuex context object.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Function} context.commit - Vuex commit method.
     * @param {Object} context.state - Vuex state.
     * @param {Object} payload - Payload object containing the authorization code.
     * @param {string} payload.code - Authorization code for GitHub OAuth.
     */
    authenticate({ commit, state }, { code }) {
      const clientId = CLIENT_ID;
      const redirectUri = CALL_BACK;
      const clientSecret = CLIENT_SECRET;
      const scope = 'user';
  
      const query = qs.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        scope,
      });
  
      const url = `https://github.com/login/oauth/authorize?auth?code=${code}&${query}`;
      fetch(url)
        .then(resp => {
          if (resp.ok) {
            resp.json().then(data => {
              const accessToken = data.access_token;
              if (accessToken) {
                state.logedin = true;
                const userId = data.id;
                commit('SET_ACCESS_TOKEN', { auth: accessToken });
                commit('SET_OWNER');
              } else {
                console.error('Authentication failed', data);
              }
            });
          } else {
            console.error('Authentication failed', resp.statusText);
          }
        });
    },
  
    /**
     * Toggles the Measure Modal visibility.
     * @param {Object} context - Vuex context object.
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Function} context.commit - Vuex commit method.
     */
    toggleMeasureModal({ commit }) {
      commit('TOGGLE_MEASURE_MODAL');
    },
  
    /**
     * Toggles the Pages Modal visibility.
     * @param {Object} context - Vuex context object.
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @param {Function} context.commit - Vuex commit method.
     */
    togglePagesModal({ commit }) {
      commit('TOGGLE_PAGES_MODAL');
    },
  
    /**
     * Logs out the user and resets the state.
     * @param {Object} context - Vuex context object.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Object} context.state - Vuex state.
     */
    logout({ state }) {
      state.logedin = false;
      state.accessToken = null;
      state.owner = null;
      state.repos = null;
      state.branches = null;
      state.repo = null;
      state.username = null;
    },
  
    /**
     * Initiates login by redirecting to GitHub OAuth.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     */
    login() {
      const clientId = CLIENT_ID;
      const redirectUri = CALL_BACK;
      const scope = 'user';
  
      const query = qs.stringify({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope,
      });
  
      window.location.href = `https://github.com/login/oauth/authorize?${query}`;
    },
  
    /**
     * Converts a file to Base64 and triggers a callback with the result.
     * @param {File} file - File to convert.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @param {Function} callback - Callback function to handle the Base64 result.
     */
    fileToBase64(file, callback) {
      const reader = new FileReader();
      reader.onload = function () {
        const content = reader.result;
        callback(content);
      };
      reader.readAsBinaryString(file);
    },
    // Add similar comments for other actions as needed
  }
  ,
  getters: {
    /**
     * Returns the access token.
     * @param {Object} state - Vuex state.
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @returns {string|null} The access token.
   */
    accesstoken: state => {
      return state.accessToken
    },
   /**
     * Returns the owner of a repository.
     * @param {Object} state - Vuex state.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @returns {string|null} The owner.
   */
    getowner: state => {
      return state.owner
    },
   /**
     * Returns the octkit value.
     * @param {Object} state - Vuex state.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @returns {object} The octokit.
   */
    octokit: state => {
      return state.octokit
    },
    /**
     * Check if xmlDoc is available .
     * @param {Object} state - Vuex state.
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @returns {boolean} The bolean value.
    */
    isReady: state => {
      return state.xmlDoc !== null
    },
    /**
     * check if state is loading.
     * @param {Object} state - Vuex state.
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @returns {boolean} boolean value.
    */
    isLoading: state => {
      return state.loading
    },
    /**
       * Return total number of zones.
       * @param {Object} state - Vuex state.
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
       * @returns {string|null} number of zones.
    */
    totalZones: state => {
      return state.totalZones
    },
   /**
   * Returns the current branch name.
   * @param {Object} state - Vuex state.
   * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
   * @returns {string|null} The current branch name.
   */
  getBranch: state => state.branch,

  /**
   * Returns the current path.
   * @param {Object} state - Vuex state.
   * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
   * @returns {string|null} The current path.
   */
  getPath: state => state.path,

  /**
   * Returns the current SHA value.
   * @param {Object} state - Vuex state.
   * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
   * @returns {string|null} The current SHA value.
   */
  getSha: state => state.sha,

  /**
   * Checks if the user is logged in.
   * @param {Object} state - Vuex state.
   * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
   * @returns {boolean} `true` if logged in, otherwise `false`.
   */
  getLoginStatus: state => state.logedin,

  /**
   * Returns the username.
   * @param {Object} state - Vuex state.
   * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
   * @returns {string|null} The username.
   */
  getUsername: state => state.username,

  /**
   * Returns the repository name.
   * @param {Object} state - Vuex state.
   * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
   * @returns {string|null} The repository name.
   */
  getRepo: state => state.repo,
    /**
     * Returns an array of page objects with their tile source and width.
     * @param {Object} state - Vuex state.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @returns {Array} Array of page objects, each containing `tileSource` (URI of the page) and `width`.
     */
    pages: state => {
      const arr = [];
      state.pages.forEach(page => {
        const obj = {
          tileSource: page.uri,
          width: page.width
        };
        arr.push(obj);
        console.log("array is ", arr);
      });
      return arr;
    },

    /**
     * Returns detailed information about each page.
     * @param {Object} state - Vuex state.
     * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
     * @returns {Array} Array of detailed page objects, each containing `tileSource`, dimensions (`dim`), page number (`n`), and label.
     */
    pagesDetailed: state => {
      const arr = [];
      state.pages.forEach(page => {
        const obj = {
          tileSource: page.uri,
          dim: `${page.width}x${page.height}`,
          n: page.n,
          label: page.label
        };
        arr.push(obj);
      });
      return arr;
    },
    /**
       * Returns the object representing the current page.
       * @param {Object} state - Vuex state.
       * @author Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
       * @returns {Object|null} The current page object, or `null` if no page is selected.
    */
    currentPageObject: state => {
      return state.pages[state.currentPage];
    },
  /**
   * Returns an array of zones on the current page.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {Array} Array of zone annotations on the current page. Returns an empty array if no XML document is loaded or the page is invalid.
   */
    zonesOnCurrentPage: state => {
      if (state.xmlDoc === null || state.currentPage === -1) {
        return []
      }
      const index = state.currentPage + 1
      const surface = state.xmlDoc.querySelector('surface:nth-child(' + index + ')')

      if (surface === null) {
        return []
      }

      const zones = surface.querySelectorAll('zone')
      const pageUri = state.pages[state.currentPage].uri

      const annots = []
      zones.forEach(zone => {
        if (zone.getAttribute('xml:id') !== state.selectedZoneId) {
          annots.push(meiZone2annotorious(state.xmlDoc, zone, pageUri))
        }
      })
      return annots
    },
    /**
       * Returns an array of all measures from the XML document.
       * @param {Object} state - Vuex state.
       * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
       * @returns {Array} Array of measure elements from the XML document. Returns an empty array if no XML document is loaded.
       */
    measures: state => {
      if (state.xmlDoc === null) {
        return [];
      }
      const measures = [...state.xmlDoc.querySelectorAll('measure')];
      return measures;
    },

    /**
     * Returns an array of all `mdiv` elements with their details.
     * @param {Object} state - Vuex state.
     * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
     * @returns {Array} Array of objects representing `mdiv` elements. Each object contains:
     * - `id`: The XML ID of the `mdiv`.
     * - `label`: The label attribute of the `mdiv`.
     * - `index`: The index of the `mdiv` in the document.
     * Returns an empty array if no XML document is loaded.
     */
    mdivs: state => {
      if (state.xmlDoc === null) {
        return [];
      }
      const arr = [];
      state.xmlDoc.querySelectorAll('mdiv').forEach((mdiv, index) => {
        arr.push({
          id: mdiv.getAttribute('xml:id'),
          label: mdiv.getAttribute('label'),
          index
        });
      });
      return arr;
    },
    
 /**
   * Returns an array of measures within a specific mdiv by its ID.
   * @param {Object} state - Vuex state.
   * @param {string} id - The ID of the mdiv to filter measures by.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {Array} Array of measure objects within the specified mdiv. Each measure object contains:
   * - `id`: The XML ID of the measure.
   * - `n`: The measure number.
   * - `label`: The measure label.
   * - `multiRest`: The number of measures in the multi-rest (if applicable).
   * - `zones`: An array of zone IDs associated with the measure.
   * - `index`: The measure's index within the mdiv.
   */
 measuresByMdivId: state => id => {
  if (state.xmlDoc === null) {
    return [];
  }
  const arr = [];
  const mdiv = [...state.xmlDoc.querySelectorAll('mdiv')].find(mdiv => mdiv.getAttribute('xml:id') === id);
  if (!mdiv) {
    return arr;
  }
  mdiv.querySelectorAll('measure').forEach((measure, index) => {
    let zones = [];
    if (measure.hasAttribute('facs')) {
      zones = measure.getAttribute('facs').replace(/\s+/g, ' ').trim().split(' ');
    }
    const mrElem = measure.querySelector('multiRest');
    const multiRest = mrElem ? parseInt(mrElem.getAttribute('num'), 10) : null;
    arr.push({
      id: measure.getAttribute('xml:id'),
      n: measure.getAttribute('n'),
      label: measure.getAttribute('label'),
      multiRest,
      zones,
      index
    });
  });
  return arr;
},

/**
 * Returns details of the currently selected mdiv.
 * @param {Object} state - Vuex state.
 * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
 * @returns {Object|null} The current mdiv object, containing:
 * - `id`: The XML ID of the mdiv.
 * - `label`: The label of the mdiv.
 * - `index`: The index of the mdiv in the document.
 * Returns `null` if no mdiv is selected or no XML document is loaded.
 */
currentMdiv: state => {
  if (!state.currentMdivId || !state.xmlDoc) {
    return null;
  }

  const mdivs = [...state.xmlDoc.querySelectorAll('mdiv')];
  const index = mdivs.findIndex(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId);
  if (index === -1) {
    return null;
  }

  const mdiv = mdivs[index];
  return {
    id: mdiv.getAttribute('xml:id'),
    label: mdiv.getAttribute('label'),
    index
  };
},

/**
 * Returns details of the currently selected measure.
 * @param {Object} state - Vuex state.
 * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
 * @returns {Object|null} The current measure object, containing:
 * - `id`: The XML ID of the measure.
 * - `n`: The measure number.
 * - `label`: The measure label.
 * - `multiRest`: The number of measures in the multi-rest (if applicable).
 * - `mdiv`: The XML ID of the mdiv containing the measure.
 * Returns `null` if no measure is selected or no XML document is loaded.
 */
currentMeasure: state => {
  if (!state.currentMeasureId || !state.xmlDoc) {
    return null;
  }

  const measures = [...state.xmlDoc.querySelectorAll('measure')];
  const measure = measures.find(measure => measure.getAttribute('xml:id') === state.currentMeasureId);
  if (!measure) {
    return null;
  }

  const mdiv = measure.closest('mdiv')?.getAttribute('xml:id');
  const multiRestElem = measure.querySelector('multiRest');
  const multiRest = multiRestElem ? parseInt(multiRestElem.getAttribute('num'), 10) : null;

  return {
    id: measure.getAttribute('xml:id'),
    n: measure.getAttribute('n'),
    label: measure.getAttribute('label') || null,
    multiRest,
    mdiv
  };
},

/**
 * Returns the current application mode.
 * @param {Object} state - Vuex state.
 * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
 * @returns {string} The current mode.
 */
mode: state => state.mode,

/**
 * Returns details of the currently selected zone.
 * @param {Object} state - Vuex state.
 * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
 * @returns {Object|null} The selected zone object, or `null` if no zone is selected or no XML document is loaded.
 */
selectedZone: state => {
  if (!state.selectedZoneId || !state.xmlDoc) {
    return null;
  }

  const index = state.currentPage + 1;
  const surface = state.xmlDoc.querySelector(`surface:nth-child(${index})`);
  if (!surface) {
    return null;
  }

  const zones = surface.querySelectorAll('zone');
  const zone = [...zones].find(zone => zone.getAttribute('xml:id') === state.selectedZoneId);
  const pageUri = state.pages[state.currentPage].uri;

  return zone ? meiZone2annotorious(state.xmlDoc, zone, pageUri) : null;
},
  /**
   * Returns the visibility status of the Load IIIF Modal.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {boolean} `true` if the modal is visible, otherwise `false`.
   */
  showLoadIIIFModal: state => state.showLoadIIIFModal,

  /**
   * Returns the visibility status of the Load Git Modal.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {boolean} `true` if the modal is visible, otherwise `false`.
   */
  showLoadGitModal: state => state.showLoadGitModal,

  /**
   * Returns the visibility status of the Load XML Modal.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {boolean} `true` if the modal is visible, otherwise `false`.
   */
  showLoadXMLModal: state => state.showLoadXMLModal,

  /**
   * Returns the visibility status of the Measure Modal.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {boolean} `true` if the modal is visible, otherwise `false`.
   */
  showMeasureModal: state => state.showMeasureModal,

  /**
   * Returns the visibility status of the Pages Modal.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {boolean} `true` if the modal is visible, otherwise `false`.
   */
  showPagesModal: state => state.showPagesModal,

  /**
   * Returns the visibility status of the Page Import Modal.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {boolean} `true` if the modal is visible, otherwise `false`.
   */
  showPageImportModal: state => state.showPageImportModal,

  /**
   * Returns the visibility status of the Mdiv Modal.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {boolean} `true` if the modal is visible, otherwise `false`.
   */
  showMdivModal: state => state.showMdivModal,

  /**
   * Returns the visibility status of the Measure List.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {boolean} `true` if the list is visible, otherwise `false`.
   */
  showMeasureList: state => state.showMeasureList,

  /**
   * Returns the array of images currently being imported.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {Array} Array of image objects being imported.
   */
  importingImages: state => state.importingImages,
    /**
   * Checks if the system is ready for image import.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {boolean} `true` if all images being imported have a status of `success`, otherwise `false`.
   */
  readyForImageImport: state => {
    let bool = true;
    if (state.importingImages.length === 0) {
      return false;
    }
    state.importingImages.every(img => {
      if (img.status !== 'success') {
        bool = false;
        return false;
      }
      return true;
    });
    return bool;
  },

  /**
   * Returns the status of the existing music mode.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {boolean} `true` if the existing music mode is active, otherwise `false`.
   */
  existingMusicMode: state => state.existingMusicMode,

  /**
   * Returns the ID of the first measure that does not have an associated zone.
   * @param {Object} state - Vuex state.
   * @author Johannes Kepper &lt;kepper@uni-paderborn.de>  
   * @returns {string|null} The XML ID of the first measure without a zone, or `null` if no such measure exists.
   */
  firstMeasureWithoutZone: state => {
    if (state.xmlDoc === null) {
      return null;
    }
    const measure = state.xmlDoc.querySelector('music measure:not([facs])');
    return measure ? measure.getAttribute('xml:id') : null;
  },

  /**
   * Returns the list of Git repositories.
   * @param {Object} state - Vuex state.
   * @author  Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
   * @returns {Array} Array of repository objects.
   */
  getGitRepositotries: state => state.repositories,

  /**
   * Returns the currently selected Git repository.
   * @param {Object} state - Vuex state.
   * @author  Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
   * @returns {string|null} The name of the selected Git repository, or `null` if none is selected.
   */
  getGitRepositotry: state => state.selectedDirectory,

  /**
   * Returns the list of Git branches.
   * @param {Object} state - Vuex state.
   * @author  Hizkiel Mitiku Alemayehu &lt;hizkiel.alemayehu@uni-paderborn.de>
   * @returns {Array} Array of branch names.
   */
  getGitBranches: state => state.branches,
  }
})

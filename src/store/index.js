import { createStore } from 'vuex'
import { iiifManifest2mei, checkIiifManifest, getPageArray } from '@/tools/iiif.js'
import { meiZone2annotorious, annotorious2meiZone, measureDetector2meiZone, generateMeasure, insertMeasure, addZoneToLastMeasure, deleteZone, setMultiRest, createNewMdiv, moveContentToMdiv, toggleAdditionalZone, addImportedPage } from '@/tools/meiMappings.js'

import { mode as allowedModes } from '@/store/constants.js'
import qs from 'qs';
import { Octokit } from '@octokit/rest'
//import axios from 'axios';
//import qs from 'query-string';
import CLIENT_ID from './client_id';
import CALL_BACK from './call_back';
import CLIENT_SECRET from './client_secret';



import { Base64 } from 'js-base64';
const parser = new DOMParser()
const serializer = new XMLSerializer()
export default createStore({
  modules: {
  },
  state: {
    repo: null,
    path: null,
    sha: null,
    owner: null,
    accessToken: null,
    selectedRepo: null,
    selectedDirectory: null,
    branches: null,
    repositories: null,
    directories: [],
    octokit: null,
    repos: null,
    xmlDoc: null,
    pages: [],
    currentPage: -1,
    showLoadXMLModal: false,
    showLoadIIIFModal: false,
    showLoadGitModal: false,
    showMeasureModal: false,
    showMdivModal: false,
    showPagesModal: false,
    showPageImportModal: false,
    showMeasureList: false,
    loading: false,
    logedin: false,
    processing: false,
    mode: allowedModes.selection,
    existingMusicMode: false,
    selectedZoneId: null,
    hoveredZoneId: null,
    currentMdivId: null,
    totalZones: 0,
    resultingArray: [],
    deleteZoneId: null,
    anno: null,
    importingImages: [],
    currentMeasureId: null,
    username: null,// used for the MeasureModal

    // TODO isScore: true
  },
  mutations: {
    TOGGLE_LOADXML_MODAL(state) {
      state.showLoadXMLModal = !state.showLoadXMLModal
    },
    async SET_ACCESS_TOKEN(state, { auth }) {
      state.accessToken = auth
      state.octokit = new Octokit({ auth: state.accessToken })
    },
    TOGGLE_LOADIIIF_MODAL(state) {
      state.showLoadIIIFModal = !state.showLoadIIIFModal
    },
    TOGGLE_LOADGIT_MODAL(state) {
      state.showLoadGitModal = !state.showLoadGitModal
    },
    TOGGLE_MEASURE_MODAL(state) {
      state.showMeasureModal = !state.showMeasureModal
    },
    TOGGLE_PAGES_MODAL(state) {
      state.showPagesModal = !state.showPagesModal
    },
    TOGGLE_PAGE_IMPORT_MODAL(state) {
      state.showPageImportModal = !state.showPageImportModal
    },
    TOGGLE_MDIV_MODAL(state) {
      state.showMdivModal = !state.showMdivModal
    },
    HIDE_MODALS(state) {
      state.showMeasureModal = false
      state.showMdivModal = false
    },
    TOGGLE_MEASURE_LIST(state) {
      state.showMeasureList = !state.showMeasureList
    },
    SET_ANNO(state, anno) {
      state.anno = anno
    },
    SET_SELECTED_DIRECTORY(state, gitdirec) {
      state.selectedDirectory = gitdirec
    },
    SET_XML_DOC(state, xmlDoc) {
      console.log("this is the xml doc in set ", xmlDoc)
      state.xmlDoc = xmlDoc
      state.currentPage = 0
    },
    SET_PAGES(state, pageArray) {
      state.pages = pageArray
      console.log("this is the length of pages ", state.pages)
    },
    SET_USERNAME(state, username) {
      state.username = username
    },
    SET_CURRENT_PAGE(state, i) {
      console.log("page is changed ", state.pages.length)
      if (i > -1 && i < state.pages.length) {
        state.currentPage = i
      }
    },
    SET_TOTAL_ZONES_COUNT(state, j) {
      state.totalZones = state.totalZones + j
      // console.log('this is j ' + state.totalZones)
    },
    SET_LOADING(state, bool) {
      state.loading = bool
    },
    SET_PROCESSING(state, bool) {
      state.processing = bool
    },
    SELECT_ZONE(state, id) {
      state.selectedZoneId = id
    },
    HOVER_ZONE(state, id) {
      state.hoveredZoneId = id
    },
    setAccessToken(state, accessToken) {
      state.accessToken = accessToken
    },
    setDirectories(state, directories) {
      state.directories = directories
    },
    CREATE_ZONE_FROM_ANNOTORIOUS(state, annot) {

      if (state.mode !== allowedModes.selection) {

        const xmlDoc = state.xmlDoc.cloneNode(true)
        // console.log('create ', annot)
        const index = state.currentPage + 1
        const surface = xmlDoc.querySelector('surface:nth-child(' + index + ')')

        const zone = annotorious2meiZone(annot)
        surface.appendChild(zone)

        if (state.existingMusicMode) {
          // standard mode -> add zone to first measure without zone
          if (state.mode === allowedModes.manualRect) {
            const lastMeasureWithoutZone = xmlDoc.querySelector('music measure:not([facs])')
            if (lastMeasureWithoutZone !== null) {
              state.currentMdivId = lastMeasureWithoutZone.closest('mdiv').getAttribute('xml:id')
              lastMeasureWithoutZone.setAttribute('facs', '#' + zone.getAttribute('xml:id'))
            }

            // add extra zone to last measure that already has one
          } else if (state.mode === allowedModes.additionalZone) {
            const lastMeasureWithZone = [...xmlDoc.querySelectorAll('music measure[facs]')].at(-1)
            if (lastMeasureWithZone !== null) {
              state.currentMdivId = lastMeasureWithZone.closest('mdiv').getAttribute('xml:id')
              lastMeasureWithZone.setAttribute('facs', lastMeasureWithZone.getAttribute('facs') + ' #' + zone.getAttribute('xml:id'))
            }
          }
        } else {
          // standard mode -> create new measure for zone
          if (state.mode === allowedModes.manualRect) {
            const measure = generateMeasure()
            measure.setAttribute('facs', '#' + zone.getAttribute('xml:id'))
            console.log("zone is ", zone)
            insertMeasure(xmlDoc, measure, state, zone, state.currentPage)


            // add zone to last existing measure in file
          } else if (state.mode === allowedModes.additionalZone && state.selectedZoneId === null) {
            addZoneToLastMeasure(xmlDoc, zone.getAttribute('xml:id'))
          }
        }

        state.xmlDoc = xmlDoc
        // console.log(state.xmlDoc)
      }
    },
    CREATE_ZONES_FROM_MEASURE_DETECTOR_ON_PAGE(state, { rects, pageIndex }) {
      const xmlDoc = state.xmlDoc.cloneNode(true)
      const index = pageIndex + 1 // pageIndex is expected to be zero-based
      const surface = xmlDoc.querySelector('surface:nth-child(' + index + ')')

      rects.forEach(rect => {
        const zone = measureDetector2meiZone(rect)
        surface.appendChild(zone)
        if (!state.existingMusicMode) {
          const measure = generateMeasure()
          measure.setAttribute('facs', '#' + zone.getAttribute('xml:id'))
          insertMeasure(xmlDoc, measure, state, zone, pageIndex)
        } else {
          const lastMeasureWithoutZone = xmlDoc.querySelector('music measure:not([facs])')
          if (lastMeasureWithoutZone !== null) {
            state.currentMdivId = lastMeasureWithoutZone.closest('mdiv').getAttribute('xml:id')
            lastMeasureWithoutZone.setAttribute('facs', '#' + zone.getAttribute('xml:id'))
          }
        }
      })

      state.xmlDoc = xmlDoc
    },
    UPDATE_ZONE_FROM_ANNOTORIOUS(state, annot) {
      const xmlDoc = state.xmlDoc.cloneNode(true)
      const newZone = annotorious2meiZone(annot)
      console.log("annotation is ", annot)

      const pageIndex = state.currentPage + 1
      const surface = xmlDoc.querySelector('surface:nth-child(' + pageIndex + ')')
      const zones = surface.querySelectorAll('zone')
      const existingZone = [...zones].find(zone => zone.getAttribute('xml:id') === newZone.getAttribute('xml:id'))

      existingZone.setAttribute('ulx', newZone.getAttribute('ulx'))
      existingZone.setAttribute('uly', newZone.getAttribute('uly'))
      existingZone.setAttribute('lrx', newZone.getAttribute('lrx'))
      existingZone.setAttribute('lry', newZone.getAttribute('lry'))

      state.xmlDoc = xmlDoc
    },
    SET_MODE(state, mode) {
      if (mode in allowedModes) {
        state.mode = mode
      }
    },
    TOGGLE_EXISTING_MUSIC_MODE(state) {
      state.existingMusicMode = !state.existingMusicMode
    },
    SET_CURRENT_MEASURE_ID(state, id) {
      if (id === null) {
        state.currentMeasureId = null
      } else {
        let measure = [...state.xmlDoc.querySelectorAll('measure')].find(measure => measure.getAttribute('xml:id') === id)
        if (measure === undefined) {
          measure = state.xmlDoc.querySelector('measure[facs~="#' + id + '"]')
        }
        state.currentMeasureId = measure.getAttribute('xml:id')
      }
    },
    SET_CURRENT_MEASURE_LABEL(state, val) {
      if (state.currentMeasureId !== null) {
        const xmlDoc = state.xmlDoc.cloneNode(true)
        const mdivs = [...xmlDoc.querySelectorAll('mdiv')]
        const mdiv = mdivs.find(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId)
        const measures = [...mdiv.querySelectorAll('measure')]
        const measure = measures.find(measure => measure.getAttribute('xml:id') === state.currentMeasureId)

        if (val === null) {
          measure.removeAttribute('label')
        } else {
          measure.setAttribute('label', val)
        }
        state.xmlDoc = xmlDoc
      }
    },
    SET_CURRENT_MEASURE_MULTI_REST(state, val) {
      if (state.currentMeasureId !== null) {
        const xmlDoc = state.xmlDoc.cloneNode(true)
        const mdivs = [...xmlDoc.querySelectorAll('mdiv')]
        const mdiv = mdivs.find(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId)
        const measures = [...mdiv.querySelectorAll('measure')]
        const measure = measures.find(measure => measure.getAttribute('xml:id') === state.currentMeasureId)

        setMultiRest(measure, val)

        state.xmlDoc = xmlDoc
      }
    },
    SET_PAGE_LABEL(state, { index, val }) {
      const xmlDoc = state.xmlDoc.cloneNode(true)
      const surface = xmlDoc.querySelectorAll('surface')[index]
      surface.setAttribute('label', val)
      state.xmlDoc = xmlDoc
    },
    SET_CURRENT_MDIV_LABEL(state, val) {
      if (state.currentMdivId !== null && state.xmlDoc !== null) {
        const xmlDoc = state.xmlDoc.cloneNode(true)
        const mdivs = [...xmlDoc.querySelectorAll('mdiv')]
        const mdiv = mdivs.find(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId)

        mdiv.setAttribute('label', val)

        state.xmlDoc = xmlDoc
      }
    },
    CREATE_NEW_MDIV(state) {
      const xmlDoc = state.xmlDoc.cloneNode(true)
      state.currentMdivId = createNewMdiv(xmlDoc, state.currentMdivId)
      moveContentToMdiv(xmlDoc, state.currentMeasureId, state.currentMdivId, state)
      state.xmlDoc = xmlDoc
    },
    SELECT_MDIV(state, id) {
      if (state.currentMeasureId !== null) {
        const xmlDoc = state.xmlDoc.cloneNode(true)
        moveContentToMdiv(xmlDoc, state.currentMeasureId, id, state)
        state.currentMdivId = id
        state.xmlDoc = xmlDoc
      }
    },
    SET_CURRENT_MDIV(state, id) {
      state.currentMdivId = id
    },
    REGISTER_IMAGE_IMPORT(state, { url, index }) {
      state.importingImages[index] = { index, url, width: null, height: null, status: 'loading' }
    },
    RECEIVE_IMAGE_IMPORT(state, { url, index, json }) {
      state.importingImages[index].status = 'success'
      state.importingImages[index].width = json.width
      state.importingImages[index].height = json.height
    },
    FAILED_IMAGE_IMPORT(state, { url, index }) {
      state.importingImages[index].status = 'failed'
    },
    SET_GIT_DIRECTORIES(state, repositories) {
      state.repositories = repositories;
    },
    SET_GIT_BRANCHES(state, branches) {
      state.branches = branches;
    },

    ACCEPT_IMAGE_IMPORTS(state) {
      const xmlDoc = state.xmlDoc.cloneNode(true)
      state.importingImages.forEach(page => {
        addImportedPage(xmlDoc, page.index, page.url, page.width, page.height)
      })
      const pageArray = getPageArray(xmlDoc)
      state.pages = pageArray
      state.importingImages = []
      state.showPagesImportModal = false
      state.xmlDoc = xmlDoc
    },
    CANCEL_IMAGE_IMPORTS(state) {
      state.importingImages = []
      state.showPagesImportModal = false
      console.log('cancel imports')
    },
    SET_LOGIN_STATUS(state, bool) {
      state.logedin = bool
    },
    SET_REPO(state, repo) {
      state.repo = repo
    },
    SET_PATH(state, path) {
      state.path = path
    },
    SET_SHA(state, sha) {
      state.sha = sha
    },
    async SET_OCTOKIT(state, octokit) {
      state.octokit = octokit
      const repos = await octokit.rest.repos.listForAuthenticatedUser();


    },
    SET_REPOS(state, repos) {
      state.repos = repos
    },
    async SET_OWNER(state, owner) {
      var resultPromise = state.octokit.rest.users.getAuthenticated()
      console.log("result promise ", resultPromise)
      const result = await resultPromise;
      const { data: user } = await result
      state.owner = user.login
    },
    SET_BRANCH(state, branch) {
      console.log("this is branch " + branch)
      state.branch = branch
    },
  },
  actions: {
    async fetchDirectories({ state, commit }) {
      try {
        const url = `https://api.github.com/repos/${state.username}/${state.repository}/contents/${state.path}`;
        const headers = { Authorization: `token ${state.accessToken}` };
        //const response = await axios.get(url, { headers });
        // const directories = response.data.filter(item => item.type === 'dir').map(item => item.name);
        // commit('setDirectories', directories);
      } catch (error) {
        console.error(error);
      }
    },
    exportDirectory({ state }) {
      return axios.get(`https://api.github.com/repos/:owner/:repo/contents/${state.selectedDirectory}`, {
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
    setLOGIN(state) {
      commit('SET_LOGIN_STATUS', true)
    },
    toggleLoadXMLModal({ commit }) {
      commit('TOGGLE_LOADXML_MODAL')
    },
    toggleLoadIIIFModal({ commit }) {
      commit('TOGGLE_LOADIIIF_MODAL')
    },
    async toggleLoadGitModal({ commit, getters, }) {
      const octokit = getters.octokit
      const { data: repositories } = await octokit.repos.listForAuthenticatedUser()
      //state.username = state.octokit.users.getAuthenticated();
      commit('SET_GIT_DIRECTORIES', repositories)
      // commit('SET_GIT_BRANCHES', branches)
      commit('TOGGLE_LOADGIT_MODAL')
    },
    authenticate({ commit, state }, { code }) {

      console.log("this is the authenticate function ")
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
      console.log("this is authentication ")
      const url = `https://github.com/login/oauth/authorize?auth?code=${code}&${query}`
      fetch(url).then(resp => {
        console.log(resp.ok)
        if (resp.ok) {
          resp.json().then(data => {
            const accessToken = data.access_token
            if (accessToken) {
              state.logedin = true

              const userId = data.id;
              commit('SET_ACCESS_TOKEN', { auth: accessToken })
              commit('SET_OWNER')
              console.log("Loged in")

            } else {
              console.error('authentication failed 1', data)
            }
          })
        } else {
          console.error('authentication failed 2', resp.statusText)
        }
      })

    },

    toggleMeasureModal({ commit }) {
      commit('TOGGLE_MEASURE_MODAL')
    },
    togglePagesModal({ commit }) {
      commit('TOGGLE_PAGES_MODAL')
    },
    togglePageImportModal({ commit }) {
      commit('TOGGLE_PAGE_IMPORT_MODAL')
    },
    toggleMdivModal({ commit }) {
      commit('TOGGLE_MDIV_MODAL')
    },
    toggleMeasureList({ commit }) {
      commit('TOGGLE_MEASURE_LIST')
    },
    setCurrentPage({ commit }, i) {
      console.log('setting current page to ' + i)
      commit('SET_CURRENT_PAGE', i)
    },
    setCurrentPageZone({ commit }, j) {
      commit('SET_TOTAL_ZONES_COUNT', j)
    },
    logout({ commit, dispatch, state }) {
      state.logedin = false
      state.accessToken = null
      state.owner = null
      state.repos = null
      state.branches = null
      state.repo = null
      state.username = null
    },
    login({ commit, dispatch, state }) {


      //   // NGINX has to be configured as a reverse proxy to
      //   // https://github.com/login/oauth/access_token?code=${code}&client_id=${CLIENT_ID}& // client_secret=${CLIENT_SECRET}
      //   const url = `auth?code=${code}`
      //   fetch(url).then(resp => {
      //   if (resp.ok) { resp.json().then(data => {
      //   const accessToken = data.access_token // console.log(data, accessToken)
      //   if (accessToken) {
      //   commit('SET_ACCESS_TOKEN', { auth: accessToken, store, remove }) } else {
      //   console.error('authentication failed', data) }
      //   })
      //   } else {
      //   console.error('authentication failed', resp.statusText) }
      //   }) },
      // acceptImageImports ({ commit }) {
      //   commit('ACCEPT_IMAGE_IMPORTS')
      // },
      // cancelImageImports ({ commit }) {
      //   commit('CANCEL_IMAGE_IMPORTS')
      // }

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

      window.location.href = `https://github.com/login/oauth/authorize?${query}`;

    },

    // Call the callback function

    fileToBase64(file, callback) {
      const reader = new FileReader();
      reader.onload = function () {
        const content = reader.result;
        // use the file content here
      }
      reader.readAsBinaryString(file); // pass the file as a parameter to readAsBinaryString
    },

    async commitGithub({ commit, dispatch, state, getters }) {

      /**
           * encode string to utf-8 base64
           * @param {string} str text to encode
           * @returns base64 encoded utf-8 coded string
           */
      const str2base64 = str => {
        const enc = new TextEncoder('utf-8')
        return Base64.fromUint8Array(enc.encode(str))
      }
      // const utf8text = TextEncoder
      // const binaryString = String.fromCharCode.apply(null, state.xmlDoc);
      // const binaryB64 = btoa(binaryString);
      // console.log(" this is the octokit ",  state.octokit)

      // const octokit = getters.octokit
      // const commit2 = {
      //   owner:  state.owner, // owner of repository
      //   repo: state.repo, // repository slug
      //   path: state.path, // path of file in directory
      //   sha: state.sha, // sha of previous version
      //   branch: str2base64(state.xml), // branch of repository
      //   message: "Commit from vertaktoid", // commit message
      //    // base64 encoded content
      //   }
      //   octokit.repos.createOrUpdateFileContents(commit2).then(({ data }) => {
      //     // Handle the response from the API call
      //     console.log('File contents updated:', data);
      //   }).catch((err) => {
      //     // Handle any errors that occurred

      //     console.error('Error updating file contents:', err);
      //   });   
      //console.log("permssion is " , permissions)



      const { data } = await state.octokit.pulls.create({
        owner: state.owner,
        repo: state.repo,
        title: 'This is the title ',
        head: state.owner + "main",
        base: "main",
        body: 'we are trying to change things here',
      });


    },
    async setBranches({ commit, dispatch, state, getters }, directory) {
      console.log("this is branch " + directory)
      const indexFirst = directory.indexOf("/")
      const repo = indexFirst > 0 ? directory.substring(0, indexFirst) : directory
      const path = indexFirst > 0 ? directory.substring(indexFirst) : ""
      let owner = ""

      const octokit = getters.octokit
      const repos = await octokit.rest.repos.listForAuthenticatedUser();

      // const [_, owner, repo, branch, ...path] = directory.split("/");
      for (const re of repos.data) {
        if (re.name == repo) {
          owner = re.owner.login
        }
      }

      console.log('repo and path are:', directory)
      const { data: rootContents } = await octokit.repos.getContent({
        owner: owner,
        repo: repo,
        path: path,
      });

      console.log("this si the owner , " + owner)

      console.log("this is the url  ", rootContents.download_url)
      const parts = rootContents.download_url.split("/");
      const branchName = parts[5];
      console.log("this is branch name   ", branchName)

      dispatch('setOwner', owner)
      dispatch('setRepo', repo)
      dispatch('setPath', path)
      dispatch('setSha', rootContents.sha)
      //      dispatch('setOctokit', octokit)
      dispatch('setRepos', repos)

      if (path.includes(".json")) {
        dispatch('importIIIF', rootContents.download_url)

      }
      //   let xmlDoc2 = ""


      //   fetch(rootContents.download_url)
      //   .then(response => response.text())
      //   .then(xmlString => {
      //     const parser = new DOMParser();
      //     const xmlDoc2 = parser.parseFromString(xmlString, "application/xml");

      //     console.log("this is xmlDoc inside fetch: ", xmlDoc2);

      //     // Call a function that needs to use the xmlDoc variable
      //     myFunction(xmlDoc2);
      //   })
      //   .catch(error => console.error(error));

      // function myFunction(xmlDoc2) {
      //   console.log("this is xmlDoc outside fetch:", xmlDoc2);
      //   dispatch('setData', xmlDoc2)


      //   // Do something with the xmlDoc variable
      // }

      // const decodedContent = new TextDecoder().decode(
      //   Uint8Array.from(atob(rootContents.data.content), c => c.charCodeAt(0))
      // );

      // Print the file content


      // const filteredContents = contents.data.filter(content => content.type === 'file' && content.name.match(/\.(mei|xml)$/i))

      // // If no files with .mei or .xml extension found, return null
      // if (filteredContents.length === 0) {
      //   return null
      // }

      // // Get the content of the first file found
      // const fileContent = await octokit.rest.repos.getContent({ owner, repo, path: filteredContents[0].path })

      // // Decode the base64-encoded content
      // const decodedContent = Buffer.from(fileContent.data.content, 'base64').toString('utf-8')

      // console.log(decodedContent)

      // const manifest = rootContents.filter(content => content.type === 'file' && content.path.match(/\.(mei|xml)$/i));
      // const pageArray = getPageArray(manifest)
      // print("this is the pageArray " + manifest)

      // let countImage = images.length
      // const imgload = new Promise(function (resolve, reject) {
      //   const arr = []

      // images.forEach(image => {       
      //   var img = new Image() 
      //   const obj = {}
      //     const url = image.download_url;

      //     img.onload = function (){
      //       obj.width = img.width
      //       obj.height = img.height
      //       obj.uri = image.download_url
      //       arr.push(obj)
      //       --countImage
      //       if(countImage == 0){
      //         console.log("this is the length of arr ", arr[0])
      //         commit('SET_PAGES', arr)
      //         resolve(arr)
      //       }

      //   }
      //   img.onerror = function () {
      //     --countImage
      //     if(countImage == 0){
      //       console.log("this is the length of arr ", arr[0])
      //       commit('SET_PAGES', arr)
      //       resolve(arr)
      //     }
      // }
      //   img.src = url

      // })



      // fetch(url)
      //   .then(response => response.blob())
      //   .then(blob => {
      //     const reader = new FileReader();
      //     reader.onload = () => {
      //       const dataUrl = reader.result;
      //       console.log('Image downloaded successfully', reader);
      //     };
      //     reader.readAsDataURL(blob);
      //   })
      //   .catch(error => {
      //     console.log(`Error downloading image: ${error.message}`);
      //   });


      //});






      // const repos = await octokit.rest.repos.listForAuthenticatedUser();

      // Iterate over each repository to get its subrepositories


      //   rootContents.forEach  ((content) => console.log("this is the content " , content));
      // if(repo.name == directory || subrepo.full_name == directory){
      //   console.log("this is the folder inside " + repo.name)
      // }
      // console.log(`${repo.name} has ${subrepos.data.length} subrepositories:`);
      // console.log(subrepos.data.map((subrepo) => subrepo.full_name));

      //  const directory_name = directory.name    
      //  const  owner = directory.owner.login
      //   console.log("this are repo " , directory)

      //   const baseBranch = "main"; // replace with your desired branch name
      //   const octokit = new Octokit({ auth: this.state.accessToken})

      //   const { data: rootContents } = await octokit.repos.getContent({
      //     owner: owner,
      //     repo: directory_name,
      //     path: ''
      //   });
      //   rootContents.forEach  ((content) => console.log("this is the content " , content));

      // Filter the contents to include only directorie
    },
    setOwner({ commit, dispatch }, owner) {
      commit('SET_OWNER', owner)
    },
    setRepo({ commit, dispatch }, repo) {
      commit('SET_REPO', repo)
    },
    setPath({ commit, dispatch }, path) {
      commit('SET_PATH', path)
    },
    setSha({ commit, dispatch }, sha) {
      commit('SET_SHA', sha)
    },
    setOctokit({ commit, dispatch }, octokit) {
      commit('SET_OCTOKIT', octokit)
    },
    setRepos({ commit, dispatch }, repos) {
      commit('SET_REPOS', repos)
    },
    setBranch({ commit, dispatch }, branch) {
      commit('SET_BRANCH', branch)
    },
    importIIIF({ commit, dispatch }, url) {
      commit('SET_LOADING', true)
      fetch(url)
        .then(res => {
          return res.json()
        })
        .then(json => {
          commit('SET_LOADING', false)
          commit('SET_PROCESSING', true)
          // check if this is a proper IIIF Manifest, then convert to MEI
          const isManifest = checkIiifManifest(json)
          console.log('isManifest: ' + isManifest)
          if (!isManifest) {
            // do some error handling
            return false
          }

          iiifManifest2mei(json, url, parser)
            .then(mei => {
              dispatch('setData', mei)
            })
        })
        .catch(err => {
          commit('SET_LOADING', false)
          console.log(err)
          // add some error message
        })
    },
    importXML({ commit, dispatch }, mei) {
      fetch(mei)
        .then(res => {
          return res.text()
        })
        .then(xml => {
          const mei = parser.parseFromString(xml, 'application/xml')
          dispatch('setData', mei)
        })
    },
    async autoDetectZonesOnCurrentPage({ commit, state }) {
      const pageIndex = state.currentPage
      const imageUri = state.pages[pageIndex].uri.replace(/\/info\.json/, '') + '/full/full/0/default.jpg'
      const blob = await fetch(imageUri).then(r => r.blob())
      console.log("this is blob ", imageUri)
      try {
        const pageIndex = state.currentPage;
        const imageUri = state.pages[pageIndex].uri.replace(/\/info\.json/, '') + '/full/full/0/default.jpg';
        const response = await fetch(imageUri);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const blob = await response.blob();
        // Further processing with the blob
    } catch (error) {
        console.error('Error fetching image blob:', error);
        // Handle the error gracefully
    }
      const successFunc = (json) => {
        commit('SET_LOADING', false)
        console.log('success')
        console.log(json)

        // do some sorting here, if necessary
        // then call measure generation
        console.log('this is from autodetect thing')
        commit('CREATE_ZONES_FROM_MEASURE_DETECTOR_ON_PAGE', { rects: json.measures, pageIndex })
      }

      const errorFunc = (err) => {
        commit('SET_LOADING', false)
        console.log('error retrieving autodetected measure positions for ' + imageUri + ': ' + err)
      }
      const formdata = new FormData()
      formdata.append('Content-Type', 'image/jpg')
      formdata.append('filename', 'image.jpg')
      formdata.append('image', blob, 'image.jpg')

      const requestOptions = {
        method: 'POST',
        body: formdata
      }
      commit('SET_LOADING', true)
      fetch('https://measure-detector.edirom.de/upload', requestOptions)
        .then(response => response.json())
        .then(json => successFunc(json))
        .catch(error => errorFunc(error))
    },
    async autoDetectZonesOnAllPage({ commit, state }) {
      for (let i = 0; i < state.pages.length; i++) {
        const pageIndex = i + 1
        const imageUri = state.pages[pageIndex].uri + '/full/full/0/default.jpg'
        const blob = await fetch(imageUri).then(r => r.blob())

        const successFunc = (json) => {
          commit('SET_LOADING', false)
          console.log('success')
          console.log(json)

          // do some sorting here, if necessary
          // then call measure generation
          console.log('this is from autodetect thing')
          commit('CREATE_ZONES_FROM_MEASURE_DETECTOR_ON_PAGE', { rects: json.measures, pageIndex })
        }

        const errorFunc = (err) => {
          commit('SET_LOADING', false)
          console.log('error retrieving autodetected measure positions for ' + imageUri + ': ' + err)
        }
        const formdata = new FormData()
        formdata.append('Content-Type', 'image/jpg')
        formdata.append('filename', 'image.jpg')
        formdata.append('image', blob, 'image.jpg')

        const requestOptions = {
          method: 'POST',
          body: formdata
        }
        commit('SET_LOADING', true)
        fetch('https://measure-detector.edirom.de/upload', requestOptions)
          .then(response => response.json())
          .then(json => successFunc(json))
          .catch(error => errorFunc(error))
      }
    },
    setData({ commit }, mei) {
      const pageArray = getPageArray(mei)
      commit('SET_PAGES', pageArray)
      console.log("this is SET_PAGES ", mei)

      commit('SET_XML_DOC', mei)
      console.log("this is SET_XML_DOC ", mei)

      commit('SET_CURRENT_PAGE', 0)
      console.log("this is SET_XML_DOC ", mei)

      commit('SET_PROCESSING', false)
      console.log("this is SET_PROCESSING ", mei)

      commit('HIDE_MODALS')
      console.log("this is HIDE_MODALS ", mei)

    },
    selectZone({ commit }, id) {
      commit('SELECT_ZONE', id)
      console.log("this is select zone")
    },
    clickZone({ commit, state }, id) {
      console.log("this is click zone")

      if (state.mode === allowedModes.deletion) {
        state.deleteZoneId = id
        const xmlDoc = state.xmlDoc.cloneNode(true)
        deleteZone(xmlDoc, id, state)
        state.xmlDoc = xmlDoc
      } else if (state.mode === allowedModes.additionalZone) {
        console.log('clicked on existing zone')
        const xmlDoc = state.xmlDoc.cloneNode(true)
        toggleAdditionalZone(xmlDoc, id, state)
        state.xmlDoc = xmlDoc
      }
    },
    clickMeasureLabel({ commit }, id) {
      console.log('clicked measure label')
      commit('SET_CURRENT_MEASURE_ID', id)
      commit('TOGGLE_MEASURE_MODAL')
    },
    closeMeasureNumberModal({ commit }) {
      commit('SET_CURRENT_MEASURE_ID', null)
      commit('TOGGLE_MEASURE_MODAL')
    },
    hoverZone({ commit }, id) {
      commit('HOVER_ZONE', id)
    },
    unhoverZone({ commit, state }, id) {
      // commit('SELECT_ZONE', id)
      if (state.hoveredZoneId === id) {
        commit('HOVER_ZONE', null)
      }
      console.log('unhovering ' + id)
    },
    createZone({ commit }, annot) {
      commit('SET_ANNO', annot)
      commit('CREATE_ZONE_FROM_ANNOTORIOUS', annot)
    },
    deleteZone({ commit }, id) {
      commit('DELETE_ZONE', id)
    },
    updateZone({ commit }, annot) {
      commit('UPDATE_ZONE_FROM_ANNOTORIOUS', annot)
    },
    setMode({ commit }, mode) {
      commit('SET_MODE', mode)
    },
    toggleExistingMusicMode({ commit }) {
      commit('TOGGLE_EXISTING_MUSIC_MODE')
    },
    setCurrentMeasureLabel({ commit }, val) {
      commit('SET_CURRENT_MEASURE_LABEL', val)
    },
    setCurrentMeasureMultiRest({ commit }, val) {
      commit('SET_CURRENT_MEASURE_MULTI_REST', val)
    },
    setPageLabel({ commit }, { index, val }) {
      commit('SET_PAGE_LABEL', { index, val })
    },
    setCurrentMdiv({ commit }, id) {
      commit('SET_CURRENT_MDIV', id)
    },
    setDirectory({ commit }, directory) {
      commit('SET_SELECTED_DIRECTORY', directory)
    },
    setCurrentMdivLabel({ commit }, val) {
      commit('SET_CURRENT_MDIV_LABEL', val)
    },
    createNewMdiv({ commit }) {
      commit('CREATE_NEW_MDIV')
    },
    selectMdiv({ commit }, id) {
      commit('SELECT_MDIV', id)
    },
    registerImageImports({ commit }, urls) {
      const arr = urls.replace(/\s+/g, ' ').trim().split(' ')
      console.log("this is arr in register Image " + arr)
      arr.forEach((url, index) => {
        commit('REGISTER_IMAGE_IMPORT', { url, index })
        fetch(url)
          .then(res => res.json())
          .then(json => {
            console.log('retrieved info.json for ' + url)
            commit('RECEIVE_IMAGE_IMPORT', { url, index, json })
            console.log(json)
          })
          .catch(err => {
            console.log('Unable to fetch ' + url + ': ' + err)
            commit('FAILED_IMAGE_IMPORT', { url, index })
          })
      })
    },
    acceptImageImports({ commit }) {
      commit('ACCEPT_IMAGE_IMPORTS')
    },
    cancelImageImports({ commit }) {
      commit('CANCEL_IMAGE_IMPORTS')
    }
  },
  getters: {
    accesstoken: state => {
      return state.accessToken
    },
    getowner: state => {
      console.log("this is owner " + state.owner)
      return state.owner
    },
    octokit: state => {
      return state.octokit
    },
    isReady: state => {
      return state.xmlDoc !== null
    },
    accessToken: state => state.accessToken,
    directories: state => state.directories,

    isLoading: state => {
      return state.loading
    },
    totalZones: state => {
      return state.totalZones
    },
    getBranch: state => {
      return state.branch
    },
    getPath: state => {
      return state.path

    },
    getSha: state => {
      return state.sha

    },
    getLoginStatus: state => {
      return state.logedin
    },
    getUsername: state => {
      return state.username
    },
    getRepo: state => {
      return state.repo
    },
    meiFileForDownload: state => {
      if (state.xmlDoc === null) {
        return null
      }
      const mei = state.xmlDoc
      return serializer.serializeToString(mei)
    },
    currentPageIndexOneBased: state => {
      return state.currentPage + 1
    },
    currentPageIndexZeroBased: state => {
      return state.currentPage
    },
    maxPageNumber: state => {
      return state.pages.length
    },
    pages: state => {
      const arr = []
  state.pages.forEach(page => {
    const obj = {
      tileSource: page.uri,
      width: page.width * 0.9, // Doubling the width
      height: page.height  * 0.9, // Doubling the height
      x: 0,
      y: 0
    }
    arr.push(obj)
  })
  return arr
    },
    pagesDetailed: state => {
      const arr = []
      state.pages.forEach(page => {
        const obj = {
          tileSource: page.uri,
          dim: page.width + 'x' + page.height,
          n: page.n,
          label: page.label
        }
        arr.push(obj)
      })

      return arr
    },
    currentPageObject: state => {
      return state.pages[state.currentPage]
    },
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
    measures: state => {
      if (state.xmlDoc === null) {
        return []
      }
      const measures = [...state.xmlDoc.querySelectorAll('measure')]

      return measures
    },
    mdivs: state => {
      if (state.xmlDoc === null) {
        return []
      }
      const arr = []
      state.xmlDoc.querySelectorAll('mdiv').forEach((mdiv, index) => {
        arr.push({
          id: mdiv.getAttribute('xml:id'),
          label: mdiv.getAttribute('label'),
          index
        })
      })
      return arr
    },
    measuresByMdivId: state => (id) => {
      if (state.xmlDoc === null) {
        return []
      }
      const arr = []
      const mdiv = [...state.xmlDoc.querySelectorAll('mdiv')].find(mdiv => mdiv.getAttribute('xml:id') === id)
      mdiv.querySelectorAll('measure').forEach((measure, index) => {
        let zones = []
        if (measure.hasAttribute('facs')) {
          zones = measure.getAttribute('facs').replace(/\s+/g, ' ').trim().split(' ')
        }
        const mrElem = measure.querySelector('multiRest')
        const multiRest = (mrElem === null) ? null : parseInt(mrElem.getAttribute('num'))
        arr.push({
          id: measure.getAttribute('xml:id'),
          n: measure.getAttribute('n'),
          label: measure.getAttribute('label'),
          multiRest,
          zones,
          index
        })
      })
      return arr
    },
    currentMdiv: state => {
      if (state.currentMdivId === null || state.xmlDoc === null) {
        return null
      }

      const mdivs = [...state.xmlDoc.querySelectorAll('mdiv')]
      const index = mdivs.findIndex(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId)

      if (index === -1) {
        return null
      }

      const mdiv = mdivs[index]

      return {
        id: mdiv.getAttribute('xml:id'),
        label: mdiv.getAttribute('label'),
        index: index
      }
    },
    currentMeasure: state => {
      if (state.currentMeasureId === null || state.xmlDoc === null) {
        return null
      }

      // const mdivs = [...state.xmlDoc.querySelectorAll('mdiv')]
      // const mdiv = mdivs.find(mdiv => mdiv.getAttribute('xml:id') === state.currentMdivId)
      const measures = [...state.xmlDoc.querySelectorAll('measure')]
      const measure = measures.find(measure => measure.getAttribute('xml:id') === state.currentMeasureId)

      const mdiv = measure.closest('mdiv').getAttribute('xml:id')

      const multiRestElem = measure.querySelector('multiRest')
      console.log("this is multi rest ")
      const multiRest = (multiRestElem !== null) ? multiRestElem.getAttribute('num') : null


      const label = measure.hasAttribute('label') ? measure.getAttribute('label') : null

      const n = measure.getAttribute('n')
      const id = measure.getAttribute('xml:id')

      return {
        id,
        n,
        label,
        multiRest,
        mdiv
      }
    },
    mode: state => {
      return state.mode
    },
    selectedZone: state => {
      if (state.selectedZoneId === null || state.xmlDoc === null) {
        return null
      }
      const index = state.currentPage + 1
      const surface = state.xmlDoc.querySelector('surface:nth-child(' + index + ')')
      const zones = surface.querySelectorAll('zone')

      const zone = [...zones].find(zone => zone.getAttribute('xml:id') === state.selectedZoneId)
      const pageUri = state.pages[state.currentPage].uri
      return meiZone2annotorious(state.xmlDoc, zone, pageUri)
    },
    showLoadIIIFModal: state => state.showLoadIIIFModal,
    showLoadGitModal: state => state.showLoadGitModal,
    showLoadXMLModal: state => state.showLoadXMLModal,
    showMeasureModal: state => state.showMeasureModal,
    showPagesModal: state => state.showPagesModal,
    showPageImportModal: state => state.showPageImportModal,
    showMdivModal: state => state.showMdivModal,
    showMeasureList: state => state.showMeasureList,
    importingImages: state => state.importingImages,
    readyForImageImport: state => {
      let bool = true
      if (state.importingImages.length === 0) {
        return false
      }
      state.importingImages.every(img => {
        if (img.status !== 'success') {
          bool = false
          return false
        }
        return true
      })
      return bool
    },
    existingMusicMode: state => {
      return state.existingMusicMode
    },
    firstMeasureWithoutZone: state => {
      if (state.xmlDoc === null) {
        return null
      }
      const measure = state.xmlDoc.querySelector('music measure:not([facs])')
      if (measure === null) {
        return null
      }
      return measure.getAttribute('xml:id')
    },
    getGitRepositotries: state => {
      return state.repositories
    },
    getGitRepositotry: state => {
      return state.selectedDirectory
    },
    getGitBranches: state => {
      return state.branches
    }
  }
})

import { uuid } from '@/tools/uuid.js'

function addPage (canvas,canvases,  dimension, n, file, meiSurfaceTemplate, hasItems) {
 // var imgsrc = canvas.images[0].resource.service['@id']+"/info.json"
  //var width, height =  getDimention(imgsrc)

  const label = canvas.label
  var width 
  var height  
  if(n <= canvases.length){
    console.log(" number is",  n , "dimenssion ", dimension, "canvas width ", canvas.width , "canvas height ", canvas.height )
    height = dimension[1]
    width =  dimension[0]

  }

  var uri = ""
  if(hasItems == true){
    console.log("has item is true")
    uri = canvas?.items[0]?.items[0]?.body?.service[0].id+"/info.json"
  }else{
    console.log("has item is false")
     uri = canvas?.images[0]?.resource?.service['@id']+"/info.json"
  }


  const surfaceId = 's' + uuid()
  const graphicId = 'g' + uuid()

  // const mdivId = 'm' + uuid()
  // const sectionId = 's' + uuid()

  const surface = meiSurfaceTemplate.querySelector('surface').cloneNode(true)
  surface.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:id', surfaceId)
  surface.setAttribute('n', n)
  surface.setAttribute('label', label)
  surface.setAttribute('lrx', width)
  surface.setAttribute('lry', height)

  const graphic = surface.querySelector('graphic')
  graphic.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:id', graphicId)
  graphic.setAttribute('target', uri)
  graphic.setAttribute('width', width)
  graphic.setAttribute('height', height)

  file.querySelector('facsimile').appendChild(surface)
}

async function getDimension(imgsrc) {
  try {
    const res = await fetch(imgsrc);
    const json = await res.json();
    const { width, height } = json;  // Assuming the dimensions are in the JSON response
    return { width, height };
  } catch (error) {
    console.error('Error fetching image dimensions:', error);
    return null;
  }
}



export async function iiifManifest2mei (json, url, parser, state) {
  const promises = []
  let meiFileTemplate
  let meiSurfaceTemplate
  promises.push(
    fetch('./assets/meiFileTemplate.xml')
      .then(res => res.text())
      .then(xml => { meiFileTemplate = parser.parseFromString(xml, 'application/xml') })
  )
  promises.push(
    fetch('./assets/meiSurfaceTemplate.xml')
      .then(res => res.text())
      .then(xml => { meiSurfaceTemplate = parser.parseFromString(xml, 'application/xml') })
  )

  return Promise.all(promises)
    .then(() => {
      const file = meiFileTemplate.querySelector('mei').cloneNode(true)

      const sourceId = 's' + uuid()
      // set file id
      file.setAttributeNS('http://www.w3.org/XML/1998/namespace', 'xml:id', 'm' + uuid())
      // set file title
      file.querySelector('title').textContent = json.label
      // set reference to Manifest
      file.querySelector('source').setAttribute('target', url)
      file.querySelector('source').setAttribute('xml:id', sourceId)
      // add current date
      file.querySelector('change date').setAttribute('isodate', new Date().toISOString().substring(0, 10))
      file.querySelector('changeDesc ptr').setAttribute('target', '#' + sourceId)

      try {
        const metadata = json.metadata

        const shelfmark = metadata.find(entry => { return entry.label === 'Signatur' }).value
        file.querySelector('physLoc > identifier').textContent = shelfmark

        // const persistentIdentifier = metadata.find(entry => {entry.label = 'Persistente URL'}).value
        // file.querySelector('title').textContent = json.label

        const composer = metadata.find(entry => { return entry.label === 'Autor' }).value
        file.querySelector('composer persName').textContent = composer
      } catch (err) {
        console.log('Apparently, there is no metadata for this IIIF Manifest.')
      }
      // handle pages
      if(json.sequences){
        json.sequences[0].canvases.forEach((canvas, i) => {
          var hasItems = false
          addPage(canvas, json.sequences[0].canvases, state.pageDimension[i], i + 1, file, meiSurfaceTemplate, hasItems)

        })
      }else{
        json.items.forEach((canvas, i) => {
          var hasItems = true
          addPage(canvas, i + 1, file, meiSurfaceTemplate, hasItems)

        })
      }
      return file
    })
}

export function checkIiifManifest (json) {
  const claimsIiif2 = json['@context'] === 'http://iiif.io/api/presentation/2/context.json'
  const claimsIiif3 = json['@context'] === 'http://iiif.io/api/presentation/3/context.json'
  const claimsManifest = json['@type'] === 'sc:Manifest'

  const hasId = typeof json['@id'] === 'string' && json['@id'].length > 0
  const hasSequences = Array.isArray(json.sequences)
  const hasItems = Array.isArray(json.items)
  console.log("has items is " , claimsManifest)

  if(hasItems == true){
    return true
  }else{
    return (claimsIiif2 || claimsIiif3) && claimsManifest && hasId && (hasSequences || hasItems)
  }
}

export function getPageArray (mei) {
  const arr = []
  mei.querySelectorAll('surface').forEach((surface, n) => {
    const graphic = surface.querySelector('graphic')
    const obj = {}
    obj.uri = graphic.getAttributeNS('', 'target').trim()
    obj.id = surface.getAttribute('xml:id').trim()
    obj.n = surface.getAttributeNS('', 'n').trim()
    //obj.label = surface.getAttributeNS('', 'label').trim()
    obj.width = parseInt(graphic.getAttributeNS('', 'width').trim(), 10)
    obj.height = parseInt(graphic.getAttributeNS('', 'height').trim(), 10)
    obj.hasSvg = surface.querySelector('svg') !== null // exists(svg:svg) inside relevant /surface
    obj.hasZones = surface.querySelector('zone') !== null // exists(mei:zone) inside relevant /surface

    arr.push(obj)
  })
  return arr
}

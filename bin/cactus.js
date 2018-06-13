#!/usr/bin/env node

const http = require('http')
const ip = require('ip')
const url = require('url')
const fs = require('fs')
const path = require('path')
const { IncomingForm } = require('formidable')

const IP_ADDR = ip.address()
const PORT = Number(process.argv[2]) || 8989
const UPLOAD_DIR = './'

http.createServer(handle).listen(PORT)
console.log(`\n🌵 Serving on http://${IP_ADDR}:${PORT}`, '\n')

function handle(req, res) {
  ;({
    GET: () => {
      let uploadedCount = Number(url.parse(req.url, true).query['🌵'])
      res.writeHead(200, {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: 0
      })
      res.end(html({ uploadedCount }))
    },
    POST: async () => {
      let redirect = ({ to }) => {
        res.writeHead(302, { Location: to })
        res.end()
      }

      try {
        let successCount = 0
        let uploadedFiles = await getUploadedFiles(req)

        let tasks = uploadedFiles.map(async file => {
          try {
            let path = await saveFile(file, UPLOAD_DIR)
            console.log('🌵 File uploaded:', path)
            successCount++
          } catch (err) {
            console.log('😵 Failed to rename:', err)
          }
        })

        await Promise.all(tasks)
        console.log(/* extra line break */)

        redirect({ to: `/?${encodeURIComponent('🌵')}=${successCount}` })
      } catch (err) {
        console.log('😵 Failed to parse form:', err, '\n')
        redirect({ to: '/' })
      }
    }
  }[req.method]())
}

function html({ uploadedCount /*: number */ }) /*: string */ {
  let resultMessage = uploadedCount > 0 ? `<b>${uploadedCount}</b> files uploaded.` : ''

  return /* syntax: html */ `
<!DOCTYPE html>
<html>
<head>
  <title>𝖼𝖺𝖼𝗍𝗎𝗌</title>
  <meta charset="utf-8">
  <link href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQAQAAAAA3iMLMAAAAAnRSTlMAAHaTzTgAAAALSURBVHgBYyARAAAAMAAByVd7gQAAAABJRU5ErkJggg==" rel="shortcut icon">
  <style>
    body {
      font: 14px / 1.2 "-apple-system", BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
      text-align: center;
    }
    input[type=file] {
      position: absolute;
      top: 0;
      left: 0;
      opacity: 0;
      width: 100vw;
      height: 100vh;
    }
    .🗿 {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .🌵::before {
      content: '🌵';
      font-size: 64px;
      margin-left: -5px;
      color: #0b0;
    }
    .🌵::after {
      content: 'DROP FILES ANYWHERE TO UPLOAD';
      font-size: 12px;
      color: #999;
      display: block;
      margin-top: 10px;
    }
    .🎉:not(:empty) {
      margin: 19px auto 0;
      padding: 10px;
      position: relative;
      border: 3px double #eee;
    }
    .🎉:not(:empty)::before {
      content: '🎉';
      font-size: 20px;
      vertical-align: middle;
      margin-right: 6px;
      color: #c60;
    }
  </style>
</head>
<body>
  <div class="🗿">
    <div class="🌵"></div>
    <div class="🎉">${resultMessage}</div>
  </div>
  <form action="/" enctype="multipart/form-data" method="post">
    <input type="file" name="upload" multiple="multiple" onChange="this.form.submit();" onDragOver="return false;">
  </form>
  <script type="text/javascript">
    function emojiToDataUri(emoji, size) {
      size = size || 32

      // draw emoji on a big canvas
      // then trim transparent pixels
      // scale to make sure the image is fully visible

      let canvasSize = size * 2
      let fontSize = size * 1.5
      let canvas = document.createElement('canvas')
      canvas.width = canvasSize
      canvas.height = canvasSize
      let context = canvas.getContext('2d')
      context.font = fontSize + 'px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(emoji, canvasSize / 2, canvasSize / 2)
      let imageData = context.getImageData(0, 0, canvas.width, canvas.height)

      imageData = trimTransparent(imageData)
      imageData = resizeToFit(imageData, size, size)

      return getContext(imageData).canvas.toDataURL()
    }

    function resizeToFit(imageData, width, height) {
      let scaleFactor = Math.min(width / imageData.width, height / imageData.height)

      let imageCanvas = getContext(imageData).canvas

      let scaleCanvas = document.createElement('canvas')
      scaleCanvas.width = imageData.width * scaleFactor
      scaleCanvas.height = imageData.height * scaleFactor
      let context = scaleCanvas.getContext('2d')
      context.scale(scaleFactor, scaleFactor)
      context.drawImage(imageCanvas, 0, 0)

      let fitCanvas = document.createElement('canvas')
      fitCanvas.width = width
      fitCanvas.height = height
      let fitContext = fitCanvas.getContext('2d')
      let x = (width - scaleCanvas.width) / 2
      let y = (height - scaleCanvas.height) / 2
      fitContext.drawImage(scaleCanvas, x, y)

      return fitContext.getImageData(0, 0, width, height)
    }

    function trimTransparent(imageData) {
      let pixels = imageData.data
      let bound = {
        top: null,
        left: null,
        right: null,
        bottom: null
      }

      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] !== 0) {
          let x = (i / 4) % imageData.width
          let y = ~~(i / 4 / imageData.width)

          if (bound.top === null) {
            bound.top = y
          }

          if (bound.left === null) {
            bound.left = x
          } else if (x < bound.left) {
            bound.left = x
          }

          if (bound.right === null) {
            bound.right = x
          } else if (bound.right < x) {
            bound.right = x
          }

          if (bound.bottom === null) {
            bound.bottom = y
          } else if (bound.bottom < y) {
            bound.bottom = y
          }
        }
      }

      let trimHeight = bound.bottom - bound.top + 1
      let trimWidth = bound.right - bound.left + 1
      let trimmed = getContext(imageData).getImageData(
        bound.left,
        bound.top,
        trimWidth,
        trimHeight
      )

      return trimmed
    }

    function getContext(imageData) {
      let canvas = document.createElement('canvas')
      canvas.width = imageData.width
      canvas.height = imageData.height
      let context = canvas.getContext('2d')
      context.putImageData(imageData, 0, 0)
      return context
    }

    function setFavicon(src) {
      let link = document.querySelector('link[rel*=icon]')

      if (!link) {
        link = document.createElement('link')
        link.rel = 'shortcut icon'
        document.head.appendChild(link)
      }

      link.href = src
    }

    function canUseBase64Favicon() {
      // Internet Explorer, Edge, Safari is not supported
      return /MSIE|rv:11\.0|Edge|(^((?!Chrome|Android).)*Safari)/.test(window.navigator.userAgent) === false
    }

    function setFavemoji(emoji) {
      if (canUseBase64Favicon()) {
        return setFavicon(emojiToDataUri(emoji))
      }

      // Show the emoji in the title instead
      window.__titleWithoutEmoji = window.__titleWithoutEmoji || document.title || ''
      document.title = emoji + ' ' + window.__titleWithoutEmoji
    }

    setFavemoji('🌵')
  </script>
</body>
</html>
`
}

function getUploadedFiles(req) /*: Promise<Array<File>> */ {
  let form = new IncomingForm({ multiples: true })

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err)
      resolve([].concat(files.upload))
    })
  })
}

function saveFile(file, targetDir) /*: Promise<File> */ {
  return new Promise((resolve, reject) => {
    let targetPath = path.join(targetDir, file.name)
    fs.rename(file.path, targetPath, err => {
      if (err) reject(err)
      resolve(targetPath)
    })
  })
}

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
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = size
      canvas.height = size
      context.font = size + 'px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'top'
      context.fillText(emoji, size / 2, 0)
      return canvas.toDataURL()
    }

    function setFavicon(src) {
      let link = document.querySelector('link[rel*=icon]')
      if (link) {
        link.href = src
      } else {
        link = document.createElement('link')
        link.rel = 'shortcut icon'
        link.href = src
        document.head.appendChild(link)
      }
    }

    function canUseBase64Favicon() {
      // Internet Explorer, Edge, Safari is not supported
      return /MSIE|rv:11\.0|Edge|(^((?!Chrome|Android).)*Safari)/.test(window.navigator.userAgent) === false
    }

    function setFavmoji(emoji) {
      if (canUseBase64Favicon()) {
        return setFavicon(emojiToDataUri(emoji))
      }

      // Show the emoji in the title instead
      window.__titleWithoutFavmoji = window.__titleWithoutFavmoji || document.title || ''
      document.title = emoji + ' ' + window.__titleWithoutFavmoji
    }

    setFavmoji('🌵')
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

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

const server = http.createServer((req, res) => {
  const handles = {
    POST: async () => {
      let redirect = ({ to }) => {
        res.writeHead(302, { Location: to })
        res.end()
      }

      try {
        let successCount = 0
        let uploadedFiles = await getUploadedFiles(req)

        let tasks = uploadedFiles.map(file =>
          saveFile(file, UPLOAD_DIR).then(
            path => {
              console.log('🌵 File uploaded:', path, '\n')
              successCount++
            },
            err => console.log('😵 Failed to rename:', err, '\n')
          )
        )

        await Promise.all(tasks)

        redirect({ to: `/?${encodeURIComponent('🌵')}=${successCount}` })
      } catch (err) {
        console.log('😵 Failed to parse form:', err, '\n')
        redirect({ to: '/' })
      }
    },
    GET: () => {
      res.end(html({ uploadedCount: url.parse(req.url, true).query['🌵'] }))
    }
  }

  handles[req.method]()
})

server.listen(PORT)

console.log(`🌵 Serving on http://${IP_ADDR}:${PORT}`, '\n')

function html({ uploadedCount /*: number */ }) /*: string */ {
  let resultMessage = uploadedCount > 0 ? `<b>${uploadedCount}</b> files uploaded.` : ''

  return /* syntax: html */ `
<html>
<head>
  <title>🌵</title>
  <meta charset="utf-8">
  <link rel="icon" href="data:;base64,=">
  <style>
    body {
      font: 14px / 1.2 -apple-system, BlinkMacSystemFont, sans-serif;
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
    }
  </style>
</head>
<body>
  <div class="🗿">
    <div class="🌵"></div>
    <div class="🎉">${resultMessage}</div>
  </div>
  <form action="/" enctype="multipart/form-data" method="post">
    <input type="file" name="upload" multiple="multiple" onChange="this.form.submit();">
  </form>
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

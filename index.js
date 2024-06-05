import ignore from 'ignore'
import tarts from './tarts'


const readFiles = (fileTree, ignoreFiles) => {
  let content = []
  let foundIgnoreFiles = []
  return new Promise((resolve, reject) => {
    for (const ignoreFile of ignoreFiles) {
      if (ignoreFile in fileTree) {
        const reader = new FileReader()
        reader.onload = function (event) {
          content.push(new TextDecoder().decode(new Uint8Array(event.target.result)))
          foundIgnoreFiles.push(ignoreFile)
          if (foundIgnoreFiles.length === ignoreFiles.length) {
            resolve(content.join("\n"))
          }
        }
        reader.onerror = function (event) {
          reject(event.target.error)
        }
        const filePointer = fileTree[ignoreFile]
        if (filePointer instanceof File) {
          reader.readAsArrayBuffer(filePointer)
        } else {
          foundIgnoreFiles.push(ignoreFile)
        }
      }
      else {
        foundIgnoreFiles.push(ignoreFile)
      }
    }
    if (foundIgnoreFiles.length === ignoreFiles.length) {
      resolve(content.join("\n"))
    }
  })
}

const createGitIgnorePathParser = async (fileTree, ignoreFiles) => {
  const content = await readFiles(fileTree, ignoreFiles)
  let filters = content.split('\n')
    .map(line => line.trim())
    .map(line => line.charAt(0) === '/' ? line.substring(1) : line)
    .map(line => line.length > 0 && line.charAt(0) !== '#' ? line : null)
    .filter(line => line !== null)
  return ignore().add(filters)
}

function buildFileTree(files) {
  const root = {};
  for (const file of files) {
    const filePath = file.webkitRelativePath || file.mozRelativePath || file.path;
    const pathParts = filePath.split(/[/\\]/);
    let currentNode = root;
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (!currentNode[part]) {
        currentNode[part] = i === pathParts.length - 1 ? file : {};
      }
      if (i < pathParts.length - 1) {
        currentNode = currentNode[part];
      }
    }
  }
  return root[Object.keys(root)[0]]
}

function excludeGitIgnoredFiles(node, files, gitIgnoreParser, currentPath) {
  if (currentPath !== "" && gitIgnoreParser.ignores(currentPath)) {
    return
  }
  for (const [key, value] of Object.entries(node)) {
    if (value instanceof File) {
      files.push(value)
    } else {
      excludeGitIgnoredFiles(value, files, gitIgnoreParser, currentPath + key + "/")
    }
  }
}

// Helper functions
function generateTarBlob(files, ignoreFiles) {
  return new Promise(async (resolve, reject) => {
    const tarFiles = []
    if (!files.length) reject('No files found')
    const fileTree = buildFileTree(files);
    const gitIgnoreParser = await createGitIgnorePathParser(fileTree, ignoreFiles);


    let filteredFiles = []
    // exclude .git folder
    delete fileTree[".git"]
    excludeGitIgnoredFiles(fileTree, filteredFiles, gitIgnoreParser, "")

    try {
      const totalFilesLength = filteredFiles.length
      for (const file of filteredFiles) {
        const reader = new FileReader()
        reader.onload = function (event) {
          const relativePath = file.webkitRelativePath.replace(/^.*?\//, '')
          const contentUint8Array = new Uint8Array(event.target.result)
          const tarFilesListLength = tarFiles.push({
            name: relativePath,
            content: contentUint8Array
          })
          if (tarFilesListLength === totalFilesLength) {
            // eslint-disable-next-line no-undef
            const tarball = tarts(tarFiles)
            resolve(
              new Blob([tarball], {
                type: 'application/x-tar'
              })
            )
          }
        }
        reader.readAsArrayBuffer(file)
      }
    } catch (error) {
      reject(error)
    }
  })
}

export default generateTarBlob
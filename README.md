## TartPlus

`tartplus` is a JS library to build tar achieve with additional support of ignore files (.gitignore, .npmignore, .dockeringore etc)

It uses [tartJS](https://github.com/tart/tartJS) source code to create tar archives and [ignore](https://github.com/kaelzhang/node-ignore) to create regex parser for ignore files (.gitignore, .npmignore, .dockeringore etc)

## Installation

```bash
npm install @swiftwave/tartplus
```

## Usage

```js
import createTar from "@swiftwave/tartplus";

...
const tarBlob = await createTar(document.getElementById("file-input").files, [".gitignore"])
...

```

## Credits
- [tartJS](https://github.com/tart/tartJS)
- [ignore](https://github.com/kaelzhang/node-ignore)

## License

Apache-2.0
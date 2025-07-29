# molstar-shiny

## Installation

## Usage

The package provides (so far) only one function, `molstarOutput()`.
It is similar to `uiOutput()` (or any other output controller in Shiny) in that it returns some HTML tags and JavaScript code.
This particular output controller renders a Mol* viewer panel in your Shiny app.

## For developers

This repository contains both the R package and the TypeScript code needed to use the Mol* library.

### References

* https://molstar.org/docs/plugin/custom-library/

### Instructions

* Edit `src/index.tsx`, a React file
* Build with `npm run build`
* Use `npm run rpack`, which will copy `build/js/index.js`, `build/css/style.css`, and `build/css/style.css.map` into the inst/www folder of the R package

### Details

This is the build command in `package.json`.
The package will be exported as `molstarShiny`: an object with this name will be available in the console after sourcing the bundled script.
```
"build": "sass src/style.scss ./build/css/style.css && esbuild src/index.tsx --bundle --outfile=./build/js/index.js --global-name=molstarShiny"
```

The project uses typescript and scss, so we need several build steps:
1. convert scss to css (with sass)
1. transpile typescript to javascript
1. bundle everything (will create build/js/index.js)

The last two steps are actually handled by esbuild at the same time.

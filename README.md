# molstar-shiny

## References

* https://molstar.org/docs/plugin/custom-library/

## Instructions

* Edit `src/index.tsx`, a React file
* Build with `npm run build`
* Copy `build/js/index.js`, `build/css/style.css`, and `build/css/style.css.map` into 

## Details

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

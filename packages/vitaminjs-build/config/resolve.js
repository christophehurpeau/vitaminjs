const { dirname, relative, resolve: resolvePath, sep } = require('path');
const resolve = require('resolve');

// .vitaminrc path
function resolveRcPath() {
    return resolvePath(process.cwd(), '.vitaminrc');
}

function resolveConfigPath(path) {
    return resolvePath(dirname(resolveRcPath()), path);
}

function resolveModule(id, basedir) {
    return resolve.sync(id, { basedir, extensions: ['.js', '.jsx'] });
}

// FIXME Consider not exporting this function anymore but use webpack's "context" config
function resolveParentModule(id) {
    // Sample node modules paths for 'vitaminjs-runtime/src/server/components/HTMLLayout',
    // according to node's resolve algorithm:
    //
    // - /real-world-example/node_modules/vitaminjs/node_modules/vitaminjs-build/config
    // - /real-world-example/node_modules/vitaminjs/node_modules/vitaminjs-build/config/node_modules
    // - /real-world-example/node_modules/vitaminjs/node_modules/vitaminjs-build/node_modules
    // - /real-world-example/node_modules/vitaminjs/node_modules
    // - /real-world-example/node_modules
    // - /node_modules

    // Resolving should skip what's inside the `vitaminjs-build` module, so for
    // the base directory used for resolving, we drop every path segment until
    // we reach `vitaminjs-build` (and remove that one too).
    // That way, we can grab the same `vitaminjs-runtime` package version that
    // would be reachable from the app or the intermediary `vitaminjs` facade
    // package.
    const parts = __dirname.split(sep);
    const index = parts.lastIndexOf('vitaminjs-build');
    if (index === -1) {
        throw new Error('Cannot resolve base directory.');
    }
    const basedir = parts.slice(0, index).join(sep);
    return resolveModule(id, basedir);
}

function resolveConfigModule(id) {
    // This is used in a context with the following dependency graph:
    //      app -> vitaminjs
    //      vitaminjs -> vitaminjs-build
    //      vitaminjs -> vitaminjs-runtime -> vitaminjs-build
    // So runtime package resolving will not always be relative to the app
    // (where the .vitaminrc file is located). We try resolve the runtime
    // package by walking up the dependency tree.
    if (id.startsWith('__vitamin_runtime__/')) {
        return resolveParentModule(id.replace('__vitamin_runtime__', 'vitaminjs-runtime'));
    }
    // .vitaminrc relative resolution
    return resolveModule(id, dirname(resolveRcPath()));
}

function isExternalModulePath(path) {
    // There is a theoretical edge case when the application is contained in a
    // parent directory called "node_modules". In that case any internal
    // application module would be erroneously considered as external.
    // We safeguard against this by searching for a "node_modules" segment only
    // on a path relative to application base path.
    return relative(dirname(resolveRcPath()), path)
        .split(sep)
        .includes('node_modules');
}

const INTERNAL_REGEXP = /^\.{0,2}\//;
function isExternalModule(id) {
    // Core node modules are considerered external too, they never match the
    // internal RegExp.
    return !INTERNAL_REGEXP.test(id);
}

// eslint-disable-next-line no-unused-vars
function isRuntimeModule(id, basedir) {
    // FIXME
    return /vitaminjs-runtime/.test(id);
}

function isRuntimeModulePath(path) {
    const relativeModulePath = relative(dirname(resolveRcPath()), path);
    // FIXME Find a more elegant implementation
    return (
        relativeModulePath.includes(`${sep}node_modules${sep}vitaminjs-runtime${sep}`) ||
        relativeModulePath.startsWith(`node_modules${sep}vitaminjs-runtime${sep}`)
    );
}

// FIXME Duplicate of isRuntimeModulePath()
function isBuildModulePath(path) {
    const relativeModulePath = relative(dirname(resolveRcPath()), path);
    return (
        relativeModulePath.includes(`${sep}node_modules${sep}vitaminjs-build${sep}`) ||
        relativeModulePath.startsWith(`node_modules${sep}vitaminjs-build${sep}`)
    );
}

// TODO Remove this for Vitamin 2
function __isVitaminFacadeModule(id) {
    return /vitaminjs(\/|$)/.test(id);
}

// TODO Remove this for Vitamin 2
// FIXME Duplicate of isRuntimeModulePath()
function __isVitaminFacadeModulePath(path) {
    const relativeModulePath = relative(dirname(resolveRcPath()), path);
    return (
        relativeModulePath.includes(`${sep}node_modules${sep}vitaminjs${sep}`) ||
        relativeModulePath.startsWith(`node_modules${sep}vitaminjs${sep}`)
    );
}

// FIXME This is fragile, make sure only webpack loaders contains !
function __hasWebpackLoader(id) {
    // Internal loaders begin or includes !, !!, -! see https://webpack.github.io/docs/loaders.html#loader-order
    return id.includes('!');
}

module.exports = {
    resolveRcPath,
    resolveConfigPath,
    resolveConfigModule,
    resolveParentModule,
    isExternalModulePath,
    isExternalModule,
    isRuntimeModule,
    isRuntimeModulePath,
    isBuildModulePath,
    __isVitaminFacadeModule,
    __isVitaminFacadeModulePath,
    __hasWebpackLoader,
};

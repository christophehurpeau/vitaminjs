'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _resolve = require('vitaminjs-build/config/resolve');

exports.default = JSON.stringify({
    rootDir: (0, _resolve.resolveConfigPath)('.'),
    setupTestFrameworkScriptFile: 'jest-enzyme/lib/index.js',
    modulePaths: ['<rootDir>/node_modules'],
    transform: {
        '^.+\\.(js|jsx)$': (0, _resolve.resolveConfigModule)('vitaminjs-jest/lib/babelrcJestTransformer')
    },
    transformIgnorePatterns: ['/node_modules/(?!vitaminjs).*'],
    moduleNameMapper: {
        [`\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$`]: '<rootDir>/__mocks__/fileMock.js',
        '\\.(css)$': 'identity-obj-proxy'
    }
});
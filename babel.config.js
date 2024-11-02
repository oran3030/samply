// babel.config.js

module.exports = {
    presets: [
      ['@babel/preset-env', {
        targets: {
          node: 'current',
          browsers: [
            'last 2 Chrome versions',
            'last 2 Firefox versions',
            'last 2 Safari versions',
            'last 2 Edge versions'
          ]
        },
        useBuiltIns: 'usage',
        corejs: 3
      }],
      '@babel/preset-react',
      '@babel/preset-typescript'
    ],
    
    plugins: [
      ['@babel/plugin-transform-runtime', {
        regenerator: true
      }],
      
      // עבור Emotion CSS-in-JS
      '@emotion/babel-plugin',
      
      // עבור class properties
      '@babel/plugin-proposal-class-properties',
      
      // עבור optional chaining
      '@babel/plugin-proposal-optional-chaining',
      
      // עבור nullish coalescing
      '@babel/plugin-proposal-nullish-coalescing-operator'
    ],
    
    env: {
      production: {
        plugins: [
          'transform-remove-console',
          'transform-react-remove-prop-types'
        ]
      },
      
      development: {
        plugins: [
          'react-refresh/babel'
        ]
      },
      
      test: {
        plugins: [
          '@babel/plugin-transform-modules-commonjs'
        ]
      }
    }
  };
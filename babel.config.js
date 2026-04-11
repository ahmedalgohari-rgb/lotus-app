module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['react-native-reanimated/plugin', {
        processNestedWorklets: true,
      }], // MUST be listed last
    ],
    env: {
      test: {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          ['@babel/preset-typescript', { allowDeclareFields: true }]
        ]
      }
    }
  };
};
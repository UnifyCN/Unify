const { getDefaultConfig } = require('expo/metro-config');
const {
  wrapWithReanimatedMetroConfig,
} = require('react-native-reanimated/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
  };
  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg'],
    // Add resolver for Sanity client React Native compatibility
    alias: {
      '@sanity/client/csm': false, // Disable the problematic module
    },
    // Add platform-specific extensions
    platforms: ['ios', 'android', 'native', 'web'],
  };

  return wrapWithReanimatedMetroConfig(config);
})();

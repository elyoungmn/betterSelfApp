// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-worklets/plugin', // ✅ usar este
      // 'react-native-reanimated/plugin', // ❌ NO usar este en SDK 54
    ],
  };
};

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Agrega soporte para .ttf
config.resolver.assetExts.push("ttf");

// Corrige el path de missing-asset-registry-path
config.resolver.extraNodeModules = {
  "missing-asset-registry-path": path.resolve(
    __dirname,
    "node_modules/missing-asset-registry-path"
  ),
};

module.exports = config;

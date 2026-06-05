module.exports = function (api) {
  api.cache(true);

  const plugins = [];
  
  // Strip all console logs in production builds, excluding warnings and errors
  if (process.env.NODE_ENV === 'production') {
    plugins.push(['transform-remove-console', { exclude: ['error', 'warn'] }]);
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
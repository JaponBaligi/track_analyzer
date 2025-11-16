module.exports = {
  devServer: (devServerConfig) => {
    devServerConfig.allowedHosts = 'all';
    return devServerConfig;
  },
};


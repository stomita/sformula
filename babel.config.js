module.exports = {
  presets: [
    [
      "@babel/env",
      process.env.BUILD_TARGET === "module"
        ? {
            modules: false,
            targets: { esmodules: true },
          }
        : {},
    ],
    "@babel/typescript",
  ],
};

module.exports = {
  presets: [
    [
      "@babel/env",
      process.env.BUILD_TARGET === "module" ? { modules: false } : {},
    ],
    "@babel/typescript",
  ],
  plugins: ["@babel/transform-runtime"],
  env: {
    test: {
      presets: ["power-assert"],
    },
  },
};

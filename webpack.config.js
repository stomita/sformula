const path = require("path");

module.exports = ["development", "production"].map((mode) => ({
  mode,
  entry: path.join(__dirname, "lib/index.js"),
  output: {
    path: path.join(__dirname, "dist"),
    filename: `sformula${mode === "production" ? ".min" : ""}.js`,
    library: "sformula",
  },
  devtool: "source-map",
  optimization: {
    minimize: mode === "production",
  },
}));

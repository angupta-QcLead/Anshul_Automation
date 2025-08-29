module.exports = {
  default: {
    require: [
      "tests/steps/*.js",
      "tests/support/*.js"
    ],
    format: ["progress", "@cucumber/pretty-formatter"],
    publishQuiet: true
  }
};

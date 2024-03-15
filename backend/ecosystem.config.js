module.exports = {
    apps : [{
      name: "llama",
      script: "./dist/index.js", // Path to your application's main file
      watch: true,
      ignore_watch: ["node_modules"]
    }]
  };
  
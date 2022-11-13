// ecosystem.config.js
module.exports = {
  apps: [{
      // 生产环境
      name: "prod-bot",
      // 项目启动入口文件
      script: "app.js",
      // 项目环境变量
      env: {
          "NODE_ENV": "production",
      }
  }, {
      // 测试环境
      name: "test-bot",
      script: "app.js",
      env: {
          "NODE_ENV": "test",
      }
  }
  ]
}
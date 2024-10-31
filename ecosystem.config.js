module.exports = {
    apps: [{
        name: "API",
        script: "app.js",
        cwd: "/root/DocumentationApi",
        env: {
            NODE_ENV: "production",
            MONGOURL: process.env.MONGOURL,
        }
    }]
}
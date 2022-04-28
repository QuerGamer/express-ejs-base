require("dotenv").config();
const express = require("express");
const app = express();
const HTTP_PORT = process.env.HTTP_PORT || 80;
const HTTPS_PORT = process.env.HTTPS_PORT || 443;
const layouts = require("express-ejs-layouts");
const path = require("path");
const router = express.Router();
const fs = require("fs");
const https = require("https");
const http = require("https");
const logger = require('morgan');
const cors = require('cors')
const session = require("express-session");
const chalk = require('chalk');
const compression = require('compression')
const ExpressCache = require('express-cache-middleware')
const cacheManager = require('cache-manager')
if (process.env.SESION_SECREAT == null) {
    console.error("SESION_SECREAT is not set!")
    process.exit();
}

//-------------------------------------------------------------
//                           APP
//-------------------------------------------------------------

if ((process.env.CORS_ENABLE || "true") == "true") {
    app.use(cors({
        "origin": (process.env.CORS_ORIGIN || "*"),
        "methods": (process.env.CORS_METHODES || "GET,HEAD,PUT,PATCH,POST,DELETE"),
        "preflightContinue": (process.env.CORS_PREFLIGHT_CONTINUE || false),
        "optionsSuccessStatus": (process.env.CORS_OPTIONS_SUCCESS_STATUS || 204)
    }))
}

app.set("trust proxy", (process.env.TRUST_PROXY || 1));
app.set('x-powered-by', (process.env.X_POWERED_BY || false));
app.use(express.json({ limit: (process.env.FILE_LIMIT || "100mb") }));
app.use(logger((process.env.LOGGER || "dev")));
app.use(express.static(__dirname + "/src/public"));
app.use(compression())
app.use(layouts);

//Bodyparser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//--|

//cache

if ((process.env.CACHE_ENABLE || "true") == "true") {

    const cacheMiddleware = new ExpressCache(
        cacheManager.caching({
            store: 'memory', max: (process.env.CACHE_MAX || 10000), ttl: (process.env.CACHE_TTL || 3600)
        })
    )

    cacheMiddleware.attach(app)

}


//--|

//session
if ((process.env.SESION_ENABLE || "true") == "true") {
    app.use(
        session({
            secret: process.env.SESION_SECREAT,
            cookie: {
                maxAge: (parseInt(process.env.SESION_COOKIE_MAX_AGE) || 86400000),
                secure: (process.env.SESION_COOKIE_SECURE || true)
            },
            saveUninitialized: (process.env.SESION_SAVE_UNINITIALIZED || false),
            resave: (process.env.SESION_RESAVE || false),
        })
    );
}
//--|

//view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname + "/src", "views"));
app.set("layout", "./layouts/layout.ejs" /* <layouts>  with comma sepeated*/);        // app.set("layout", "./src/layouts/layout_example.ejs", "./src/layouts/null.ejs");
//
//RateLimit
if ((process.env.RATELIMIT || "true") == "true") {

    const rateLimit = require("express-rate-limit");

    const limiter = rateLimit({
        max: (parseInt(process.env.RATELIMIT_MAX) || 1000),
        windowMs: (parseInt(process.env.RATELIMIT_WINDOW_MS) || 300000),
        message: (process.env.RATELIMIT_MESAGE || "too many requests sent by this ip, please try again!"),
    });

    app.use(limiter);

}
//--|

//SlowDown

if ((process.env.SLOWDOWN || "false") == "true") {
    const slowDown = require("express-slow-down");

    const speedLimiter = slowDown({
        windowMs: (parseInt(process.env.SLOWDOWN_WINDOWMS) || 300000),
        delayAfter: (parseInt(process.env.SLOWDOWN_DELAY_AFTER) || 300),
        remaining: (parseInt(process.env.SLOWDOWN_REMAINING) || 300),
        delayMs: (parseInt(process.env.SLOWDOWN_DELAY_MS) || 50),
        maxDelayMs: (parseInt(process.env.SLOWDOWN_MAX_DELAY_MS) || 2000),
    });

    app.use(speedLimiter);

}
//--|

// Routes

const document = require("./src/routes/example-route");

//--|

// Middleware Routes

app.use("/", document); //maping to path

//--|


//auto generate SSL 
if ((process.env.SSL_GENERATE || "false") == "true") {
    console.info("SSL_GENERATE= " + process.env.SSL_GENERATE)
    const generatessl = require("./src/g-ss.js")
    generatessl()
}

if ((process.env.HTTPS_ENABLE || "true")== "true") {
    var privateKey = fs.readFileSync("./ssl/key.pem", "utf8");
    var certificate = fs.readFileSync("./ssl/cert.pem", "utf8");

    var credentials = { key: privateKey, cert: certificate };

    var httpsServer = https.createServer(credentials, app);
    httpsServer.listen(HTTPS_PORT, () => {
        console.log(`HTTPS Server Use Port ` + chalk.green.bold(`${HTTPS_PORT}`));
    });
}
if (Boolean(process.env.HTTP_ENABLE || false) == true) {
    var httpServer = http.createServer(app);
    httpServer.listen(HTTP_PORT, () => {
        console.log(`HTTP Server Use Port ` + chalk.green.bold(`${HTTP_PORT}`));
    });
}

//test routes
app.get('/', (req, res) => {
    res.render('index', {
        desc: req.protocol === 'https'
            ? `Express using SSL certificate for using ${req.protocol} protocol`
            : `Express using SSL certificate for using ${req.protocol} protocol`
    })
});
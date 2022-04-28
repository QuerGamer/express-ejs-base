const router = require("express").Router();
require("dotenv").config();

router.get("/example", (req, res) => {
    //res.sendStatus(200)
    res.render("index")     //looks for the index.ejs file in the view folder
}
);

module.exports = router;
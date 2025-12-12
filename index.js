// imports
const express = require("express")

// express application object
const app = express()
const port = 8000;

// ejs template
app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: true }))

// css template
app.use(express.static("public"));

// routes
const mainRoutes = require("./routes/main")
app.use('/', mainRoutes)

// web app listening
app.listen(port, () => console.log(`Health app running on port ${port}`))
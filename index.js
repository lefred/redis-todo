const express = require("express");
const app = express();

const redis = require('redis');
const client = redis.createClient({
  url: 'redis://127.0.0.1:6379'
});

client.connect();

console.log('Starting the program...');


app.use("/static", express.static("public"));
app.use(express.urlencoded({ extended: true }));

client.on('connect', function (err) {
  if (err) {
    console.log('Could not establish a connection with Redis. ' + err);
  } else {
    console.log('Connected to Redis!');
    app.listen(3000, () => console.log("Server Up and running"));
  }
});

app.set("view engine", "ejs");

// GET METHOD (read)
app.get('/',async(req, res) => {
 try{
      reply = await client.lRange("mytodo", 0, -1) ;
      donereply = await client.lRange("mydone", 0, -1) ;
      console.log(reply);
 } catch (err) {
    console.log("Error: " + err);
 }
 res.render('todo.ejs');
});

// POST METHOD (add an entry)
app.post('/',async(req, res) => {
  console.log(req.body);
  if (req.body.content==="") {
    console.log("Empty string");
  } else {
    try {
      await client.lPush("mytodo", req.body.content);
    } catch (err) {
      console.log("Error: " + err);
    }
  }
  res.redirect("/");
});

// UPDATE

app.route("/edit/:id").get(async(req, res) => {
  const id = req.params.id;
  reply = await client.lRange("mytodo", 0, -1);
  res.render("todoEdit.ejs", {
      reply: reply,
      idTask: id
  });
}).post(async(req, res) => {
  const id = req.params.id;
  try {
  reply = await client.lSet("mytodo", id, req.body.content);
  } catch (err) {
    return res.send(500, err);
  }
  res.redirect("/");
});

app.route("/remove/:id").get(async(req, res) => {
  const id = req.params.id;
  try {
    reply = await client.lRange("mytodo", id, id);
    await client.lPush("mydone", reply);
    await client.lSet("mytodo", id, "TO_BE_DELETED_WORKAROUND");
    await client.lRem("mytodo", 1, "TO_BE_DELETED_WORKAROUND");
  } catch (err) {
    return res.send(500, err);
  }
  res.redirect("/");
});


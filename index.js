const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const app = express()
const port = process.env.PORT || 5000
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");


// middleware
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Media is burning')
})


// const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.ta7i6kc.mongodb.net/?retryWrites=true&w=majority`;
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.ta7i6kc.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {

    // my code goes from here

    const users = client.db("giggleMedia").collection("users");
    const posts = client.db("giggleMedia").collection("posts");

    app.post('/signUp', async (req, res) => {
      const {userName, email, pass} = req.body
      const existingUser = await users.findOne({userName})
      if(existingUser){
        return res.send({status: false, message: "User Existed"})
      }
      const hashedPassword = await bcrypt.hash(pass, 10)
      const result = await users.insertOne({userName, email, hashedPassword})
      if(result.insertedId) {
        res.send({status: true, message: "User created successfully"})
      } else {
        res.send({status: false, message: "Failed to create user"})
      }
    })

    app.post('/signIn', async (req, res) => {
      const {userName, pass} = req.body
      const user = await users.findOne({userName})
      if(!user){
        return res.send({status: false, message: "Invalid username or password"})
      }
      const isMatch = await bcrypt.compare(pass, user.hashedPassword)
      if(isMatch){
        return res.send({status: true, message: "Login successful"})
      } else {
        return res.send({status: false, message: "Invalid password"})
      }
    })

    app.post('/createPost', async(req, res) => {
      const contentAndImg = req.body;
      const post = {
        ...contentAndImg,
        likes: 0,
        comment: []
      }

      const result = await posts.insertOne(post)
      if(result.insertedId){
        res.send({status: true, message: 'Posted'})
      } else {
        res.send({status: false, message: 'Failed to post'})
      }
    })

    app.get('/posts', async(req, res) => {
      const result = await posts.find().toArray()
      res.send(result)
    })

    app.patch('/addLike/:id', async(req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await posts.updateOne(query, {$inc: {likes: 1}})
      res.send(result)
    })

    app.patch('/disLike/:id', async(req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await posts.updateOne(query, {$inc: {likes: -1}})
      res.send(result)
    })

    app.patch('/addComment/:id', async(req, res) => {
      const comment = req.body
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await posts.updateOne(query, {$push: {comment: comment}})
      res.send(result)
    })

    app.delete('/deletePost/:id', async(req, res) => {
      const id = req.params.id
      const query = {_id: new ObjectId(id)}
      const result = await posts.deleteOne(query)
      res.send(result)
    })
 
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log('Media is running on', port)
})
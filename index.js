const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 3000;

//middleware
app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ptpa0yz.mongodb.net/?retryWrites=true&w=majority`;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,


});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect((err) => {
            if (err) {
                console.log(err);
            }
            return;
        });

        const toysCollection = client.db("AllToysDb").collection("toys");

        // from database
        app.get('/allToys', async (req, res) => {
            const cursor = toysCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })
        //add data to database
        app.post('/allToys', async (req, res) => {
            const newToy = req.body;
            const result = await toysCollection.insertOne(newToy);
            res.json(result);
            console.log(newToy)
        })
        
        //! get data from db by email
        app.get('/myToys/:email', async (req, res) => {
            console.log(req.params.email);
            const result = await toysCollection.find({ email: req.params.email }).toArray();
            res.send(result);
        })

        //delete data from db
        app.delete('/allToys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toysCollection.deleteOne(query);
            res.json(result);
        })

        app.get('/allToys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await toysCollection.findOne(query);
            res.json(result);
        })


        //update data from db
        app.put('/allToys/:id', async (req, res) => {
            const id = req.params.id;
            const updateToy = req.body;
            const filter = { _id: new ObjectId(id) };
            const options = { upsert: true };
            const toy = {
                $set: {
                    name: updateToy.name,
                    price: updateToy.price,
                    sellerName: updateToy.sellerName,
                    imgUrl: updateToy.imgUrl,
                    email: updateToy.email,
                    rating: updateToy.rating,
                    description: updateToy.description,
                    subCategory: updateToy.subCategory,
                    availableQuantity: updateToy.availableQuantity
                },
            };
            const result = await toysCollection.updateOne(filter, toy, options);
            res.json(result);
        })

        //pagination 
        app.get('/totalToys', async (req, res) => {
            const result = await toysCollection.estimatedDocumentCount();
            res.send({ totalToys: result });
        })

        //! get data from db by subCategory

        app.get('/allToys/:subCategory', async (req, res) => {
            const result = await toysCollection.find({ subCategory: { $regex: req.params.subCategory, $options: 'i' } }).toArray();
            res.send(result);
        });





        //! search data from db
        const indexKeys = { name: 1, subCategory: 1 };
        const indexOptions = { name: 'titleSubCategory' };

        const result = await toysCollection.createIndex(indexKeys, indexOptions);

        app.get('/allToysSearch/:text', async (req, res) => {
            const searchText = req.params.text;
            const result = await toysCollection.find({
                $or: [
                    { name: { $regex: searchText, $options: 'i' } },
                    { subCategory: { $regex: searchText, $options: 'i' } }
                ]
            }).toArray();
            res.send(result);
        })





        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close(); 
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Toy market Place is running');
});

app.listen(port, () => {
    console.log(`Toy Market is running on port ${port}`);
});
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine','ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

titleList = ["Today"];


// Mongoose basic code

// mongoose.connect("mongodb://127.0.0.1:27017/todolistDB",{useNewUrlParser : true});    -- to connect on local server

mongoose.connect("mongodb+srv://ashrithaherle2903:geetha123@cluster0.3cj5flm.mongodb.net/todolistDB",{useNewUrlParser : true}); 

const itemsSchema = {
    name : String
};

const Item = mongoose.model("Item",itemsSchema);    // model name should be singular

const item1 = new Item ({
    name : "Welcome to your To-Do List"
});

const item2 = new Item ({
    name : "Click the + button to add a new item"
});

const item3 = new Item ({
    name : "<-- Click this to delete an item"
});

const defaultItems = [item1,item2,item3];

const listSchema = {
    name : String,
    items : [itemsSchema]
};

const List = mongoose.model("List",listSchema);


// render today's date

let today = new Date();
    
let options = {
    weekday : "long",
    day: "numeric",
    month : "long"
};

let day = today.toLocaleDateString("en-US",options);

app.get("/",function(req,res) {                                           // home route

    Item.find({})
        .then(function(foundItems) {

            if( foundItems.length === 0) {
                Item.insertMany(defaultItems)
                .then(function () {
                console.log("Default items added to the database successfully");
              })
              .catch(function (err) {
                console.log(err);
              });
            res.redirect("/");
            } else {
                res.render("List",{listTitle : day, newListItems : foundItems, titleList : titleList});
            }
 
        })
        .catch(function(err){
            console.log(err);
        });

});



app.get("/:customListName",function(req,res){                             // custom route

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName})
    .then(function(foundlist){
        if(!foundlist) {
            // create a new list
            const list = new List({
                name : customListName,
                items : defaultItems
            });
            list.save();
            res.redirect("/"+customListName);

        } else {
            // show the existing list
            res.render("List",{listTitle : foundlist.name, newListItems : foundlist.items});
        }
        
    })
    .catch(function(err){
        console.log(err);
    });

});


app.post("/", function(req,res) {

    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name : itemName
    });

    if(listName === day) {
        item.save();
        res.redirect("/");  
    } else {
        List.findOne({name : listName})
        .then(function(foundlist){
            foundlist.items.push(item);
            foundlist.save();
            res.redirect("/"+listName);
        });
    }

});


app.post("/delete", function(req,res) {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === day) {

        Item.findByIdAndRemove(checkedItemId)
        .then(function(deletedItem){
            if(deletedItem) {
                console.log("successfully deleted");
                res.redirect("/");
            } else {
                console.log("item couldnt be deleted");
            }  
        })
        .catch(function(err) {
            console.log(err);
        });

    } else {
        List.findOneAndUpdate({name : listName},{$pull: {items: {_id: checkedItemId}}})
        .then(function(deletedItem) {
            if(deletedItem){
                res.redirect("/" + listName);
            } else {
                console.log("item not deleted - -");
            }
        })
        .catch(function(err) {
            console.log(err);  
        });
    }

});


app.listen(3000,function() {
    console.log("server running on port 3000");
});
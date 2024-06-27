const mongoose = require("mongoose")
const Category = require("../model/categories")


const ProductSchema = new mongoose.Schema({
    catid :{
        type : mongoose.Schema.Types.ObjectId,
        ref : Category
    },
    pname  :{
        type : String
    },
    price : {
        type : Number
    },
    qty : {
        type : Number
    },
    image : {
        type : String
    }
})

module.exports = new mongoose.model("Product",ProductSchema)
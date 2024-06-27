const mongoose = require("mongoose")
const User = require("../model/users")
const Product = require("../model/products")
const CartSchema = new mongoose.Schema({

    uid : {
        type : mongoose.Schema.Types.ObjectId,
        ref : User
    },
    pid : {
        type : mongoose.Schema.Types.ObjectId,
        ref : Product
    },
    qty : {
        type:Number
    }
})


module.exports=new mongoose.model("Cart",CartSchema)
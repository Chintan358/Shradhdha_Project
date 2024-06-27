const mongoose  =require("mongoose")
const User = require("../model/users")
const  Product = require("../model/products")
const orderSchema = new mongoose.Schema({
    uid : {
        type : mongoose.Schema.Types.ObjectId,
        ref : User
    },
    payid  :{
        type : String
    },
    Product : [{
        pid  :{
            type : mongoose.Schema.Types.ObjectId,
            ref : Product
        },
        price : {
            type : Number
        },
        qty : {
            type : Number
        }
    }],

})

module.exports=new mongoose.model("Order",orderSchema)
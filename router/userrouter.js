const express = require("express")
const router = express.Router()
const User = require("../model/users")
const auth = require("../middleware/auth")
const bcrypt = require("bcryptjs")
const Category = require("../model/categories")
const Product = require("../model/products")
const Cart = require("../model/carts")
const Razorpay = require('razorpay');
const Order = require("../model/orders")
const nodemailer = require('nodemailer');



router.get("/",(req,resp)=>{
    resp.redirect("index")
})

router.get("/index",async(req,resp)=>{

    try {
        
        const allprods = await Product.find();
        const allCategories = await Category.find();
        resp.render("index",{"categories":allCategories,'products':allprods})
    } catch (error) {
        
    }
    
})


router.get("/contact",(req,resp)=>{
    resp.render("contact")
})

router.get("/detail",(req,resp)=>{
    resp.render("detail")
})

router.get("/shop",(req,resp)=>{
    resp.render("shop")
})

//*********************************Cart****************** */
router.get("/cart",auth,async(req,resp)=>{
    try {

        const cartdata = await Cart.find({uid:req.user._id}).populate("pid");
      
        var total=0;
        for(i=0;i<cartdata.length;i++)
        {
                total = total+cartdata[i].pid.price*cartdata[i].qty
              
                
        }
      
        
        resp.render("cart",{"cartdata":cartdata,"total":total})
    } catch (error) {
        console.log(error);
    }
    
})


router.get("/addtocart",auth,async(req,resp)=>{
    const pid = req.query.pid
    const uid = req.user._id


    try {

        const ddata =  await Cart.findOne({$and :[{pid : {$eq:pid}},{uid:{$eq:uid}}]});
        if(ddata==null)
        {
            const cart = new Cart({uid:uid,pid:pid,qty:1})
            const data =  await cart.save()
           
            resp.send("Product added in to cart !!!!")
        }
        else
        {
            resp.send("product alredy exist in cart !!!!")
        }

       
    } catch (error) {
        console.log('error');
    }
})

router.get("/removecart",async(req,resp)=>{
    const cartid = req.query.cartid
    try {
        await Cart.findByIdAndDelete(cartid)
        resp.send("Product removed from cart !!!")
    } catch (error) {
        console.log(error);
        
    }
})


router.get("/changeQty",async(req,resp)=>{
    const cartid = req.query.cartid
    const qty = req.query.qty
    try {
        const cartdata =  await Cart.findOne({_id:cartid})
        const newQty = cartdata.qty + Number(qty)
        
        if(newQty>0)
        {
          await Cart.findByIdAndUpdate(cartid,{qty:newQty});
        }
        resp.send("qty changed !!!")
    } catch (error) {
        console.log(error);
        
    }
})


//********************************************************* */
router.get("/login",(req,resp)=>{
    resp.render("login")
})


router.get("/reg",(req,resp)=>{
    resp.render("reg")
})


router.post("/userreg",async(req,resp)=>{
    try {
       const user = new User(req.body)
       const dt = await user.save()

       resp.render("reg",{"msg":"registration successfully !!!"})
    } catch (error) {
        console.log(error);
    }
})


router.post("/userlogin",async (req,resp)=>{

    const email = req.body.email
    const password = req.body.pass

    try {
        
        const data = await User.findOne({email:email})

       


        const isValid =  await bcrypt.compare(password,data.pass)
        if(isValid)
        {
            
            const token = await data.generateToken()
            resp.cookie("jwt",token)
            resp.redirect("index")
        }
        else{
            resp.render("login",{"msg":"Invalid credentials"})
        }


    } catch (error) {
        console.log(error);
        resp.render("login",{"msg":"Invalid credentials"})
    }

})

router.get("/logout",auth,async(req,resp)=>{
    var user  = req.user
    var token = req.token

    // console.log(user);
    // console.log(token);

   user.Tokens =   user.Tokens.filter(ele=>{
        return ele.token !=token
    })

    await user.save()


    resp.clearCookie("jwt")
    resp.render("login")
})

//**********************************order******************* */

router.get("/payment",(req,resp)=>{

    const amt  = Number(req.query.amt);

    var instance = new Razorpay({ key_id: 'rzp_test_a7SSRy55tg3DNp', key_secret: 'rMTukwWBdNatIClz8CX3yJ5Q'})

    var options = {
    amount: amt*100,  // amount in the smallest currency unit
    currency: "INR",
    receipt: "order_rcptid_11"
    };
    
    instance.orders.create(options, function(err, order) {
   
    resp.send(order)
    });

})





router.get("/order",auth,async(req,resp)=>{


    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: 'chintan.tops@gmail.com',
          pass: 'bsjh oare pgbz goyh'
        }
      });

    try {
    const user = req.user
    const payid = req.query.payid;
    const cartData = await Cart.find({uid:user._id}).populate("pid")

    var prod = [];
    var rows = "";
    var total = 0;
    for(var i=0;i<cartData.length;i++)
    {
       var pid = cartData[i].pid._id
       var price = cartData[i].pid.price
       var qty = cartData[i].qty
       prod.push({
        pid :pid,
        price :price,
        qty :qty})

        rows = rows+"<tr><td>"+cartData[i].pid.pname+"</td><td>"+price+"</td><td>"+qty+"</td> <td>"+qty*price+"</td></tr>"
   
        total = total + (price*qty)
    }
   
    const order = new Order({uid:user._id,payid:payid,Product:prod})
    const odata = await order.save()
   
    await Cart.deleteMany({uid:user._id})

    //****************mail order********** */

    var mailOptions = {
        from: 'chintan.tops@gmail.com',
        to: user.email,
        subject: 'Order conformation',
        html: "<table border='1'><tr><th>Productname</th><th>Price</th><th>Qty</th><th>Total</th></tr>"+rows+"<tr><td colspan='3'>Total</td><td>"+total+"</td></tr></table>"
      };
    

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      

    resp.send("Order confirmd!!!")
    } catch (error) {
        console.log(error);
    }
    

   
})


module.exports=router
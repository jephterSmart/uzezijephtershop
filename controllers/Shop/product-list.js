const fs = require('fs');
const path = require('path');

const PDFDocumet = require('pdfkit');
const dotenv = require('../../keys')

const stripe = require('stripe')(process.env.STRIPE_KEY);

const ProductModel = require('../../models/product');
const OrderModel = require('../../models/order');

const ITEM_PER_PAGE = 1;

exports.getAllProduct = (req,res,next) => {
    const page = +req.query.page || 1;
    let totalItems ;
    ProductModel.find().countDocuments()
    .then(numProduct=>{
        totalItems = +numProduct;
        return  ProductModel.find()
        .skip((page-1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE)
    })
   
    .then( products => {
        res.render('Shop/product-list',
        {path:'/products',
        pageTitle:'All products',
        prods:products,
        totalProducts: totalItems,
        currentPage: page,
        hasNextPage: page * ITEM_PER_PAGE < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems/ITEM_PER_PAGE)
    });
    } )
    .catch(err => console.log(err));
    
}
exports.getProduct = (req,res,next) => {
    ProductModel.findById(req.params.productId)
    .then( product => {
        res.render('Shop/product-details',{
            path:'/product',
            pageTitle:'Product Details',
            product:product});   
    } )
    .catch(err => console.log(err));
     
}

exports.getIndexPage = (req,res,next) =>{
    const page = +req.query.page || 1;
    let totalItems ;
    ProductModel.find().countDocuments()
    .then(numProduct=>{
        totalItems = +numProduct;
        return  ProductModel.find()
        .skip((page-1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE)
    })
    .then( products => {
        res.render('Shop/index',
        {path:'/',
        pageTitle:'Home Page',
        prods:products,
        totalProducts: totalItems,
        currentPage: page,
        hasNextPage: page * ITEM_PER_PAGE < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems/ITEM_PER_PAGE)
        });
    } )
    .catch(err => console.log(err));
   

}

exports.getCheckout = (req,res,next) =>{
    let total = 0;
    let productArray =[];
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user =>{
        
         productArray = user.cart.items;
        productArray.forEach(prod =>{
            total += prod.productId.price * prod.quantity;
        })
        return stripe.paymentIntents.create({
            amount: +total.toFixed(0),
            currency: 'usd',
            // Verify your integration in this guide by including this parameter
            metadata: {integration_check: 'accept_a_payment'},
        })
        // return stripe.checkout.sessions.create({
        //     payment_method_types: ['card'],
        //     line_items: productArray.map(p => {
        //         return {
        //             name: p.productId.title,
        //             description: p.productId.description,
        //             currency:'usd',
        //             amount : p.productId.price * 100,
        //             quantity: p.quantity,
        //         }
        //     }),
        //     success_url : req.protocol + '://' + req.get('host') + '/checkout/success',
        //     cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
        // })
        
    
    })
    .then(paymentIntent => {
       
        res.render('Shop/checkout',
            {path:'/checkout', 
            pageTitle: 'Your Cart',
            products:productArray ,
            totalSum: total,
            sessionId: paymentIntent.client_secret
        })
    })
    .catch(err => console.log(err));
}

exports.getCheckoutSuccess = (req,res,next) =>{
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user =>{
        const products = user.cart.items.map(item =>{
            return {quantity: item.quantity, product:{...item.productId._doc}}
        })
        const order = new OrderModel({
            products,
            user:{
                email: req.user.email,
                userId:req.user._id
            }
        })
       return order.save()
        
    })
    .then(order => {
     return req.user.clearCart()   
     
    })
    .then(cart => {
        res.redirect('/orders');
    })
    .catch(err => console.log(err))
   
    
}

exports.getOrders = (req,res,next) =>{
    OrderModel.find({'user.userId':req.session.user._id})
    .then(orders =>{
       
        res.render('Shop/orders',{path:'/orders', pageTitle: "Your Orders",orders })
    })
    .catch(err => console.log(err))
    
}
exports.getCart = (req,res,next) =>{
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user =>{
        
        let productArray = user.cart.items;
        res.render('Shop/cart',
            {path:'/cart', pageTitle: 'Your Cart',products:productArray })
    
    })
    .catch(err => console.log(err));
    
}
exports.postCart = (req,res,next) =>{
    const prodId = req.body.productId;
    ProductModel.findById(prodId)
    .then(product=>{
       return req.user.addTocart(product)
       
    })
    .then(user =>{
        res.redirect('/cart')
    })
    .catch(err => { console.log(err)})
}

exports.postDeleteCartItem = (req,res,next) => {
    const prodId = req.body.productId;
    const Increment = Boolean(req.body.Increase);
    const Decrement = Boolean(req.body.Decrease);
    ProductModel.findById(prodId)
    .then(product =>{
        if(Increment){
           return req.user.deleteCart(product,true);
        }
        else  if(Decrement){
            return req.user.deleteCart(product,false)
        }
        else {
            return req.user.deleteCart(product)
            
        }
        
    })
        
        .then( result => {
            res.redirect('/cart');
        })
    
 
    
   
}

exports.postOrder = (req,res,next) => {
    req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user =>{
        const products = user.cart.items.map(item =>{
            return {quantity: item.quantity, product:{...item.productId._doc}}
        })
        const order = new OrderModel({
            products,
            user:{
                email: req.user.email,
                userId:req.user._id
            }
        })
       return order.save()
        
    })
    .then(order => {
     return req.user.clearCart()   
     
    })
    .then(cart => {
        res.redirect('/orders');
    })
    .catch(err => console.log(err))
   
}

exports.getInvoice = (req,res,next) => {
    const orderId = req.params.orderId;
    OrderModel.findById(orderId)
    .then(order => {
        
        if(!order){
            return next(new Error('No order found in database'));
        }
        if(order.user.userId.toString() !== req.user._id.toString()){
            return next(new Error("You can't access this order"))
        }
        const invoiceName = 'invoice-' + orderId + '.pdf';
        const invoicePath = path.join('data',"invoices",invoiceName);
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'inline; filename="'+invoiceName + '"');
        const pdfDoc = new PDFDocumet({size:'A6',margins:{
            top: 20,
            left: 10,
            bottom: 20,
            right: 10
        },
        info:{Author:req.user._id.toString(),Title:'The invoice of your order - ' + orderId,Subject:"invoice"} 
    });
        pdfDoc.pipe(fs.createWriteStream(invoicePath));
        pdfDoc.pipe(res);
        pdfDoc.font('Times-BoldItalic').fontSize(26).text('Invoice',{align: 'center',underline:true})
        
        pdfDoc.text('-------------------',{align:'center'});
        const invoiceString = [];
        let totalPrice = 0;
        order.products.forEach(prod => {
            totalPrice += prod.quantity * prod.product.price;
            invoiceString.push(prod.product.title + ' - ' + prod.quantity + ' x ' + '$' + prod.product.price);
        } );

        pdfDoc.font('Times-Roman').fillColor('green').fontSize(16).list(invoiceString,{bulletIndent:true});
       
        pdfDoc.fillColor('black').text('-------')
        pdfDoc.fillColor('green').text("Total Price: $" + totalPrice.toFixed(3))
        pdfDoc.end();
    })
    .catch(err =>{
        next(err)
    })
}
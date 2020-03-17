const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    password:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    resetToken: String,
    resetExpirationDate: Date,
    cart:{
        items:[{
            productId:{type:Schema.Types.ObjectId,ref: 'Product', required:true},
            quantity:{type:Number,required:true}
        }]
    }
   
})

userSchema.methods.addTocart = function(product){
    let newQty = 1;
    const updatedcartItems = [...this.cart.items];
  const cartItemIndex = this.cart.items.findIndex(item =>{
     
     return product._id.toString() === item.productId.toString()
  })
  if(cartItemIndex >= 0){
      newQty = this.cart.items[cartItemIndex].quantity + 1;
      updatedcartItems[cartItemIndex].quantity = newQty;
        }
  else{
      updatedcartItems.push({productId:product._id, quantity: newQty})
      
  }
  const updatedCart = {
      items:updatedcartItems
  }
  this.cart = updatedCart
  return this.save()
  
  
}
userSchema.methods.deleteCart = function(product,increment){
    let updatedcartItems = [...this.cart.items];
    const cartItemIndex = updatedcartItems.findIndex(item =>{
        return product._id.toString() === item.productId.toString()
     })
    if(increment){
        updatedcartItems[cartItemIndex].quantity++;
    }
    else if(increment === false){
        if(updatedcartItems[cartItemIndex].quantity > 1){
            updatedcartItems[cartItemIndex].quantity--;
        }
        else return;
    }
    else if(increment === undefined){
        updatedcartItems.splice(cartItemIndex,1);
    }
    const updatedCart ={
        items: updatedcartItems
    }
    this.cart = updatedCart;
    return this.save()
}
userSchema.methods.clearCart = function(){
    this.cart = {
        items: []
    }
    return this.save();
}
module.exports = mongoose.model('User',userSchema);
const { validationResult }  =require('express-validator/check')

const ProductModel = require('../../models/product');
const file = require('../../utility/file')

exports.getAddProduct =  (req,res,next) => {
    res.render('Admin/edit-product',{pageTitle:'Add Product', 
    path: "/admin/add-product",editing:false,hasError:false,validationError:[],errorMessage:null});
}
exports.getEditProduct =  (req,res,next) => {
    const editMode = Boolean(req.query.edit);
    const prodId = req.params.productId
    if(!editMode){
        return res.redirect('/')
    }
    ProductModel.findById(prodId)
    .then( product =>{
        if(!product){
            return res.render('/404',{pageTitle:'No valid Data passed',path:'/404'});
        }
        res.render('Admin/edit-product',{pageTitle:'Edit Product', path: "/admin/edit-product",
        editing:editMode, product:product,hasError:false,validationError:[],errorMessage:null});
    })
    .catch( err => {
        const error = new Error(err)
        next(error);    
    })
    
}
exports.postEditProduct = (req,res,next) => {
    const title = req.body.title;
    const image = req.file;
    const price = req.body.price;
    const description = req.body.description;
    const productId = req.body.productId;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(422).render('Admin/edit-product',
        {pageTitle:'Edit Product', path: "/admin/edit-product",
        editing:true,errorMessage:errors.array()[0].msg, product:{
            title,price,description,_id:productId
        },
        hasError: true,
        validationError: errors.array()
    });
    }

ProductModel.findById(productId)
.then( product => {
    if(product.userId.toString() !== req.user._id.toString()){
        return res.redirect('/');
    }
    if(image){
        file.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
    }
    product.title = title;
    product.price = price;
    product.description = description;
    product.save()
    .then( () => {
        res.redirect('/admin/products');
    })
})

.catch(err =>{
    const error = new Error(err);
    next(error);
} );


}

exports.deleteProduct = (req,res,next) => {
    const prodId = req.params.productId;
    ProductModel.findById(prodId)
    .then(product => {
        if(!product) return next(new Error('product already deleted'))
        file.deleteFile(product.imageUrl);
        return ProductModel.deleteOne({_id:prodId, userId:req.user._id})
    })
    
    .then( result => {
        res.status(200).json({message:'Delete is successful'})})
    .catch(err => {
    res.status(500).json({message:'An error occured',error:err})    
    })
    
}
exports.postProduct = (req,res,next) =>{
    
        const title = req.body.title;
        const image = req.file;
        const price = req.body.price;
        const description = req.body.description;
        const userId = req.user
        
        const errors = validationResult(req);
        
        if(!errors.isEmpty()){
            return res.status(422).render('Admin/edit-product',
            {pageTitle:'Add Product', path: "/admin/edit-product",
            editing:false,errorMessage:errors.array()[0].msg, product:{
                title,price,description
            },
            hasError: true,
            validationError: errors.array()
        });
        }
        if(!image){
          return  res.status(422).render('Admin/edit-product',
            {pageTitle:'Add Product', path: "/admin/edit-product",
            editing:false,errorMessage:'Only .jpeg, .jpg and .png pictures are allowed', product:{
                title,price,description
            },
            hasError: true,
            validationError: []
        });  
        }
        const product = new ProductModel({
            title,price,imageUrl:image.path,description,userId
        })
        product.save()
        .then( result => res.redirect('/admin/products') )
        .catch(err => {
            const error = new Error(err);
            next(error)})
        
    
}

exports.getProducts = (req,res,next) =>{
    const ITEM_PER_PAGE = 3;
    const page = +req.query.page || 1;
    let totalItems ;
    ProductModel.find({userId: req.user._id}).countDocuments()
    .then(numProduct=>{
        totalItems = +numProduct;
        return  ProductModel.find({userId: req.user._id})
        .skip((page-1) * ITEM_PER_PAGE)
        .limit(ITEM_PER_PAGE)
    })
     
    .then(products =>{
        res.render('Admin/products',
        {path:'/admin/products',
        pageTitle:'My Products',
        prods:products,
        totalProducts: totalItems,
        currentPage: page,
        hasNextPage: page * ITEM_PER_PAGE < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems/ITEM_PER_PAGE)
        })
    })
    .catch(err => {
        const error = new Error(err);
        next(error)})
    


}
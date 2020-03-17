const path = require('path');

const express = require('express');
const {body}  = require('express-validator/check');

const adminController = require('../controllers/Admin/product');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth,adminController.getAddProduct);

// /admin/products => GET
router.get('/products',isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post('/add-product',isAuth,[
    body('title',"please put a valid title")
    .isString()
    .isLength({min:3}).trim(),
    body('price','must be a decimal number')
    .isFloat(),
    body('description','character count between 3 and 200.')
    .isString()
    .isLength({min:3, max:200})
    .trim()
], adminController.postProduct);

router.get('/edit-product/:productId',isAuth,adminController.getEditProduct);

router.post('/edit-product', isAuth,
[
    body('title',"please put a valid title")
    .isString()
    .isLength({min:3}).trim(),
    body('price','must be a decimal number')
    .isFloat(),
    body('description','character count between 3 and 200.')
    .isString()
    .isLength({min:3, max:200})
    .trim()
],adminController.postEditProduct);

router.delete('/delete-product/:productId', isAuth,adminController.deleteProduct);

module.exports = router;

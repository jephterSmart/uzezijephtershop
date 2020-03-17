const express = require('express');

const shopController = require('../controllers/Shop/product-list');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

router.get('/', shopController.getIndexPage);

router.get('/products', shopController.getAllProduct);

router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth,shopController.getCart);

router.post('/cart',isAuth, shopController.postCart);

router.post('/delete-cart-item',isAuth, shopController.postDeleteCartItem);

router.get('/checkout', isAuth, shopController.getCheckout);


router.get('/checkout/cancel', isAuth, shopController.getCheckout);

router.get('/checkout/success', isAuth,shopController.getCheckoutSuccess);

router.get('/orders/:orderId', isAuth, shopController.getInvoice);

router.get('/orders',isAuth, shopController.getOrders);

module.exports = router;

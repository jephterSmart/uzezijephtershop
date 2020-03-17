const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongodbStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');

const page404 = require('./controllers/404');
const UserModel = require('./models/user');

const app = express();

const store = new MongodbStore({
    uri:process.env.MONGO_URI,
    collection: 'sessions'
})
const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null, './images/')
    },
    filename: function(req,file,cb) {
        
        cb(null, new Date().toISOString().replace(/[-T:\.Z]/g, "") + file.originalname);
    }
})

const fileFilter = function(req,file,cb) {
    
    if(file.mimetype === 'image/png' || 
    file.mimetype === 'image/jpg' ||
     file.mimetype === 'image/jpeg'){
         cb(null,true)
     }
     else cb(null,false)
}

app.use(multer({storage:fileStorage,fileFilter:fileFilter}).single('image'));
app.use(bodyParser.urlencoded({extended:false}));

app.use(express.static(path.join(__dirname,'public')));
app.use('/images',express.static(path.join(__dirname,'images')));

app.use(session({secret:'my secret life', resave: false, saveUninitialized: false,store}))
app.use(csrfProtection);
app.use(flash());


app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));

const adminRoutes = require('./routes/admin');
const shopRoute = require('./routes/shop');
const authRoute = require('./routes/auth');

app.use(helmet())
app.use(compression())
app.use((req,res,next) => {
    res.locals.isAuthenticated = req.session.isLoggedIn;
    res.locals.csrfToken = req.csrfToken();
    
    next();
})

app.use((req,res,next) => {
    if(!req.session.user){
        return next()
    }
    UserModel.findById(req.session.user._id)
    .then(user => {
        if(!user){
            return next();
        }
        req.user = user;
        next();
    })
    .catch(err => {
        const error = new Error(err);
        next(error);
    })

})


app.use('/admin',adminRoutes);
app.use(shopRoute);
app.use(authRoute);

app.use(page404.get404);

app.use((error,req,res,next) => {
        console.log(error)
        res.status(500).render('500',
        {pageTitle: 'Server Error',path:'anything',isAuthenticated: req.isLoggedIn});
    next();

})

mongoose.connect(process.env.MONGO_URI,
{useNewUrlParser: true})
.then(result => {
   
 app.listen(processs.env.PORT || 3000)
    })
.catch(err =>{
    const error = new Error(err);
    next(error);
    
})

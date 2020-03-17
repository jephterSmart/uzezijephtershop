const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const mailgunTransport = require('nodemailer-mailgun-transport');
const { validationResult }  = require('express-validator/check');

const UserModel = require('../../models/user');

const auth = {
  auth:{
    domain: "sandboxfb79b9d44fb84f1bbdc5b54c6de4f5de.mailgun.org",
    api_key: process.env.MAILGUN_KEY
  }

}
const transporter = nodemailer.createTransport(mailgunTransport(auth));


exports.getLogin = (req, res, next) => {
  let message =  req.flash('error');
  if(message.length > 0){
    message = message[0];
  }
  else message = null;
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage:message,
    oldInput:{
      email:'',
      password:''
    },
    validationError: []
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422)
    .render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage:errors.array()[0].msg,
      oldInput:{
        email,
        password
      },
      validationError: errors.array()
    });
  }
  UserModel.findOne({email})
  .then(user => {
    if(!user){
      return res.status(422)
    .render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage:'Invalid email or password.',
      oldInput:{
        email,
        password
      },
      validationError: []
    });
      
    }
    
    bcrypt.compare(password,user.password)
    .then(doMatch => {
      if(doMatch){
        req.session.user = user;
        req.session.isLoggedIn = true;
        return  req.session.save((err) =>{
      
        res.redirect('/')
      });
      }
      return res.status(422)
    .render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage:'Invalid email or password.',
      oldInput:{
        email,
        password
      },
      validationError: []
    });
      
    })
    .catch(err =>{
      console.log(err)
      res.redirect('/login')
    })
      
  })
  .catch(err => {
    const error = new Error(err);
    next(error)
  })

    
  };
exports.postLogout = (req,res,next) => {
  req.session.destroy((err) => {
    console.log(err)
    res.redirect('/');
  })
}
exports.getSignup = (req, res, next) => {
  let message =  req.flash('error');
  if(message.length > 0){
    message = message[0];
  }
  else message = null;
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage:message,
    oldInput:{
      email:'',
      password:'',
      confirmPassword: ''
    },
    validationError: []
  });
};
exports.postSignup = (req, res, next) => {
  // UserModel.findOneAndDelete({email:'kali@gmail.com'})
  // .then(result =>{
  //     res.redirect('/signup')
  // })
  // .catch(err => {console.log(err)})
  
  const email = req.body.email.trim();
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422)
    .render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage:errors.array()[0].msg,
      oldInput:{
        email,
        password,
        confirmPassword
      },
      validationError:errors.array()
    });
  }
      bcrypt.hash(password,12)
      .then(hashedPassword => {
        const user1 = new UserModel({
          email,
          password: hashedPassword,
          cart:{items:[]}
        })
        return user1.save()
      })
      .then(result => {
        const mailoption = {
          from:"Mailgun Sandbox <postmaster@sandboxfb79b9d44fb84f1bbdc5b54c6de4f5de.mailgun.org>",
          to: email,
          subject:"welcome to using node to send mail",
          html: "<h1> i really like to try more of this</h1> <p>You are signed up </p>"
        }
        transporter.sendMail(mailoption)
        .then(data => {
         
        })
        .catch(err => {console.log(err)})
        res.redirect('/login');
   
    
  })
  
  .catch(err =>{
    console.log(err);
  })
};

exports.getReset = (req,res,next) => {
  let message =  req.flash('error');
  if(message.length > 0){
    message = message[0];
  }
  else message = null;
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Password Reset',
    errorMessage:message
  });
}

exports.postReset = (req,res,next) => {
  const email = req.body.email;
  crypto.randomBytes(32,(err,buffer) => {
    if(err){
      console.log(err);
      return res.redirect('/reset')
    }
    const token = buffer.toString('hex');
    UserModel.findOne({email})
    .then(user =>{
      if(!user){
        req.flash('error','No user with that email');
        return res.redirect('/reset');
      }
      user.resetToken = token;
      user.resetExpirationDate = Date.now() + 60*60*1000;
      return user.save()
    })
    .then(result =>{
      res.redirect('/');
      const mailoption = {
        from:"Mailgun Sandbox <postmaster@sandboxfb79b9d44fb84f1bbdc5b54c6de4f5de.mailgun.org>",
        to: email,
        subject:"Reset Password",
        html: `<h1>Password reset</h1>
            <p>you requested for password reset</p>
            <p> click this <a href="http://localhost:3000/reset/${token}">link </a> to set a new password</p>`
      }
      transporter.sendMail(mailoption)
    })
    .catch(err => {
      const error = new Error(err);
      next(error)
    });
  })
}

exports.getNewPassword = (req,res,next) => {
  const token = req.params.token;
  UserModel.findOne({resetToken: token, resetExpirationDate:{$gt: Date.now()}})
  .then(user=>{
    if(!user){
      req.flash('error','No user with that address');
      return res.redirect('/reset');
    }
    let message =  req.flash('error');
    if(message.length > 0){
    message = message[0];
    }
    else message = null;
  res.render('auth/new-password', {
    path: '/new-password',
    pageTitle: 'Update Password',
    errorMessage:message,
    UserId: user._id.toString(),
    passwordToken: token,
    validationError: [],
    oldInput:{
      password:''
    }
  });

  })
  .catch(err => {
    const error = new Error(err);
    next(error)
  })
}

exports.postNewPassword = (req,res,next) => {
const userId = req.body.UserId;
const passwordToken = req.body.passwordToken;
const newPassword = req.body.password;
let resetUser;
const errors = validationResult(req);

if(!errors.isEmpty()){
  return res.status(422)
  .render('auth/new-password', {
    path: '/new-password',
    pageTitle: 'Update password',
    errorMessage: errors.array()[0].msg,
    UserId:userId,
    passwordToken,
    oldInput:{
      password: newPassword
    },
    validationError: errors.array()
  });
}
UserModel.findOne({resetToken: passwordToken, resetExpirationDate:{$gt: Date.now()}, _id: userId})
.then(user => {
  resetUser = user;
 return bcrypt.hash(newPassword,12)
})
.then(hashedPassword => {
  resetUser.password = hashedPassword;
  resetUser.resetToken= undefined;
  resetUser.resetExpirationDate = undefined;
  return resetUser.save()
})
.then(result => {
 
return res.redirect('/login');
})
.catch(err => {
  const error = new Error(err);
  next(error)
});

}
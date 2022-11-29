const express = require('express');
const app = express();
const fs = require('fs');
const port = 3000;
const session = require('express-session');
const path = require('path');
const sendMail = require('./methods/sendEmail')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const upload_profile = multer({ dest: 'uploads/profiles' })
const secretKey = "12345678";
const Razorpay = require('razorpay');

const mongoose = require('mongoose');
const init = require('./mongo/init');
const cartItem = require('./mongo/cartItem');
const productModal = require('./mongo/productModal');
const userModal = require('./mongo/newUser');

init();

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('views'));
app.use(express.static('uploads'));
app.use(express.json());
app.set('view engine', 'ejs');


app.get('/', (req, res) => {
    console.log(req.url);
    if (req.session.isLoggedIn) {
        if (req.session.userModal.isVerified) {
            productModal.find({}, (err, list) => {
                res.render('mainActivity', { user: req.session.userModal, list: list });
            }).skip(0).limit(req.session.pageLimit);
        } else if ( req.session.userModal.isVerified == 0) {
            res.redirect('/verifyEmail');
        } 
    } else {
        // req.session.isLoggedIn = 0;
        res.redirect('/signup')
    }
});

app.get('/signup', (req, res) => {
    console.log(req.url);
    message = "Welcome user";
    res.render('signupActivity', { message });
});

app.get('/verifyEmail', (req, res) => {


    if (req.session.isLoggedIn) {

        if (req.session.userModal.isVerified == 0) {
            let messageOtp = "Verify your otp!";
            res.render('verificationActivity', { message: messageOtp });
        } else {
            res.redirect('/');
        }
    } else {
        res.redirect('/login');
    }
    console.log(req.url);

});

app.get('/login', (req, res) => {
    console.log(req.url);
    let message = "Welcome User";
    res.render('loginActivity', { message });
});

app.get('/admin', (req, res) => {
    let message = "Admin Only";
    res.render('addDataAdmin', { message });
});

app.get('/profile', function (req, res) {

    if (req.session.isLoggedIn) {
        if (req.session.userModal.isVerified) {
            res.render('profile', { user: req.session.userModal });
        } else if (req.session.userModal.isVerified == 0) {
            res.redirect('/verifyEmail');
        }
    } else {
        req.session.isLoggedIn = 0;
        res.redirect('/signup')
    }

});

app.get('/logout', function (req, res) {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/contactus', function (req, res) {
    res.render('contactUs');
});

app.get('/cart', function (req, res) {
    console.log(req.url);
    if (req.session.isLoggedIn) {
        if (req.session.userModal.isVerified) {
            res.render('myCart', { user: req.session.userModal, list: req.session.userModal.cartItems });
        } else {
            res.redirect('/login');
        }
    } else {
        res.redirect('/verifyEmail');
    }
});

app.get('/loadmore', function (req, res) {

    productModal.count({}, function (err, count) {
        if (count > req.session.pageLimit) {
            productModal.find({}, function (err, list) {
                res.send(JSON.stringify(list));
            }).skip(req.session.pageLimit).limit(5);
            req.session.pageLimit += 5;
        } else {
            res.send("0");
        }
    });

})


app.post('/admin', upload.single('productimg'), async function (req, res) {
    let adminReq = req.body;
    adminReq.productimg = req.file.filename;
    //for testing purpose
    adminReq.stock = 100;

    if (adminReq.adminkey === secretKey) {
        delete adminReq.adminkey;

        let newProduct = new productModal(adminReq);
        try {
            await newProduct.save();
            let message = "Product Added succesfully!";
            res.render('addDataAdmin', { message });
        } catch (error) {
            let message = "Access Denied!";
            res.render('addDataAdmin', { message });
        }
    } else {
        let message = "Wrong Admin Key!";
        res.render('addDataAdmin', { message });
    }
})

app.post('/login', (req, res) => {
    let userModal = req.body;
    getUser(userModal, function (err, data) {

        if (data && userModal.password == data.password) {
            req.session.isLoggedIn = 1;
            req.session.userModal = data;
            req.session.pageLimit = 5;
            res.redirect('/');
        } else {
            let message = "Invalid Username oR password"
            res.render('loginActivity', { message });
        }
    })
})

app.post('/signup', (req, res) => {
    let userModal = req.body;
    userModal.otp = 100000 + Math.floor(Math.random() * 900000);
    userModal.isVerified = 0;
    userModal.userimage = "";
    userModal.cartItems = [];

    //check the user if he is already in the database

    getUser(userModal, function (err, data) {
        if (!data) {
            sendMail(userModal.usermail, userModal.username, userModal.otp, function (err, data) {

                if (!err) {

                    setUser(userModal, function (err) {
                        if (!err) {

                            req.session.isLoggedIn = 1;
                            req.session.userModal = userModal;
                            req.session.isVerified = 0;
                            res.redirect('/');
                        } else {

                            res.end();
                        }
                    });

                } else {
                    console.log(err);
                    let message = "Invalid email address!";
                    res.render('signupActivity', { message });
                }
            })
        } else {
            req.session.isLoggedIn = 0;
            let message = "User Already Exists";
            res.render('signupActivity', { message });
            // return;
        }
    });

})

app.post('/verifyEmail', (req, res) => {

    if (req.session.userModal.isVerified == 1) {
        res.redirect('/');
    } else {
        let otpBox = req.body;
        //here
        if (otpBox.otp == req.session.userModal.otp) {
            req.session.userModal.isVerified = 1;
            getUser(req.session.userModal, function (err, data) {
                if (err) {
                    //user not found
                } else {

                    userModal.updateOne({ username: req.session.userModal.username }, { isVerified: 1 }, (err, result) => {

                    });
                    req.session.isLoggedIn = 1;

                }
            });
            res.redirect('/');
        } else {
            let messaage = "Invalid Otp";
            res.render('verificationActivity', { messaage });
        }
    }
});

app.post('/getDetails', function (req, res) {
    let { id } = req.body;
    let obj = {};

    console.log(id);
    productModal.findOne({ productimg: id }, function (err, doc) {

        if (!err) {
            obj = doc;
            res.end(JSON.stringify(obj));
        } else {

            res.end();
        }
    });

    // getProducts(function(list){
    //     for(let i=0;i<list.length;i++){
    //         if(id == list[i].productimg){
    //             obj = list[i];
    //             res.end(JSON.stringify(obj));
    //             break;
    //         }
    //     }
    // });
})

app.post('/getProduct', function (req, res) {
    console.log(req.url);
    let obj = req.body;
    console.log(obj);
    getProduct(req, obj, function (obj) {
        res.end(JSON.stringify(obj));
    });
});

app.post('/profile', upload_profile.single('profile_pic'), function (req, res) {
    let { password } = req.body;
    let filename;
    if (req.file) {
        filename = req.file.filename;
    }
    if (password != "" && req.session.isLoggedIn && req.session.userModal.isVerified) {

        userModal.updateOne({ username: req.session.userModal.username }, { userimage: filename, password: password }, (err, result) => {

            if (!err) {

                userModal.findOne({ username: req.session.userModal.username }, function (err, doc) {
                    if (!err) {
                        req.session.userModal = doc;
                        res.render('profile', { user: doc });
                    }
                });

            } else {
                res.end("someThing went wrong!");
            }
        });

    }
});

app.post('/addToCart', function (req, res) {
    console.log(req.url);

    let operation = req.body.operation;
    let objModal = req.body.obj;

    if (objModal != {}) {
        console.log("inside add to cart");
        addProduct(req, objModal, operation, function (addedOrNot, obj) {
            console.log(addedOrNot, "line 332");
            if (obj) {
                res.end(JSON.stringify(obj));
            } else {
                res.end(addedOrNot);
            }

        })
    }
});

app.post('/pay',function (req, res) {
    let { amount } = req.body;
    console.log(amount);
    var instance = new Razorpay({ key_id: 'rzp_test_SRZ05Qk4jGTGRh', key_secret: '4BgpIFh9XL6hRtfTbfYT9nor' })

    instance.orders.create({
        amount:amount,
        currency: "INR",
        receipt: "receipt#1",
    }).then(function(data){
        console.log(data);
        res.send(JSON.stringify(data));
    }).catch(function(error){
        res.send(JSON.stringify({order:error,sucess:false}));
    });
})

app.post('/orderSuccess',function(req,res){
    console.log(req.body);
});

//custom 404 page

app.get('*', function (req, res) {
    res.render('customError');
})

//functions

async function setUser(user, callback) {
    let list = [];

    let newUser = new userModal(user);
    let item = new cartItem({});
    newUser.cartItems = [];

    try {
        await newUser.save();
        callback(null);
    } catch (error) {
        callback(error);
    }
}

function getUser(user, callback) {
    let list = [];
    userModal.findOne({ username: user.username }, function (err, doc) {
        if (!err) {
            if (doc) {
                //user Already found!!

                callback(null, doc);
            } else {
                //new user can be created 
                callback(err, null);
            }
        }
    });
}

// for user adding to cart!
function addProduct(req, product, operation, callback) {

    console.log("inside add product");
    userModal.findOne({ username: req.session.userModal.username }, (err, doc) => {
        if (doc) {
            console.log("inside add product line 550 doc found");
            let isFound = 0;
            let quantity = 1;
            let totalAmount = 0;
            let stockcal = 0;
            for (key in doc.cartItems) {

                if (doc.cartItems[key].productimg == product.productimg) {
                    console.log(operation);
                    if (operation != null) {
                        if (operation == '+') {
                            product.quantity = doc.cartItems[key].quantity + 1;
                            stockcal = -1;
                        } else {
                            if (product.quantity != 0) {
                                product.quantity = doc.cartItems[key].quantity - 1;
                                stockcal = +1;
                            } else {

                            }
                        }
                        quantity = product.quantity;
                    } else {
                        quantity = doc.cartItems[key].quantity;
                        stockcal = -1;
                    }


                    totalAmount = quantity * product.productprice;
                    product.quantity = quantity;
                    if (quantity != 0) {
                        req.session.userModal.cartItems[key] = product;
                        doc.cartItems[key] = product;
                    } else {
                        req.session.userModal.cartItems.splice(key, 1);
                        doc.cartItems.splice(key, 1);
                    }


                    isFound = 1;
                    break;
                }

            }

            if (!isFound) {
                product.quantity = 1;
                stockcal = -1;
                req.session.userModal.cartItems.push(product);
                doc.cartItems.push(product);
            }

            userModal.updateOne({ username: req.session.userModal.username }, { cartItems: doc.cartItems }, function (err, result) {
                if (result) {
                    if (isFound) {
                        let obj = {
                            quantity: quantity,
                            totalAmount: totalAmount
                        }
                        productModal.findOne({ productimg: product.productimg }, function (err, doc) {
                            productModal.updateOne({ productimg: product.productimg }, { stock: doc.stock + stockcal }, function () {
                                callback("1", obj);
                            });
                        })
                    } else {
                        productModal.findOne({ productimg: product.productimg }, function (err, doc) {
                            productModal.updateOne({ productimg: product.productimg }, { stock: doc.stock + stockcal }, function () {
                                callback("0", null);
                            });
                        })

                    }
                }
            });

        } else {
            console.log("userNotFound");
        }
    });

    // readThisFile('database.txt',function(err,data){
    //     let list = [];
    //     if(data.length != 0){
    //         list = JSON.parse(data);
    //     }
    //     for(let i=0;i<list.length;i++){
    //         
    //         if(list[i].username == req.session.userModal.username){

    //             
    //             let isFound = 0;
    //             let quantity = 1;
    //             let totalAmount = 0;
    //             for(key in list[i].cartItems){

    //                 if(list[i].cartItems[key].productimg == product.productimg){
    //                    
    //                     if(operation != null){
    //                         if(operation == '+'){
    //                             product.quantity = product.quantity+1;
    //                         }else{
    //                             if(product.quantity != 0){
    //                                 product.quantity = product.quantity-1;
    //                             }else{

    //                             }
    //                         }
    //                         quantity = product.quantity;
    //                         totalAmount = quantity*product.productprice;
    //                         if(quantity !=0){
    //                             req.session.userModal.cartItems[key] = product;
    //                             list[i].cartItems[key] = product;
    //                         }else{
    //                             req.session.userModal.cartItems.splice(key,1);
    //                             list[i].cartItems.splice(key,1);
    //                         }
    //                     }
    //                     isFound = 1;
    //                     break;
    //                 }

    //             }

    //             if(!isFound){
    //                 product.quantity = 1;
    //                 req.session.userModal.cartItems.push(product);
    //                
    //                 list[i].cartItems.push(product);
    //             }

    //             
    //             writeThisFile('database.txt',list,function(){
    //                 if(isFound){
    //                     let obj = {
    //                         quantity: quantity,
    //                         totalAmount: totalAmount
    //                     }
    //                     callback("1",obj);
    //                 }else{
    //                     callback("0",null);
    //                 }
    //             });
    //             break;
    //         }
    //     }
    // });
}

function getProduct(req, product, callback) {

    userModal.findOne({ username: req.session.userModal.username }, (err, doc) => {
        if (doc) {
            for (key in doc.cartItems) {
                if (doc.cartItems[key].productimg == product.id) {
                    console.log(doc);
                    callback(doc.cartItems[key]);
                }
            }
        }
    });
}

app.listen(port, () => {
    console.log("***************server started***************");
});
#Index

**Modules**

* [periodicjs.ext.login](#periodicjs.ext.module_login)
* [authController](#module_authController)
* [userloginController](#module_userloginController)

**Functions**

* [login(req, res)](#login)
* [logout(req, res)](#logout)
* [rememberme(req, res)](#rememberme)
* [ensureAuthenticated(req, res)](#ensureAuthenticated)
* [usePassport(req, res)](#usePassport)
* [facebook(req, res)](#facebook)
* [facebookcallback(req, res)](#facebookcallback)
* [instagram(req, res)](#instagram)
* [instagramcallback(req, res)](#instagramcallback)
* [twitter(req, res)](#twitter)
* [twittercallback(req, res)](#twittercallback)
* [saveUser()](#saveUser)
* [login(req, res)](#login)
* [newuser(req, res)](#newuser)
* [create(req, res)](#create)
* [finishregistration(req, res)](#finishregistration)
* [updateuserregistration(req, res)](#updateuserregistration)
* [forgot(req, res)](#forgot)
 
<a name="periodicjs.ext.module_login"></a>
#periodicjs.ext.login
An authentication extension that uses passport to authenticate user sessions.

**Params**

- periodic `object` - variable injection of resources from current periodic instance  

**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2014 Typesettin. All rights reserved.  
<a name="module_authController"></a>
#authController
login controller

**Params**

- resources `object` - variable injection from current periodic instance with references to the active logger and mongo session  

**Returns**: `object` - sendmail  
**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2014 Typesettin. All rights reserved.  
<a name="module_userloginController"></a>
#userloginController
login controller

**Params**

- resources `object` - variable injection from current periodic instance with references to the active logger and mongo session  

**Returns**: `object` - userlogin  
**Author**: Yaw Joseph Etse  
**License**: MIT  
**Copyright**: Copyright (c) 2014 Typesettin. All rights reserved.  
<a name="login"></a>
#login(req, res)
logins a user using passport's local strategy, if a user is passed to this function, then the user will be logged in and req.user will be populated

**Params**

- req `object`  
- res `object`  

**Returns**: `object` - reponds with an error page or sends user to authenicated in resource  
<a name="logout"></a>
#logout(req, res)
logs user out and destroys user session

**Params**

- req `object`  
- res `object`  

**Returns**: `object` - sends user to logout resource  
<a name="rememberme"></a>
#rememberme(req, res)
keep a user logged in for 30 days

**Params**

- req `object`  
- res `object`  

**Returns**: `function` - next() callback  
<a name="ensureAuthenticated"></a>
#ensureAuthenticated(req, res)
make sure a user is authenticated, if not logged in, send them to login page and return them to original resource after login

**Params**

- req `object`  
- res `object`  

**Returns**: `function` - next() callback  
<a name="usePassport"></a>
#usePassport(req, res)
uses passport to log users in, calls done(err,user) when complete, can define what credentials to check here

**Params**

- req `object`  
- res `object`  

**Returns**: `function` - done(err,user) callback  
<a name="facebook"></a>
#facebook(req, res)
logs user in via facebook oauth2

**Params**

- req `object`  
- res `object`  

**Returns**: `function` - next() callback  
<a name="facebookcallback"></a>
#facebookcallback(req, res)
facebook oauth callback

**Params**

- req `object`  
- res `object`  

**Returns**: `function` - next() callback  
<a name="instagram"></a>
#instagram(req, res)
logs user in via instagram oauth2

**Params**

- req `object`  
- res `object`  

**Returns**: `function` - next() callback  
<a name="instagramcallback"></a>
#instagramcallback(req, res)
instagram oauth callback

**Params**

- req `object`  
- res `object`  

**Returns**: `function` - next() callback  
<a name="twitter"></a>
#twitter(req, res)
logs user in via twitter oauth2

**Params**

- req `object`  
- res `object`  

**Returns**: `function` - next() callback  
<a name="twittercallback"></a>
#twittercallback(req, res)
twitter oauth callback

**Params**

- req `object`  
- res `object`  

**Returns**: `function` - next() callback  
<a name="saveUser"></a>
#saveUser()
description The save user function has two special fn calls on the model to mark the properties on it as changed/modified this gets around some werid edge cases when its being updated in memory but not save in mongo

<a name="login"></a>
#login(req, res)
user login page

**Params**

- req `object`  
- res `object`  

**Returns**: `object` - reponds with an error page or requested view  
<a name="newuser"></a>
#newuser(req, res)
user registration form

**Params**

- req `object`  
- res `object`  

**Returns**: `object` - reponds with an error page or requested view  
<a name="create"></a>
#create(req, res)
create a new user account

**Params**

- req `object`  
- res `object`  

**Returns**: `object` - reponds with an error page or requested view  
<a name="finishregistration"></a>
#finishregistration(req, res)
complete registration form view

**Params**

- req `object`  
- res `object`  

**Returns**: `object` - reponds with an error page or requested view  
<a name="updateuserregistration"></a>
#updateuserregistration(req, res)
if username required, updates user username after account is created

**Params**

- req `object`  
- res `object`  

**Returns**: `object` - reponds with an error page or requested view  
<a name="forgot"></a>
#forgot(req, res)
Shows the forgot password view

**Params**

- req `object`  
- res `object`  

**Returns**: `object` - reponds with an error page or requested view  

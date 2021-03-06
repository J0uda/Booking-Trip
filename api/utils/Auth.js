const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");
const { SECRET } = require("../config");

/**
 * @DESC To register the user (ADMIN, SUPER_ADMIN, USER)
 */


const userRegister = async(userDets, role, res) => {
    try {
        /*
        // Validate the username
        let usernameNotTaken = await validateUsername(userDets.username);
        if (!usernameNotTaken) {
            return res.status(400).json({
                message: `Username is already taken.`,
                success: false
            });
        }*/

        // validate the email
        let emailNotRegistered = await validateEmail(userDets.email);
        if (!emailNotRegistered) {
            return res.status(400).send({
                message: `Email is already registered.`
            });
        }

        // Get the hashed password
        const password = await bcrypt.hash(userDets.password, 12);
        // create a new user
        const newUser = new User({
            ...userDets,
            password,
            role
        });

        await newUser.save();
        return res.status(201).send({
            message: "Hurry! now you are successfully registred. Please nor login."
        });
    } catch (err) {
        // Implement logger function (winston)
        return res.status(500).send({
            message: "Unable to create your account."
        });
    }
};

/**
 * @DESC To Login the user (ADMIN, SUPER_ADMIN, USER)
 */
const userLogin = async(userCreds, role, res) => {
    let { email, password } = userCreds;
    // First Check if the username is in the database
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).send({
            message: "Email is not found. Invalid login credentials.",

        });
    }
    // We will check the role
    if (user.role !== role) {
        return res.status(403).send({
            message: "Please make sure you are logging in from the right portal."
        });
    }
    // That means user is existing and trying to signin fro the right portal
    // Now check for the password
    let isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
        // Sign in the token and issue it to the user
        let token = jwt.sign({
                user_id: user._id,
                role: user.role,
                username: user.username,
                email: user.email
            },
            SECRET, { expiresIn: "7 days" }
        );

        let result = {
            username: user.username,
            role: user.role,
            email: user.email,
            token: `Bearer ${token}`,
            expiresIn: 168
        };

        return res.status(200).send({
            ...result,
            message: "Hurray! You are now logged in."
        });
    } else {
        return res.status(403).send({
            message: "Incorrect password."
        });
    }
};

/**
 * @DESC To update user profile (ADMIN, SUPER_ADMIN, USER)
 */
const updateProfile = async(req, res) => {
    const id = req.params.id;
    const user = await User.findOne({ _id: id }, (err, foundObject) => {
        if (err) {
            res.status(500).json({
                message: "Error, check updateProfile",
                success: false
            });
        } else {
            if (!foundObject) {
                res.status(404).json({
                    message: "Error, user id not found",
                    success: false
                });
            } else {
                if (req.body.address) {
                    foundObject.address = req.body.address
                }
                if (req.body.name) {
                    foundObject.name = req.body.name
                }
                if (req.body.email) {
                    foundObject.email = req.body.email
                }
                if (req.body.password) {
                    foundObject.password = req.body.password
                }
                if (req.body.birthday) {
                    foundObject.birthday = req.body.birthday
                }
                if (req.body.sex) {
                    foundObject.sex = req.body.sex
                }
                if (req.body.phone) {
                    foundObject.phone = req.body.phone
                }
                if (req.body.city) {
                    foundObject.city = req.body.city
                }
                if (req.body.address) {
                    foundObject.address = req.body.address
                }
                if (req.body.avatar) {
                    foundObject.avatar = req.body.avatar
                }
                foundObject.save(function(err) {
                    if (err) {
                        res.status(500).json({
                            message: "Error, couldn't save user!",
                            success: false
                        });
                    } else {
                        res.status(201).json({
                            message: 'User info has been updated successfully!',
                            success: true
                        });
                    }
                })
            }
        }
    });
}

const validateUsername = async username => {
    let user = await User.findOne({ username });
    return user ? false : true;
};

/**
 * @DESC Passport middleware
 */
const userAuth = passport.authenticate("jwt", { session: false });

/**
 * @DESC Check Role Middleware
 */
const checkRole = roles => (req, res, next) => {
    !roles.includes(req.user.role) ?
        res.status(401).send("Unauthorized") :
        next();
}

const validateEmail = async email => {
    let user = await User.findOne({ email });
    return user ? false : true;
};

const serializeUser = user => {
    return {
        username: user.username,
        email: user.email,
        name: user.name,
        _id: user._id,
        updatedAt: user.updatedAt,
        createdAt: user.createdAt,
        birthday: user.birthday,
        sex: user.sex,
        phone: user.phone,
        city: user.city,
        address: user.address,
        avatar: user.avatar
    };
};

module.exports = {
    userAuth,
    checkRole,
    userLogin,
    userRegister,
    updateProfile,
    serializeUser
};
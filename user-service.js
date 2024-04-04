const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

let mongoDBConnectionString = process.env.MONGO_URL;

let Schema = mongoose.Schema;

let userSchema = new Schema({
    userName: { type: String, unique: true },
    password: String,
    favourites: [String], 
    history: [String] 
});

let User; 

module.exports.connect = function() {
    return new Promise((resolve, reject) => {
        let db = mongoose.createConnection(mongoDBConnectionString); // Removed deprecated options

        db.on('error', (err) => {
            reject(err); // Failed to connect
        });

        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
};


module.exports.registerUser = function (userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2) {
            reject("Passwords do not match");
        } else {
            bcrypt.hash(userData.password, 10)
                .then((hash) => {
                    userData.password = hash;
                    let newUser = new User(userData);

                    newUser.save()
                        .then(() => resolve("User " + userData.userName + " successfully registered"))
                        .catch((err) => {
                            if (err.code === 11000) reject("User Name already taken");
                            else reject("There was an error creating the user: " + err);
                        });
                })
                .catch((err) => reject(err));
        }
    });
};

module.exports.checkUser = function (userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })
            .then((user) => {
                if (!user) {
                    reject("User not found");
                } else {
                    bcrypt.compare(userData.password, user.password).then((result) => {
                        if (result) {
                            resolve(user); 
                        } else {
                            reject("Incorrect Password");
                        }
                    });
                }
            })
            .catch((err) => reject("Unable to find user " + userData.userName));
    });
};

module.exports.getUserById = function(id) {
    return new Promise((resolve, reject) => {
        User.findById(id)
            .then(user => resolve(user))
            .catch(err => reject("Unable to find user with ID: " + id));
    });
};

module.exports.getFavourites = function (id) {
    return new Promise((resolve, reject) => {
        User.findById(id)
            .then((user) => resolve(user.favourites))
            .catch((err) => reject("Unable to retrieve favourites: " + err));
    });
};

module.exports.addFavourite = function (id, favId) {
    return new Promise((resolve, reject) => {
        User.findByIdAndUpdate(id, { $addToSet: { favourites: favId } }, { new: true })
            .then(() => resolve("Favourite added"))
            .catch((err) => reject("Unable to add favourite: " + err));
    });
};

module.exports.removeFavourite = function (id, favId) {
    return new Promise((resolve, reject) => {
        User.findByIdAndUpdate(id, { $pull: { favourites: favId } }, { new: true })
            .then(() => resolve("Favourite removed"))
            .catch((err) => reject("Unable to remove favourite: " + err));
    });
};

module.exports.getHistory = function (id) {
    return new Promise((resolve, reject) => {
        User.findById(id)
            .then((user) => resolve(user.history))
            .catch((err) => reject("Unable to retrieve history: " + err));
    });
};

module.exports.addHistory = function (id, historyId) {
    return new Promise((resolve, reject) => {
        User.findByIdAndUpdate(id, { $addToSet: { history: historyId } }, { new: true })
            .then(() => resolve("History added"))
            .catch((err) => reject("Unable to add to history: " + err));
    });
};

module.exports.removeHistory = function (id, historyId) {
    return new Promise((resolve, reject) => {
        User.findByIdAndUpdate(id, { $pull: { history: historyId } }, { new: true })
            .then(() => resolve("History removed"))
            .catch((err) => reject("Unable to remove from history: " + err));
    });
};
var request = require('request');
var async = require('async');
var fs = require('fs');
var JSFtp = require('jsftp');

var mongo = require('mongodb').MongoClient;

var url = 'mongodb://localhost:27017/schools';

var schoolsJson = require('./data/schools.json');

mongo.connect(url, function (err, db) {
    if (err) {
        console.log('Unable to connect to the mongoDB server. Error:', err);
        
    } 
    else {
        console.log('Connection established to', url);
    }
    
    var collection = db.collection('schools');
    
    collection.deleteMany({}, function(err, results) {
        if (err) {console.log(err);} 
        else {
            collection.insert(schoolsJson, function (err, result) {
                if (err) {console.log(err);} 
                else {
                    console.log('Inserted %d schools', result.insertedCount);
                }
              
                db.close();
            });
        }
   });
});



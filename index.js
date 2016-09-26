var request = require('request');
var async = require('async');
var fs = require('fs');
var JSFtp = require("jsftp");

        async.waterfall([
            function(callback){
                //console.time("getjson");
                getSchoolJsons(callback);
            },//ftp schools, add to mongos, or mysql??
            function(schoolsJson, callback){
                sendFile(schoolsJson, function(err) {
                    if (err) return callback(err);
                        
                    console.log('file ftp\'ed');
                    
                    callback(null);
                });
                
            }
        ],
        function(err, results){
            //console.timeEnd("getjson");
            if (err) console.log(err);
            
        });
    
    
    function getSchoolJsons(cb) {
        var counties = [{county:'Miami-Dade', zipcodes:[33146, 33145, 33147, 33150, 33149, 33154, 33153, 33156, 33155, 33158, 33157, 33160, 33162, 33161, 33166, 33165, 33168, 33167, 33170, 33169, 33173, 33172, 33175, 33174, 33177, 33176, 33179, 33178, 33181, 33180, 33183, 33182, 33185, 33184, 33187, 33186, 33189, 33188, 33190, 33194, 33193, 33196, 33199, 33239, 33106, 33010, 33013, 33012, 33015, 33014, 33016, 33018, 33027, 33031, 33030, 33033, 33032, 33035, 33034, 33037, 33039, 33055, 33054, 33056, 33090, 33092, 33101, 33109, 33112, 33116, 33114, 33122, 33126, 33125, 33128, 33127, 33130, 33129, 33132, 33131, 33134, 33133, 33136, 33135, 33138, 33137, 33140, 33139, 33142, 33141, 33144, 33143]},{county:'Monroe', zipcodes:[33051, 33070, 33001, 33036, 33040, 33042, 33043, 33050]} ];
        //var counties = [{county:'Miami-Dade', zipcodes:[33146, 33146, 33145]},{county:'Monroe', zipcodes:[33050, 33050]} ];
        
        var mainJsonArr = [];
        var countyCount = counties.length;
        
        //for (var i = 0, countyCount = counties.length; i < countyCount; i++) { 
        function forloop(i){
            if( i < countyCount){
                async.forEachLimit(counties[i].zipcodes, 5, function(zip, callback) {
                    //console.log(counties[i].zipcodes);
                    getJson(counties[i].county, zip, function (err, result){
                        if (err) {console.log(err);}
                        
                        if (result) mainJsonArr  = mainJsonArr.concat(result);
                        
                        callback();
                    });
                },
                function(err){
                    if (err) {return cb(err);}
                    return forloop(++i);
                    
                });
            }
            else { 
                //elimate duplicats
                mainJsonArr = removeDuplicates(mainJsonArr, 'ProviderNumber');
                cb(null, mainJsonArr);
            }
        }
        forloop(0);
    }
        
    
    function getJson(county, zip, cb) {
        
        var options = {
            url: 'https://cares.myflfamilies.com/PublicSearch/Search?dcfSearchBox='+zip,
            form: {},
        }

        request(options, function (err, response, body) {
            if (err) {return cb(err + ' ' + options.url);}
            
            if (!err && response.statusCode == 200) {
                startPos = body.indexOf('{"Data":[{"');
                endPos = body.indexOf('},"detailTemplate":');
                
                if (startPos>0 && endPos>0) {
                    
                    mainSchoolJson = JSON.parse(body.substring(startPos,endPos));
                    
                    var schoolArr = [];
                    
                    var propDel = ['VPKCurriculum', 'VPKClass', 'VPKAccreditation', 'VpkStatusID', 'DBAName', 'DisplayPhoneOnWeb', 'DisplayAddressOnWeb', 'ExtraSecondaryDesignatorSuffix', 'ExtraSecondaryDesignatorPrefix', 'SecondaryDesignatorSuffix', 'SecondaryDesignatorPrefix', 'StreetPostDirection', 'StreetSuffix', 'StreetName', 'StreetPreDirection', 'StreetNumber', 'AddressID', 'GoldSealStatusID', 'Inspections'];
 
                    for (var i = 0, schoolCount = mainSchoolJson.Data.length; i < schoolCount; i++) { 
                        //delete some properties
                        for (var j = 0,  count = propDel.length; j < count; j++) {
                            delete mainSchoolJson.Data[i].Provider[propDel[j]];
                        }
                        if (mainSchoolJson.Data[i].Provider !== 'undefined') {
                            schoolArr.push(mainSchoolJson.Data[i].Provider);
                        }
                    }
                    
                    cb(null, schoolArr);
                }
                else {
                    cb('NO JSON');
                }
            }
        });//request
        
    }
    
    function removeDuplicates(arr, prop) {
        var new_arr = [];
        var lookup  = {};
     
        for (var i in arr) {
            if (arr[i].hasOwnProperty(prop)) {
                lookup[arr[i][prop].trim()] = arr[i];
            }
        }
     
        for (i in lookup) {
            new_arr.push(lookup[i]);
        }
     
        return new_arr;
    }
    
    function sendFile(schoolsJson, cb) {
        var localFile = '/var/www/html/dev/school/data/schools.json';
        var remoteFile = '/dev/schools/data/data.json';
        
        fs.writeFile(localFile, JSON.stringify(schoolsJson), function(err) {
            if(err) { return cb(err); }

            //ftp file
            var JSftp = new JSFtp({host: '74.208.47.226', port: 21, user: 'mhmcmiafly', pass: 'mh@DF58!xc0'});
            
            JSftp.put(localFile, remoteFile, function(err) {
                if (err) { JSftp.raw.quit(); return cb(err);}

                //console.log("json file ftp\'ed");
                
                JSftp.raw.quit();
                
                return cb(null);
            });

        }); 
    }
    
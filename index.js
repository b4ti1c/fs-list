var fs = require('fs');
var path = require('path');
var FileQueue = require('filequeue');
var fq = new FileQueue(200);


var listFiles = function(dir, options) {
    return new Promise(function(resolve, reject) {
        var results = [];
        fq.readdir(dir, function(err, list) {
            if (err) return reject(err);

            var pending = list.length;
            if (!pending) return resolve(results);

            list.forEach(function(file) {
                var file;
                if (options && options.fullPath) file = path.resolve(dir, file);
                else file = path.join(dir, file);

                fq.stat(file, function(err, stat) {
                    if(err) return reject(err);

                    if (stat && stat.isDirectory()) {
                        listFiles(file, options).then(function(res) {
                            results = results.concat(res);
                            if (!--pending) resolve(results);
                        });
                    } else {
                        results.push(file);
                        if (!--pending) resolve(results);
                    }
                });
            });
        });
    });
}


var listFolders = function(dir, options) {
    return new Promise(function(resolve, reject) {
        var dirs = [dir];
        fq.readdir(dir, function(err, list){
            if(err) return reject(err);

            var pending = list.length;
            if(!pending) return resolve(dirs);

            list.forEach(function(subpath){
                var subdir;
                if (options && options.fullPath) subdir = path.resolve(dir, subpath);
                else subdir = path.join(dir, subpath);

                fq.stat(subdir, function(err, stat){
                    if(err) return reject(err);

                    if(stat && stat.isDirectory()){
                        dirs.push(subdir);
                        listFolders(subdir).then(function(res){
                            dirs = dirs.concat(res);
                            if(!--pending) resolve(dirs);
                        });
                    } else {
                        if(!--pending) resolve(dirs);
                    }
                });
            });
        });
    });
}


module.exports.listFiles = listFiles;
module.exports.listFolders = listFolders;

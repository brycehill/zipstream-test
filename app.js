var express = require('express'),
    exphbs = require('express3-handlebars'),
    connect = require('connect'),
    zipstream = require('zipstream'),
    fs = require('fs'),
    app = express();


/*
 * Setup Express
 */ 
app.configure(function() {
  app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
  app.set('view engine', 'handlebars');

  app.use(connect.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'MY$UPERSECRETKEY'}));
  app.use(connect.static(__dirname + '/public'));
  app.use(app.router);
});


var imgDir = './img';

app.get('/', function(req, res) {
  var locals = {
    files: []
  };
  // get files in dir and send to page
  fs.readdir(imgDir, function(err, files) {
    files.forEach(function(file) {
      var path = imgDir + '/' + file;
      var size = 0;

      fs.stat(path, function(err, stats) {

        locals.files.push({
          name: file,
          size: stats.size
        });

        // console.log(locals)
        // need to use Q or something for all these callbacks, shouldn't render
        // in a loop!
        res.render('index', locals);

      });
    });
  });
});

app.post('/upload', function(req, res) {
  // VALIDATE?
  var file = req.files.uploadedFile;

  if (file.name === '') {
    //err
  } else {
    fs.readFile(req.files.uploadedFile.path, function(err, data) {
      if (err) throw err;

      var newPath = __dirname + "/img/" + req.files.uploadedFile.name;
      fs.writeFile(newPath, data, function (err) {
        if (err) throw err;

        res.redirect("/");
      });
    });
  }
});

app.get('/zip', function(req, res) {
  var zip = zipstream.createZip({ level: 1 }),
      // out = fs.createWriteStream('images.zip'),
      files = [], 
      count = 0;

  fs.readdir(imgDir, function(err, files) {

    // err catch here
    // if (err) return/throw ?

    // Create an array of file objects
    for (var i = 0, l = files.length; i < l; i++) {
      file = files[i];

      files[i] = {
        path: imgDir + '/' + file,
        name: file
      };
    }

    zip.addFile(fs.createReadStream(files[count].path), { name: files[count].name }, addNext);

    function addNext() {
      count++;
      console.log('count: ' + count);
      
      if (files.length > count) {
        zip.addFile(fs.createReadStream(files[count].path), { name: files[count].name }, addNext);
      } else {
        zip.finalize(function(written) { 
          console.log(written + ' total bytes written'); 
        });
      }
    }
  });

  // Set the name of the zip file here. 
  res.set('Content-Disposition', 'attachment; filename="images.zip"');
  res.set('Content-Type', 'application/zip');

  // Pipe the file to the browser
  zip.pipe(res);
});


app.listen(3000);
console.log('App is listening on port 3000');
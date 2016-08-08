var app = {};

function startApp() {

  app.canvas = document.getElementById("gameWindow");
  app.ctx = app.canvas.getContext("2d");

  app.canvas.addEventListener("mousemove", myMouseMove, false);

  app.background = new Image();
  app.background.src = "images/bg.png"

  app.shipImage = new Image();
  app.shipImage.src = "images/ship.png";

  app.rockImage = new Image();
  app.rockImage.src = "images/asteroid.png";

  app.explosionImage = new Image();
  app.explosionImage.src = "images/explosion.png";

  app.cw = app.canvas.width;
  app.ch = app.canvas.height;
  app.scrollY = 0;

  app.state = "play";
  app.asteroids = [];
  app.frequency = 130;
  app.countDown = 0;
  app.modifier = 0

  if (app.reset == "yes") {
    app.canvas.removeEventListener("click", startApp);
    startGame();
  } else {
    app.ctx.font = "22px Arial";
    app.ctx.textAlign = "center"
    app.ctx.fillRect(0,app.ch/2,app.cw,35);
    app.ctx.textAlign = "center";
    app.ctx.fillStyle = "#fff";
    app.ctx.fillText("Click to Start",app.cw/2,app.ch/2 + 24)
    app.canvas.addEventListener("click", startGame);
  }

  spawnHero();
}

function startGame() {
  app.canvas.removeEventListener("click", startGame);
  document.getElementById("gameWindow").style.cursor = "none";
  app.countDown = 120
  app.lastTime = window.performance.now();
  window.requestAnimationFrame(frameUpdate);
}

function frameUpdate(timestamp) {
  if (app.modifier == 0) {
    app.modifier = timestamp;
  }
  switch (app.state) {
    case "lose" :
      document.getElementById("gameWindow").style.cursor = "default";
      app.ctx.fillStyle = "#ff0000";
      app.ctx.fillRect(0,app.ch/2,app.cw,35);
      app.ctx.textAlign = "center";
      app.ctx.fillStyle = "#fff";
      app.ctx.fillText("Game Over (click to try again)",app.cw/2,app.ch/2 + 24);
      reset();
      break;
    case "win":
      document.getElementById("gameWindow").style.cursor = "default";
      app.ctx.fillStyle = "#009900";
      app.ctx.fillRect(0,app.ch/2,app.cw,35);
      app.ctx.textAlign = "center";
      app.ctx.fillStyle = "#fff";
      app.ctx.fillText("You Win! (click to play again)",app.cw/2,app.ch/2 + 24);
      reset();
      break;
    default:
      window.requestAnimationFrame(frameUpdate);
      var dt = (timestamp - app.lastTime) / 1000;
      app.frequency = 120 - (timestamp-app.modifier)/1000;
      app.countDown = Math.floor(app.frequency);
      if (app.countDown === 0) {
        app.state = "win";
      };
      app.lastTime = timestamp;
      for (i = 0; i < app.asteroids.length; i++) {
        var foo = app.asteroids[i];
        foo.position.y += foo.speed * dt;
        if (foo.position.y - foo.size > app.ch){
          app.asteroids.splice(i,1);
        }
        foo.checkHitHero(app.hero);
      }

      var modulated = (app.frequency/2.5 +10);
      if (random(1,modulated) == 1) {
        spawnAsteroid();
      }

      drawScene(timestamp);
  }
}

function getDistance(object1, object2) {
  var dx = object1.position.x - object2.position.x;
  var dy = object1.position.y - object2.position.y;
  return Math.sqrt(dx*dx + dy*dy);
}

function drawScene(time) {
  // Background scrolling
  while (app.scrollY > app.ch) {
    app.scrollY = app.scrollY - app.ch;
  }
  app.ctx.drawImage(app.background,0,app.scrollY);
  app.ctx.drawImage(app.background,0,app.scrollY-app.ch);
  app.scrollY = time/200;

  //Draw instructions at start
  app.ctx.fillStyle = "#fff";
  if (app.frequency > 115) {
    app.ctx.fillText("Survive for 2 minutes!",app.cw/2,120);
  }

  //Draw and update the game clock
  updateClock();
  app.hero.drawMe();
  for (i = 0; i < app.asteroids.length; i++) {
    drawObject(app.asteroids[i]);
  }
}

function updateClock() {
  var mins = Math.floor((app.countDown)/60);
  var secs = pad(app.countDown - (60*mins),2);
  var time = mins + ":" + secs;
  app.ctx.fillText(time,app.cw-50,app.ch-20);
}

function pad (str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

function drawObject(object) {
  app.ctx.save();
  app.ctx.translate(object.position.x, object.position.y);
  if (object.degree != "no") {
    app.ctx.rotate(object.degree);
    object.degree += object.spin;
  } else {
    app.ctx.rotate(0);
  };
  app.ctx.drawImage(object.image, -object.size/2, -object.size/2, object.size, object.size);
  app.ctx.restore();

}

function spawnHero() {
  app.hero = {
    position: { x: 400, y: 400},
    size: 60,
    image: app.shipImage,
    degree: "no",
    drawMe: function() {
      if(this.state === "exploded") {
        this.image = app.explosionImage;
      }
      drawObject(this);
    }
  };
}

function random(from, to, neg) {
  var num = Math.floor(Math.random() * (to - from + 1)) + from;
  if (neg == "yes") {
    if (random(0,1) == 1) {
      console.log(-num);
      return -num;
    }
  };
  return num;
}

function spawnAsteroid() {
  var rndSize = random(20, 100)
  app.asteroid = {
    position: {
      x: random(0,app.cw),
      y: -15
    },
    size: rndSize,
    speed:random(45,240),
    image: app.rockImage,
    degree: random(0,359),
    spin: (random(0,100,"yes")/1000),
    checkHitHero: function(hero) {
      var distance = getDistance(hero, this);
      if (distance < (this.size/2 + app.hero.size/2)-3) {
        hero.state = "exploded";
        app.state = "lose";
      }
    }
  }
  app.asteroids.push(app.asteroid);
}

function reset() {
  app.reset = "yes";
  app.state = "play";
  app.hero.state = "alive";
  app.hero.image = app.shipImage;
  app.asteroids = [];
  app.canvas.addEventListener("click", startApp);
}

function myMouseMove(event) {
  if (app.hero.state != "exploded") {
    var pageMargin = (document.body.clientWidth-app.canvas.width)/2
    app.hero.position.x = event.pageX - pageMargin;
    app.hero.position.y = (event.pageY);
  }
}

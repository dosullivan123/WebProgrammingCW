//-------Game-------------------------------------------------------------------------


function startGame() {
        
        Area.start();
        
        var test = new Tank("lachlan", 6000, 15, 15);
        test.draw(Area);
        this.interval = setInterval(Area.updateArea, 20);
        window.addEventListener('keydown', function (e) {
          Area.key = e.keyCode;
        })
        window.addEventListener('keyup', function (e) {
          Area.key = false;
        })
      
      }
     
    




var Area = {
    canvas : document.getElementById("Canvas"),
    start : function() {
        this.canvas.width = 1000;
        this.canvas.height = 500;
        this.context = this.canvas.getContext("2d");
    },
    clear : function(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
        

}



//basic game object class
class Object {
    constructor(name, size, x, y, speedX, speedY){
        this.name = name;
        this.size = 15;
        this.x = x;
        this.y = y;
        this.speedX = 0;
        this.speedY = 0;
    }

    get_name(){
        return this.name;
    }
    get_size() {
        return this.size;
    }
    

    
    
}

//tank object 
class Tank extends Object{
    //basic attributes for tank, elemental damage not included
    constructor(name, size, x, y, speedX, speedY, damageO, level){
        super(name, size,x, y, speedX, speedY);
        this.damageO = damageO;
        this.level = level;
    }

    draw(canvas){
        Area.context.fillStyle = "#FF0000";
        Area.context.fillRect(100, 150, this.size, (this.size+5));
    }
    update() {
        var ctx = Area.context;
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    newPos() {
        this.x += this.speedX;
        this.y += this.speedY; 
    }
}

//fire tank child of tank 
class Fire extends Tank{
    //super all attributes from tank, add what type of damage(fire)
    constructor(name, size, x, y, speedX, speedY, damageO, level, type){
        this.type = "fire";
        super(name, size, x, y, speedX, speedY, damageO, level, type);
    }
}

//kinetic tank child of tank 
class Kinetic extends Tank{
    //super all attributes from tank, add what type of damage(kinetic)
    constructor(name, size, x, y, speedX, speedY, damageO, level, type){
        this.type = "kinetic";
        super(name, size, x, y, speedX, speedY, damageO, level, type);
    }
}


//water tank child of tank
class Water extends Tank{
    //super all attributes from tank, add what type of damage(water)
    constructor(name, size, x, y, speedX, speedY, damageO, level, type){
        this.type = "water";
        super(name, size, x, y, speedX, speedY, damageO, level, type);
    }
}


function getKeyAndMove(e){				
    var key_code=e.which||e.keyCode;
    switch(key_code){
        case 37: //left arrow key
            moveLeft();
            break;
        case 38: //Up arrow key
            moveUp();
            break;
        case 39: //right arrow key
            moveRight();
            break;
        case 40: //down arrow key
            moveDown();
            break;						
    }
}
function moveLeft(){
    test.speedX = -1;
    test.newPos();    
    test.update();
}
function moveUp(){
    test.speedX = -1;
    test.newPos();    
    test.update();
}
function moveRight(){
    test.speedX = 1;
    test.newPos();    
    test.update();
}
function moveDown(){
    test.speedX = 1;
    test.newPos();    
    test.update();
}

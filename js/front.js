document.querySelector('#cube1').style.left = '0px';
document.querySelector("#ligne1").style.width = '800px';
document.getElementById("clickme").addEventListener("click", function (event) {
    // Affiche le compte courant de clics à l'intérieur de la div cliquée

    console.log(parseFloat(document.querySelector('#cube1').style.left));
    if (parseFloat(document.querySelector('#cube1').style.left) < 750) {
        console.log('yo');
        document.querySelector('#cube1').style.left = parseFloat(document.querySelector('#cube1').style.left) +
            30 + 'px';
        laFonctionClick();
    }
}, false);

document.querySelector('#cube2').style.left = '0px';
document.querySelector("#ligne2").style.width = '800px';
document.getElementById("clickme2").addEventListener("click", function (event) {
    // Affiche le compte courant de clics à l'intérieur de la div cliquée
    if (parseFloat(document.querySelector('#cube2').style.left) < 750) {
        document.querySelector('#cube2').style.left = parseFloat(document.querySelector('#cube2').style.left) +
            30 + 'px';

    }
}, false);


var socket = io.connect('http://192.168.1.17:8080');
        var laFonctionClick = function(){
            
            socket.emit('cube', document.querySelector('#cube1').style.left)
        }
       
       
    
    socket.on('cube2', function(lecube2){
        document.querySelector('#cube2').style.left = lecube2;
    })
    socket.emit('nom', document.querySelector('#clickme').innerHTML)

    socket.on('nom2', function(hey){
        document.querySelector('#clickme2').innerHTML = hey;
    })
    socket.on('jesuisla', function(hello){
        socket.id // id de la connexion
        
        console.log(hello);
        
        document.querySelector('#clickme2').innerHTML = hello[1];
        
    });
    socket.emit('monidsocket', document.querySelector('#clickme').socked.id)
    
       
  
 
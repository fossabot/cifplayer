/**
 * Author: Evgeny Blokhin
 * Web: http://tilde.pro
 * Email: eb@tilde.pro
 * License: MIT
 * Version: 0.12.0
 */
require.config({ baseUrl: 'js/app', paths: { libs: '../libs' }});
require(['libs/matinfio', 'libs/three.custom', 'libs/domReady'], function(MatinfIO, th, domReady){

var player = {};
player.version = '0.12.0';
player.loaded = false;
player.container = null;
player.stats = null;
player.camera = null;
player.scene = null;
player.renderer = null;
player.controls = null;
player.atombox = null;
player.available_overlays = ["S", "N"];
player.current_overlay = "S"; // default overlay
player.obj3d = false;
player.webproxy = 'proxy.php'; // to display and download remote files; must support url get param
player.sample = "data_global\n_cell_length_a 24\n_cell_length_b 5.91\n_cell_length_c 5.85\n_cell_angle_alpha 90\n_cell_angle_beta 90\n_cell_angle_gamma 90\n_symmetry_space_group_name_H-M 'P1'\nloop_\n_symmetry_equiv_pos_as_xyz\nx,y,z\nloop_\n_atom_site_label\n_atom_site_type_symbol\n_atom_site_fract_x\n_atom_site_fract_y\n_atom_site_fract_z\nO1 O 0.425 0.262 0.009\nO2 O -0.425 0.262 0.009\nH3 H 0.444 0.258 0.154\nH4 H -0.444 0.258 0.154\nH5 H 0.396 0.124 0.012\nH6 H -0.396 0.124 0.012\nO7 O 0.425 0.236 0.510\nO8 O -0.425 0.236 0.510\nH9 H 0.444 0.239 0.656\nH10 H -0.444 0.239 0.656\nH11 H 0.396 0.374 0.512\nH12 H -0.396 0.374 0.512\nSr13 Sr 0.342 0.964 0.467\nSr14 Sr -0.342 0.964 0.467\nSr15 Sr 0.342 0.535 0.967\nSr16 Sr -0.342 0.535 0.967\nO17 O 0.348 0.971 0.019\nO18 O -0.348 0.971 0.019\nO19 O 0.348 0.528 0.519\nO20 O -0.348 0.528 0.519\nO21 O 0.263 0.803 0.701\nO22 O -0.263 0.803 0.701\nO23 O 0.264 0.695 0.200\nO24 O -0.264 0.695 0.200\nZr25 Zr 0.261 0.000 0.998\nZr26 Zr -0.261 0.000 0.998\nZr27 Zr 0.261 0.499 0.498\nZr28 Zr -0.261 0.499 0.498\nO29 O 0.257 0.304 0.806\nO30 O -0.257 0.304 0.806\nO31 O 0.257 0.195 0.306\nO32 O -0.257 0.195 0.306\nSr33 Sr 0.173 0.993 0.524\nSr34 Sr -0.173 0.993 0.524\nSr35 Sr 0.173 0.506 0.024\nSr36 Sr -0.173 0.506 0.024\nO37 O 0.173 0.947 0.986\nO38 O -0.173 0.947 0.986\nO39 O 0.173 0.551 0.486\nO40 O -0.173 0.551 0.486\nO41 O 0.098 0.204 0.295\nO42 O -0.098 0.204 0.295\nO43 O 0.098 0.295 0.795\nO44 O -0.098 0.295 0.795\nZr45 Zr 0.086 0.004 0.998\nZr46 Zr -0.086 0.004 0.998\nZr47 Zr 0.086 0.495 0.498\nZr48 Zr -0.086 0.495 0.498\nO49 O 0.074 0.709 0.211\nO50 O -0.074 0.709 0.211\nO51 O 0.074 0.790 0.711\nO52 O -0.074 0.790 0.711\nSr53 Sr 0 0.991 0.467\nSr54 Sr 0 0.508 0.967\nO55 O 0 0.076 0.020\nO56 O 0 0.423 0.520";

var THREE = th.THREE || th;

function draw_3d_line(start_arr, finish_arr, color){
    if (!color) var color = 0xEEEEEE;
    var vector = new THREE.Geometry();
    vector.vertices.push(new THREE.Vector3( start_arr[0], start_arr[1], start_arr[2] ));
    vector.vertices.push(new THREE.Vector3( finish_arr[0], finish_arr[1], finish_arr[2] ));
    var material = new THREE.LineBasicMaterial({color: color});
    player.atombox.add(new THREE.Line(vector, material));
}

function create_sprite(text){
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var metrics = context.measureText(text);
    var w = metrics.width * 3.5; // to be adjusted

    canvas.width = w;
    canvas.height = 26; // to be adjusted
    context.font = "normal 26px Arial"; // to be adjusted
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#000000";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    var material = new THREE.SpriteMaterial({map: texture});
    var sprite = new THREE.Sprite(material);
    sprite.renderOrder = 1; // TODO?
    var txt = new THREE.Object3D();
    sprite.scale.set(w, 26, 1); // to be adjusted
    txt.add(sprite);
    txt.name = "label";
    return txt;
}

function init_3D(){
    player.loaded = true;

    player.container = document.createElement('div');
    player.container.style.backgroundColor = '#ffffff';
    document.body.appendChild(player.container);

    player.scene = new THREE.Scene();
    player.camera = new THREE.PerspectiveCamera( 45, window.innerWidth/window.innerHeight, 0.1, 20000);
    player.camera.position.set(0, 0, 3000);

    var AmbientLight = new THREE.AmbientLight(0x999999);
    player.scene.add(AmbientLight);
    var PointLight = new THREE.PointLight(0x666666, 1);
    PointLight.position.set(1500, 1500, 1500);
    player.scene.add(PointLight);

    player.renderer = new THREE.CanvasRenderer();
    player.renderer.setClearColor(0xffffff, 1);
    player.renderer.setSize(window.innerWidth, window.innerHeight);
    player.container.appendChild(player.renderer.domElement);

    //player.stats = new Stats();
    //player.stats.domElement.style.position = 'absolute';
    //player.stats.domElement.style.top = '0px';
    //document.body.appendChild( player.stats.domElement );

    var zoompanel = document.createElement('div');
    zoompanel.setAttribute('id', 'zoompanel');
    document.body.appendChild(zoompanel);
    zoompanel.onclick = function(evt){
        evt = evt || window.event;
        if (evt.cancelBubble)
            evt.cancelBubble = true;
        else {
            evt.stopPropagation();
            evt.preventDefault();
        }
        var y = (evt.pageY) ? evt.pageY : evt.clientY;
        var fov = ((y > 79) ? -1 : 1) * 7.5;
        player.camera.fov -= fov;
        player.camera.updateProjectionMatrix();
    }

    player.controls = new THREE.TrackballControls(player.camera); // fixme: multi-touch bug https://github.com/mrdoob/three.js/pull/7409
    player.controls.rotateSpeed = 1.75;
    player.controls.staticMoving = true;

    render_3D();
}

function render_3D(){
    var old = player.scene.getObjectByName("atombox");
    if (!!old) player.scene.remove(old);
    player.atombox = new THREE.Object3D();

    var test = document.getElementById('infopanel');
    if (!!test) test.parentNode.removeChild(test);
    if (player.obj3d.descr){
        var infopanel = document.createElement('div');
        infopanel.setAttribute('id', 'infopanel');
        infopanel.innerHTML = '<span style=color:#900>a = '+player.obj3d.descr['a']+' &#8491;</span><br /><span style=color:#090>b = '+player.obj3d.descr['b']+' &#8491;</span><br /><span style=color:#009>c = '+player.obj3d.descr['c']+' &#8491;</span><br />&#945; = '+player.obj3d.descr['alpha']+'&deg;<br />&#946; = '+player.obj3d.descr['beta']+'&deg;<br />&#947; = '+player.obj3d.descr['gamma']+'&deg;<br />';
        document.body.appendChild(infopanel);
    }

    var test = document.getElementById('optionpanel');
    if (!!test) test.parentNode.removeChild(test);
    var optionpanel = document.createElement('div');
    optionpanel.setAttribute('id', 'optionpanel');
    optionpanel.innerHTML = '<input type=radio name=optionpanel id=optionpanel_none /><label for=optionpanel_none>none</label>';
    optionpanel.innerHTML += ' <input type=radio name=optionpanel id=optionpanel_S checked=checked /><label for=optionpanel_S>chemical elements</label>';
    optionpanel.innerHTML += ' <input type=radio name=optionpanel id=optionpanel_N /><label for=optionpanel_N>id\'s</label>';
    if (player.obj3d.overlayed){
        for (var prop in player.obj3d.overlayed){
            optionpanel.innerHTML += ' <input type=radio name=optionpanel id=optionpanel_'+prop+' /><label for=optionpanel_'+prop+'>'+player.obj3d.overlayed[prop]+'</label>';
        }
    }
    document.body.appendChild( optionpanel );
    optionpanel.onclick = function(evt){
        evt = evt || window.event;
        player.current_overlay = (evt.target || evt.srcElement).id.replace('optionpanel_', '');
        var obj = player.scene.getObjectByName("atombox");
        obj = obj.children;
        var labels = obj.filter(function(item){ return item.name == 'label' })
        var i, len = labels.length;
        for (i = 0; i < len; i++){
            player.atombox.remove(labels[i]);
            player.scene.remove(labels[i]);
        }
        if (player.available_overlays.indexOf(player.current_overlay) !== -1){
            var balls = obj.filter(function(item){ return item.name == 'atom' });
            var len = balls.length;
            for (i = 0; i < len; i++){
                var label = create_sprite(balls[i].overlays[player.current_overlay]);
                label.position.set(balls[i].position.x, balls[i].position.y, balls[i].position.z);
                player.atombox.add(label);
            }
        }
        player.renderer.render(player.scene, player.camera);
    }

    player.current_overlay = "S";

    var actd, sphd = {lodim:{w:6, h:6}, hidim:{w:10, h:8}};
    player.obj3d.atoms.length > 50 ? actd = sphd.lodim : actd = sphd.hidim;

    var i, len = player.obj3d.atoms.length;
    for (i = 0; i < len; i++){
        var x = parseInt( player.obj3d.atoms[i].x*100 ), y = parseInt( player.obj3d.atoms[i].y*100 ), z = parseInt( player.obj3d.atoms[i].z*100 ), r = player.obj3d.atoms[i].r*65;

        var atom = new THREE.Mesh( new THREE.SphereBufferGeometry( r, actd.w, actd.h ), new THREE.MeshLambertMaterial( { color: player.obj3d.atoms[i].c, overdraw: 0.5 } ) );
        atom.position.set(x, y, z);
        atom.name = "atom";
        atom.overlays = player.obj3d.atoms[i].overlays;
        player.atombox.add(atom);

        var label = create_sprite(atom.overlays[player.current_overlay]);
        label.position.set(x, y, z);
        player.atombox.add(label);
    }

    if (player.obj3d.cell.length){
        var axcolor, ortes = [];
        for (var i = 0; i < 3; i++){
            var a = Math.round(parseFloat(player.obj3d.cell[i][0])*1000)/10;
            var b = Math.round(parseFloat(player.obj3d.cell[i][1])*1000)/10;
            var c = Math.round(parseFloat(player.obj3d.cell[i][2])*1000)/10;
            ortes.push([a, b, c]);
            if (i==0) axcolor = 0x990000;
            else if (i==1) axcolor = 0x009900;
            else if (i==2) axcolor = 0x000099;
            player.atombox.add(new THREE.ArrowHelper(new THREE.Vector3(a, b, c).normalize(), new THREE.Vector3(0, 0, 0), Math.sqrt(a*a+b*b+c*c), axcolor, 75, 10));
        }

        var plane_point1 = [ortes[0][0]+ortes[1][0], ortes[0][1]+ortes[1][1], ortes[0][2]+ortes[1][2]]
        var plane_point2 = [ortes[0][0]+ortes[2][0], ortes[0][1]+ortes[2][1], ortes[0][2]+ortes[2][2]]
        var plane_point3 = [plane_point1[0]+ortes[2][0], plane_point1[1]+ortes[2][1], plane_point1[2]+ortes[2][2]]
        var dpoint = [ortes[1][0]+ortes[2][0], ortes[1][1]+ortes[2][1], ortes[1][2]+ortes[2][2]]
        var drawing_cell = [];

        drawing_cell.push([ortes[0], plane_point1]);
        drawing_cell.push([ortes[0], plane_point2]);
        drawing_cell.push([ortes[1], dpoint]);
        drawing_cell.push([ortes[1], plane_point1]);
        drawing_cell.push([ortes[2], dpoint]);
        drawing_cell.push([ortes[2], plane_point2]);
        drawing_cell.push([plane_point1, plane_point3]);
        drawing_cell.push([plane_point2, plane_point3]);
        drawing_cell.push([plane_point3, dpoint]);

        var i, len = drawing_cell.length;
        for (i = 0; i < len; i++){
            draw_3d_line(drawing_cell[i][0], drawing_cell[i][1]);
        }
    }
    player.atombox.name = "atombox";
    player.scene.add(player.atombox);
    //TWEEN.removeAll();
    play();
    //var fake_phonon = ''; for (var i=0; i<player.obj3d.atoms.length; i++){ fake_phonon += '1,1,1, ' } // debug phonon animation
    //vibrate_3D( '[' + fake_phonon.substr(0, fake_phonon.length-2) + ']' );
}

function resize(){
    if (!player.loaded) return;
    player.camera.aspect = window.innerWidth / window.innerHeight;
    player.camera.updateProjectionMatrix();
    player.renderer.setSize(window.innerWidth, window.innerHeight);
    player.controls.handleResize();
    play();
}

function play(){
    //if (!!player.active_renderer) requestAnimationFrame(play);
    requestAnimationFrame(play);
    player.renderer.render(player.scene, player.camera);
    player.controls.update();
    //TWEEN.update();
    //player.stats.update();
}

function url_redraw_react(){
    var url = document.location.hash.substr(1);
    if (url.indexOf('://') == -1) return alert('Error: not a valid url!');

    ajax_download(url);
}

function display_startup(){
    if (window.parent && window.parent.cifdata){ // iframe integration
        accept_data(window.parent.cifdata, false);
    } else if (window.FileReader) {
        var test = document.getElementById('landing');
        if (!!test) test.parentNode.removeChild(test);
        var panel = document.createElement('div');
        panel.setAttribute('id', 'landing');
        panel.innerHTML = 'Please drag & drop a CIF file here<br>or <a href=/ id=play_demo>display example</a>.';
        document.body.appendChild(panel);
        var demo = document.getElementById('play_demo');
        demo.onclick = play_demo;
    } else play_demo();
}

function play_demo(evt){
    evt = evt || window.event;
    if (evt.cancelBubble)
        evt.cancelBubble = true;
    else {
        evt.stopPropagation();
        evt.preventDefault();
    }
    accept_data(player.sample, false);
}

function direct_download(){
    var url = document.location.hash.substr(1);
    if (url.indexOf('://') == -1) return;
    window.open(url, 'd_' + Math.random());
}

function ajax_download(url){
    var parser = document.createElement('a');
    parser.href = url;
    if (parser.hostname !== window.location.hostname){
        url = player.webproxy + '?url=' + url;
    }
    var xmlhttp = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
    xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4){
            if (xmlhttp.status == 200) accept_data(xmlhttp.responseText, true);
            else {
                alert("Error: HTTP " + xmlhttp.status + " status received during retrieving data from the server");
                if (!player.loaded) display_startup();
            }
        }
    }
    xmlhttp.open("GET", url);
    xmlhttp.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2000 00:00:00 GMT");
    xmlhttp.send(1);
}

function accept_data(str, allow_download){
    //console.log("Data:", str);
    var dpanel_ready = document.getElementById('dpanel');
    if (!!dpanel_ready) dpanel_ready.style.display = 'none';

    player.obj3d = MatinfIO.to_player(str);
    if (player.obj3d){
        var test = document.getElementById('landing');
        if (!!test) test.parentNode.removeChild(test);

        if (allow_download){
            if (!dpanel_ready){
                var dpanel = document.createElement('div');
                dpanel.setAttribute('id', 'dpanel');
                document.body.appendChild(dpanel);
                dpanel.onclick = direct_download;
            } else dpanel_ready.style.display = 'block';
        }
        player.loaded ? render_3D() : init_3D();
    }
}

function handleFileSelect(evt){
    evt.stopPropagation();
    evt.preventDefault();

    if (evt.dataTransfer.files.length > 1) return alert("Error: only one file at the time may be rendered!");
    var file = evt.dataTransfer.files[0];
    if (!file || !file.size) return alert("Error: file cannot be read (unaccessible?)");

    var reader = new FileReader();

    reader.onloadend = function(evt){
        accept_data(evt.target.result, false);
    }
    reader.abort = function(){ alert("Error: file reading has been cancelled!") }
    reader.onerror = function(evt){ alert("Error: file reading has been cancelled: " + evt.target.error.name) }

    reader.readAsText(file);
}

function handleDragOver(evt){
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
}

domReady(function(){
    window.addEventListener('resize', resize, false );
    window.addEventListener('hashchange', url_redraw_react, false);

    if (window.FileReader){
        window.addEventListener('dragover', handleDragOver, false);
        window.addEventListener('drop', handleFileSelect, false);
    }

    if (document.location.hash.length) url_redraw_react();
    else display_startup();
});

});
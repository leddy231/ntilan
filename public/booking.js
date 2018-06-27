var config = {
    apiKey: "AIzaSyAOif6D08SlHcp1BpVLrMirVhYFc0-Y12c",
    authDomain: "itg-lan-dev.firebaseapp.com",
    databaseURL: "https://itg-lan-dev.firebaseio.com",
    projectId: "itg-lan-dev",
    storageBucket: "itg-lan-dev.appspot.com",
    messagingSenderId: "599939385369"
};

firebase.initializeApp(config);

var booked = 0;
var newUser = false;
var tabToggle = 0;

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginButton = document.getElementById("loginButton");
const loginError = document.getElementById("loginError");

const registerName = document.getElementById("registerName");
const registerPassword2 = document.getElementById("registerPassword2");
const registerNameDiv = document.getElementById("registerNameDiv");
const registerPasswordDiv = document.getElementById("registerPasswordDiv");

const saveButton = document.getElementById("saveTable");
const cancelButton = document.getElementById("cancelTable");
const logoutButton = document.getElementById("logoutButton");
const loadingIcon = document.getElementById("loadingIcon");

const tableDiv = document.getElementById("tablesHere");
const bookingDiv = document.getElementById("bookingDiv");
const loginDiv = document.getElementById("loginDiv");

const userName = document.getElementById("userName");

loginTab.addEventListener("click", function(){
	loginTab.className = "tab selected";
	registerTab.className = "tab";
	registerNameDiv.className = "hidden";
	registerPasswordDiv.className = "hidden";
	loginButton.value = "Logga in";
	loginError.innerHTML = "";
	tabToggle = 0;
});

registerTab.addEventListener("click", function(){
	loginTab.className = "tab";
	registerTab.className = "tab selected";
	registerNameDiv.className = "";
	registerPasswordDiv.className = "";
	loginButton.value = "Registrera";
	loginError.innerHTML = "";
	tabToggle = 1;
});

firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		loginDiv.className = "hidden"
		bookingDiv.className = "card"
		if (!newUser) {
			readName();
		}
		newUser = false;
		clearFields();
		loadTables();
	} else {
		bookingDiv.className = "hidden"
		loginDiv.className = "card"
	}
});

function loadTables() {
	user.getIdToken(true).then(function(idToken) { 
		httpGetAsync("/tables/" + idToken, function(text){
			insertHtml("tablesHere", text);
			firebase.database().ref('/active').once('value').then(function(snapshot) {
				var active = snapshot.val();
				firebase.database().ref('/users/' + user.uid + "/tables/" + active).once('value').then(function(snapshot) {
					var table = snapshot.val();
					if (table) {
						newTable = document.getElementById(table);
						if (newTable) {
							booked = table;
							newTable.className = "booked";
							cancelButton.disabled = false;
						}
					}
				});
			});
		});
	});
}

loginPassword.addEventListener("keyup", function(event) {
  if (tabToggle == 0 && event.keyCode == 13) {
	event.preventDefault();
    login();
  }
});
loginButton.addEventListener("click", function() {
	if(tabToggle == 0) {
		login();
	} else {
		register();
	}
});

registerPassword2.addEventListener("keyup", function(event) {
  event.preventDefault();
  if (event.keyCode == 13) {
    register();
  }
});

logoutButton.addEventListener("click", function(){
	firebase.auth().signOut();
});

saveButton.addEventListener("click", function(){
	loadingIcon.style.visibility = "visible";
	firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
		var data = JSON.stringify({"token": idToken, "table": booked});
		httpPostAsync("/book", "text/JSON", data, function(response){
			document.getElementById(booked).className = "booked";
			saveButton.disabled = true;
			cancelButton.disabled = false;
			loadingIcon.style.visibility = "hidden";
		});
	}).catch(function(error) {
		var errorMessage = error.message;
		var errorCode = error.code;
		console.log(errorCode);
		console.log(errorMessage);
		loadingIcon.style.visibility = "hidden";
	});
});

cancelButton.addEventListener("click", function(){
	if (booked != 0) {
		loadingIcon.style.visibility = "visible"
		firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
			var data = JSON.stringify({"token": idToken});
			httpPostAsync("/cancel", "text/JSON", data, function(response){
				document.getElementById(booked).className = "";
				saveButton.disabled = true;
				cancelButton.disabled = true;
				loadingIcon.style.visibility = "hidden";
			});
		}).catch(function(error) {
			var errorMessage = error.message;
			var errorCode = error.code;
			console.log(errorCode);
			console.log(errorMessage);
			loadingIcon.style.visibility = "hidden";
		});
	}
});

function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", theUrl, true);
  xmlHttp.send(null);
}

function httpPostAsync(theUrl, type, data, callback) {
  var xmlHttp = new XMLHttpRequest();
	if (callback) {
		xmlHttp.onreadystatechange = function() {
	    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
	      callback(xmlHttp.responseText);
	  }
	}
	xmlHttp.open("POST", theUrl, true);
	xmlHttp.setRequestHeader('Content-Type', type);
  xmlHttp.send(data);
}

function clearFields() {
	if (booked != 0) {
		var oldTable = document.getElementById(booked);
		oldTable.className = "";
	}
	booked = 0;
	loginForm.reset();
	saveButton.disabled = true;
	cancelButton.disabled = true;
	loginError.innerHTML = "";
	tableDiv.innerHTML = "";
}

function login() {
	var email = loginEmail.value;
	var password = loginPassword.value;
	firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
		// Handle Errors here.
		var errorCode = error.code;
		var errorMessage = error.message;
		if (errorCode == "auth/invalid-email") {
			loginError.innerHTML = "Ogiltig Email";
			return
		}
		if (errorCode == "auth/user-disabled") {
			loginError.innerHTML = "Kontot avstängt";
			return
		}
		if (errorCode == "auth/user-not-found") {
			loginError.innerHTML = "Kontot finns inte";
			return
		}
		if (errorCode == "auth/wrong-password") {
			loginError.innerHTML = "Fel lösenord";
			return
		}
		console.log(errorCode);
		console.log(errorMessage);
	});
}

function register() {
	var name = registerName.value;
	if (name == "") {
		loginError.innerHTML = "Du glömde namn";
		return
	}
	var email = loginEmail.value;
	if (email == "") {
		loginError.innerHTML = "Du glömde email";
		return
	}
	var password = loginPassword.value;
	if (password == "") {
		loginError.innerHTML = "Du glömde lösenord";
		return
	}
	if (password.length < 6) {
		loginError.innerHTML = "Lösenord måste vara 6 bokstäver eller mer";
		return
	}
	var password2 = registerPassword2.value;
	if (password != password2) {
		loginError.innerHTML = "Lösenorden matchar inte";
		return
	}
	newUser = true;
	firebase.auth().createUserWithEmailAndPassword(email, password).then(function(user){
		var user = firebase.auth().currentUser;
		user.getIdToken(true).then(function(token) {
			var data = JSON.stringify({"token": token, "name": name, "email": email});
			httpPostAsync("/rename", "text/JSON", data, false);
		});

	}).catch(function(error) {
		// Handle Errors here.
		var errorCode = error.code;
		var errorMessage = error.message;
		if (errorCode == "auth/invalid-email") {
			loginError.innerHTML = "Ogiltig Email";
			return
		}
		if (errorCode == "auth/email-already-in-use") {
			loginError.innerHTML = "Emailen används redan";
			return
		}

		console.log(errorCode);
		console.log(errorMessage);
	});
	userName.innerHTML = name;
}

function readName() {
	user = firebase.auth().currentUser;
	firebase.database().ref('/users/' + user.uid).once('value').then(function(snapshot) {
		var name = (snapshot.val() && snapshot.val().name) || 'None';
		userName.innerHTML = name;
	});
}

function book(id) {
	newTable = document.getElementById(id);
	if (newTable && newTable.className != "taken") {
		if (booked != 0) {
			var oldTable = document.getElementById(booked);
			oldTable.className = "";
		}
		booked = id;
		newTable.className = "selected";
		saveButton.disabled = false;
	}
}

//script tags inside html which gets added with .inneerHTML is borked, this fixes
function insertHtml(id, html) {
	var ele = document.getElementById(id);
	ele.innerHTML = html;
	var codes = ele.getElementsByTagName("script");
	for(var i = 0; i < codes.length; i++) {
		httpGetAsync(codes[i].src, function(script){ 
			eval(script);
		});
	}
}


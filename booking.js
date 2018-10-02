const config = <%= $firebase_web_config.to_json %>;

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

const VUEApp = new Vue({
	el: "#vue",
	data: {
		loggedIn: false,
		isLogginIn: false,
		isSaving: false,
		isCanceling: false,
		registering: false,
		loginError: false,
		loginEmail: "",
		loginPassword: "",
		registerName: "",
		registerPasswordConfirm: "",
		lanData: false,
		bookedSeat: false,
		selectedSeat: false,
		tab: 0,
		adminShowOnlyBookedUsers: true,
		adminSelectedUser: false,
		adminIsCanceling: false,
		newUser: false,
	},
	methods: {
		onNameKey: (event) => {
			if (event.keyCode === 13) {
				document.getElementById("loginEmail").focus();
			} 
		},
		onEmailKey: (event) => {
			if (event.keyCode === 13) {
				document.getElementById("loginPassword").focus();
			} 
		},
		onPasswordKey: (event) => {
			if (event.keyCode === 13) {
				if (!VUEApp.registering) {
					VUEApp.loginButton()
				} else {
					document.getElementById("loginPassword2").focus();
				}
			}	
		},
		onPassword2Key: (event) => {
			if (event.keyCode === 13) {
				VUEApp.loginButton()
			} 
		},
		loginButton: () => {
			VUEApp.loginError = ""
			VUEApp.isLogginIn = true
			if (VUEApp.registering) {
				VUEApp.register()
			} else if(VUEApp.loggedIn) {
				VUEApp.logout()
			} else {
				VUEApp.login()
			}
		},
		register: () => {
			var name = VUEApp.registerName
			if (name == "") {
				VUEApp.loginError = "Du glömde namn";
				VUEApp.isLogginIn = false;
				return
			}
			var email = VUEApp.loginEmail
			if (email == "") {
				VUEApp.loginError = "Du glömde email";
				VUEApp.isLogginIn = false;
				return
			}
			var password = VUEApp.loginPassword;
			if (password == "") {
				VUEApp.loginError = "Du glömde lösenord";
				VUEApp.isLogginIn = false;
				return
			}
			if (password.length < 6) {
				VUEApp.loginError = "Lösenord måste vara 6 bokstäver eller mer";
				VUEApp.isLogginIn = false;
				return
			}
			var password2 = VUEApp.registerPasswordConfirm;
			if (password != password2) {
				VUEApp.loginError = "Lösenorden matchar inte";
				VUEApp.isLogginIn = false;
				return
			}
			VUEApp.newUser = true;
			firebase.auth().createUserWithEmailAndPassword(email, password).then(function(user){
				var user = firebase.auth().currentUser;
				user.getIdToken(true).then(function(token) {
					var data = JSON.stringify({"token": token, "name": name, "email": email});
					httpPostAsync("/rename", "text/JSON", data, (newData) => {
						VUEApp.loadData(newData)
					});
				});
			}).catch(function(error) {
				VUEApp.isLogginIn = false;
				// Handle Errors here.
				var errorCode = error.code;
				var errorMessage = error.message;
				if (errorCode == "auth/invalid-email") {
					VUEApp.loginError = "Ogiltig Email";
					return
				}
				if (errorCode == "auth/email-already-in-use") {
					VUEApp.loginError = "Emailen används redan";
					return
				}
				console.log(errorCode);
				console.log(errorMessage);
			});
			VUEApp.userName = name;
		},
		logout: () => {
			VUEApp.loadData("false")
			firebase.auth().signOut();
		},
		login: () => {
			firebase.auth().signInWithEmailAndPassword(VUEApp.loginEmail, VUEApp.loginPassword).catch(function(error) {
				// Handle Errors here.
				VUEApp.isLogginIn = false;
				var errorCode = error.code;
				var errorMessage = error.message;
				if (errorCode == "auth/invalid-email") {
					VUEApp.loginError = "Ogiltig Email";
					return
				}
				if (errorCode == "auth/user-disabled") {
					loginError.innerHTML = "Kontot avstängt";
					return
				}
				if (errorCode == "auth/user-not-found") {
					VUEApp.loginError = "Kontot finns inte";
					return
				}
				if (errorCode == "auth/wrong-password") {
					VUEApp.loginError = "Fel lösenord";
					return
				}
				console.log(errorCode);
				console.log(errorMessage);
			});
		},
		cancel: () => {
			VUEApp.isCanceling = true;
			firebase.auth().currentUser.getIdToken(true).then((idToken) => {
				var data = JSON.stringify({"token": idToken});
				httpPostAsync("/cancel", "text/JSON", data, (newData) =>{
					VUEApp.loadData(newData)
				});
			}).catch(function(error) {
				VUEApp.isCanceling = false;
				var errorMessage = error.message;
				var errorCode = error.code;
				console.log(errorCode);
				console.log(errorMessage);
			});
		},
		adminCancel: () => {
			VUEApp.adminIsCanceling = true;
			firebase.auth().currentUser.getIdToken(true).then((idToken) => {
				var data = JSON.stringify({"token": idToken, "adminForced" : true, "id": VUEApp.adminSelectedUser['id']});
				httpPostAsync("/cancel", "text/JSON", data, (newData) =>{
					VUEApp.loadData(newData)
					VUEApp.adminIsCanceling = false;
				});
			}).catch(function(error) {
				VUEApp.adminIsCanceling = false;
				var errorMessage = error.message;
				var errorCode = error.code;
				console.log(errorCode);
				console.log(errorMessage);
			});
		},
		save: () => {
			VUEApp.isSaving = true;
			firebase.auth().currentUser.getIdToken(true).then((idToken) => {
				var data = JSON.stringify({"token": idToken, "table": VUEApp.selectedSeat});
				httpPostAsync("/book", "text/JSON", data, (newData) => {
					VUEApp.loadData(newData)
				});
			}).catch(function(error) {
				VUEApp.isSaving = false;
				var errorMessage = error.message;
				var errorCode = error.code;
				console.log(errorCode);
				console.log(errorMessage);
			});
		},
		loadData: (data) => {
			VUEApp.loggedIn = true
			VUEApp.isLogginIn = false
			VUEApp.isSaving = false
			VUEApp.isCanceling = false
			VUEApp.registering = false
			VUEApp.loginError = false
			VUEApp.loginEmail = ""
			VUEApp.loginPassword = ""
			VUEApp.registerName = ""
			VUEApp.registerPasswordConfirm = ""
			VUEApp.lanData = JSON.parse(data)
			VUEApp.bookedSeat = VUEApp.lanData.seat
			VUEApp.selectedSeat = false
			VUEApp.adminSelectedUser = false,
			VUEApp.adminIsCanceling = false,
			VUEApp.newUser = false
		},
		downloadExcel: () => {
			firebase.auth().currentUser.getIdToken(true).then((idToken) => {
				var link = document.createElement("a");
				link.href = "/lanexcel/" + idToken;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
				delete link;
			})
		}
	},
	mounted: () => {
		firebase.initializeApp(config);
		firebase.auth().onAuthStateChanged(function(user) {
			if (user && !VUEApp.newUser) {
				VUEApp.isLogginIn = true;
				user.getIdToken(true).then((idToken) => {
					httpGetAsync("/landata/" + idToken, function(data){
						VUEApp.loadData(data);
					});
				})
			} else {
				VUEApp.loggedIn = false;
			}
		});
	}
})
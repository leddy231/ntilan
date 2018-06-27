
const tablesTab = document.getElementById("tablesTab");
const usersTab = document.getElementById("usersTab");
const setingsTab = document.getElementById("setingsTab");

const tablesDiv = document.getElementById("tablesDiv");
const usersDiv = document.getElementById("usersDiv");
const setingsDiv = document.getElementById("setingsDiv");

tablesTab.addEventListener("click", function(){
	tablesTab.className = "tab selected";
    usersTab.className = "tab";
    settingsTab.className = "tab";

	tablesDiv.className = "";
    usersDiv.className = "hidden";
    settingsDiv.className = "hidden";
});

usersTab.addEventListener("click", function(){
	tablesTab.className = "tab";
    usersTab.className = "tab selected";
    settingsTab.className = "tab";

	tablesDiv.className = "hidden";
    usersDiv.className = "";
    settingsDiv.className = "hidden";
});

settingsTab.addEventListener("click", function(){
	tablesTab.className = "tab";
    usersTab.className = "tab";
    settingsTab.className = "tab selected";

	tablesDiv.className = "hidden";
    usersDiv.className = "hidden";
    settingsDiv.className = "";
});

window.adminCancel = function(id) {
    loadingIcon.style.visibility = "visible";
    firebase.auth().currentUser.getIdToken(true).then(function(idToken) {
        var data = JSON.stringify({"token": idToken, "adminForced" : true, "id": id});
        httpPostAsync("/cancel", "text/JSON", data, function(response){
            user.getIdToken(true).then(function(idToken) { 
                httpGetAsync("/tables/" + idToken, function(text){
                    insertHtml("tablesHere", text);
                    loadingIcon.style.visibility = "hidden";
                });
            });
        });
    }).catch(function(error) {
        console.log(errorCode);
        console.log(errorMessage);
    });
}
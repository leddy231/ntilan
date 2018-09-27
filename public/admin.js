


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
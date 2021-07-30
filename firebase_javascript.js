let ref_data = firebase.database().ref('Rocks');
let ref_photos = firebase.storage().ref('Photos');

// Reading Data

ref_data.on("value", function (snapshot) {
    let data_rocks = snapshot.val().Items;
    let data_reviews = snapshot.val().Reviews;
    let max_id = snapshot.val().max_id || 0;;
    console.log(data_rocks);
    $("#firebase_table").find("tbody").find("tr").remove();
    for (item in data_rocks) {
        try {
            let row = $("<tr></tr>");
            let td_id = $("<td></td>").text(item);
            let td_name = $("<td></td>").text(data_rocks[item].Name);
            let td_value = $("<td></td>").text(data_rocks[item].Value);
            row.append(td_id, td_name, td_value);
            $("#firebase_table tbody").append(row);
        } catch (error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            $("#alertMessage").find("span").text(errorMessage);
            $("#alertMessage").attr("class", "alert alert-danger");
            $("#alertMessage").fadeIn();
            setTimeout(function () {
                $("#alertMessage").fadeOut();
            }, 5000);
        }
    }


    $('.carousel-inner').html("");
    for (item in data_reviews) {
        $('<div class="carousel-item text-center p-4"><blockquote>' + data_reviews[item].Value + ' <cite>' + data_reviews[item].Name + '</cite></blockquote></div>').appendTo('.carousel-inner');
    }
    $('.carousel-item').first().addClass('active');
}, function (error) {
    console.log("Error: " + error.code);
});

// Writing Data

function addRock() {
    ref_data.once('value').then(function (snapshot) {
        let data = snapshot.val();
        let max_id = data.max_id || 0;;
        ref_data.child('Items/' + (max_id + 1)).set({
            "Name": $("#rockName").val(),
            "Value": $("#rockPrice").val()
        });
        ref_data.child('max_id').set(max_id + 1);
        $('#exampleModal1').modal('toggle');
    });
}

// Reading Images

loadImages();
var imageUrls = [];

function loadImages() {
    imageUrls = [];
    // Now we get the references of these images
    ref_photos.listAll().then(function (result) {
        result.items.forEach(function (imageRef) {
            getUrlAndDisplay(imageRef, result.items.length);
        });

    }).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        $("#alertMessage").find("span").text(errorMessage);
        $("#alertMessage").attr("class", "alert alert-danger");
        $("#alertMessage").fadeIn();
        setTimeout(function () {
            $("#alertMessage").fadeOut();
        }, 5000);
    });
}

function getUrlAndDisplay(imageRef, totalImages) {
    imageRef.getDownloadURL().then(function (url) {
        imageRef.getMetadata()
            .then((metadata) => {
                imageUrls.push(url);
                let div = $("<div></div>");
                div.addClass("col-md-3");
                let aTag = $("<a></a>");
                aTag.attr("href", url);
                aTag.attr("title", metadata.customMetadata ? metadata.customMetadata.data : "");
                let imgTag = $("<img></img>");
                imgTag.attr("src", url);
                imgTag.addClass("img-thumbnail");
                imgTag.attr("alt", "Image");
                aTag.append(imgTag);
                let spanTag = $("<span></span>");
                spanTag.text(metadata.customMetadata ? metadata.customMetadata.data : "");
                div.append(aTag);
                div.append(spanTag);
                $(".images").append(div);
                if (imageUrls.length == totalImages)
                    $('.images a').simpleLightbox();
                // SimpleLightbox.open({
                // items: imageUrls
                // });
            })
            .catch((error) => {
                var errorCode = error.code;
                var errorMessage = error.message;
                $("#alertMessage").find("span").text(errorMessage);
                $("#alertMessage").attr("class", "alert alert-danger");
                $("#alertMessage").fadeIn();
                setTimeout(function () {
                    $("#alertMessage").fadeOut();
                }, 5000);
            });
    }).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        $("#alertMessage").find("span").text(errorMessage);
        $("#alertMessage").attr("class", "alert alert-danger");
        $("#alertMessage").fadeIn();
        setTimeout(function () {
            $("#alertMessage").fadeOut();
        }, 5000);
    });
}

// Writing Images

function addImage() {
    ref_data.once('value').then(function (snapshot) {
        let data = snapshot.val();
        let max_photo_id = data.max_photo_id;
        var metadata = {
            customMetadata: {
                data: $('#fileData').val()
            }
        };
        file = $('#myFile')[0].files[0];
        ref_photos.child((max_photo_id + 1).toString()).put(file, metadata);
        ref_data.child('max_photo_id').set(max_photo_id + 1);
        $('#exampleModal2').modal('toggle');
        setTimeout(function () {
            $(".images").html("");
            loadImages();
        }, 5000);

    });
}

// Authentication

//Create User with Email and Password

//   var email="someone@example.com";
//   var password="password";
//   firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
//     // Handle Errors here.
//     var errorCode = error.code;
//     var errorMessage = error.message;
//     console.log(errorCode);
//     console.log(errorMessage);
//   });

function logOut() {
    firebase.auth().signOut().then(function () {
        console.log('User Logged Out!');
        showHideFields(false);
    }).catch(function (error) {
        var errorCode = error.code;
        var errorMessage = error.message;
        $("#alertMessage").find("span").text(errorMessage);
        $("#alertMessage").attr("class", "alert alert-danger");
        $("#alertMessage").fadeIn();
        setTimeout(function () {
            $("#alertMessage").fadeOut();
        }, 5000);
    });
}


function signIn() {
    let email = $("#email").val();
    let password = $("#password").val();
    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            var user = userCredential.user;
            showHideFields(true);
            $('#exampleModal3').modal('toggle');
        })
        .catch((error) => {
            var errorCode = error.code;
            var errorMessage = error.message;
            $("#alertMessage").find("span").text(errorMessage);
            $("#alertMessage").attr("class", "alert alert-danger");
            $("#alertMessage").fadeIn();
            setTimeout(function () {
                $("#alertMessage").fadeOut();
            }, 5000);
        });
}

firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
        showHideFields(true);
    } else {
        showHideFields(false);
    }
});

function showHideFields(status) {
    if (status) {
        $("#signIn").hide();
        $("#addRock").show();
        $("#addImage").show();
        $("#logOut").show();
        $("#alertMessage").find("span").text("You have successfully signed in!");
        $("#alertMessage").attr("class", "alert alert-success");
        $("#alertMessage").fadeIn();
        setTimeout(function () {
            $("#alertMessage").fadeOut();
        }, 5000);
    } else {
        $("#signIn").show();
        $("#addRock").hide();
        $("#addImage").hide();
        $("#logOut").hide();
        $("#alertMessage").find("span").text("You have successfully logged out!");
        $("#alertMessage").attr("class", "alert alert-success");
        $("#alertMessage").fadeIn();
        setTimeout(function () {
            $("#alertMessage").fadeOut();
        }, 5000);
    }
}

// Writing Reviews

function submitReview() {
    ref_data.once('value').then(function (snapshot) {
        let data = snapshot.val();
        let max_id = data.max_reviews_id || 0;;
        ref_data.child('Reviews/' + (max_id + 1)).set({
            "Name": $("#reviewer_fname").val() + " " + $("#reviewer_lname").val(),
            "Value": $("#review").val()
        });
        ref_data.child('max_reviews_id').set(max_id + 1);
        $('#exampleModal4').modal('toggle');
    });
}
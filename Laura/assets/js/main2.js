//Global declaration
let ref_pending_reviews = firebase.database().ref('reviews/pending_reviews');
let ref_approved_reviews = firebase.database().ref('reviews/approved_reviews');
let portfolio_last_used_id = firebase.database().ref('portfolio_last_used_id');
let ref_photos = firebase.storage().ref('photos');
let portfolio_photos = {};
let pending_reviews = {};
let approved_reviews = {};
let profilePhotos = {};
const photoAlbumTypes = {
    PROFILE: 1,
    PORTFOLIO: 2
}
loadPhotos(photoAlbumTypes.PROFILE);
loadPhotos(photoAlbumTypes.PORTFOLIO);

function showMessage(message, className) {
    $("#alertMessage").find("span").text(message);
    $("#alertMessage").attr("class", className + " bring-forward");
    $("#alertMessage").fadeIn();
    setTimeout(function() {
        $("#alertMessage").fadeOut();
        $("#alertMessage").attr("class", "");
    }, 5000);
}

// If review is not null, it's a pending review that you're approving
function submitReview(review = null) {
    let ref_review = review ? ref_approved_reviews : ref_pending_reviews;
    ref_review.once('value').then(function(snapshot) {
        let data = snapshot.val();
        let id = review ? review.id : data.last_used_id + 1;
        // If adding a pending review
        if (!review) {
            //If user uploaded a profile photo
            if ($("#profilePhoto").val()) {
                uploadPhoto(id, $("#profilePhoto")[0].files[0], ref_photos.child('testimonials'));
            }
            try {
                ref_review.child('last_used_id').set(id);
            } catch (error) {
                showMessage(error.message, "alert alert-danger");
            }
        }
        try {
            ref_review.child(id).set({
                "name": review ? review.name : $("#reviewer_fname").val() + " " + $("#reviewer_lname").val(),
                "phone": review ? review.phone : $("#reviewer_phone").val(),
                "review": review ? review.review : $("#review").val()
            });
            let alertMessage = review ? "Review successfully approved!" : "Review successfully submitted for approval!";
            showMessage(alertMessage, "alert alert-success");
        } catch (error) {
            showMessage(error.message, "alert alert-danger");
        }
    }).catch(function(error) {
        showMessage(error.message, "alert alert-danger");
    });
}

// If snapshot is present, we've just pulled in these reviews, else we are just repopulating retrieved reviews with photos
function populate_approved_reviews(snapshot = null) {
    $(".swiper-container").html("");
    $(".swiper-container").append($("<div class='swiper-wrapper'></div>"));
    $(".swiper-container").append($("<div class='swiper-pagination'></div>"));
    $("#approved_reviews").find("tbody").find("tr").remove();
    approved_reviews = snapshot ? snapshot.val() : approved_reviews;
    if (approved_reviews) {
        for ([key, value] of Object.entries(approved_reviews)) {
            if (key != "last_used_id") {
                let swiperSlide = $("<div></div>");
                swiperSlide.attr("class", "swiper-slide");
                let testimonialItem = $("<div></div>");
                testimonialItem.attr("class", "testimonial-item");
                let img = $("<img></img>");
                img.attr({
                    "src": profilePhotos[key] ? profilePhotos[key] : "assets/img/testimonials/avatar.png",
                    "class": "testimonial-img",
                    "alt": ""
                });
                let h3 = $("<h3></h3>").text(value.name);
                let h4 = $("<h4></h4>").text("Customer");
                let p = $("<p></p>");
                let iLeft = $('<i class="bx bxs-quote-alt-left quote-icon-left"></i>');
                let review = value.review;
                let iRight = $('<i class="bx bxs-quote-alt-right quote-icon-right"></i>');
                p.append(iLeft, review, iRight);
                testimonialItem.append(img, h3, h4, p);
                swiperSlide.append(testimonialItem);
                $(".swiper-wrapper").append(swiperSlide);


                let row = $("<tr></tr>");
                let td_name = $("<td></td>").text(value.name);
                let td_review = $("<td></td>").text(value.review);
                let td_actions = $("<td></td>");
                let remove = $("<button class='actionButton remove' onclick='removeReview(" + key + ", true, false)'>Remove</button>");
                td_actions.append(remove);
                row.append(td_name, td_review, td_actions);
                $("#approved_reviews tbody").append(row);
            }
        }
        startTestimonialSlider();
    }
}

ref_approved_reviews.on("value", function(snapshot) {
    try {
        populate_approved_reviews(snapshot);
    } catch (error) {
        showMessage(error.message, "alert alert-danger");
    }
});

ref_pending_reviews.on("value", function(snapshot) {
    try {
        $("#pending_reviews").find("tbody").find("tr").remove();
        pending_reviews = snapshot.val();
        for ([key, value] of Object.entries(pending_reviews)) {
            if (key != "last_used_id") {
                let row = $("<tr></tr>");
                let td_name = $("<td></td>").text(value.name);
                let td_review = $("<td></td>").text(value.review);
                let td_actions = $("<td></td>");
                let approve = $("<button class='actionButton approve' onclick='approveReview(" + key + ")'>Approve</button>");
                let remove = $("<button class='actionButton remove' onclick='removeReview(" + key + ", false, true)'>Remove</button>");
                td_actions.append(approve, ' | ', remove);
                row.append(td_name, td_review, td_actions);
                $("#pending_reviews tbody").append(row);
            }
        }
    } catch (error) {
        showMessage(error.message, "alert alert-danger");
    }
});

//type 1 = profile, 2 = portfolio
function loadPhotos(type) {
    // Now we get the references of these images
    if (type == photoAlbumTypes.PROFILE) {
        $(".swiper-container").html("");
        profilePhotos = {};
        ref_photos.child('testimonials').listAll().then(function(result) {
            result.items.forEach(function(imageRef) {
                getUrlAndDisplay(imageRef, type, result.items.length);
            });
        }).catch(function(error) {
            showMessage(error.message, "alert alert-danger");
        });
    } else {
        let count = {};
        portfolio_photos = {};
        $(".portfolio-container").html("");
        ref_photos.child('portfolio').listAll().then(function(result) {
            result.prefixes.forEach(function(folder, folder_index, folders) {
                folder.listAll().then(function(folder_result) {
                    folder_result.items.forEach(function(imageRef) {
                        count[folder.fullPath.split("/")[2]] = folder_result.items.length;
                        if (folder_index == (folders.length - 1))
                            portfolio_photos.count = count;
                        getUrlAndDisplay(imageRef, type, folder_result.items.length);
                    });
                });
            });
        }).catch(function(error) {
            showMessage(error.message, "alert alert-danger");
        });
    }
}

function getUrlAndDisplay(imageRef, type, totalImages) {
    imageRef.getDownloadURL().then(function(url) {
        imageRef.getMetadata()
            .then((metadata) => {
                let photoAlbum = null;
                if (type == 1) {
                    photoAlbum = profilePhotos;
                    photoAlbum[metadata.name] = url;
                    if (Object.keys(photoAlbum).length == totalImages)
                        populate_approved_reviews();
                } else {
                    photoAlbum = portfolio_photos;
                    let subfolder = metadata.fullPath.split('/')[2];
                    if (!(subfolder in photoAlbum))
                        photoAlbum[subfolder] = {};
                    photoAlbum[subfolder][metadata.name] = {};
                    photoAlbum[subfolder][metadata.name].url = url;
                    photoAlbum[subfolder][metadata.name].info = metadata.customMetadata.data || "";
                    let done = true;
                    if ("count" in photoAlbum) {
                        for (let key in photoAlbum.count) {
                            if (!(key in photoAlbum && Object.keys(photoAlbum[key]).length == photoAlbum.count[key])) {
                                done = false;
                                break;
                            }
                        }
                        if (done)
                            populate_portfolio();
                    }
                }
            })
            .catch((error) => {
                showMessage(error.message, "alert alert-danger");
            });
    }).catch(function(error) {
        showMessage(error.message, "alert alert-danger");
    });
}

function approveReview(reviewId) {
    let pending_review = pending_reviews[reviewId];
    pending_review.id = reviewId;
    submitReview(pending_review);
    removeReview(reviewId);
    loadPhotos(photoAlbumTypes.PROFILE);
}

function removeReview(reviewId, approved = false, rejected = false) {
    let review = approved ? ref_approved_reviews.child(reviewId) : ref_pending_reviews.child(reviewId);
    if (approved || rejected) {
        try {
            removePhoto(reviewId, ref_photos.child('testimonials'));
        } catch (error) { //do nothing
        }
    }
    try {
        review.remove();
    } catch (error) {
        showMessage(error.message, "alert alert-danger");
    }
}

function uploadPhoto(id, photo, ref, info = "") {
    var metadata = {
        customMetadata: {
            data: info
        }
    };
    try {
        ref.child(id.toString()).put(photo, metadata);
    } catch (error) {
        showMessage(error.message, "alert alert-danger");
    }
}

function removePhoto(id, ref = null, type = null) {
    if (!ref)
        ref = ref_photos.child("portfolio/" + type);
    try {
        ref.child(id.toString()).delete();
    } catch (error) {
        //Photo doesn't exist, do nothing
    }
    if (type) {
        setTimeout(function() {
            loadPhotos(photoAlbumTypes.PORTFOLIO);
        }, 5000);
    }
}

function populate_portfolio() {
    let container = $(".portfolio-container");
    container.html("");
    for (let type in portfolio_photos) {
        if (type != "count") {
            for (let id in portfolio_photos[type]) {
                let div_filter = $("<div class='col-lg-4 col-md-6 portfolio-item filter-" + type + "'></div>");
                let div_img = $("<div class='portfolio-img'></div>");
                let img = $("<img src='" + portfolio_photos[type][id].url + "' class='img-fluid' alt=''></img>");
                let div_info = $("<div class='portfolio-info'></div>");
                let h4 = $("<h4>" + type + "</h4>");
                let p = $("<p>" + portfolio_photos[type][id].info + "</p>");
                let a_img = $("<a href='" + portfolio_photos[type][id].url + "' data-description='" + portfolio_photos[type][id].info + "' data-type='image' data-effect='fade' data-gallery='portfolioGallery' class='portfolio-lightbox' title='" + type + "'><i class='bi bi-arrows-angle-expand'></i></a>");
                let button1 = $("<button type='button' class='yellow-button transparent add-new d-flex align-items-center justify-content-center'></button>");
                let button2 = $("<button type='button' class='auth yellow-button add-new d-flex align-items-center justify-content-center' onclick='populateDeleteImageConfirmation(\"" + type + "\"," + id + ")' data-bs-toggle='modal' data-bs-target='#deleteImageConfirmationModal'><i class='bi bi-dash'></i></button>");
                button1.append(a_img);
                div_info.append(h4, p, button2, button1);
                div_img.append(img);
                div_filter.append(div_img, div_info);
                container.append(div_filter);
            }
        }
    }
    setTimeout(function() {
        startPortfolioSlider();
    }, 3000);
}

function populateDeleteImageConfirmation(type, id) {
    $("#deleteImageConfirmationModal #photo").attr("src", portfolio_photos[type][id].url);
    $("#deleteImageConfirmationModal #category_").text(type);
    $("#deleteImageConfirmationModal #description_").text(portfolio_photos[type][id].info || "-");
    $("#deleteImageConfirmationModal #confirm").attr("onclick", "removePhoto('" + id + "'," + null + ",'" + type + "')");
}

function login(creds) {
    let email = creds.login_email.value;
    let password = creds.login_password.value;
    firebase.auth().signInWithEmailAndPassword(email, password).then((userCredential) => {
        // Signed in
        // var user = userCredential.user;
        showHideFields(true);
    }).catch((error) => {
        showMessage(error.message, "alert alert-danger");
    });
}

function logOut() {
    firebase.auth().signOut().then(function() {
        showHideFields(false);
    }).catch(function(error) {
        showMessage(error.message, "alert alert-danger");
    });
}

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        showHideFields(true);
    } else {
        showHideFields(false);
    }
});

function showHideFields(show = false) {
    if (show) {
        $("#log-in").hide();
        $(".auth").show();
        showMessage("You have successfully logged in!", "alert alert-success");
    } else {
        $("#log-in").show();
        $(".auth").attr("style", "display: none !important");
        showMessage("You have successfully logged out!", "alert alert-success");
    }
}

function addToPortfolio() {
    let photo = $("#portfolioPhoto")[0].files[0];
    let category = $("#category").val();
    let description = $("#description").val();
    let ref = ref_photos.child('portfolio/' + category);
    let id = null;
    portfolio_last_used_id.once('value').then(function(snapshot) {
        id = snapshot.val() + 1;
        uploadPhoto(id, photo, ref, description);
        try {
            portfolio_last_used_id.set(id);
        } catch (error) {
            showMessage(error.message, "alert alert-danger");
        }
        setTimeout(function() {
            loadPhotos(photoAlbumTypes.PORTFOLIO);
        }, 5000);
    });
}
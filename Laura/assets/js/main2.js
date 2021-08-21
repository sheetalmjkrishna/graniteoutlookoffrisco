//Global declaration
let ref_pending_reviews = firebase.database().ref('reviews/pending_reviews');
let ref_approved_reviews = firebase.database().ref('reviews/approved_reviews');
let portfolio_last_used_id = firebase.database().ref('portfolio_last_used_id');
let ref_profile_photos = firebase.storage().ref('photos/testimonials');
let ref_kitchen_photos = firebase.storage().ref('photos/kitchen');
let ref_bathroom_photos = firebase.storage().ref('photos/bathroom');
let ref_other_photos = firebase.storage().ref('photos/other');
let pending_reviews = {};
let approved_reviews = {};
let profilePhotos = {};
loadProfilePhotos();

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
function submitReview(review=null) {
    debugger;
    ref_review = review ? ref_approved_reviews : ref_pending_reviews;
    ref_review.once('value').then(function(snapshot) {
        let data = snapshot.val();
        let id = review ? review.id : data.last_used_id + 1;
        // If adding a pending review
        if (!review) {
            //If user uploaded a profile photo
            if ($("#profilePhoto").val()) {
                uploadPhoto(id, $("#profilePhoto")[0].files[0], ref_profile_photos);
            }
            ref_review.child('last_used_id').set(id);
        }
        ref_review.child(id).set({
            "name": review ? review.name : $("#reviewer_fname").val() + " " + $("#reviewer_lname").val(),
            "phone": review ? review.phone : $("#reviewer_phone").val(),
            "review": review ? review.review : $("#review").val()
        });
        let alertMessage = review ? "Review successfully approved!" : "Review successfully submitted for approval!";
        showMessage(alertMessage, "alert alert-success");
    }).catch(function(error) {
        showMessage(error.message, "alert alert-danger")
    });
}

// If snapshot is present, we've just pulled in these reviews, else we are just repopulating retrieved reviews with photos
function populate_approved_reviews(snapshot=null) {
    $(".swiper-container").html("");
    $(".swiper-container").append($("<div class='swiper-wrapper'></div>"));
    $(".swiper-container").append($("<div class='swiper-pagination'></div>"));
    $("#approved_reviews").find("tbody").find("tr").remove();
    approved_reviews = snapshot ? snapshot.val() : approved_reviews;
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

function loadProfilePhotos() {
    // Now we get the references of these images
    ref_profile_photos.listAll().then(function(result) {
        result.items.forEach(function(imageRef) {
            getUrlAndDisplay(imageRef, result.items.length);
        });
    }).catch(function(error) {
        showMessage(error.message, "alert alert-danger");
    });
}

function getUrlAndDisplay(imageRef, totalImages) {
    imageRef.getDownloadURL().then(function(url) {
        imageRef.getMetadata()
            .then((metadata) => {
                debugger;
                profilePhotos[metadata.name] = url;
                if (Object.keys(profilePhotos).length == totalImages)
                    populate_approved_reviews();
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
    pending_review["id"] = reviewId;
    submitReview(pending_review);
    removeReview(reviewId);
    loadProfilePhotos();
}

function removeReview(reviewId, approved=false, rejected=false) {
    debugger;
    let review = approved ? ref_approved_reviews.child(reviewId) : ref_pending_reviews.child(reviewId);
    if (approved || rejected) {
        try{
            removePhoto(reviewId, ref_profile_photos);
        }
        catch{//do nothing
        };
        
    }
    review.remove();
}

function uploadPhoto(id, photo, ref, info="") {
    debugger;
    var metadata = {
        customMetadata: {
            data: info
        }
    };
    ref.child(id.toString()).put(photo, metadata);
}

function removePhoto(id, ref) {
    debugger;
    ref.child(id.toString()).delete();
}

function addToPortfolio(){
    let photo = $("#portfolioPhoto")[0].files[0];
    let category = $("#category").val();
    let description = $("#description").val();
    let ref = null;
    switch(category){
        case "kitchen":
            ref = ref_kitchen_photos;
            break;
        case "bathroom":
            ref = ref_bathroom_photos;
            break;
        case "other":
            ref = ref_other_photos;
            break;
    }
}
/**
 * Testimonials slider
 */
function startTestimonialSlider(argument) {
    new Swiper('.testimonials-slider', {
        speed: 600,
        loop: true,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false
        },
        slidesPerView: 'auto',
        pagination: {
            el: '.swiper-pagination',
            type: 'bullets',
            clickable: true
        }
    });
}
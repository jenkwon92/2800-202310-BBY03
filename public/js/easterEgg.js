$(document).ready(function () {
  var clickCount = 0;                                   //Initialize the click count

  $(document).on("click", "#hello_plane", function () { //Attaches a click event handler
    clickCount++;                                       //Increments the value of the variable clickCount by 1.

    if (clickCount === 3) {             
      sound.play();                                     // Play the plane sound
      createSky();                                      // Create sky section dynamically
      placeClouds();                                    // Create and place clouds randomly
      startPlaneMovement();                             // Start the plane movement
    } else if (clickCount === 4) {
      stopPlaneMovement();                              // Stop the plane movement
      removeSky();                                      // Remove the sky container
    }
  });

  function removeSky() {                                // Function that removes the sky element from the body.
    $("#sky").remove();                                 // Remove the sky container
  } 

  function createSky() {                                // Function to create the sky elements.
    var skyDiv = $("<div>").attr("id", "sky");          // Create a new div element for the sky container
    var cloudsDiv = $("<div>").attr("id", "clouds");    // Create a new div element for the clouds container
    var planeImg = $("<img>").attr({                    // Create a new img element for the plane
      id: "plane",
      src: "/easterEgg/plane.png"
    });

    var cloudImgs = [];
    for (var i = 1; i <= 6; i++) {                      // Create the special cloud elements.
      var cloudImg = $("<img>")
        .addClass("cloud")
        .attr("src", "/easterEgg/cloud" + i + ".png");  // Create new img elements for the clouds
      cloudImgs.push(cloudImg);
    }
    skyDiv.append(cloudsDiv);                           // Append the clouds container to the sky container
    skyDiv.append(planeImg);                            // Append the plane to the sky container
    skyDiv.append(cloudImgs);                           // Append the clouds to the sky container
    $("body").append(skyDiv);                           // Append the sky container to the body
  }

  function placeClouds() {
    const numClouds = Math.floor(Math.random() * 100) + 1; // Generate a random number of clouds between 1 and 100
    for (let i = 0; i < numClouds; i++) {
      const newCloud = $("<img>")
        .addClass("cloud")
        .attr("src", "/easterEgg/cloud6.png");            // Create a new cloud image element
      $("#clouds").append(newCloud);                      // Append the cloud to the "clouds" container element
    }
    $(".cloud").each(function () {
      const cloud = $(this);                                                // Get the current cloud element
      const cloudX = Math.random() * ($("#sky").width() - cloud.width());   // Generate a random X position within the sky container
      const cloudY = Math.random() * ($("#sky").height() - cloud.height()); // Generate a random Y position within the sky container
      cloud.css({ left: cloudX, top: cloudY });                             // Set the cloud's position
      if (cloudX > $(window).width()) {
        cloud.hide();                                                       // Hide the cloud if it's initially positioned outside the screen
      }
    });
  }

  let planeInterval;
  const sound = new Audio("/easterEgg/plane.wav"); // Create a new Audio object for the plane sound

  function startPlaneMovement() {
    const plane = $("#plane");                    // Get the plane element
    const screenWidth = $(window).width();        // Get the screen width
    const planeWidth = plane.width();             // Get the width of the plane image
    let planeX = -planeWidth;                     // Set the initial position of the plane to the left of the screen

    planeInterval = setInterval(movePlane, 60);

    function movePlane() {
      planeX += 2.5;                              // Increment the plane's X position to move it to the right
      if (planeX + planeWidth >= screenWidth) {
        stopPlaneMovement();                      // Stop the plane movement
        removeSky();                              // Remove the sky container
      }
      plane.css("left", planeX);                  // Update the plane's position
    }
  }

  function stopPlaneMovement() {
    clearInterval(planeInterval); // Stop the plane movement interval
    sound.pause();                // Pause the plane sound
  }

  function planeHide() {// Hide the plane and all the clouds
    $("#plane").hide(); // Hide the plane
    $(".cloud").hide(); // Hide all the clouds
  }
});

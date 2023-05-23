$(document).ready(function () {
  const plane = $("#plane");                        // Get the plane element
  const screenWidth = $(window).width();            // Get the screen width
  const planeWidth = plane.width();                 // Get the width of the plane image
  let planeX = -planeWidth;                         // Set the initial position of the plane to the left of the screen
  const sound = new Audio('/easterEgg/plane.wav');            // Create a new Audio object for the plane sound

  function movePlane() {
    planeX += 2.5;                                  // Increment the plane's X position to move it to the right
    if (planeX + planeWidth >= screenWidth) {
      planeX = screenWidth - planeWidth;            // Limit the plane's position to the right edge of the screen
      plane.hide();                                 // Hide the plane when it reaches the right edge
      $(".cloud").hide();                           // Hide all the clouds
      clearInterval(planeInterval);                 // Stop the plane movement interval
      clickCount = 0;     
       removeEasterEgg();
    }
    plane.css("left", planeX);                      // Update the plane's position
  }

  function placeClouds() {
    const numClouds = Math.floor(Math.random() * 100) + 1;                                  // Generate a random number of clouds between 1 and 100
    for (let i = 0; i < numClouds; i++) {
      const newCloud = $("<img>").addClass("cloud").attr("src", "/easterEgg/cloud6.png");   // Create a new cloud image element
      newCloud.hide();                                                                      // Hide the cloud initially
      $("#clouds").append(newCloud);                                                        // Append the cloud to the "clouds" container element
    }
    $(".cloud").each(function () {
      const cloud = $(this);                                                                // Get the current cloud element
      const cloudX = Math.random() * ($("#sky").width() - cloud.width());                   // Generate a random X position within the sky container
      const cloudY = Math.random() * ($("#sky").height() - cloud.height());                 // Generate a random Y position within the sky container
      cloud.css({ left: cloudX, top: cloudY });                                             // Set the cloud's position
      if (cloudX > screenWidth) {
        cloud.hide();                                                                       // Hide the cloud if it's initially positioned outside the screen
      }
    });
  }

  let planeInterval;                                // Variable to store the interval ID for the plane movement
  let clickCount = 0;                               // Counter to keep track of the number of clicks

  $("#hello_plane").click(function () {
    clickCount++;                                   // Increment the click count
    console.log(clickCount);
    if (clickCount === 3) {                         // When a user clicks the button third times.
      placeClouds();                                // Place the clouds on the third click
      plane.show();                                 // Show the plane
      $(".cloud").show();                           // Show all the clouds
      sound.play();                                 // Play the plane sound
      planeInterval = setInterval(movePlane, 50);   // Start the interval for plane movement
    } else if (clickCount === 4) {                  // When a user clicks the button fourth times.
      plane.hide();                                 // Hide the plane on the fourth click
      $(".cloud").hide();                           // Hide all the clouds
      clearInterval(planeInterval);                 // Stop the plane movement interval
      sound.pause();
      removeEasterEgg();                            // Pause the plane sound
      clickCount = 0;
    }
    return false;                                   // Prevent the default click behavior
  });

  // Function to remove the created HTML structure
  function removeEasterEgg() {
    var skyDiv = document.getElementById('sky');
    if (skyDiv) {
      skyDiv.parentNode.removeChild(skyDiv);
    }
  }

  function createEasterEgg() {
  // Create the necessary elements
  var skyDiv = document.createElement('div');
  skyDiv.id = 'sky';

  var cloudsDiv = document.createElement('div');
  cloudsDiv.id = 'clouds';

  var planeImg = document.createElement('img');
  planeImg.id = 'plane';
  planeImg.src = '/easterEgg/plane.png';

  var cloudImgs = [];
  var cloudSrcs = [
    '/easterEgg/cloud1.png',
    '/easterEgg/cloud2.png',
    '/easterEgg/cloud3.png',
    '/easterEgg/cloud4.png',
    '/easterEgg/cloud5.png',
    '/easterEgg/cloud6.png'
  ];
  
  for (var i = 0; i < cloudSrcs.length; i++) {
    var cloudImg = document.createElement('img');
    cloudImg.classList.add('cloud');
    cloudImg.src = cloudSrcs[i];
    cloudImgs.push(cloudImg);
  }

  // Append elements to the document
  cloudsDiv.append(...cloudImgs);
  skyDiv.append(cloudsDiv, planeImg);
  document.body.appendChild(skyDiv);
}
});
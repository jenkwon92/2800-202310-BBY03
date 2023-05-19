$(document).ready(function () {
  // My Courses carousel function
  // Slide For My Courses
  $('.my_courses').slick({                         // Initialize Slick carousel on elements with class 'my_courses'
    slidesToShow: 3,                               // Display 3 slides at a time
    arrows: true,                                  // Enable arrow navigation
    autoplay: true,                                // Autoplay the carousel
    dots: true,                                    // Show dots navigation
    responsive: [                                  // Define responsive breakpoints for different screen sizes
      {
        breakpoint: 800,                           // For screens with a maximum width of 800px
        settings: {                                // Adjust the settings for the carousel
          arrows: false,                           // Hide arrow navigation
          slidesToShow: 2                          // Display 2 slides at a time
        }
      },
      {
        breakpoint: 480,                          // For screens with a maximum width of 480px
        settings: {                               // Adjust the settings for the carousel
          arrows: false,                          // Hide arrow navigation
          slidesToShow: 1                         // Display 1 slide at a time
        }
      }
    ]
  });
});
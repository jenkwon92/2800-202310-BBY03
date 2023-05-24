function saveCourse() {
  const courseId = '<%= course._id %>';                     // Get the courseId from the server-side template
  const xhr = new XMLHttpRequest();                         // Create a new XMLHttpRequest object
  xhr.open('POST', '/saveCourse');                          // Set up the POST request to the '/saveCourse' endpoint
  xhr.setRequestHeader('Content-Type', 'application/json'); // Set the request header for JSON content
  xhr.onload = function () {                                // Define the onload event handler for the request
    if (xhr.status === 200) {                               // Check if the response status is 200 (success)
      console.log('The course saved successfully');         // Log a success message
      //window.location.href = '/myCourses';                // Redirect to the 'myCourses' page

      swal("Success!", "Course has been saved!", "success");
    } else {
      console.error('Error saving a course');               // Log an error message
    }
  };
  xhr.send(JSON.stringify({ courseId: courseId }));         // Send the courseId as JSON data in the request body
}
function saveCourse() {
  var button = document.getElementById('course_id');
  console.log(button);
  const courseId = button.getAttribute('data');
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/saveCourse');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function () {
    if (xhr.status === 200) {
      console.log('The course removal was successful');
      // Display success message using sweetalert library
      swal({
        title: "Success!",
        text: "Course has been saved!",
        icon: "success",
      }).then(() => {
        window.location.href = '/myCourses';
      });
    } else {
      console.error('Error saving a course');
    }
  };
  xhr.send(JSON.stringify({ courseId: courseId }));
}

function removeCourse() {
  var button = document.getElementById('course_id');
  console.log(button);
  const courseId = button.getAttribute('data');
  const xhr = new XMLHttpRequest();
  xhr.open('POST', '/removeCourse');
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.onload = function () {
    if (xhr.status === 200) {
      console.log('The course removal was successful');
      // Display success message using sweetalert library
      swal({
        title: "Success!",
        text: "Course has been removed!",
        icon: "success",
      }).then(() => {
        window.location.href = '/myCourses';
      });
    } else {
      console.error('Error removing the course');
    }
  };
  xhr.send(JSON.stringify({ courseId: courseId }));
}
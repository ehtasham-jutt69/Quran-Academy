// Enhanced UX for form submission button

const getApiBase = () => {
  if (window.location.protocol === 'file:') {
    return 'http://localhost:5000';
  }
  if (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  ) {
    // If served by the Express server on port 5000, use same-origin
    return '';
  }
  return ''; // same-origin in production
};

// Navbar functionality
document.addEventListener("DOMContentLoaded", function () {
  const navbarCollapse = document.querySelector('.navbar-collapse');
  const navbarToggler = document.querySelector('.navbar-toggler');
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navbarCollapse.classList.contains('show')) {
        navbarToggler.click();
      }
    });
  });
});

// Function to manage button states
function setButtonState(state) {
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  const btnSuccess = submitBtn.querySelector('.btn-success');

  // Reset all states
  btnText.classList.add('d-none');
  btnLoading.classList.add('d-none');
  btnSuccess.classList.add('d-none');
  submitBtn.disabled = false;
  submitBtn.classList.remove('btn-loading', 'btn-success');

  switch (state) {
    case 'loading':
      btnLoading.classList.remove('d-none');
      submitBtn.disabled = true;
      submitBtn.classList.add('btn-loading');
      break;
    case 'success':
      btnSuccess.classList.remove('d-none');
      submitBtn.classList.add('btn-success');
      break;
    default:
      btnText.classList.remove('d-none');
      break;
  }
}

// Enhanced alert function
function showEnhancedAlert(type, message) {
  // Remove existing alerts
  const existingAlerts = document.querySelectorAll('.custom-alert');
  existingAlerts.forEach(alert => alert.remove());

  const alertContainer = document.createElement('div');
  alertContainer.className = 'custom-alert';
  let iconType, bgColor;

  if (type === 'success') {
    iconType = 'check-circle-fill';
    bgColor = 'alert-success';
  } else if (type === 'warning') {
    iconType = 'info-fill';
    bgColor = 'alert-warning';
  } else {
    iconType = 'exclamation-triangle-fill';
    bgColor = 'alert-danger';
  }

  alertContainer.innerHTML = `
    <div class="alert ${bgColor} alert-dismissible d-flex align-items-center shadow-lg" role="alert" 
         style="position: fixed; top: 20px; left: 50%; transform: translateX(-50%) translateY(-20px); z-index: 9999; width: 90%; max-width: 400px; border-radius: 8px; opacity: 0; transition: all 0.3s ease;">
      <svg class="bi flex-shrink-0 me-2" width="20" height="20" role="img" aria-label="${type}:"><use xlink:href="#${iconType}"/></svg>
      <div class="flex-grow-1" style="font-size: 14px; line-height: 1.4;">${message}</div>
      <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
  `;

  document.body.appendChild(alertContainer);

  // Animate in
  setTimeout(() => {
    const alert = alertContainer.querySelector('.alert');
    if (alert) {
      alert.style.opacity = '1';
      alert.style.transform = 'translateX(-50%) translateY(0)';
    }
  }, 10);

  // Auto remove after 4 seconds
  setTimeout(() => {
    if (alertContainer && alertContainer.parentNode) {
      const alert = alertContainer.querySelector('.alert');
      if (alert) {
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => alertContainer.remove(), 300);
      }
    }
  }, 4000);
}

// Enhanced form submission handler
document.addEventListener('DOMContentLoaded', function () {
  const submitButton = document.querySelector('.submit');

  if (submitButton) {
    submitButton.addEventListener('click', function (e) {
      e.preventDefault();

      // Set loading state
      setButtonState('loading');

      // Get form data safely
      const formData = {
        name: document.getElementById("name")?.value || "",
        age: document.getElementById("age")?.value || "",
        phone: document.getElementById("phone")?.value || "",
        gender: document.getElementById("gender")?.value || "",
        subject: document.getElementById("subject")?.value || "",
        day: document.getElementById("day")?.value || "",
        hours: document.getElementById("hours")?.value || "",
        time: document.getElementById("time")?.value || "",
        trial: document.getElementById("trial")?.value || "Yes",
        location: document.getElementById("location")?.value || "",
        proposedFee: document.getElementById("proposedFee")?.value || "",
      };

      // Validation with enhanced UX
      if (!formData.name.trim()) {
        showEnhancedAlert('warning', 'Please enter your full name');
        setButtonState('default');
        return;
      }
      if (!formData.age.trim()) {
        showEnhancedAlert('warning', 'Please enter the student\'s age');
        setButtonState('default');
        return;
      }
      if (!formData.phone.trim()) {
        showEnhancedAlert('warning', 'Please enter your WhatsApp number');
        setButtonState('default');
        return;
      }
      if (!formData.gender || formData.gender === '') {
        showEnhancedAlert('warning', 'Please select your gender');
        setButtonState('default');
        return;
      }
      if (!formData.subject || formData.subject === '') {
        showEnhancedAlert('warning', 'Please select a subject');
        setButtonState('default');
        return;
      }
      if (!formData.day.trim()) {
        showEnhancedAlert('warning', 'Please specify how many days a week you want to take classes');
        setButtonState('default');
        return;
      }
      if (!formData.hours.trim()) {
        showEnhancedAlert('warning', 'Please specify how many hours a day you want to study');
        setButtonState('default');
        return;
      }
      if (!formData.proposedFee.trim()) {
        showEnhancedAlert('warning', 'Please enter your proposed fee');
        setButtonState('default');
        return;
      }


      // API submission
      const apiUrl = getApiBase() + "/api/submit-form";

      fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setButtonState('success');
            showEnhancedAlert('success', 'Sent successfully! We will contact you soon.');
            console.log("Server Response:", data);

            // Reset form after success
            setTimeout(() => {
              document.getElementById("registrationForm").reset();
              setButtonState('default');
            }, 3000);
          } else {
            throw new Error(data.message || 'Error from server');
          }
        })
        .catch(err => {
          console.error("❌ Problem Occurred:", err);
          setButtonState('default');
          showEnhancedAlert('danger', 'There was a problem sending the form. Please try again later.');
        });
    });
  }
});












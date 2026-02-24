// Main JavaScript file for client-side functionality

// Auto-dismiss alerts after 5 seconds
document.addEventListener('DOMContentLoaded', function() {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }, 5000);
  });
});

// Form validation helpers
function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;
  
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return false;
  }
  return true;
}

// Discount percentage validation (0-100 range)
function validateDiscountPercentage(input) {
  const value = parseFloat(input.value);
  if (isNaN(value) || value < 0 || value > 100) {
    input.classList.add('is-invalid');
    input.setCustomValidity('Discount percentage must be between 0 and 100');
    return false;
  } else {
    input.classList.remove('is-invalid');
    input.setCustomValidity('');
    return true;
  }
}

// Apply discount validation to all discount percentage inputs
document.addEventListener('DOMContentLoaded', function() {
  const discountInputs = document.querySelectorAll('input[name="discount_percentage"]');
  discountInputs.forEach(input => {
    // Real-time validation
    input.addEventListener('input', function() {
      validateDiscountPercentage(this);
    });
    
    // Blur validation
    input.addEventListener('blur', function() {
      validateDiscountPercentage(this);
    });
    
    // Form submission validation
    const form = input.closest('form');
    if (form) {
      form.addEventListener('submit', function(e) {
        if (!validateDiscountPercentage(input)) {
          e.preventDefault();
          input.focus();
          return false;
        }
      });
    }
  });
});

// Confirm delete actions
document.addEventListener('DOMContentLoaded', function() {
  const deleteForms = document.querySelectorAll('form[onsubmit*="confirm"]');
  deleteForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      if (!confirm('Are you sure you want to delete this item?')) {
        e.preventDefault();
      }
    });
  });
});

// Enhanced form validation for all forms
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form[novalidate]');
  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
        form.classList.add('was-validated');
      }
    });
  });
});
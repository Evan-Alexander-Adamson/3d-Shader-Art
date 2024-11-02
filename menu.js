document.addEventListener('DOMContentLoaded', function() {
    const dropdown = document.getElementById('menuDropdown');
    const button = document.getElementById('dropdownButton');

    if (button && dropdown) {
        // Toggle dropdown menu on button click
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });

        // Close dropdown on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dropdown.classList.remove('active');
            }
        });
    }
}); 
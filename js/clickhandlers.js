function toggleDropdown(id){
    const targetElement = document.getElementById(id);
    const targetElementClass = targetElement.getAttribute('class');
    targetElement.setAttribute(
        'class', 
        targetElementClass === 'dropdown-inactive' ? 
            'dropdown-active' : 
            'dropdown-inactive'
    );
}
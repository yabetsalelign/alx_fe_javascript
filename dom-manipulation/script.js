// Array of quote objects (initial data)
// Load existing quotes from local storage if available
let quotes = JSON.parse(localStorage.getItem('quotes')) || [
    { text: "The only limit to our realization of tomorrow is our doubts of today.", category: "Inspiration" },
    { text: "Life is 10% what happens to us and 90% how we react to it.", category: "Motivation" },
    { text: "Do not wait to strike till the iron is hot; but make it hot by striking.", category: "Action" }
];

// Function to simulate fetching quotes from a mock server
async function fetchQuotesFromServer() {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts'); // Simulating with a mock API
        const serverQuotes = await response.json();

        // Map server data to our quote structure
        return serverQuotes.map(quote => ({
            text: quote.body,  // Using body for quote text
            category: quote.title // Using title for category
        }));
    } catch (error) {
        console.error('Error fetching quotes from server:', error);
        return [];
    }
}

// Function to send new quotes to the server
async function sendQuoteToServer(quote) {
    try {
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json' // Specify the content type as JSON
            },
            body: JSON.stringify(quote) // Send the quote as a JSON string
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const result = await response.json();
        console.log('Quote successfully sent to server:', result);
    } catch (error) {
        console.error('Error sending quote to server:', error);
    }
}

// Function to display quotes based on the current filter
function displayQuotes(filteredQuotes) {
    const quoteDisplay = document.getElementById('quoteDisplay');
    quoteDisplay.innerHTML = filteredQuotes.length > 0
        ? filteredQuotes.map(q => `<p>"${q.text}"</p><p>- ${q.category}</p>`).join('')
        : "No quotes available for this category.";
}

// Function to sync local quotes with server data
async function syncQuotesWithServer() {
    const serverQuotes = await fetchQuotesFromServer();

    // Conflict resolution: Use server data if there's a conflict
    const serverQuotesMap = new Map(serverQuotes.map(q => [q.text, q])); // Create a map for quick lookup
    const updatedQuotes = quotes.map(localQuote => {
        if (serverQuotesMap.has(localQuote.text)) {
            // If there's a server quote with the same text, we take the server one
            return serverQuotesMap.get(localQuote.text);
        }
        return localQuote; // Otherwise, keep the local quote
    });

    // Check for new server quotes
    serverQuotes.forEach(serverQuote => {
        if (!quotes.some(localQuote => localQuote.text === serverQuote.text)) {
            updatedQuotes.push(serverQuote); // Add new server quotes
        }
    });

    // Update local quotes and save to local storage
    quotes = updatedQuotes;
    saveQuotes(); // Save updated quotes to local storage
    populateCategories(); // Refresh categories
    displayQuotes(quotes); // Update displayed quotes

    // Notify user about the sync
    displaySyncNotification("Quotes synced with server!"); // Show sync notification
}

// Function to display sync notification
function displaySyncNotification(message) {
    const notificationElement = document.getElementById('syncNotification');
    notificationElement.textContent = message; // Set notification message
    notificationElement.style.display = 'block'; // Show notification
    setTimeout(() => {
        notificationElement.style.display = 'none'; // Hide notification after 3 seconds
    }, 3000);
}

// Function to periodically sync quotes with the server
function startSyncing() {
    syncQuotesWithServer(); // Initial sync
    setInterval(syncQuotesWithServer, 60000); // Sync every 60 seconds
}

// Function to filter quotes based on the selected category
function filterQuotes() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    const filteredQuotes = selectedCategory === 'all' 
        ? quotes 
        : quotes.filter(q => q.category === selectedCategory);
    displayQuotes(filteredQuotes); // Display the filtered quotes

    // Save the last selected category in local storage
    localStorage.setItem('lastSelectedCategory', selectedCategory);
}

// Function to populate the category filter dropdown
function populateCategories() {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = [...new Set(quotes.map(q => q.category))]; // Extract unique categories

    // Clear existing options
    categoryFilter.innerHTML = '<option value="all">All Categories</option>'; 

    // Populate the dropdown with categories
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    // Restore last selected category from local storage, if available
    const lastSelectedCategory = localStorage.getItem('lastSelectedCategory');
    if (lastSelectedCategory) {
        categoryFilter.value = lastSelectedCategory; // Set the dropdown value
        filterQuotes(); // Apply filter
    }
}

// Function to show a random quote
function showRandomQuote() {
    const selectedCategory = document.getElementById('categoryFilter').value;
    const filteredQuotes = selectedCategory === 'all' 
        ? quotes 
        : quotes.filter(q => q.category === selectedCategory);

    if (filteredQuotes.length > 0) { // Check if there are filtered quotes available
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        const randomQuote = filteredQuotes[randomIndex];

        // Update the quote display in the DOM using innerHTML
        const quoteDisplay = document.getElementById('quoteDisplay');
        quoteDisplay.innerHTML = `<p>"${randomQuote.text}"</p><p>- ${randomQuote.category}</p>`;
    } else {
        alert("No quotes available in this category."); // Edge case: when no quotes are available
    }

    // Save the last viewed quote in session storage
    sessionStorage.setItem('lastViewedQuote', quoteDisplay.innerHTML);
}

// Function to add a new quote
async function addQuote() {
    const quoteText = document.getElementById('newQuoteText').value.trim();
    const quoteCategory = document.getElementById('newQuoteCategory').value.trim();

    // Check if both quote text and category are provided
    if (quoteText && quoteCategory) {
        // Create the new quote object
        const newQuote = { text: quoteText, category: quoteCategory };

        // Add the new quote to the array
        quotes.push(newQuote);

        // Save updated quotes to local storage
        saveQuotes();

        // Send the new quote to the server
        await sendQuoteToServer(newQuote); // Call to send the quote to the server

        // Populate categories again after adding a new quote
        populateCategories();

        // Clear the input fields after adding the quote
        document.getElementById('newQuoteText').value = '';
        document.getElementById('newQuoteCategory').value = '';

        alert("New quote added!");
    } else {
        alert("Please fill in both the quote text and category.");
    }
}

// Function to save quotes to local storage
function saveQuotes() {
    localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Function to create and append the add quote form
function createAddQuoteForm() {
    // Create form elements
    const form = document.createElement('form');
    const quoteInput = document.createElement('input');
    const categoryInput = document.createElement('input');
    const addButton = document.createElement('button');

    // Set attributes for the quote input
    quoteInput.setAttribute('id', 'newQuoteText');
    quoteInput.setAttribute('placeholder', 'Enter quote text');
    quoteInput.setAttribute('required', true); // Make it required

    // Set attributes for the category input
    categoryInput.setAttribute('id', 'newQuoteCategory');
    categoryInput.setAttribute('placeholder', 'Enter quote category');
    categoryInput.setAttribute('required', true); // Make it required

    // Set attributes for the add button
    addButton.setAttribute('id', 'addQuoteBtn');
    addButton.textContent = 'Add Quote';
    addButton.type = 'submit'; // Make it a submit button

    // Append inputs and button to the form
    form.appendChild(quoteInput);
    form.appendChild(categoryInput);
    form.appendChild(addButton);

    // Append form to a designated area in the DOM
    document.getElementById('addQuoteForm').appendChild(form);

    // Prevent form submission to allow the addQuote function to handle it
    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission
        addQuote(); // Call addQuote when the form is submitted
    });
}

// Function to export quotes as a JSON file
function exportQuotes() {
    const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quotes.json'; // Set the file name
    document.body.appendChild(a);
    a.click(); // Trigger the download
    document.body.removeChild(a); // Remove the anchor element
}

// Function to import quotes from a JSON file
function importFromJsonFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedQuotes = JSON.parse(e.target.result);
                quotes = quotes.concat(importedQuotes); // Merge with existing quotes
                saveQuotes(); // Save merged quotes to local storage
                populateCategories(); // Refresh categories
                displayQuotes(quotes); // Update displayed quotes
                alert("Quotes imported successfully!");
            } catch (error) {
                alert("Error importing quotes: " + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Document ready event
document.addEventListener('DOMContentLoaded', function() {
    // Attach event listeners
    const newQuoteButton = document.getElementById('newQuoteButton');
    if (newQuoteButton) {
        newQuoteButton.addEventListener('click', showRandomQuote);
    }

    // Initialize category filter and populate quotes
    populateCategories();
    displayQuotes(quotes); // Display all quotes initially

    // Start syncing quotes with the server
    startSyncing(); // Begin periodic syncing

    // Create and display the add quote form
    createAddQuoteForm(); // Create the add quote form

    // Display the first random quote when the page is loaded
    showRandomQuote(); // Show a random quote initially

    // Set up file input for importing quotes
    const importInput = document.getElementById('importInput');
    if (importInput) {
        importInput.addEventListener('change', importFromJsonFile);
    }
});

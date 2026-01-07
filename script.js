document.addEventListener('DOMContentLoaded', function() {
    // Elements - Header
    const headerUploadBtn = document.getElementById('headerUploadBtn');
    const headerFileUpload = document.getElementById('headerFileUpload');
    const headerSearchBtn = document.getElementById('headerSearchBtn');
    const headerSearchInput = document.getElementById('headerSearchInput');
    const headerFileInfo = document.getElementById('headerFileInfo');
    const headerFileName = document.getElementById('headerFileName');
    const headerRecordCount = document.getElementById('headerRecordCount');
    const headerClearFileBtn = document.getElementById('headerClearFileBtn');
    
    // Elements - Main
    const resultsTableBody = document.getElementById('resultsTableBody');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const noResultsText = document.getElementById('noResultsText');
    const exportBtn = document.querySelector('.export-btn');
    const clearBtn = document.querySelector('.clear-btn');
    const refreshSearchBtn = document.getElementById('refreshSearchBtn');
    const countBadge = document.querySelector('.count-badge');
    const countText = document.querySelector('.results-count span:last-child');
    const totalRecords = document.getElementById('totalRecords');
    const activeUsers = document.getElementById('activeUsers');
    const totalBranches = document.getElementById('totalBranches');
    const downloadSampleBtn = document.getElementById('downloadSampleBtn');
    
    // Search tags
    const searchTags = document.querySelectorAll('.search-tag');
    
    // Application state
    let uploadedData = [];
    let currentResults = [];
    let branches = new Set();
    let lastSearchTerm = '';
    
    // Initialize
    clearResults();
    updateStats();
    
    // Setup search tag click handlers
    searchTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const searchTerm = this.getAttribute('data-search');
            headerSearchInput.value = searchTerm;
            performSearch(searchTerm);
        });
    });
    
    // Header upload functionality
    headerUploadBtn.addEventListener('click', function() {
        headerFileUpload.click();
    });
    
    headerFileUpload.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            readUploadedFile(file);
        }
    });
    
    // Header search functionality
    headerSearchBtn.addEventListener('click', function() {
        const searchTerm = headerSearchInput.value.trim();
        if (searchTerm) {
            performSearch(searchTerm);
        }
    });
    
    headerSearchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            const searchTerm = headerSearchInput.value.trim();
            if (searchTerm) {
                performSearch(searchTerm);
            }
        }
    });
    
    // Clear uploaded file
    headerClearFileBtn.addEventListener('click', function() {
        uploadedData = [];
        branches.clear();
        headerFileUpload.value = '';
        headerFileInfo.style.display = 'none';
        headerFileName.textContent = 'No file uploaded';
        headerRecordCount.textContent = '0 records';
        clearResults();
        updateStats();
        showNotification('Uploaded data cleared successfully', 'info');
    });
    
    // Export functionality
    exportBtn.addEventListener('click', function() {
        if (currentResults.length === 0) {
            showNotification('No results to export', 'warning');
            return;
        }
        
        exportToCSV(currentResults);
    });
    
    // Clear results functionality
    clearBtn.addEventListener('click', clearResults);
    
    // Refresh search functionality
    refreshSearchBtn.addEventListener('click', function() {
        if (lastSearchTerm) {
            headerSearchInput.value = lastSearchTerm;
            performSearch(lastSearchTerm);
        } else {
            showNotification('No previous search to refresh', 'info');
        }
    });
    
    // Download sample CSV
    downloadSampleBtn.addEventListener('click', function() {
        downloadSampleCSV();
    });
    
    // Function to read uploaded file (CSV or Excel)
    function readUploadedFile(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        // Show loading state
        showNotification(`Reading ${file.name}...`, 'info');
        
        if (fileExtension === 'csv') {
            readCSVFile(file);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            readExcelFile(file);
        } else {
            showNotification('Unsupported file format. Please upload CSV or Excel file.', 'warning');
            return;
        }
    }
    
    // Read CSV file
    function readCSVFile(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                const lines = content.split('\n');
                const headers = lines[0].split(',').map(h => h.trim());
                
                // Find column indices
                const userIdIndex = headers.findIndex(h => h.toLowerCase().includes('userid') || h.toLowerCase().includes('user'));
                const numberIndex = headers.findIndex(h => h.toLowerCase().includes('number') || h.toLowerCase().includes('phone') || h.toLowerCase().includes('mobile'));
                const branchIndex = headers.findIndex(h => h.toLowerCase().includes('branch') || h.toLowerCase().includes('location'));
                const statusIndex = headers.findIndex(h => h.toLowerCase().includes('status') || h.toLowerCase().includes('state'));
                
                if (userIdIndex === -1 || numberIndex === -1) {
                    showNotification('CSV must have UserID and Number columns', 'warning');
                    return;
                }
                
                // Parse data
                uploadedData = [];
                branches.clear();
                
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim() === '') continue;
                    
                    const columns = parseCSVLine(lines[i]);
                    if (columns.length >= Math.max(userIdIndex, numberIndex, branchIndex, statusIndex) + 1) {
                        const userId = columns[userIdIndex]?.trim() || '';
                        const number = columns[numberIndex]?.trim() || '';
                        const branch = branchIndex !== -1 ? columns[branchIndex]?.trim() || 'Unknown' : 'Unknown';
                        const status = statusIndex !== -1 ? columns[statusIndex]?.trim() || 'Active' : 'Active';
                        
                        if (userId && number) {
                            uploadedData.push({
                                userId: userId,
                                number: number,
                                branch: branch,
                                status: status
                            });
                            
                            if (branch !== 'Unknown') {
                                branches.add(branch);
                            }
                        }
                    }
                }
                
                updateFileInfo(file.name, uploadedData.length);
                updateStats();
                showNotification(`Successfully loaded ${uploadedData.length} records from ${file.name}`, 'success');
                
                // Auto-search if there's already a search term
                if (headerSearchInput.value.trim()) {
                    performSearch(headerSearchInput.value.trim());
                }
                
            } catch (error) {
                console.error('Error reading CSV:', error);
                showNotification('Error reading CSV file. Please check the format.', 'warning');
            }
        };
        
        reader.readAsText(file);
    }
    
    // Helper function to parse CSV line (handles quoted values)
    function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }
    
    // Read Excel file using SheetJS
    function readExcelFile(file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get first sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    showNotification('Excel file is empty', 'warning');
                    return;
                }
                
                // Get headers from first row
                const firstRow = jsonData[0];
                const headers = Object.keys(firstRow);
                
                // Find column names
                const userIdKey = headers.find(h => h.toLowerCase().includes('userid') || h.toLowerCase().includes('user'));
                const numberKey = headers.find(h => h.toLowerCase().includes('number') || h.toLowerCase().includes('phone') || h.toLowerCase().includes('mobile'));
                const branchKey = headers.find(h => h.toLowerCase().includes('branch') || h.toLowerCase().includes('location'));
                const statusKey = headers.find(h => h.toLowerCase().includes('status') || h.toLowerCase().includes('state'));
                
                if (!userIdKey || !numberKey) {
                    showNotification('Excel must have UserID and Number columns', 'warning');
                    return;
                }
                
                // Parse data
                uploadedData = [];
                branches.clear();
                
                jsonData.forEach(row => {
                    const userId = row[userIdKey]?.toString().trim() || '';
                    const number = row[numberKey]?.toString().trim() || '';
                    const branch = branchKey ? row[branchKey]?.toString().trim() || 'Unknown' : 'Unknown';
                    const status = statusKey ? row[statusKey]?.toString().trim() || 'Active' : 'Active';
                    
                    if (userId && number) {
                        uploadedData.push({
                            userId: userId,
                            number: number,
                            branch: branch,
                            status: status
                        });
                        
                        if (branch !== 'Unknown') {
                            branches.add(branch);
                        }
                    }
                });
                
                updateFileInfo(file.name, uploadedData.length);
                updateStats();
                showNotification(`Successfully loaded ${uploadedData.length} records from ${file.name}`, 'success');
                
                // Auto-search if there's already a search term
                if (headerSearchInput.value.trim()) {
                    performSearch(headerSearchInput.value.trim());
                }
                
            } catch (error) {
                console.error('Error reading Excel:', error);
                showNotification('Error reading Excel file. Please check the format.', 'warning');
            }
        };
        
        reader.readAsArrayBuffer(file);
    }
    
    // Update file info display in header
    function updateFileInfo(name, count) {
        headerFileInfo.style.display = 'block';
        headerFileName.textContent = name;
        headerRecordCount.textContent = `${count.toLocaleString()} records`;
    }
    
    // Perform search
    function performSearch(searchTerm) {
        if (!searchTerm) {
            showNotification('Please enter a search term', 'warning');
            return;
        }
        
        if (uploadedData.length === 0) {
            showNotification('Please upload a CSV/Excel file first', 'warning');
            return;
        }
        
        // Store last search term
        lastSearchTerm = searchTerm;
        
        // Show loading state on header search button
        headerSearchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        headerSearchBtn.disabled = true;
        
        // Get search type
        const searchType = document.querySelector('input[name="searchType"]:checked').value;
        
        // Simulate API call delay
        setTimeout(() => {
            // Filter data based on search term and type
            const filteredResults = uploadedData.filter(item => {
                const searchLower = searchTerm.toLowerCase();
                
                if (searchType === 'number') {
                    // Search in number only
                    return item.number.includes(searchTerm);
                } else if (searchType === 'userid') {
                    // Search in userId only
                    return item.userId.toLowerCase().includes(searchLower);
                } else {
                    // Search in both number and userId
                    return item.number.includes(searchTerm) || 
                           item.userId.toLowerCase().includes(searchLower);
                }
            });
            
            // Store current results for export
            currentResults = filteredResults;
            
            // Display results
            displayResults(filteredResults);
            
            // Update results count
            updateResultsCount(filteredResults.length);
            
            // Reset search button
            headerSearchBtn.innerHTML = '<i class="fas fa-search"></i>';
            headerSearchBtn.disabled = false;
            
            // Show notification based on results
            if (filteredResults.length > 0) {
                showNotification(`Found ${filteredResults.length} matching records for "${searchTerm}"`, 'success');
            } else {
                showNotification(`No matching records found for "${searchTerm}"`, 'info');
            }
        }, 300);
    }
    
    // Clear results
    function clearResults() {
        resultsTableBody.innerHTML = '';
        currentResults = [];
        lastSearchTerm = '';
        noResultsMessage.style.display = 'block';
        
        if (uploadedData.length === 0) {
            noResultsText.textContent = 'Upload a CSV/Excel file and search for data';
        } else {
            noResultsText.textContent = 'No search results yet. Use the search box in the header.';
        }
        
        updateResultsCount(0);
        headerSearchInput.value = '';
        showNotification('Results cleared', 'info');
    }
    
    // Display results in table
    function displayResults(results) {
        resultsTableBody.innerHTML = '';
        
        if (results.length === 0) {
            noResultsMessage.style.display = 'block';
            noResultsText.textContent = 'No matching records found';
            return;
        }
        
        noResultsMessage.style.display = 'none';
        
        results.forEach(item => {
            const row = document.createElement('tr');
            
            // Determine status class
            let statusClass = 'status-active';
            const statusLower = item.status.toLowerCase();
            
            if (statusLower.includes('inactive') || statusLower.includes('expired')) {
                statusClass = 'status-inactive';
            } else if (statusLower.includes('pending') || statusLower.includes('waiting')) {
                statusClass = 'status-pending';
            }
            
            row.innerHTML = `
                <td>${item.userId}</td>
                <td>${formatPhoneNumber(item.number)}</td>
                <td>${item.branch}</td>
                <td><span class="${statusClass}">${item.status}</span></td>
            `;
            
            resultsTableBody.appendChild(row);
        });
    }
    
    // Format phone number for display
    function formatPhoneNumber(number) {
        // Remove any non-digit characters
        const digits = number.replace(/\D/g, '');
        
        if (digits.length === 11 && digits.startsWith('91')) {
            // Format Indian numbers: 91-60000-00000
            return `${digits.slice(0,2)}-${digits.slice(2,7)}-${digits.slice(7)}`;
        } else if (digits.length === 10) {
            // Format 10-digit numbers: 60000-00000
            return `${digits.slice(0,5)}-${digits.slice(5)}`;
        }
        
        return number;
    }
    
    // Update results count display
    function updateResultsCount(count) {
        countBadge.textContent = count;
        countText.textContent = count === 1 ? 'RESULT FOUND' : 'RESULTS FOUND';
    }
    
    // Update stats
    function updateStats() {
        totalRecords.textContent = uploadedData.length.toLocaleString();
        
        // Count active users (status contains 'active')
        const activeCount = uploadedData.filter(item => 
            item.status.toLowerCase().includes('active')
        ).length;
        activeUsers.textContent = activeCount.toLocaleString();
        
        totalBranches.textContent = branches.size.toLocaleString();
    }
    
    // Export to CSV
    function exportToCSV(data) {
        if (data.length === 0) return;
        
        // Create CSV content
        let csvContent = "UserID,Number,Branch,Status\n";
        
        data.forEach(item => {
            csvContent += `"${item.userId}","${item.number}","${item.branch}","${item.status}"\n`;
        });
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const timestamp = new Date().toISOString().slice(0,19).replace(/[:]/g, '-');
        a.download = `bbc_search_results_${timestamp}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification(`Exported ${data.length} records as CSV`, 'success');
    }
    
    // Download sample CSV
    function downloadSampleCSV() {
        const sampleData = `UserID,Number,Branch,Status
bbc1234,91600000000,Mumbai Central,Active
bbc1235,91600000000,Delhi North,Active
bbc1236,91777777777,Bangalore South,Active
bbc1237,91888888888,Chennai East,Inactive
bbc1238,91999999999,Kolkata West,Pending
bbc5678,91600000000,Pune West,Active
bbc5679,91777777777,Hyderabad,Active
bbc5680,91888888888,Jaipur,Inactive`;
        
        const blob = new Blob([sampleData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bbc_sample_data.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showNotification('Sample CSV downloaded successfully', 'success');
    }
    
    // Notification system
    function showNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => {
            notification.remove();
        });
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Add styles for notification
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                padding: 15px 20px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
                z-index: 1000;
                min-width: 300px;
                max-width: 400px;
                animation: slideIn 0.3s ease;
                border-left: 4px solid #4caf50;
            }
            
            .notification-warning {
                border-left-color: #ff9800;
            }
            
            .notification-info {
                border-left-color: #2196f3;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-grow: 1;
            }
            
            .notification-content i {
                font-size: 1.2rem;
            }
            
            .notification-success .notification-content i {
                color: #4caf50;
            }
            
            .notification-warning .notification-content i {
                color: #ff9800;
            }
            
            .notification-info .notification-content i {
                color: #2196f3;
            }
            
            .notification-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #888;
                font-size: 1rem;
                margin-left: 15px;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        
        document.head.appendChild(style);
        
        // Close button functionality
        notification.querySelector('.notification-close').addEventListener('click', function() {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
                style.remove();
            }, 250);
        });
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    notification.remove();
                    style.remove();
                }, 250);
            }
        }, 5000);
    }
    
    // Add slideOut animation
    const slideOutStyle = document.createElement('style');
    slideOutStyle.textContent = `
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(slideOutStyle);
});

// BBC Data Search System - Main JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // ===== GLOBAL VARIABLES =====
    let allData = [];
    let filteredData = [];
    let currentTab = 'multiple';
    let currentFile = null;
    let currentPage = 1;
    let itemsPerPage = 25;
    let sortColumn = 'userid';
    let sortDirection = 'asc';
    let uniqueBranches = new Set();

    // ===== DOM ELEMENTS =====
    const elements = {
        // Theme
        themeToggle: document.getElementById('themeToggle'),
        body: document.body,
        
        // Help Modal
        helpBtn: document.getElementById('helpBtn'),
        helpModal: document.getElementById('helpModal'),
        closeHelp: document.getElementById('closeHelp'),
        
        // Data Loader
        autoLoadBtn: document.getElementById('autoLoadBtn'),
        autoLoadCard: document.getElementById('autoLoadCard'),
        autoStatus: document.getElementById('autoStatus'),
        autoStatusText: document.getElementById('autoStatusText'),
        browseBtn: document.getElementById('browseBtn'),
        csvFile: document.getElementById('csvFile'),
        uploadCard: document.getElementById('uploadCard'),
        uploadStatus: document.getElementById('uploadStatus'),
        uploadStatusText: document.getElementById('uploadStatusText'),
        sampleBtn: document.getElementById('sampleBtn'),
        sampleCard: document.getElementById('sampleCard'),
        sampleStatus: document.getElementById('sampleStatus'),
        sampleStatusText: document.getElementById('sampleStatusText'),
        filePreview: document.getElementById('filePreview'),
        fileName: document.getElementById('fileName'),
        fileSize: document.getElementById('fileSize'),
        fileRecords: document.getElementById('fileRecords'),
        previewBody: document.getElementById('previewBody'),
        
        // Loading Overlay
        loadingOverlay: document.getElementById('loadingOverlay'),
        loadingText: document.getElementById('loadingText'),
        loadingSubtext: document.getElementById('loadingSubtext'),
        
        // Search Section
        searchSection: document.getElementById('searchSection'),
        dashboardSection: document.getElementById('dashboardSection'),
        
        // Search Tabs
        tabBtns: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // Multiple ID Search
        multipleUserIds: document.getElementById('multipleUserIds'),
        idCount: document.getElementById('idCount'),
        pasteIds: document.getElementById('pasteIds'),
        clearIds: document.getElementById('clearIds'),
        multipleCount: document.getElementById('multipleCount'),
        
        // Single ID Search
        singleUserId: document.getElementById('singleUserId'),
        singleSuggestions: document.getElementById('singleSuggestions'),
        
        // Number Search
        searchNumber: document.getElementById('searchNumber'),
        
        // Advanced Filters
        branchFilter: document.getElementById('branchFilter'),
        statusFilter: document.getElementById('statusFilter'),
        sortBy: document.getElementById('sortBy'),
        resultsPerPage: document.getElementById('resultsPerPage'),
        
        // Search Actions
        searchBtn: document.getElementById('searchBtn'),
        searchLoader: document.getElementById('searchLoader'),
        resetBtn: document.getElementById('resetBtn'),
        exportBtn: document.getElementById('exportBtn'),
        
        // Dashboard
        totalRecords: document.getElementById('totalRecords'),
        matchedResults: document.getElementById('matchedResults'),
        matchPercent: document.getElementById('matchPercent'),
        activeUsers: document.getElementById('activeUsers'),
        activePercent: document.getElementById('activePercent'),
        uniqueBranches: document.getElementById('uniqueBranches'),
        topBranch: document.getElementById('topBranch'),
        resultsSummary: document.getElementById('resultsSummary'),
        
        // Table
        tableBody: document.getElementById('tableBody'),
        showingStart: document.getElementById('showingStart'),
        showingEnd: document.getElementById('showingEnd'),
        totalResults: document.getElementById('totalResults'),
        currentPage: document.getElementById('currentPage'),
        totalPages: document.getElementById('totalPages'),
        prevPage: document.getElementById('prevPage'),
        nextPage: document.getElementById('nextPage'),
        sortableHeaders: document.querySelectorAll('.sortable'),
        
        // Refresh
        refreshResults: document.getElementById('refreshResults'),
        lastUpdated: document.getElementById('lastUpdated'),
        
        // Quick Actions
        quickActions: document.getElementById('quickActions'),
        scrollTopBtn: document.getElementById('scrollTopBtn'),
        quickSearchBtn: document.getElementById('quickSearchBtn'),
        quickExportBtn: document.getElementById('quickExportBtn'),
        
        // Notification Container
        notificationContainer: document.getElementById('notificationContainer')
    };

    // ===== INITIALIZATION =====
    function init() {
        setupEventListeners();
        setupTheme();
        updateLastUpdated();
        
        // Try to auto-load bbc.csv on startup
        setTimeout(() => {
            autoLoadBBCData();
        }, 1000);
    }

    // ===== EVENT LISTENERS =====
    function setupEventListeners() {
        // Theme Toggle
        elements.themeToggle.addEventListener('click', toggleTheme);
        
        // Help Modal
        elements.helpBtn.addEventListener('click', () => showModal(elements.helpModal));
        elements.closeHelp.addEventListener('click', () => hideModal(elements.helpModal));
        elements.helpModal.addEventListener('click', (e) => {
            if (e.target === elements.helpModal) hideModal(elements.helpModal);
        });
        
        // Data Loader
        elements.autoLoadBtn.addEventListener('click', autoLoadBBCData);
        elements.browseBtn.addEventListener('click', () => elements.csvFile.click());
        elements.csvFile.addEventListener('change', handleFileUpload);
        elements.sampleBtn.addEventListener('click', loadSampleData);
        
        // Drag and drop for upload
        elements.uploadCard.addEventListener('dragover', handleDragOver);
        elements.uploadCard.addEventListener('dragleave', handleDragLeave);
        elements.uploadCard.addEventListener('drop', handleDrop);
        
        // Search Tabs
        elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => switchTab(btn.dataset.tab));
        });
        
        // Multiple ID Search
        elements.multipleUserIds.addEventListener('input', updateIdCount);
        elements.pasteIds.addEventListener('click', pasteFromClipboard);
        elements.clearIds.addEventListener('click', clearMultipleIds);
        
        // Single ID Search
        elements.singleUserId.addEventListener('input', showSuggestions);
        
        // Search Actions
        elements.searchBtn.addEventListener('click', performSearch);
        elements.resetBtn.addEventListener('click', resetFilters);
        elements.exportBtn.addEventListener('click', exportResults);
        
        // Advanced Filters
        elements.branchFilter.addEventListener('change', updateBranchFilter);
        elements.statusFilter.addEventListener('change', filterData);
        elements.sortBy.addEventListener('change', sortData);
        elements.resultsPerPage.addEventListener('change', updatePagination);
        
        // Pagination
        elements.prevPage.addEventListener('click', () => changePage(currentPage - 1));
        elements.nextPage.addEventListener('click', () => changePage(currentPage + 1));
        
        // Table Sorting
        elements.sortableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.dataset.sort;
                if (sortColumn === column) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = column;
                    sortDirection = 'asc';
                }
                sortData();
                updateTable();
            });
        });
        
        // Refresh Results
        elements.refreshResults.addEventListener('click', refreshData);
        
        // Quick Actions
        elements.scrollTopBtn.addEventListener('click', scrollToTop);
        elements.quickSearchBtn.addEventListener('click', () => {
            elements.searchSection.scrollIntoView({ behavior: 'smooth' });
        });
        elements.quickExportBtn.addEventListener('click', exportResults);
        
        // Keyboard Shortcuts
        document.addEventListener('keydown', handleKeyboardShortcuts);
    }

    // ===== THEME MANAGEMENT =====
    function setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        elements.body.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);
    }

    function toggleTheme() {
        const currentTheme = elements.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        elements.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        showNotification(`Switched to ${newTheme} theme`, 'info');
    }

    function updateThemeIcon(theme) {
        const icon = elements.themeToggle.querySelector('i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    // ===== DATA LOADING =====
    async function autoLoadBBCData() {
        showLoading('Loading BBC Data', 'Searching for bbc.csv file...');
        updateStatus('auto', 'loading', 'Loading...');
        
        try {
            // Try to load bbc.csv from same directory
            const response = await fetch('bbc.csv');
            
            if (!response.ok) {
                throw new Error('bbc.csv file not found in the same directory');
            }
            
            const csvText = await response.text();
            await processCSVData(csvText, 'bbc.csv');
            
            updateStatus('auto', 'success', 'Loaded successfully');
            showNotification('BBC data loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Auto-load failed:', error);
            updateStatus('auto', 'error', 'File not found');
            
            // Show helpful message
            showNotification(
                `Could not find bbc.csv. Please upload your CSV file manually.`,
                'warning'
            );
            
            // Switch to upload card
            elements.uploadCard.classList.add('active');
            elements.autoLoadCard.classList.remove('active');
        } finally {
            hideLoading();
        }
    }

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showNotification('Please select a CSV file', 'error');
            return;
        }
        
        currentFile = file;
        updateStatus('upload', 'loading', 'Reading file...');
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                await processCSVData(e.target.result, file.name);
                updateStatus('upload', 'success', 'Uploaded successfully');
                showNotification('CSV file loaded successfully!', 'success');
            } catch (error) {
                console.error('File processing error:', error);
                updateStatus('upload', 'error', 'Error processing');
                showNotification('Error processing CSV file', 'error');
            }
        };
        
        reader.onerror = function() {
            updateStatus('upload', 'error', 'Read error');
            showNotification('Error reading file', 'error');
        };
        
        reader.readAsText(file);
    }

    function handleDragOver(e) {
        e.preventDefault();
        elements.uploadCard.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.preventDefault();
        elements.uploadCard.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        elements.uploadCard.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.toLowerCase().endsWith('.csv')) {
                // Create a fake event object
                const fakeEvent = { target: { files: [file] } };
                handleFileUpload(fakeEvent);
            } else {
                showNotification('Please drop a CSV file', 'error');
            }
        }
    }

    async function loadSampleData() {
        showLoading('Loading Sample Data', 'Creating sample dataset...');
        updateStatus('sample', 'loading', 'Creating...');
        
        // Create sample data
        const sampleData = [];
        const branches = ['Main', 'North', 'South', 'East', 'West'];
        const statuses = ['active', 'inactive'];
        
        for (let i = 1; i <= 100; i++) {
            const userNum = i.toString().padStart(3, '0');
            const branch = branches[Math.floor(Math.random() * branches.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            
            sampleData.push({
                UserID: `USER${userNum}`,
                Number: `555-${(1000 + i).toString().slice(1)}`,
                Branch: `${branch} Branch`,
                Status: status
            });
        }
        
        // Process as if it were CSV
        const csvHeaders = 'UserID,Number,Branch,Status\n';
        const csvRows = sampleData.map(row => 
            `${row.UserID},${row.Number},${row.Branch},${row.Status}`
        ).join('\n');
        const csvText = csvHeaders + csvRows;
        
        await processCSVData(csvText, 'sample_data.csv');
        
        updateStatus('sample', 'success', 'Loaded successfully');
        showNotification('Sample data loaded successfully!', 'success');
        hideLoading();
    }

    async function processCSVData(csvText, fileName) {
        showLoading('Processing CSV', 'Parsing and validating data...');
        
        try {
            // Parse CSV
            const data = parseCSV(csvText);
            
            if (data.length === 0) {
                throw new Error('CSV file is empty or could not be parsed');
            }
            
            // Validate required columns
            const requiredColumns = ['userid', 'number', 'branch', 'status'];
            const firstRow = data[0];
            const missingColumns = requiredColumns.filter(col => 
                !Object.keys(firstRow).some(key => key.toLowerCase() === col)
            );
            
            if (missingColumns.length > 0) {
                throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
            }
            
            // Process and clean data
            allData = data.map((row, index) => {
                const userID = getColumnValue(row, ['userid', 'user id', 'id', 'user']);
                const number = getColumnValue(row, ['number', 'num', 'no', '#', 'phone']);
                const branch = getColumnValue(row, ['branch', 'dept', 'department', 'location']);
                const status = getColumnValue(row, ['status', 'state', 'active']);
                
                return {
                    id: index + 1,
                    UserID: String(userID || '').trim().toUpperCase(),
                    Number: String(number || '').trim(),
                    Branch: String(branch || '').trim(),
                    Status: String(status || 'active').trim().toLowerCase()
                };
            });
            
            // Update UI
            updateFilePreview(fileName, csvText.length, allData.length);
            populateBranchFilter();
            updateDashboardStats();
            
            // Show search interface
            elements.searchSection.style.display = 'block';
            elements.dashboardSection.style.display = 'block';
            
            // Initialize table with all data
            filteredData = [...allData];
            currentPage = 1;
            updateTable();
            
            // Scroll to search section
            setTimeout(() => {
                elements.searchSection.scrollIntoView({ behavior: 'smooth' });
            }, 500);
            
            return true;
            
        } catch (error) {
            console.error('CSV processing error:', error);
            showNotification(`Error: ${error.message}`, 'error');
            return false;
        } finally {
            hideLoading();
        }
    }

    function parseCSV(csvText) {
        const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        if (lines.length === 0) return [];
        
        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            // Only add if not completely empty
            if (Object.values(row).some(value => value.trim() !== '')) {
                data.push(row);
            }
        }
        
        return data;
    }

    function parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        values.push(current);
        return values.map(v => v.trim().replace(/^"(.*)"$/, '$1'));
    }

    function getColumnValue(row, possibleNames) {
        for (const name of possibleNames) {
            if (row[name] !== undefined && row[name] !== '') {
                return row[name];
            }
            
            // Case-insensitive match
            const keys = Object.keys(row);
            const matchingKey = keys.find(key => key.toLowerCase() === name.toLowerCase());
            if (matchingKey && row[matchingKey] !== '') {
                return row[matchingKey];
            }
        }
        return '';
    }

    // ===== UI UPDATES =====
    function updateStatus(type, status, text) {
        const statusElement = document.getElementById(`${type}Status`);
        const textElement = document.getElementById(`${type}StatusText`);
        
        if (statusElement && textElement) {
            statusElement.className = `status-indicator ${status}`;
            textElement.textContent = text;
        }
    }

    function updateFilePreview(fileName, fileSizeBytes, recordCount) {
        elements.fileName.textContent = fileName;
        elements.fileSize.textContent = `• ${formatFileSize(fileSizeBytes)}`;
        elements.fileRecords.textContent = `• ${recordCount} records`;
        
        // Show preview of first 5 rows
        const previewRows = allData.slice(0, 5);
        elements.previewBody.innerHTML = previewRows.map(row => `
            <tr>
                <td>${row.UserID}</td>
                <td>${row.Number}</td>
                <td>${row.Branch}</td>
                <td>
                    <span class="status-cell ${row.Status === 'active' ? 'status-active' : 'status-inactive'}">
                        <i class="fas fa-circle"></i>
                        ${row.Status.charAt(0).toUpperCase() + row.Status.slice(1)}
                    </span>
                </td>
            </tr>
        `).join('');
        
        elements.filePreview.style.display = 'block';
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    function populateBranchFilter() {
        // Collect unique branches
        const branches = new Set();
        allData.forEach(row => {
            if (row.Branch) branches.add(row.Branch);
        });
        
        // Sort branches alphabetically
        const sortedBranches = Array.from(branches).sort();
        
        // Update filter dropdown
        elements.branchFilter.innerHTML = `
            <option value="">All Branches</option>
            ${sortedBranches.map(branch => 
                `<option value="${branch}">${branch}</option>`
            ).join('')}
        `;
    }

    // ===== SEARCH FUNCTIONALITY =====
    function switchTab(tabName) {
        currentTab = tabName;
        
        // Update tab buttons
        elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update tab contents
        elements.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
        
        // Update placeholder for single ID search
        if (tabName === 'single' && allData.length > 0) {
            const sampleIds = allData.slice(0, 3).map(row => row.UserID);
            elements.singleUserId.placeholder = `e.g., ${sampleIds.join(', ')}`;
        }
    }

    function updateIdCount() {
        const text = elements.multipleUserIds.value;
        const ids = parseMultipleIds(text);
        elements.idCount.textContent = ids.length;
        elements.multipleCount.textContent = ids.length;
    }

    function parseMultipleIds(text) {
        if (!text.trim()) return [];
        
        return text.split(/[\n,\s]+/)
            .map(id => id.trim())
            .filter(id => id.length > 0)
            .map(id => id.toUpperCase());
    }

    async function pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            elements.multipleUserIds.value = text;
            updateIdCount();
            showNotification('Pasted from clipboard', 'success');
        } catch (error) {
            console.error('Clipboard error:', error);
            showNotification('Cannot access clipboard', 'error');
        }
    }

    function clearMultipleIds() {
        elements.multipleUserIds.value = '';
        updateIdCount();
        showNotification('Cleared all IDs', 'info');
    }

    function showSuggestions() {
        const searchTerm = elements.singleUserId.value.trim().toUpperCase();
        if (!searchTerm || searchTerm.length < 2) {
            elements.singleSuggestions.innerHTML = '';
            return;
        }
        
        // Find matching UserIDs
        const matches = allData
            .filter(row => row.UserID.includes(searchTerm))
            .slice(0, 5);
        
        if (matches.length === 0) {
            elements.singleSuggestions.innerHTML = '';
            return;
        }
        
        elements.singleSuggestions.innerHTML = matches.map(row => `
            <div class="suggestion-item" onclick="selectSuggestion('${row.UserID}')">
                ${row.UserID} (${row.Branch})
            </div>
        `).join('');
    }

    function selectSuggestion(userId) {
        elements.singleUserId.value = userId;
        elements.singleSuggestions.innerHTML = '';
    }

    // Expose to global scope
    window.selectSuggestion = selectSuggestion;

    function performSearch() {
        if (allData.length === 0) {
            showNotification('Please load data first', 'warning');
            return;
        }
        
        showSearchLoading(true);
        
        // Small delay to show loading animation
        setTimeout(() => {
            let results = [...allData];
            
            // Apply tab-specific search
            switch (currentTab) {
                case 'multiple':
                    const ids = parseMultipleIds(elements.multipleUserIds.value);
                    if (ids.length > 0) {
                        results = results.filter(row => ids.includes(row.UserID));
                    }
                    break;
                    
                case 'single':
                    const singleId = elements.singleUserId.value.trim().toUpperCase();
                    if (singleId) {
                        results = results.filter(row => row.UserID === singleId);
                    }
                    break;
                    
                case 'number':
                    const number = elements.searchNumber.value.trim();
                    if (number) {
                        results = results.filter(row => 
                            row.Number && row.Number.includes(number)
                        );
                    }
                    break;
            }
            
            // Apply advanced filters
            const branch = elements.branchFilter.value;
            if (branch) {
                results = results.filter(row => row.Branch === branch);
            }
            
            const status = elements.statusFilter.value;
            if (status) {
                results = results.filter(row => row.Status === status);
            }
            
            // Store filtered results
            filteredData = results;
            
            // Reset to first page
            currentPage = 1;
            
            // Update UI
            updateDashboardStats();
            updateTable();
            updateResultsSummary();
            
            showSearchLoading(false);
            
            // Show notification
            const message = results.length === allData.length 
                ? 'Showing all records' 
                : `Found ${results.length} matching record${results.length !== 1 ? 's' : ''}`;
            
            showNotification(message, 'success');
            
        }, 500);
    }

    function showSearchLoading(show) {
        elements.searchLoader.style.display = show ? 'block' : 'none';
        elements.searchBtn.disabled = show;
    }

    function resetFilters() {
        // Clear search inputs
        elements.multipleUserIds.value = '';
        elements.singleUserId.value = '';
        elements.searchNumber.value = '';
        elements.singleSuggestions.innerHTML = '';
        
        // Reset advanced filters
        elements.branchFilter.value = '';
        elements.statusFilter.value = '';
        elements.sortBy.value = 'userid';
        elements.resultsPerPage.value = '25';
        
        // Reset UI
        updateIdCount();
        filteredData = [...allData];
        currentPage = 1;
        sortColumn = 'userid';
        sortDirection = 'asc';
        
        // Update everything
        updateDashboardStats();
        updateTable();
        updateResultsSummary();
        
        showNotification('All filters reset', 'info');
    }

    function filterData() {
        performSearch();
    }

    function updateBranchFilter() {
        performSearch();
    }

    function sortData() {
        const sortOption = elements.sortBy.value;
        
        switch (sortOption) {
            case 'userid':
                sortColumn = 'userid';
                sortDirection = 'asc';
                break;
            case 'userid-desc':
                sortColumn = 'userid';
                sortDirection = 'desc';
                break;
            case 'number':
                sortColumn = 'number';
                sortDirection = 'asc';
                break;
            case 'branch':
                sortColumn = 'branch';
                sortDirection = 'asc';
                break;
            case 'status':
                sortColumn = 'status';
                sortDirection = 'asc';
                break;
        }
        
        updateTable();
    }

    // ===== DASHBOARD UPDATES =====
    function updateDashboardStats() {
        elements.totalRecords.textContent = allData.length.toLocaleString();
        elements.matchedResults.textContent = filteredData.length.toLocaleString();
        
        // Calculate percentages
        const matchPercent = allData.length > 0 
            ? Math.round((filteredData.length / allData.length) * 100) 
            : 0;
        elements.matchPercent.textContent = `${matchPercent}% of total`;
        
        // Count active users
        const activeCount = filteredData.filter(row => row.Status === 'active').length;
        elements.activeUsers.textContent = activeCount.toLocaleString();
        
        const activePercent = filteredData.length > 0 
            ? Math.round((activeCount / filteredData.length) * 100) 
            : 0;
        elements.activePercent.textContent = `${activePercent}% active`;
        
        // Count unique branches
        const branches = new Set(filteredData.map(row => row.Branch));
        elements.uniqueBranches.textContent = branches.size;
        
        // Find most common branch
        const branchCounts = {};
        filteredData.forEach(row => {
            branchCounts[row.Branch] = (branchCounts[row.Branch] || 0) + 1;
        });
        
        let topBranch = '-';
        let maxCount = 0;
        Object.entries(branchCounts).forEach(([branch, count]) => {
            if (count > maxCount) {
                maxCount = count;
                topBranch = branch;
            }
        });
        
        if (topBranch !== '-') {
            const percent = Math.round((maxCount / filteredData.length) * 100);
            elements.topBranch.textContent = `${topBranch} (${percent}%)`;
        } else {
            elements.topBranch.textContent = '-';
        }
    }

    function updateResultsSummary() {
        if (filteredData.length === allData.length) {
            elements.resultsSummary.textContent = `Showing all ${allData.length} records`;
        } else {
            elements.resultsSummary.textContent = 
                `${filteredData.length} records match your search criteria`;
        }
    }

    // ===== TABLE MANAGEMENT =====
    function updateTable() {
        // Sort data
        const sortedData = [...filteredData].sort((a, b) => {
            let valueA = a[sortColumn] || '';
            let valueB = b[sortColumn] || '';
            
            // Convert to string for comparison
            valueA = String(valueA).toLowerCase();
            valueB = String(valueB).toLowerCase();
            
            let comparison = 0;
            if (valueA > valueB) comparison = 1;
            if (valueA < valueB) comparison = -1;
            
            return sortDirection === 'desc' ? -comparison : comparison;
        });
        
        // Calculate pagination
        const totalItems = sortedData.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        // Ensure current page is valid
        if (currentPage > totalPages) currentPage = Math.max(1, totalPages);
        
        // Calculate slice indices
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
        const pageData = sortedData.slice(startIndex, endIndex);
        
        // Update pagination controls
        updatePaginationControls(totalItems, totalPages, startIndex, endIndex);
        
        // Render table rows
        if (pageData.length === 0) {
            elements.tableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="5">
                        <div class="empty-state">
                            <i class="fas fa-search"></i>
                            <h4>No matching records found</h4>
                            <p>Try adjusting your search criteria</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        elements.tableBody.innerHTML = pageData.map(row => `
            <tr>
                <td>
                    <div class="userid-cell">
                        <i class="fas fa-id-card"></i>
                        <strong>${row.UserID}</strong>
                    </div>
                </td>
                <td>
                    <div class="number-cell">
                        <i class="fas fa-hashtag"></i>
                        ${row.Number}
                    </div>
                </td>
                <td>
                    <div class="branch-cell">
                        <i class="fas fa-code-branch"></i>
                        ${row.Branch}
                    </div>
                </td>
                <td>
                    <span class="status-cell ${row.Status === 'active' ? 'status-active' : 'status-inactive'}">
                        <i class="fas fa-circle"></i>
                        ${row.Status.charAt(0).toUpperCase() + row.Status.slice(1)}
                    </span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn" onclick="copyToClipboard('${row.UserID}')" title="Copy UserID">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="action-btn" onclick="viewDetails(${row.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
        
        // Update sort indicators
        updateSortIndicators();
    }

    function updatePaginationControls(totalItems, totalPages, startIndex, endIndex) {
        elements.showingStart.textContent = (startIndex + 1).toLocaleString();
        elements.showingEnd.textContent = endIndex.toLocaleString();
        elements.totalResults.textContent = totalItems.toLocaleString();
        elements.currentPage.textContent = currentPage;
        elements.totalPages.textContent = totalPages;
        
        elements.prevPage.disabled = currentPage <= 1;
        elements.nextPage.disabled = currentPage >= totalPages;
    }

    function updateSortIndicators() {
        elements.sortableHeaders.forEach(header => {
            const icon = header.querySelector('.fa-sort');
            const column = header.dataset.sort;
            
            if (column === sortColumn) {
                icon.className = sortDirection === 'asc' 
                    ? 'fas fa-sort-up' 
                    : 'fas fa-sort-down';
            } else {
                icon.className = 'fas fa-sort';
            }
        });
    }

    function updatePagination() {
        itemsPerPage = elements.resultsPerPage.value === 'all' 
            ? filteredData.length 
            : parseInt(elements.resultsPerPage.value);
        
        currentPage = 1;
        updateTable();
    }

    function changePage(page) {
        const totalPages = Math.ceil(filteredData.length / itemsPerPage);
        
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            updateTable();
            
            // Smooth scroll to table top
            elements.tableBody.parentElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }
    }

    function refreshData() {
        if (allData.length === 0) {
            showNotification('No data loaded', 'warning');
            return;
        }
        
        filteredData = [...allData];
        currentPage = 1;
        
        updateDashboardStats();
        updateTable();
        updateResultsSummary();
        updateLastUpdated();
        
        showNotification('Data refreshed', 'success');
    }

    // ===== EXPORT FUNCTIONALITY =====
    function exportResults() {
        if (filteredData.length === 0) {
            showNotification('No data to export', 'warning');
            return;
        }
        
        // Create CSV content
        const headers = ['UserID', 'Number', 'Branch', 'Status'];
        const csvRows = filteredData.map(row => 
            `${row.UserID},${row.Number},${row.Branch},${row.Status}`
        );
        
        const csvContent = [
            headers.join(','),
            ...csvRows
        ].join('\n');
        
        // Create and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        link.setAttribute('download', `bbc_data_${timestamp}.csv`);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification(`Exported ${filteredData.length} records to CSV`, 'success');
    }

    // ===== UTILITY FUNCTIONS =====
    function showLoading(title, subtitle) {
        elements.loadingText.textContent = title;
        elements.loadingSubtext.textContent = subtitle;
        elements.loadingOverlay.classList.add('active');
    }

    function hideLoading() {
        elements.loadingOverlay.classList.remove('active');
    }

    function showModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="fas fa-${icons[type] || 'info-circle'}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">
                    ${type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        elements.notificationContainer.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    function updateLastUpdated() {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString();
        elements.lastUpdated.textContent = `${dateString} ${timeString}`;
    }

    function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + F for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            elements.searchSection.scrollIntoView({ behavior: 'smooth' });
            if (currentTab === 'multiple') {
                elements.multipleUserIds.focus();
            } else if (currentTab === 'single') {
                elements.singleUserId.focus();
            }
        }
        
        // Ctrl/Cmd + E for export
        if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
            e.preventDefault();
            exportResults();
        }
        
        // Escape to reset
        if (e.key === 'Escape') {
            resetFilters();
        }
    }

    // ===== GLOBAL FUNCTIONS =====
    window.copyToClipboard = function(text) {
        navigator.clipboard.writeText(text).then(() => {
            showNotification(`Copied: ${text}`, 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            showNotification('Copy failed', 'error');
        });
    };

    window.viewDetails = function(id) {
        const item = allData.find(row => row.id === id);
        if (item) {
            const details = `
UserID: ${item.UserID}
Number: ${item.Number}
Branch: ${item.Branch}
Status: ${item.Status}
            `.trim();
            
            showNotification(`Details:<br>${details.replace(/\n/g, '<br>')}`, 'info');
        }
    };

    window.copyTable = function() {
        if (filteredData.length === 0) {
            showNotification('No data to copy', 'warning');
            return;
        }
        
        const headers = ['UserID', 'Number', 'Branch', 'Status'];
        const rows = filteredData.map(row => 
            [row.UserID, row.Number, row.Branch, row.Status]
        );
        
        const csvContent = [
            headers.join('\t'),
            ...rows.map(row => row.join('\t'))
        ].join('\n');
        
        navigator.clipboard.writeText(csvContent).then(() => {
            showNotification(`Copied ${filteredData.length} records to clipboard`, 'success');
        }).catch(err => {
            console.error('Copy failed:', err);
            showNotification('Copy failed', 'error');
        });
    };

    window.printTable = function() {
        if (filteredData.length === 0) {
            showNotification('No data to print', 'warning');
            return;
        }
        
        const printWindow = window.open('', '_blank');
        const title = `BBC Data Search Results - ${new Date().toLocaleString()}`;
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #333; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f5f5f5; padding: 10px; text-align: left; border-bottom: 2px solid #ddd; }
                    td { padding: 10px; border-bottom: 1px solid #ddd; }
                    .status-active { color: green; }
                    .status-inactive { color: red; }
                </style>
            </head>
            <body>
                <h1>${title}</h1>
                <p>Total Records: ${filteredData.length}</p>
                <table>
                    <thead>
                        <tr>
                            <th>UserID</th>
                            <th>Number</th>
                            <th>Branch</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredData.map(row => `
                            <tr>
                                <td>${row.UserID}</td>
                                <td>${row.Number}</td>
                                <td>${row.Branch}</td>
                                <td class="status-${row.Status}">${row.Status}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <p style="margin-top: 20px; color: #666;">
                    Generated by BBC Data Search System
                </p>
            </body>
            </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
    };

    // ===== START THE APPLICATION =====
    init();
});
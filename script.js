
// ==================== FACE RECOGNITION ATTENDANCE SYSTEM ==================== //
// This is a simulated face recognition system for educational purposes
// Note: Real face recognition requires backend ML libraries (OpenCV, face_recognition, dlib)

// ==================== GLOBAL VARIABLES ====================

let allAttendanceRecords = [];
let allStudents = [];
let currentPage = 1;
const recordsPerPage = 20;
let attendanceStream = null;
let registrationStream = null;
let isAttendanceRunning = false;
let markedTodayStudents = new Set();
let sortColumn = 0;
let sortAscending = true;

// ==================== PAGE NAVIGATION ====================

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const page = document.getElementById(pageName);
    if (page) {
        page.classList.add('active');

        // Initialize page-specific content
        if (pageName === 'home') {
            updateDashboard();
        } else if (pageName === 'view') {
            displayAttendanceRecords();
        } else if (pageName === 'export') {
            updateExportPreview();
        } else if (pageName === 'registration') {
            startRegistrationCamera();
        } else if (pageName === 'attendance') {
            initializeAttendancePage();
        }
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// ==================== INITIALIZATION ====================

function initializeApp() {
    loadDataFromStorage();
    initializeDemoData();
    updateDashboard();
    setSessionInfo();
    setExportDateRange();
}

// function initializeDemoData() {
//Only initialize if no students exist
// if (allStudents.length === 0) {
// const demoStudents = [
// { id: 'demo1', studentId: 'STU001', name: 'Rahul Kumar', department: 'CSE', email: 'rahul@college.edu', registeredDate: '2025-11-01', faceData: 'demo-face-1' },
// { id: 'demo2', studentId: 'STU002', name: 'Priya Sharma', department: 'ECE', email: 'priya@college.edu', registeredDate: '2025-11-01', faceData: 'demo-face-2' },
// { id: 'demo3', studentId: 'STU003', name: 'Amit Patel', department: 'CSE', email: 'amit@college.edu', registeredDate: '2025-11-02', faceData: 'demo-face-3' },
// { id: 'demo4', studentId: 'STU004', name: 'Sneha Singh', department: 'ME', email: 'sneha@college.edu', registeredDate: '2025-11-02', faceData: 'demo-face-4' },
// { id: 'demo5', studentId: 'STU005', name: 'Rohan Verma', department: 'CSE', email: 'rohan@college.edu', registeredDate: '2025-11-03', faceData: 'demo-face-5' }
// ];
// 
// allStudents = demoStudents;
// saveStudentsToStorage();
// }
// 
//Add demo attendance records if none exist
// if (allAttendanceRecords.length === 0) {
// const demoRecords = [
// { studentId: 'STU001', studentName: 'Rahul Kumar', department: 'CSE', date: '2025-11-03', time: '09:15 AM', status: 'Present' },
// { studentId: 'STU002', studentName: 'Priya Sharma', department: 'ECE', date: '2025-11-03', time: '09:18 AM', status: 'Present' },
// { studentId: 'STU003', studentName: 'Amit Patel', department: 'CSE', date: '2025-11-03', time: '09:22 AM', status: 'Present' },
// { studentId: 'STU001', studentName: 'Rahul Kumar', department: 'CSE', date: '2025-11-04', time: '09:10 AM', status: 'Present' },
// { studentId: 'STU003', studentName: 'Amit Patel', department: 'CSE', date: '2025-11-04', time: '09:25 AM', status: 'Present' },
// { studentId: 'STU005', studentName: 'Rohan Verma', department: 'CSE', date: '2025-11-04', time: '09:30 AM', status: 'Present' },
// { studentId: 'STU001', studentName: 'Rahul Kumar', department: 'CSE', date: '2025-11-05', time: '09:12 AM', status: 'Present' },
// { studentId: 'STU002', studentName: 'Priya Sharma', department: 'ECE', date: '2025-11-05', time: '09:20 AM', status: 'Present' }
// ];
// 
// allAttendanceRecords = demoRecords;
// saveAttendanceToStorage();
// }
// }
// 
// ==================== STORAGE FUNCTIONS ====================

function saveStudentsToStorage() {
    localStorage.setItem('faceAttendanceStudents', JSON.stringify(allStudents));
}

function saveAttendanceToStorage() {
    localStorage.setItem('faceAttendanceRecords', JSON.stringify(allAttendanceRecords));
}

function loadDataFromStorage() {
    const studentsData = localStorage.getItem('faceAttendanceStudents');
    const attendanceData = localStorage.getItem('faceAttendanceRecords');

    if (studentsData) {
        allStudents = JSON.parse(studentsData);
    }

    if (attendanceData) {
        allAttendanceRecords = JSON.parse(attendanceData);
    }
}

// ==================== DASHBOARD ====================

function updateDashboard() {
    const totalStudents = allStudents.length;
    const todayDate = getTodayDate();
    const todayAttendance = allAttendanceRecords.filter(r => r.date === todayDate).length;

    let totalPresent = 0;
    let totalRecords = 0;

    allAttendanceRecords.forEach(record => {
        totalRecords++;
        if (record.status === 'Present') {
            totalPresent++;
        }
    });

    const attendancePercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('todayAttendance').textContent = todayAttendance;
    document.getElementById('attendancePercentage').textContent = attendancePercentage + '%';
}

// ==================== REGISTRATION ====================

function startRegistrationCamera() {
    const video = document.getElementById('registrationVideo');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } }
        })
            .then(stream => {
                registrationStream = stream;
                video.srcObject = stream;
                video.play();
            })
            .catch(err => {
                showMessage('registrationMessage', 'Error: Could not access webcam. Please allow camera permissions.', 'error');
                console.error('Camera error:', err);
            });
    }
}

function capturePhotoRegistration() {
    const video = document.getElementById('registrationVideo');
    const canvas = document.getElementById('registrationCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    const capturedImage = document.getElementById('capturedImage');
    capturedImage.src = imageData;

    document.getElementById('photoPreview').style.display = 'block';
    document.getElementById('retakeBtn').style.display = 'inline-block';
    document.getElementById('registrationMessage').style.display = 'none';
}

function retakePhoto() {
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('retakeBtn').style.display = 'none';
    document.getElementById('registrationMessage').style.display = 'none';
}

function registerStudent() {
    const studentId = document.getElementById('studentId').value.trim();
    const studentName = document.getElementById('studentName').value.trim();
    const department = document.getElementById('department').value;
    const email = document.getElementById('email').value.trim();
    const capturedImage = document.getElementById('capturedImage').src;

    // Validation
    if (!studentId || !studentName || !department) {
        showMessage('registrationMessage', 'Please fill all required fields', 'error');
        return;
    }

    if (!capturedImage || capturedImage === '') {
        showMessage('registrationMessage', 'Please capture a photo first', 'error');
        return;
    }

    // Check for duplicate student ID
    const isDuplicate = allStudents.some(s => s.studentId === studentId);
    if (isDuplicate) {
        showMessage('registrationMessage', 'Student ID already exists', 'error');
        return;
    }

    // Create student object
    const newStudent = {
        id: generateId(),
        studentId: studentId,
        name: studentName,
        department: department,
        email: email,
        registeredDate: getTodayDate(),
        faceData: capturedImage
    };

    // Add to array and save
    allStudents.push(newStudent);
    saveStudentsToStorage();

    showMessage('registrationMessage', `✓ Student ${studentName} registered successfully!`, 'success');

    // Reset form after 2 seconds
    setTimeout(() => {
        document.getElementById('registrationForm').reset();
        document.getElementById('photoPreview').style.display = 'none';
        document.getElementById('retakeBtn').style.display = 'none';
        showPage('home');
    }, 2000);
}

// ==================== ATTENDANCE MARKING ====================

function initializeAttendancePage() {
    setSessionInfo();
    markedTodayStudents.clear();
    document.getElementById('attendanceList').innerHTML = '<p style="text-align: center; color: #999;">No students marked yet</p>';
}

function startAttendance() {
    const video = document.getElementById('attendanceVideo');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } }
        })
            .then(stream => {
                attendanceStream = stream;
                video.srcObject = stream;
                video.play();

                document.getElementById('startAttendanceBtn').style.display = 'none';
                document.getElementById('stopAttendanceBtn').style.display = 'inline-block';

                isAttendanceRunning = true;
                simulateFaceRecognition();
            })
            .catch(err => {
                console.error('Camera error:', err);
                alert('Error: Could not access webcam');
            });
    }
}

function stopAttendance() {
    isAttendanceRunning = false;

    if (attendanceStream) {
        attendanceStream.getTracks().forEach(track => track.stop());
    }

    document.getElementById('startAttendanceBtn').style.display = 'inline-block';
    document.getElementById('stopAttendanceBtn').style.display = 'none';
    document.getElementById('recognitionStatus').style.display = 'none';
}

function simulateFaceRecognition() {
    if (!isAttendanceRunning) return;

    // Simulate face recognition with random intervals
    const randomDelay = Math.random() * 3000 + 2000; // 2-5 seconds

    setTimeout(() => {
        if (isAttendanceRunning && allStudents.length > 0) {
            // Randomly select a student
            const randomStudent = allStudents[Math.floor(Math.random() * allStudents.length)];

            // Check if already marked today
            if (!markedTodayStudents.has(randomStudent.studentId)) {
                markAttendanceForStudent(randomStudent);
            }
        }

        // Continue simulation
        simulateFaceRecognition();
    }, randomDelay);
}

function markAttendanceForStudent(student) {
    // Show recognition status
    const status = document.getElementById('recognitionStatus');
    const nameSpan = document.getElementById('recognizedName');
    nameSpan.textContent = student.name;
    status.style.display = 'block';

    // Hide status after 2 seconds
    setTimeout(() => {
        status.style.display = 'none';
    }, 2000);

    // Record attendance
    const todayDate = getTodayDate();
    const currentTime = getCurrentTime();

    const attendanceRecord = {
        studentId: student.studentId,
        studentName: student.name,
        department: student.department,
        date: todayDate,
        time: currentTime,
        status: 'Present'
    };

    allAttendanceRecords.push(attendanceRecord);
    markedTodayStudents.add(student.studentId);
    saveAttendanceToStorage();

    // Update attendance list
    updateAttendanceList();
}

function updateAttendanceList() {
    const todayDate = getTodayDate();
    const todayRecords = allAttendanceRecords.filter(r => r.date === todayDate);

    const listContainer = document.getElementById('attendanceList');

    if (todayRecords.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #999;">No students marked yet</p>';
    } else {
        listContainer.innerHTML = todayRecords.map((record, index) => `
            <div class="attendance-item">
                <div class="attendance-item-info">
                    <div class="attendance-item-id">${record.studentId} - ${record.studentName}</div>
                    <div class="attendance-item-time">${record.time} | ${record.department}</div>
                </div>
                <div style="color: #4CAF50; font-weight: bold;">✓ Present</div>
            </div>
        `).join('');
    }

    document.getElementById('presentCount').textContent = todayRecords.length;
}

function setSessionInfo() {
    document.getElementById('sessionDate').textContent = getTodayDate();
    document.getElementById('sessionTime').textContent = getCurrentTime();
}

// ==================== VIEW ATTENDANCE ====================

function displayAttendanceRecords(records = allAttendanceRecords) {
    currentPage = 1;
    displayPage(records);
}

function displayPage(records = allAttendanceRecords) {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageRecords = records.slice(startIndex, endIndex);

    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    if (pageRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No records found</td></tr>';
    } else {
        pageRecords.forEach((record, index) => {
            const row = `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td>${record.studentId}</td>
                    <td>${record.studentName}</td>
                    <td>${record.department}</td>
                    <td>${record.date}</td>
                    <td>${record.time}</td>
                    <td><span class="status-${record.status.toLowerCase()}">${record.status}</span></td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

    // Update pagination
    const totalPages = Math.ceil(records.length / recordsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

function nextPage() {
    const records = getFilteredRecords();
    const totalPages = Math.ceil(records.length / recordsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayPage(records);
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        const records = getFilteredRecords();
        displayPage(records);
    }
}

function sortTable(column) {
    const records = getFilteredRecords();

    if (sortColumn === column) {
        sortAscending = !sortAscending;
    } else {
        sortColumn = column;
        sortAscending = true;
    }

    records.sort((a, b) => {
        let valueA, valueB;

        switch (column) {
            case 0: valueA = ''; valueB = ''; break;
            case 1: valueA = a.studentId; valueB = b.studentId; break;
            case 2: valueA = a.studentName; valueB = b.studentName; break;
            case 3: valueA = a.department; valueB = b.department; break;
            case 4: valueA = a.date; valueB = b.date; break;
            case 5: valueA = a.time; valueB = b.time; break;
            case 6: valueA = a.status; valueB = b.status; break;
            default: valueA = ''; valueB = '';
        }

        if (valueA < valueB) return sortAscending ? -1 : 1;
        if (valueA > valueB) return sortAscending ? 1 : -1;
        return 0;
    });

    displayPage(records);
}

function applyFilters() {
    displayPage(getFilteredRecords());
}

function clearFilters() {
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    document.getElementById('filterDepartment').value = '';
    document.getElementById('filterStudentId').value = '';
    displayPage(allAttendanceRecords);
}

function getFilteredRecords() {
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;
    const department = document.getElementById('filterDepartment').value;
    const studentId = document.getElementById('filterStudentId').value.trim().toUpperCase();

    return allAttendanceRecords.filter(record => {
        const recordDate = record.date;

        if (fromDate && recordDate < fromDate) return false;
        if (toDate && recordDate > toDate) return false;
        if (department && record.department !== department) return false;
        if (studentId && !record.studentId.includes(studentId)) return false;

        return true;
    });
}

// ==================== EXPORT ====================

function setExportDateRange() {
    const today = getTodayDate();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    document.getElementById('exportFromDate').value = formatDate(thirtyDaysAgo);
    document.getElementById('exportToDate').value = today;
}

function updateExportPreview() {
    const fromDate = document.getElementById('exportFromDate').value;
    const toDate = document.getElementById('exportToDate').value;
    const department = document.getElementById('exportDepartment').value;

    const filteredRecords = allAttendanceRecords.filter(record => {
        if (fromDate && record.date < fromDate) return false;
        if (toDate && record.date > toDate) return false;
        if (department && record.department !== department) return false;
        return true;
    });

    const previewRecords = filteredRecords.slice(0, 10);
    const tbody = document.getElementById('exportPreviewBody');

    if (previewRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No records to export</td></tr>';
    } else {
        tbody.innerHTML = previewRecords.map(record => `
            <tr>
                <td>${record.studentId}</td>
                <td>${record.studentName}</td>
                <td>${record.department}</td>
                <td>${record.date}</td>
                <td>${record.time}</td>
                <td><span class="status-${record.status.toLowerCase()}">${record.status}</span></td>
            </tr>
        `).join('');
    }
}

function exportToCSV() {
    const fromDate = document.getElementById('exportFromDate').value;
    const toDate = document.getElementById('exportToDate').value;
    const department = document.getElementById('exportDepartment').value;

    const filteredRecords = allAttendanceRecords.filter(record => {
        if (fromDate && record.date < fromDate) return false;
        if (toDate && record.date > toDate) return false;
        if (department && record.department !== department) return false;
        return true;
    });

    if (filteredRecords.length === 0) {
        showMessage('exportMessage', 'No records to export', 'warning');
        return;
    }

    // Create CSV content
    let csvContent = 'Student ID,Name,Department,Date,Time,Status\n';

    filteredRecords.forEach(record => {
        csvContent += `${record.studentId},"${record.studentName}",${record.department},${record.date},${record.time},${record.status}\n`;
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${getTodayDate()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showMessage('exportMessage', `✓ Exported ${filteredRecords.length} records successfully!`, 'success');
}

// ==================== UTILITY FUNCTIONS ====================

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const displayHours = now.getHours() % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message show ${type}`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 5000);
}

// ==================== EVENT LISTENERS ====================

// Update export preview when filters change
document.addEventListener('change', function (e) {
    if (e.target.id === 'exportFromDate' || e.target.id === 'exportToDate' || e.target.id === 'exportDepartment') {
        updateExportPreview();
    }
});

// Cleanup streams on page unload
window.addEventListener('beforeunload', function () {
    if (registrationStream) {
        registrationStream.getTracks().forEach(track => track.stop());
    }
    if (attendanceStream) {
        attendanceStream.getTracks().forEach(track => track.stop());
    }
});

// Initialize app on page load
window.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    showPage('home');
});
=======
// ==================== FACE RECOGNITION ATTENDANCE SYSTEM ==================== //
// This is a simulated face recognition system for educational purposes
// Note: Real face recognition requires backend ML libraries (OpenCV, face_recognition, dlib)

// ==================== GLOBAL VARIABLES ====================

let allAttendanceRecords = [];
let allStudents = [];
let currentPage = 1;
const recordsPerPage = 20;
let attendanceStream = null;
let registrationStream = null;
let isAttendanceRunning = false;
let markedTodayStudents = new Set();
let sortColumn = 0;
let sortAscending = true;

// ==================== PAGE NAVIGATION ====================

function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // Show selected page
    const page = document.getElementById(pageName);
    if (page) {
        page.classList.add('active');

        // Initialize page-specific content
        if (pageName === 'home') {
            updateDashboard();
        } else if (pageName === 'view') {
            displayAttendanceRecords();
        } else if (pageName === 'export') {
            updateExportPreview();
        } else if (pageName === 'registration') {
            startRegistrationCamera();
        } else if (pageName === 'attendance') {
            initializeAttendancePage();
        }
    }

    // Scroll to top
    window.scrollTo(0, 0);
}

// ==================== INITIALIZATION ====================

function initializeApp() {
    loadDataFromStorage();
    initializeDemoData();
    updateDashboard();
    setSessionInfo();
    setExportDateRange();
}

// function initializeDemoData() {
//Only initialize if no students exist
// if (allStudents.length === 0) {
// const demoStudents = [
// { id: 'demo1', studentId: 'STU001', name: 'Rahul Kumar', department: 'CSE', email: 'rahul@college.edu', registeredDate: '2025-11-01', faceData: 'demo-face-1' },
// { id: 'demo2', studentId: 'STU002', name: 'Priya Sharma', department: 'ECE', email: 'priya@college.edu', registeredDate: '2025-11-01', faceData: 'demo-face-2' },
// { id: 'demo3', studentId: 'STU003', name: 'Amit Patel', department: 'CSE', email: 'amit@college.edu', registeredDate: '2025-11-02', faceData: 'demo-face-3' },
// { id: 'demo4', studentId: 'STU004', name: 'Sneha Singh', department: 'ME', email: 'sneha@college.edu', registeredDate: '2025-11-02', faceData: 'demo-face-4' },
// { id: 'demo5', studentId: 'STU005', name: 'Rohan Verma', department: 'CSE', email: 'rohan@college.edu', registeredDate: '2025-11-03', faceData: 'demo-face-5' }
// ];
//
// allStudents = demoStudents;
// saveStudentsToStorage();
// }
//
//Add demo attendance records if none exist
// if (allAttendanceRecords.length === 0) {
// const demoRecords = [
// { studentId: 'STU001', studentName: 'Rahul Kumar', department: 'CSE', date: '2025-11-03', time: '09:15 AM', status: 'Present' },
// { studentId: 'STU002', studentName: 'Priya Sharma', department: 'ECE', date: '2025-11-03', time: '09:18 AM', status: 'Present' },
// { studentId: 'STU003', studentName: 'Amit Patel', department: 'CSE', date: '2025-11-03', time: '09:22 AM', status: 'Present' },
// { studentId: 'STU001', studentName: 'Rahul Kumar', department: 'CSE', date: '2025-11-04', time: '09:10 AM', status: 'Present' },
// { studentId: 'STU003', studentName: 'Amit Patel', department: 'CSE', date: '2025-11-04', time: '09:25 AM', status: 'Present' },
// { studentId: 'STU005', studentName: 'Rohan Verma', department: 'CSE', date: '2025-11-04', time: '09:30 AM', status: 'Present' },
// { studentId: 'STU001', studentName: 'Rahul Kumar', department: 'CSE', date: '2025-11-05', time: '09:12 AM', status: 'Present' },
// { studentId: 'STU002', studentName: 'Priya Sharma', department: 'ECE', date: '2025-11-05', time: '09:20 AM', status: 'Present' }
// ];
//
// allAttendanceRecords = demoRecords;
// saveAttendanceToStorage();
// }
// }
//
// ==================== STORAGE FUNCTIONS ====================

function saveStudentsToStorage() {
    localStorage.setItem('faceAttendanceStudents', JSON.stringify(allStudents));
}

function saveAttendanceToStorage() {
    localStorage.setItem('faceAttendanceRecords', JSON.stringify(allAttendanceRecords));
}

function loadDataFromStorage() {
    const studentsData = localStorage.getItem('faceAttendanceStudents');
    const attendanceData = localStorage.getItem('faceAttendanceRecords');

    if (studentsData) {
        allStudents = JSON.parse(studentsData);
    }

    if (attendanceData) {
        allAttendanceRecords = JSON.parse(attendanceData);
    }
}

// ==================== DASHBOARD ====================

function updateDashboard() {
    const totalStudents = allStudents.length;
    const todayDate = getTodayDate();
    const todayAttendance = allAttendanceRecords.filter(r => r.date === todayDate).length;

    let totalPresent = 0;
    let totalRecords = 0;

    allAttendanceRecords.forEach(record => {
        totalRecords++;
        if (record.status === 'Present') {
            totalPresent++;
        }
    });

    const attendancePercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('todayAttendance').textContent = todayAttendance;
    document.getElementById('attendancePercentage').textContent = attendancePercentage + '%';
}

// ==================== REGISTRATION ====================

function startRegistrationCamera() {
    const video = document.getElementById('registrationVideo');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } }
        })
            .then(stream => {
                registrationStream = stream;
                video.srcObject = stream;
                video.play();
            })
            .catch(err => {
                showMessage('registrationMessage', 'Error: Could not access webcam. Please allow camera permissions.', 'error');
                console.error('Camera error:', err);
            });
    }
}

function capturePhotoRegistration() {
    const video = document.getElementById('registrationVideo');
    const canvas = document.getElementById('registrationCanvas');
    const ctx = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL('image/jpeg');
    const capturedImage = document.getElementById('capturedImage');
    capturedImage.src = imageData;

    document.getElementById('photoPreview').style.display = 'block';
    document.getElementById('retakeBtn').style.display = 'inline-block';
    document.getElementById('registrationMessage').style.display = 'none';
}

function retakePhoto() {
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('retakeBtn').style.display = 'none';
    document.getElementById('registrationMessage').style.display = 'none';
}

function registerStudent() {
    const studentId = document.getElementById('studentId').value.trim();
    const studentName = document.getElementById('studentName').value.trim();
    const department = document.getElementById('department').value;
    const email = document.getElementById('email').value.trim();
    const capturedImage = document.getElementById('capturedImage').src;

    // Validation
    if (!studentId || !studentName || !department) {
        showMessage('registrationMessage', 'Please fill all required fields', 'error');
        return;
    }

    if (!capturedImage || capturedImage === '') {
        showMessage('registrationMessage', 'Please capture a photo first', 'error');
        return;
    }

    // Check for duplicate student ID
    const isDuplicate = allStudents.some(s => s.studentId === studentId);
    if (isDuplicate) {
        showMessage('registrationMessage', 'Student ID already exists', 'error');
        return;
    }

    // Create student object
    const newStudent = {
        id: generateId(),
        studentId: studentId,
        name: studentName,
        department: department,
        email: email,
        registeredDate: getTodayDate(),
        faceData: capturedImage
    };

    // Add to array and save
    allStudents.push(newStudent);
    saveStudentsToStorage();

    showMessage('registrationMessage', `✓ Student ${studentName} registered successfully!`, 'success');

    // Reset form after 2 seconds
    setTimeout(() => {
        document.getElementById('registrationForm').reset();
        document.getElementById('photoPreview').style.display = 'none';
        document.getElementById('retakeBtn').style.display = 'none';
        showPage('home');
    }, 2000);
}

// ==================== ATTENDANCE MARKING ====================

function initializeAttendancePage() {
    setSessionInfo();
    markedTodayStudents.clear();
    document.getElementById('attendanceList').innerHTML = '<p style="text-align: center; color: #999;">No students marked yet</p>';
}

function startAttendance() {
    const video = document.getElementById('attendanceVideo');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 640 }, height: { ideal: 480 } }
        })
            .then(stream => {
                attendanceStream = stream;
                video.srcObject = stream;
                video.play();

                document.getElementById('startAttendanceBtn').style.display = 'none';
                document.getElementById('stopAttendanceBtn').style.display = 'inline-block';

                isAttendanceRunning = true;
                simulateFaceRecognition();
            })
            .catch(err => {
                console.error('Camera error:', err);
                alert('Error: Could not access webcam');
            });
    }
}

function stopAttendance() {
    isAttendanceRunning = false;

    if (attendanceStream) {
        attendanceStream.getTracks().forEach(track => track.stop());
    }

    document.getElementById('startAttendanceBtn').style.display = 'inline-block';
    document.getElementById('stopAttendanceBtn').style.display = 'none';
    document.getElementById('recognitionStatus').style.display = 'none';
}

function simulateFaceRecognition() {
    if (!isAttendanceRunning) return;

    // Simulate face recognition with random intervals
    const randomDelay = Math.random() * 3000 + 2000; // 2-5 seconds

    setTimeout(() => {
        if (isAttendanceRunning && allStudents.length > 0) {
            // Randomly select a student
            const randomStudent = allStudents[Math.floor(Math.random() * allStudents.length)];

            // Check if already marked today
            if (!markedTodayStudents.has(randomStudent.studentId)) {
                markAttendanceForStudent(randomStudent);
            }
        }

        // Continue simulation
        simulateFaceRecognition();
    }, randomDelay);
}

function markAttendanceForStudent(student) {
    // Show recognition status
    const status = document.getElementById('recognitionStatus');
    const nameSpan = document.getElementById('recognizedName');
    nameSpan.textContent = student.name;
    status.style.display = 'block';

    // Hide status after 2 seconds
    setTimeout(() => {
        status.style.display = 'none';
    }, 2000);

    // Record attendance
    const todayDate = getTodayDate();
    const currentTime = getCurrentTime();

    const attendanceRecord = {
        studentId: student.studentId,
        studentName: student.name,
        department: student.department,
        date: todayDate,
        time: currentTime,
        status: 'Present'
    };

    allAttendanceRecords.push(attendanceRecord);
    markedTodayStudents.add(student.studentId);
    saveAttendanceToStorage();

    // Update attendance list
    updateAttendanceList();
}

function updateAttendanceList() {
    const todayDate = getTodayDate();
    const todayRecords = allAttendanceRecords.filter(r => r.date === todayDate);

    const listContainer = document.getElementById('attendanceList');

    if (todayRecords.length === 0) {
        listContainer.innerHTML = '<p style="text-align: center; color: #999;">No students marked yet</p>';
    } else {
        listContainer.innerHTML = todayRecords.map((record, index) => `
            <div class="attendance-item">
                <div class="attendance-item-info">
                    <div class="attendance-item-id">${record.studentId} - ${record.studentName}</div>
                    <div class="attendance-item-time">${record.time} | ${record.department}</div>
                </div>
                <div style="color: #4CAF50; font-weight: bold;">✓ Present</div>
            </div>
        `).join('');
    }

    document.getElementById('presentCount').textContent = todayRecords.length;
}

function setSessionInfo() {
    document.getElementById('sessionDate').textContent = getTodayDate();
    document.getElementById('sessionTime').textContent = getCurrentTime();
}

// ==================== VIEW ATTENDANCE ====================

function displayAttendanceRecords(records = allAttendanceRecords) {
    currentPage = 1;
    displayPage(records);
}

function displayPage(records = allAttendanceRecords) {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageRecords = records.slice(startIndex, endIndex);

    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';

    if (pageRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">No records found</td></tr>';
    } else {
        pageRecords.forEach((record, index) => {
            const row = `
                <tr>
                    <td>${startIndex + index + 1}</td>
                    <td>${record.studentId}</td>
                    <td>${record.studentName}</td>
                    <td>${record.department}</td>
                    <td>${record.date}</td>
                    <td>${record.time}</td>
                    <td><span class="status-${record.status.toLowerCase()}">${record.status}</span></td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    }

    // Update pagination
    const totalPages = Math.ceil(records.length / recordsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages;
}

function nextPage() {
    const records = getFilteredRecords();
    const totalPages = Math.ceil(records.length / recordsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayPage(records);
    }
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        const records = getFilteredRecords();
        displayPage(records);
    }
}

function sortTable(column) {
    const records = getFilteredRecords();

    if (sortColumn === column) {
        sortAscending = !sortAscending;
    } else {
        sortColumn = column;
        sortAscending = true;
    }

    records.sort((a, b) => {
        let valueA, valueB;

        switch (column) {
            case 0: valueA = ''; valueB = ''; break;
            case 1: valueA = a.studentId; valueB = b.studentId; break;
            case 2: valueA = a.studentName; valueB = b.studentName; break;
            case 3: valueA = a.department; valueB = b.department; break;
            case 4: valueA = a.date; valueB = b.date; break;
            case 5: valueA = a.time; valueB = b.time; break;
            case 6: valueA = a.status; valueB = b.status; break;
            default: valueA = ''; valueB = '';
        }

        if (valueA < valueB) return sortAscending ? -1 : 1;
        if (valueA > valueB) return sortAscending ? 1 : -1;
        return 0;
    });

    displayPage(records);
}

function applyFilters() {
    displayPage(getFilteredRecords());
}

function clearFilters() {
    document.getElementById('filterFromDate').value = '';
    document.getElementById('filterToDate').value = '';
    document.getElementById('filterDepartment').value = '';
    document.getElementById('filterStudentId').value = '';
    displayPage(allAttendanceRecords);
}

function getFilteredRecords() {
    const fromDate = document.getElementById('filterFromDate').value;
    const toDate = document.getElementById('filterToDate').value;
    const department = document.getElementById('filterDepartment').value;
    const studentId = document.getElementById('filterStudentId').value.trim().toUpperCase();

    return allAttendanceRecords.filter(record => {
        const recordDate = record.date;

        if (fromDate && recordDate < fromDate) return false;
        if (toDate && recordDate > toDate) return false;
        if (department && record.department !== department) return false;
        if (studentId && !record.studentId.includes(studentId)) return false;

        return true;
    });
}

// ==================== EXPORT ====================

function setExportDateRange() {
    const today = getTodayDate();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    document.getElementById('exportFromDate').value = formatDate(thirtyDaysAgo);
    document.getElementById('exportToDate').value = today;
}

function updateExportPreview() {
    const fromDate = document.getElementById('exportFromDate').value;
    const toDate = document.getElementById('exportToDate').value;
    const department = document.getElementById('exportDepartment').value;

    const filteredRecords = allAttendanceRecords.filter(record => {
        if (fromDate && record.date < fromDate) return false;
        if (toDate && record.date > toDate) return false;
        if (department && record.department !== department) return false;
        return true;
    });

    const previewRecords = filteredRecords.slice(0, 10);
    const tbody = document.getElementById('exportPreviewBody');

    if (previewRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No records to export</td></tr>';
    } else {
        tbody.innerHTML = previewRecords.map(record => `
            <tr>
                <td>${record.studentId}</td>
                <td>${record.studentName}</td>
                <td>${record.department}</td>
                <td>${record.date}</td>
                <td>${record.time}</td>
                <td><span class="status-${record.status.toLowerCase()}">${record.status}</span></td>
            </tr>
        `).join('');
    }
}

function exportToCSV() {
    const fromDate = document.getElementById('exportFromDate').value;
    const toDate = document.getElementById('exportToDate').value;
    const department = document.getElementById('exportDepartment').value;

    const filteredRecords = allAttendanceRecords.filter(record => {
        if (fromDate && record.date < fromDate) return false;
        if (toDate && record.date > toDate) return false;
        if (department && record.department !== department) return false;
        return true;
    });

    if (filteredRecords.length === 0) {
        showMessage('exportMessage', 'No records to export', 'warning');
        return;
    }

    // Create CSV content
    let csvContent = 'Student ID,Name,Department,Date,Time,Status\n';

    filteredRecords.forEach(record => {
        csvContent += `${record.studentId},"${record.studentName}",${record.department},${record.date},${record.time},${record.status}\n`;
    });

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_${getTodayDate()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    showMessage('exportMessage', `✓ Exported ${filteredRecords.length} records successfully!`, 'success');
}

// ==================== UTILITY FUNCTIONS ====================

function getTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const displayHours = now.getHours() % 12 || 12;
    return `${String(displayHours).padStart(2, '0')}:${minutes} ${ampm}`;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
}

function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message show ${type}`;

    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 5000);
}

// ==================== EVENT LISTENERS ====================

// Update export preview when filters change
document.addEventListener('change', function (e) {
    if (e.target.id === 'exportFromDate' || e.target.id === 'exportToDate' || e.target.id === 'exportDepartment') {
        updateExportPreview();
    }
});

// Cleanup streams on page unload
window.addEventListener('beforeunload', function () {
    if (registrationStream) {
        registrationStream.getTracks().forEach(track => track.stop());
    }
    if (attendanceStream) {
        attendanceStream.getTracks().forEach(track => track.stop());
    }
});

// Initialize app on page load
window.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    showPage('home');
});
>>>>>>> d3f0c173da363c5b365fe4b4ad0e81081c046e51

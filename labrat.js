import './js/config.js';

document.addEventListener('DOMContentLoaded', function () {
    let lastPdfBlobUrl = null;
    let lastPdfFile = null;



    // ========== Custom Dropdown Functions (from routine page) ==========

    // Dropdown animation helpers
    function showDropdown(dropdown) {
        if (!dropdown) return;
        dropdown.classList.remove('hidden', 'hiding');
        dropdown.offsetHeight; // Force reflow
        dropdown.classList.add('showing');
    }

    function hideDropdown(dropdown) {
        if (!dropdown) return;
        dropdown.classList.remove('showing');
        dropdown.classList.add('hiding');
        setTimeout(() => {
            dropdown.classList.remove('hiding');
            dropdown.classList.add('hidden');
        }, 200);
    }


    // Helper function to check if an option is a placeholder
    function isPlaceholderOption(option) {
        if (!option) return false;
        const value = option.value || '';
        const text = option.textContent.trim() || '';
        // Only skip if BOTH value is empty AND text starts with "Select" or is empty
        return (value === '' && (text === '' || /^select\s/i.test(text)));
    }


    // Helper function to get button display text
    function getButtonText(selectElement) {
        const selectedOption = selectElement.options[selectElement.selectedIndex];
        if (!selectedOption) return '';
        return selectedOption.textContent;
    }

    // Convert native select to custom animated dropdown
    function convertSelectToCustomDropdown(selectElement) {
        if (!selectElement || selectElement.dataset.converted === 'true') return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'custom-dropdown';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'custom-dropdown-button';
        if (selectElement.disabled) button.classList.add('disabled');

        const menu = document.createElement('div');
        menu.className = 'custom-dropdown-menu hidden';

        button.textContent = getButtonText(selectElement);

        function updateMenu() {
            menu.innerHTML = '';
            Array.from(selectElement.options).forEach((option, index) => {
                if (isPlaceholderOption(option)) return;

                const item = document.createElement('div');
                item.className = 'custom-dropdown-item';
                if (option.selected && !isPlaceholderOption(option)) {
                    item.classList.add('selected');
                }
                if (option.disabled) item.classList.add('disabled');
                item.textContent = option.textContent;
                item.dataset.value = option.value;
                item.dataset.index = index;

                item.addEventListener('click', (e) => {
                    if (option.disabled) return;
                    e.stopPropagation();
                    selectElement.selectedIndex = index;
                    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                    button.textContent = option.textContent;
                    hideDropdown(menu);
                    button.classList.remove('open');
                    menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                });

                menu.appendChild(item);
            });
        }

        updateMenu();

        button.addEventListener('click', (e) => {
            e.stopPropagation();
            if (selectElement.disabled) return;

            const isOpen = menu.classList.contains('showing');

            document.querySelectorAll('.custom-dropdown-menu.showing').forEach(dd => {
                if (dd !== menu) {
                    hideDropdown(dd);
                    dd.closest('.custom-dropdown')?.querySelector('.custom-dropdown-button')?.classList.remove('open');
                }
            });

            if (isOpen) {
                hideDropdown(menu);
                button.classList.remove('open');
            } else {
                showDropdown(menu);
                button.classList.add('open');
            }
        });

        const observer = new MutationObserver(() => {
            button.textContent = getButtonText(selectElement);
            updateMenu();
        });
        observer.observe(selectElement, { childList: true, attributes: true, attributeFilter: ['selected'] });

        selectElement.addEventListener('change', () => {
            button.textContent = getButtonText(selectElement);
            updateMenu();
        });

        const disabledObserver = new MutationObserver(() => {
            if (selectElement.disabled) {
                button.classList.add('disabled');
                hideDropdown(menu);
                button.classList.remove('open');
            } else {
                button.classList.remove('disabled');
            }
        });
        disabledObserver.observe(selectElement, { attributes: true, attributeFilter: ['disabled'] });

        wrapper.appendChild(button);
        wrapper.appendChild(menu);

        selectElement.style.display = 'none';
        selectElement.dataset.converted = 'true';
        selectElement.parentNode.insertBefore(wrapper, selectElement);
        wrapper.appendChild(selectElement);

        return wrapper;
    }

    // Global click listener to close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            document.querySelectorAll('.custom-dropdown-menu.showing').forEach(menu => {
                hideDropdown(menu);
                menu.closest('.custom-dropdown')?.querySelector('.custom-dropdown-button')?.classList.remove('open');
            });
        }
    });

    // Convert department select to custom dropdown
    const departmentSelect = document.getElementById('departmentSelect');
    if (departmentSelect) {
        setTimeout(() => {
            convertSelectToCustomDropdown(departmentSelect);
        }, 100);
    }

    // ========== End Custom Dropdown Functions ==========

    // Show/hide Teacher 2 fields based on checkbox
    const teacher2Enable = document.getElementById('teacher2Enable');
    const teacher2Fields = document.getElementById('teacher2Fields');
    if (teacher2Enable && teacher2Fields) {
        teacher2Enable.addEventListener('change', function () {
            teacher2Fields.style.display = this.checked ? 'block' : 'none';
        });
    }

    // Handle Department Selection (CSE hides Date Inputs)
    const dateInputsContainer = document.getElementById('dateInputsContainer');
    if (departmentSelect && dateInputsContainer) {
        departmentSelect.addEventListener('change', function () {
            if (this.value === 'CSE') {
                dateInputsContainer.classList.add('hidden');
            } else {
                dateInputsContainer.classList.remove('hidden');
            }
        });
    }

    // Set default date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1;
    let dd = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    const formattedToday = `${yyyy}-${mm}-${dd}`;

    const submissionDateEl = document.getElementById('submissionDate');
    const experimentDateEl = document.getElementById('experimentDate');

    if (submissionDateEl && experimentDateEl) {
        submissionDateEl.value = formattedToday;
        experimentDateEl.value = formattedToday;

        const dateConfig = {
            dateFormat: 'Y-m-d',
            defaultDate: formattedToday,
            altInput: true,
            altFormat: 'F j, Y',
            allowInput: true,
            disableMobile: true,
            appendTo: document.body,
            position: 'above',
            onReady: function (selectedDates, dateStr, instance) {
                if (instance.altInput) {
                    instance.set('positionElement', instance.altInput);
                }
            },
            onOpen: function (selectedDates, dateStr, instance) {
                if (instance.altInput) {
                    instance.set('positionElement', instance.altInput);
                }
            }
        };

        if (window.flatpickr) {
            flatpickr(submissionDateEl, dateConfig);
            flatpickr(experimentDateEl, dateConfig);
        }
    }

    const validationDialog = document.getElementById('validationDialog');
    const validationClose = document.getElementById('validationClose');
    const validationOk = document.getElementById('validationOk');
    const allInputs = document.querySelectorAll('input, select');

    // ========== Auto-Fill / Toggle Logic ==========
    const autoFillToggle = document.getElementById('autoFillToggle');
    const autoFillFields = {
        studentName: document.getElementById('studentName'),
        studentId: document.getElementById('studentId'),
        section: document.getElementById('section'),
        semester: document.getElementById('semester'),
        departmentSelect: document.getElementById('departmentSelect') // Use Department too
    };

    function handleAutoFill() {
        if (!autoFillToggle) return;
        const isMe = autoFillToggle.checked;

        if (isMe) {
            // Try to load user data from localStorage
            try {
                const userProfileStr = localStorage.getItem('cse.userProfile'); // Set by app.js
                if (userProfileStr) {
                    const profile = JSON.parse(userProfileStr);

                    // Fill and Disable
                    if (autoFillFields.studentName) {
                        autoFillFields.studentName.value = profile.name || '';
                        autoFillFields.studentName.readOnly = true;
                        autoFillFields.studentName.classList.add('auto-filled');
                    }
                    if (autoFillFields.studentId) {
                        autoFillFields.studentId.value = profile.id || profile.studentId || '';
                        autoFillFields.studentId.readOnly = true;
                        autoFillFields.studentId.classList.add('auto-filled');
                    }
                    if (autoFillFields.section) {
                        autoFillFields.section.value = profile.section || '';
                        autoFillFields.section.readOnly = true;
                        autoFillFields.section.classList.add('auto-filled');
                    }
                    if (autoFillFields.semester) {
                        // Map 1-1 to 1st, etc if stored as code
                        const semCode = profile.text_semester || profile.semester || '';
                        // Simple mapper or just use value
                        const semMap = {
                            '1-1': '1st', '1-2': '2nd', '2-1': '3rd', '2-2': '4th',
                            '3-1': '5th', '3-2': '6th', '4-1': '7th', '4-2': '8th'
                        };
                        autoFillFields.semester.value = semMap[semCode] || semCode;
                        autoFillFields.semester.readOnly = true;
                        autoFillFields.semester.classList.add('auto-filled');
                    }
                    // Department
                    if (profile.dept || profile.department) {
                        const d = profile.dept || profile.department;
                        if (autoFillFields.departmentSelect) {
                            autoFillFields.departmentSelect.value = d;
                            // Trigger change event to update UI logic (like dates for CSE)
                            autoFillFields.departmentSelect.dispatchEvent(new Event('change'));
                        }
                    }

                }
            } catch (e) {
                console.warn('Failed to auto-fill user data', e);
            }
        } else {
            // Enable fields for "Another" and CLEAR them
            Object.values(autoFillFields).forEach(el => {
                if (el && el !== autoFillFields.departmentSelect) {
                    el.readOnly = false;
                    el.classList.remove('auto-filled');
                    el.value = ''; // Clear value as requested
                }
            });
        }
    }

    if (autoFillToggle) {
        autoFillToggle.addEventListener('change', handleAutoFill);
        // Run on init
        handleAutoFill();
    }

    // Auto-filled style
    const style = document.createElement('style');
    style.innerHTML = `
        .auto-filled {
            background-color: #171717 !important;
            color: #ffffff !important;
            cursor: default;
            opacity: 1;
            border-color: var(--outline);
        }
    `;
    document.head.appendChild(style);


    // ========== Download PDF (with Progress Animation) ==========
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            if (validateForm()) {
                const originalText = downloadBtn.innerHTML; // Save original state

                // Add downloading class
                downloadBtn.classList.add('downloading');
                downloadBtn.disabled = true;

                // Simulate Progress Values (0 to 90%)
                let progress = 0;

                // Initial Display
                const updateBtnContent = (percent, text = "Downloading...") => {
                    downloadBtn.style.setProperty('--progress', `${percent}%`);
                    downloadBtn.innerHTML = `
                        <div class="primary-btn-content">
                            <svg class="spinner" viewBox="0 0 50 50" style="width:18px;height:18px;animation:spin 1s linear infinite;">
                                <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5"></circle>
                            </svg>
                            <span style="font-weight:600; font-family:'Courier New', monospace; letter-spacing:0.5px;">${text} ${percent}%</span>
                        </div>
                    `;
                };

                updateBtnContent(0);

                // Start smooth progress simulation
                const interval = setInterval(() => {
                    // Slow down as we approach 90%
                    const remaining = 90 - progress;
                    const increment = Math.max(1, Math.floor(Math.random() * (remaining / 5)));
                    progress = Math.min(90, progress + increment);
                    updateBtnContent(progress);
                }, 150);

                // Delay slightly to allow UI redraw
                setTimeout(() => {
                    downloadPDF().then(() => {
                        clearInterval(interval);
                        // Jump to 100%
                        updateBtnContent(100, "Done!");

                        // Brief pause to show 100% before transition (though form hides instantly)
                        setTimeout(() => {
                            // Reset for next time (in background since form is hidden)
                            downloadBtn.classList.remove('downloading');
                            downloadBtn.style.removeProperty('--progress');
                            downloadBtn.innerHTML = originalText;
                            downloadBtn.disabled = false;
                        }, 500);

                    }).catch(err => {
                        console.error(err);
                        clearInterval(interval);
                        downloadBtn.classList.remove('downloading');
                        downloadBtn.innerHTML = originalText; // Revert on error
                        downloadBtn.disabled = false;
                        alert('Error downloading PDF');
                    });
                }, 100);
            }
        });
    }

    // Live remove error state when user fixes a field
    allInputs.forEach(el => {
        el.addEventListener('input', function () {
            if ((this.value || '').trim()) {
                this.classList.remove('input-error');
            }
        });
        el.addEventListener('change', function () {
            if ((this.value || '').trim()) {
                this.classList.remove('input-error');
            }
        });
    });

    // Success page button handlers
    const openPdfBtn = document.getElementById('openPdfBtn');
    if (openPdfBtn) {
        openPdfBtn.addEventListener('click', function () {
            if (lastPdfBlobUrl) {
                window.open(lastPdfBlobUrl, '_blank');
            } else {
                alert('Please generate and download the PDF first.');
            }
        });
    }

    const sharePdfBtn = document.getElementById('sharePdfBtn');
    if (sharePdfBtn) {
        sharePdfBtn.addEventListener('click', function () {
            if (lastPdfFile && navigator.share && navigator.canShare && navigator.canShare({ files: [lastPdfFile] })) {
                navigator.share({
                    title: 'Lab Report',
                    text: 'Varendra University Lab Report Front Page',
                    files: [lastPdfFile]
                }).catch(() => { });
            } else {
                copyToClipboard();
            }
        });
    }

    const newReportBtn = document.getElementById('newReportBtn');
    if (newReportBtn) {
        newReportBtn.addEventListener('click', function () {
            // Reset form and show form section
            resetForm();
            const successSection = document.getElementById('successSection');
            const formSection = document.getElementById('formSection');
            if (successSection) successSection.classList.add('hidden');
            if (formSection) formSection.classList.remove('hidden');
        });
    }

    function copyToClipboard() {
        const text = 'Lab Report PDF downloaded successfully!';
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert('Message copied to clipboard!');
            });
        }
    }

    function validateForm() {
        let requiredIds = [
            'courseCode', 'courseTitle', 'experimentNo', 'experimentName',
            'studentName', 'studentId', 'section', 'semester', 'batch',
            'teacher1Name', 'teacher1Designation'
        ];

        const dep = document.getElementById('departmentSelect');
        if (!dep || dep.value !== 'CSE') {
            requiredIds.push('submissionDate', 'experimentDate');
        }
        if (teacher2Enable && teacher2Enable.checked) {
            requiredIds.push('teacher2Name', 'teacher2Designation');
        }

        let allValid = true;
        requiredIds.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const value = (el.value || '').trim();
            if (!value) {
                allValid = false;
                el.classList.add('input-error');
            } else {
                el.classList.remove('input-error');
            }
        });

        if (!allValid) {
            showValidationDialog();
        }
        return allValid;
    }

    function resetForm() {
        if (document.getElementById('departmentSelect')) {
            document.getElementById('departmentSelect').value = 'EEE';
        }
        if (document.getElementById('dateInputsContainer')) {
            document.getElementById('dateInputsContainer').classList.remove('hidden');
        }
        const fields = [
            'courseCode', 'courseTitle', 'experimentNo', 'experimentName',
            'studentName', 'studentId', 'section', 'semester', 'batch',
            'teacher1Name', 'teacher1Designation', 'teacher2Name', 'teacher2Designation'
        ];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        const subDate = document.getElementById('submissionDate');
        const expDate = document.getElementById('experimentDate');
        if (subDate) subDate.value = formattedToday;
        if (expDate) expDate.value = formattedToday;

        if (window.flatpickr && subDate && expDate) {
            if (subDate._flatpickr) subDate._flatpickr.setDate(formattedToday);
            if (expDate._flatpickr) expDate._flatpickr.setDate(formattedToday);
        }

        // Re-apply toggle logic after reset
        handleAutoFill();
    }

    function updatePreview() {
        // Get all input values
        const getValue = (id) => {
            const el = document.getElementById(id);
            return el ? (el.value || '__________') : '__________';
        };

        const courseCode = getValue('courseCode');
        const courseTitle = getValue('courseTitle');
        const experimentNo = getValue('experimentNo');
        const experimentName = getValue('experimentName');
        const studentName = getValue('studentName');
        const studentId = getValue('studentId');
        const section = getValue('section');
        const semester = getValue('semester');
        const batch = getValue('batch');
        const teacher1Name = getValue('teacher1Name');
        const teacher1Designation = getValue('teacher1Designation');

        let teacher2Name = '';
        let teacher2Designation = '';
        if (teacher2Enable && teacher2Enable.checked) {
            teacher2Name = getValue('teacher2Name');
            teacher2Designation = getValue('teacher2Designation');
        }

        // Format the date for display
        const getFormattedDate = (id) => {
            const inputEl = document.getElementById(id);
            if (inputEl && inputEl.value) {
                const dateObj = new Date(inputEl.value);
                return dateObj.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }
            return '__________';
        };

        const submissionDate = getFormattedDate('submissionDate');
        const experimentDate = getFormattedDate('experimentDate');

        // Update preview elements
        const setText = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setText('previewCourseCode', courseCode);
        setText('previewCourseTitle', courseTitle);
        setText('previewExperimentNo', experimentNo);
        setText('previewExperimentName', experimentName);
        setText('previewStudentName', studentName);
        setText('previewStudentId', studentId);
        setText('previewSection', section);
        setText('previewSemester', semester);
        setText('previewBatch', batch);
        setText('previewTeacher1Name', teacher1Name);
        setText('previewTeacher1Designation', teacher1Designation);
        setText('previewTeacher2Name', teacher2Name);
        setText('previewTeacher2Designation', teacher2Designation);

        // Show/hide Teacher 2 block in preview
        const teacher2PreviewBlock = document.getElementById('teacher2PreviewBlock');
        const departmentTitle = document.getElementById('previewDepartmentTitle');

        if (teacher2PreviewBlock && teacher2Enable) {
            const isT2Enabled = teacher2Enable.checked;

            // Toggle Display (removes from flow vs just hiding)
            teacher2PreviewBlock.style.display = isT2Enabled ? 'flex' : 'none';

            // Adjust Department Title spacing
            if (departmentTitle) {
                // If T2 is ON: Standard margin (15px)
                // If T2 is OFF: Tighter margin (8px) to reduce whitespace
                departmentTitle.style.marginTop = isT2Enabled ? '15px' : '12px';
            }
        }

        setText('previewSubmissionDate', submissionDate);
        setText('previewExperimentDate', experimentDate);

        // Department specific logic
        const depEl = document.getElementById('departmentSelect');
        // Safely check if elements exist before accessing propertys
        const department = depEl ? depEl.value : 'EEE';
        const previewElement = document.getElementById('preview');
        const previewLeftLogo = document.getElementById('previewLeftLogo');
        const previewDepartmentName = document.getElementById('previewDepartmentName');

        if (department === 'CSE') {
            if (previewLeftLogo) previewLeftLogo.src = 'logo_image/cse_logo.jpg';
            if (previewDepartmentName) previewDepartmentName.textContent = 'Department of Computer Science and Engineering';
            if (previewElement) previewElement.classList.add('cse-template');
        } else {
            if (previewLeftLogo) previewLeftLogo.src = 'logo_image/eee-logo.png';
            if (previewDepartmentName) previewDepartmentName.textContent = 'Department of Electrical and Electronic Engineering';
            if (previewElement) previewElement.classList.remove('cse-template');
        }
    }

    function downloadPDF() {
        return new Promise((resolve, reject) => {
            try {
                // Update preview first
                updatePreview();

                const { jsPDF } = window.jspdf;
                const previewElement = document.getElementById('preview');
                if (!previewElement) {
                    resolve();
                    return;
                }

                // Wait a moment for images to load
                setTimeout(() => {
                    // Force scroll to top before capture to prevent cropping
                    window.scrollTo(0, 0);

                    // Higher scale for better resolution (MS Word quality)
                    html2canvas(previewElement, {
                        scale: 4, // Increased from 3 to 4 for sharper text
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff',
                        width: 794, // Force A4 Width for canvas
                        height: 1123, // Force A4 Height
                        windowWidth: 1200, // Force Desktop Viewport logic
                        scrollY: 0, // Reset Scroll
                        scrollX: 0,
                        removeContainer: false,
                        imageTimeout: 5000,
                        allowTaint: false,
                        letterRendering: true, // Better text rendering
                        onclone: function (clonedDoc) {
                            // Fix for mobile: Force the cloned document to be desktop-sized
                            const clonedHtml = clonedDoc.documentElement;
                            const clonedBody = clonedDoc.body;
                            const clonedPreview = clonedDoc.getElementById('preview');

                            if (clonedHtml) {
                                clonedHtml.style.width = '1200px';
                                clonedHtml.style.height = 'auto';
                                clonedHtml.style.overflow = 'visible';
                            }
                            if (clonedBody) {
                                clonedBody.style.width = '1200px';
                                clonedBody.style.height = 'auto';
                                clonedBody.style.overflow = 'visible';
                                clonedBody.style.position = 'relative';
                            }

                            if (clonedPreview) {
                                clonedPreview.style.transform = 'none'; // Reset any transforms
                                clonedPreview.style.color = '#000000';

                                // Bring it into the viewport of the clone
                                clonedPreview.style.position = 'absolute';
                                clonedPreview.style.left = '0px';
                                clonedPreview.style.top = '0px';

                                // Explicitly force width again in clone
                                clonedPreview.style.width = '794px';
                                clonedPreview.style.minWidth = '794px';
                                clonedPreview.style.height = '1123px';
                                clonedPreview.style.minHeight = '1123px';
                                clonedPreview.style.margin = '0 auto';

                                const allElements = clonedPreview.querySelectorAll('*');
                                allElements.forEach(el => {
                                    el.style.color = '#000000';
                                    el.style.webkitTextSizeAdjust = 'none';
                                    el.style.textSizeAdjust = 'none';
                                });
                            }
                        }
                    }).then(canvas => {
                        // Convert to JPEG with 0.8 quality (Great balance of size vs quality)
                        // PNG at scale 4 is huge (MBs). JPEG at scale 4 is crisp and small (~150kb).
                        const imgData = canvas.toDataURL("image/jpeg", 0.8);

                        // Enable compression
                        const pdf = new jsPDF({
                            orientation: 'p',
                            unit: 'mm',
                            format: 'a4',
                            compress: true
                        });

                        const imgWidth = 210; // A4 width in mm
                        const imgHeight = (canvas.height * imgWidth) / canvas.width;

                        // Add image to PDF
                        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, 'FAST');

                        // Generate Filename based on Experiment Name
                        const expNameInput = document.getElementById('experimentName');
                        let fileName = 'LabRat.pdf';

                        if (expNameInput && expNameInput.value.trim()) {
                            // Sanitize: keep only letters, numbers, spaces
                            let safeName = expNameInput.value.trim().replace(/[^a-zA-Z0-9 ]/g, '');
                            // Replace spaces with underscores
                            safeName = safeName.replace(/\s+/g, '_');
                            // Truncate to reasonable length (e.g. 25 chars)
                            if (safeName.length > 25) {
                                safeName = safeName.substring(0, 25);
                            }
                            if (safeName) {
                                fileName = `LabRat_${safeName}.pdf`;
                            }
                        }

                        // Get blob and blob URL for open/share
                        const pdfBlob = pdf.output('blob');
                        if (lastPdfBlobUrl) {
                            URL.revokeObjectURL(lastPdfBlobUrl);
                        }
                        lastPdfBlobUrl = URL.createObjectURL(pdfBlob);
                        lastPdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

                        // Check if running inside Flutter App (via JavascriptChannel)
                        // Flutter App should inject a channel named 'DownloadChannel'
                        if (window.DownloadChannel) {
                            const pdfBase64 = pdf.output('datauristring');
                            // Send base64 data to Flutter
                            window.DownloadChannel.postMessage(JSON.stringify({
                                type: 'pdf_download',
                                data: pdfBase64,
                                filename: fileName
                            }));
                        } else {
                            // Standard Browser Download
                            pdf.save(fileName);
                        }

                        // Show success page
                        setTimeout(() => {
                            const formSec = document.getElementById('formSection');
                            const successSec = document.getElementById('successSection');

                            // 1. Hide form, Show success
                            if (formSec) formSec.classList.add('hidden');
                            if (successSec) successSec.classList.remove('hidden');

                            // 2. Force scroll to top immediately (bypassing smooth scroll)
                            window.scrollTo({ top: 0, behavior: 'instant' });
                            document.body.scrollTop = 0; // For Safari
                            document.documentElement.scrollTop = 0; // For Chrome, Firefox, IE, Opera

                            // 3. Force AGAIN after a short delay to override any browser scroll restoration
                            setTimeout(() => {
                                window.scrollTo({ top: 0, behavior: 'instant' });
                            }, 50);


                            // Track Download
                            try {
                                if (window.firebase) {
                                    const db = window.firebase.database();
                                    const user = window.firebase.auth().currentUser;

                                    // 1. Global Count
                                    const statsRef = db.ref('stats/totalLabReportDownloads');
                                    statsRef.transaction((currentValue) => {
                                        return (currentValue || 0) + 1;
                                    });

                                    // 2. User Count
                                    if (user) {
                                        const userRef = db.ref('users/' + user.uid + '/labReportDownloads');
                                        userRef.transaction((currentValue) => {
                                            return (currentValue || 0) + 1;
                                        });
                                    }
                                }
                            } catch (e) {
                                console.error('Tracking error:', e);
                            }

                            initSuccessLottie();
                            resolve();
                        }, 400);
                    }).catch(error => {
                        console.error('PDF generation error:', error);
                        alert('Error generating PDF. Please try again.');
                        reject(error);
                    });
                }, 300);
            } catch (err) {
                reject(err);
            }
        });
    }

    function initSuccessLottie() {
        if (!window.lottie) return;
        const container = document.getElementById('successLottie');

        // Ensure container exists and is clean
        if (container) {
            container.innerHTML = '';
            // Remove any previous attributes if any
            container.removeAttribute('data-loaded');
        } else {
            return;
        }

        // Clean up any existing animations globally to prevent conflicts
        try {
            window.lottie.destroy();
        } catch (e) { }

        try {
            window.lottie.loadAnimation({
                container: container,
                renderer: 'svg',
                loop: false,
                autoplay: true,
                path: './animation_file/Done.json', // Explicit local path
                rendererSettings: {
                    preserveAspectRatio: 'xMidYMid meet', // Ensure it fits well
                    progressiveLoad: true
                }
            });
            container.dataset.loaded = 'true';
        } catch (e) {
            console.error('Lottie load error:', e);
            container.innerHTML = '<div style="font-size:40px; text-align:center;">✅</div>'; // Fallback
        }
    }

    function showValidationDialog() {
        if (!validationDialog) return;
        validationDialog.classList.remove('hidden');
    }

    function hideValidationDialog() {
        if (!validationDialog) return;
        validationDialog.classList.add('hidden');
    }

    if (validationClose) {
        validationClose.addEventListener('click', hideValidationDialog);
    }
    if (validationOk) {
        validationOk.addEventListener('click', hideValidationDialog);
    }
    if (validationDialog) {
        validationDialog.addEventListener('click', function (e) {
            if (e.target === validationDialog) {
                hideValidationDialog();
            }
        });
    }
});

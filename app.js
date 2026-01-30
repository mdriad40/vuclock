(function () {
  // Use modules if available, otherwise fallback to local definitions
  const PRIMARY_COLOR = window.AppConfig?.PRIMARY_COLOR || '#6C63FF';
  const DAYS_ORDER = window.AppConfig?.DAYS_ORDER || ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const DEPARTMENT_LOCK_MODE = window.AppConfig?.DEPARTMENT_LOCK_MODE || 'yes';
  const db = window.AppConfig?.db || (window.firebase ? window.firebase.database() : null);

  // Use state from module if available, otherwise create local
  const routineData = window.AppState?.routineData || {};
  const crDetails = window.AppState?.crDetails || {};
  const versionLabels = window.AppState?.versionLabels || {};
  let departments = window.AppState?.departments || [];
  let departmentSections = window.AppState?.departmentSections || {};
  let departmentAvailability = {}; // { 'EEE': true, 'CSE': false, ... }
  let currentTimeFormat = 'format2'; // Default to standard

  // Sync with AppState if it exists
  if (window.AppState) {
    window.AppState.routineData = routineData;
    window.AppState.crDetails = crDetails;
    window.AppState.versionLabels = versionLabels;
    window.AppState.departments = departments;
    window.AppState.departmentSections = departmentSections;
  }

  // ========== PRESENCE SYSTEM & VISIT COUNTER ==========
  if (db) {
    const connectedRef = db.ref(".info/connected");
    const activeSessionsRef = db.ref("active_sessions");
    const statsRef = db.ref("stats");

    connectedRef.on("value", (snap) => {
      if (snap.val() === true) {
        // 1. Manage Active Sessions (Live)
        const con = activeSessionsRef.push();
        con.onDisconnect().remove();
        con.set(true);

        // 2. Increment Visit Counters
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        // Increment All-time Total Visits
        statsRef.child('total_visits').transaction((current) => {
          return (current || 0) + 1;
        });

        // Increment Today's Visits
        statsRef.child('daily_visits').child(todayStr).transaction((current) => {
          return (current || 0) + 1;
        });

        // Increment Monthly Visits (For Growth Calculation)
        const monthStr = `${year}-${month}`;
        statsRef.child('monthly_visits').child(monthStr).transaction((current) => {
          return (current || 0) + 1;
        });
      }
    });
  }

  const els = {
    screens: {
      landing: document.getElementById('landing'),
      student: document.getElementById('student'),
      teacher: document.getElementById('teacher'),
      empty: document.getElementById('empty'), // "Empty" was the old placeholder for "More"
      more: document.getElementById('more'),   // Add "more" explicitly
      query: document.getElementById('query'),
      booking: document.getElementById('booking'),
      notice: document.getElementById('notice'),
      privacy: document.getElementById('privacy'),
      support: document.getElementById('support'),
      information: document.getElementById('information'),
      todo: document.getElementById('todo'),
      schedio: document.getElementById('schedio')
    },
    landingOverlay: document.getElementById('landingOverlay'),
    // Query screen elements
    roomQueryTab: document.getElementById('roomQueryTab'),

    crInfoTab: document.getElementById('crInfoTab'),
    roomQueryInterface: document.getElementById('roomQueryInterface'),
    crInfoInterface: document.getElementById('crInfoInterface'),
    roomQueryDepartment: document.getElementById('roomQueryDepartment'),
    roomQuerySearchBy: document.getElementById('roomQuerySearchBy'),
    roomQueryThirdSelect: document.getElementById('roomQueryThirdSelect'),
    roomQueryThirdLabel: document.getElementById('roomQueryThirdLabel'),
    roomQueryDaySelectorWrapper: document.getElementById('roomQueryDaySelectorWrapper'),
    roomQueryDayTitle: document.getElementById('roomQueryDayTitle'),
    roomQueryDayScroller: document.getElementById('roomQueryDayScroller'),
    roomQueryDateToday: document.getElementById('roomQueryDateToday'),
    roomQueryLottie: document.getElementById('roomQueryLottie'),
    roomQueryResults: document.getElementById('roomQueryResults'),
    crInfoDepartment: document.getElementById('crInfoDepartment'),
    crInfoSemester: document.getElementById('crInfoSemester'),
    crInfoSection: document.getElementById('crInfoSection'),
    crInfoLottie: document.getElementById('crInfoLottie'),
    crInfoResults: document.getElementById('crInfoResults'),
    department: document.getElementById('department'),
    lottie: document.getElementById('lottie'),
    getSchedule: document.getElementById('getSchedule'),
    landingError: document.getElementById('landingError'),
    semester: document.getElementById('semester'),
    section: document.getElementById('section'),
    // student screen
    departmentDisplay: document.getElementById('departmentDisplay'),
    semesterDisplay: document.getElementById('semesterDisplay'),
    sectionDisplay: document.getElementById('sectionDisplay'),
    // removed edit/apply buttons; direct editing instead
    detailsSemester: document.getElementById('detailsSemester'),
    detailsSection: document.getElementById('detailsSection'),
    detailsTotal: document.getElementById('detailsTotal'),
    detailsVersion: document.getElementById('detailsVersion'),
    detailsCR1: document.getElementById('detailsCR1'),
    detailsCR2: document.getElementById('detailsCR2'),
    dayScroller: document.getElementById('dayScroller'),
    dateToday: document.getElementById('dateToday'),
    scheduleContainer: document.getElementById('scheduleContainer'),
    emptyMessage: document.getElementById('emptyMessage'),
    emptyLottie: document.getElementById('emptyLottie'),
    networkMessage: document.getElementById('networkMessage'),
    tabs: Array.from(document.querySelectorAll('.tabbar .tab')),
    // teacher screen
    teacherSearch: document.getElementById('teacherSearch'),
    teacherSuggestions: document.getElementById('teacherSuggestions'),
    teacherDepartment: document.getElementById('teacherDepartment'),
    teacherDetailsName: document.getElementById('teacherDetailsName'),
    teacherDetailsBatch: document.getElementById('teacherDetailsBatch'),
    teacherDetailsTotal: document.getElementById('teacherDetailsTotal'),
    teacherDetailsVersion: document.getElementById('teacherDetailsVersion'),
    teacherDayScroller: document.getElementById('teacherDayScroller'),
    teacherDateToday: document.getElementById('teacherDateToday'),
    teacherLottie: document.getElementById('teacherLottie'),
    teacherScheduleContainer: document.getElementById('teacherScheduleContainer'),
    teacherEmptyMessage: document.getElementById('teacherEmptyMessage'),
    teacherNetworkMessage: document.getElementById('teacherNetworkMessage'),
    teacherContactBtn: document.getElementById('teacherContactBtn'),
    teacherContactPopup: document.getElementById('teacherContactPopup'),
    teacherContactClose: document.getElementById('teacherContactClose'),
    teacherContactTitle: document.getElementById('teacherContactTitle'),
    teacherContactDesignation: document.getElementById('teacherContactDesignation'),
    teacherContactPhone: document.getElementById('teacherContactPhone'),
    teacherContactEmail: document.getElementById('teacherContactEmail'),
    teacherContactDepartment: document.getElementById('teacherContactDepartment'),
    // Student loading overlay
    appRoot: document.getElementById('app'),
    studentLoadingOverlay: document.getElementById('studentLoadingOverlay'),
    // Auth elements
    authView: document.getElementById('authView'),
    menuView: document.getElementById('menuView'),
    profileIcon: document.getElementById('profileIcon'),
    // Booking elements
    bookingMenuOption: document.getElementById('bookingMenuOption'),
    bookingModal: document.getElementById('bookingModal'),
    bookingModalClose: document.getElementById('bookingModalClose'),
    // bookingForm removed, replaced by new UI flow elements:
    bookingQueryDepartment: document.getElementById('bookingQueryDepartment'),
    bookingQuerySearchBy: document.getElementById('bookingQuerySearchBy'),
    bookingQueryThirdSelect: document.getElementById('bookingQueryThirdSelect'),
    bookingQueryThirdLabel: document.getElementById('bookingQueryThirdLabel'),
    bookingQueryDay: document.getElementById('bookingQueryDay'),
    bookingQuerySearchBtn: document.getElementById('bookingQuerySearchBtn'),
    bookingQueryResults: document.getElementById('bookingQueryResults'),
    bookingConfirmPopup: document.getElementById('bookingConfirmPopup'),
    bookingConfirmClose: document.getElementById('bookingConfirmClose'),
    bookingConfirmForm: document.getElementById('bookingConfirmForm'),
    bookingConfirmDate: document.getElementById('bookingConfirmDate'),
    bookingConfirmReason: document.getElementById('bookingConfirmReason'),
    bookingConfirmRoom: document.getElementById('bookingConfirmRoom'),
    bookingConfirmTime: document.getElementById('bookingConfirmTime'),
    bookingConfirmDetails: document.getElementById('bookingConfirmDetails'),
    // Booking Tab Elements
    bookingTab: document.getElementById('bookingTab'),
    historyTab: document.getElementById('historyTab'),
    bookingInterface: document.getElementById('bookingInterface'),
    historyInterface: document.getElementById('historyInterface')
  };

  function enableRipple(node) {
    if (!node || node.dataset.ripple === 'true') return;
    node.dataset.ripple = 'true';

    // Add multiple event listeners for better browser/webview compatibility
    node.addEventListener('click', handleRipple);
    node.addEventListener('touchstart', handleRipple, { passive: true });
    node.addEventListener('pointerdown', handleRipple);
  }

  function handleRipple(event) {
    const target = event.currentTarget;
    if (!target) return;

    // Prevent multiple ripples from same event sequence
    if (target.querySelector('.touch-ripple')) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    const maxDimension = Math.max(rect.width, rect.height);
    const baseSize = Math.min(Math.max(maxDimension * 1.35, 80), 140);

    // For tab buttons, start ripple from icon center (middle of button)
    // For other elements, use click/touch position
    const isTab = target.classList.contains('tab');
    let originX, originY;

    if (isTab) {
      // Start from center of tab button (where icon is positioned)
      originX = rect.width / 2;
      originY = rect.height / 2;
    } else {
      // Use click/touch position for other elements
      const clientX = event.clientX ?? (event.touches && event.touches[0]?.clientX) ?? (event.changedTouches && event.changedTouches[0]?.clientX);
      const clientY = event.clientY ?? (event.touches && event.touches[0]?.clientY) ?? (event.changedTouches && event.changedTouches[0]?.clientY);
      originX = (clientX ?? rect.left + rect.width / 2) - rect.left;
      originY = (clientY ?? rect.top + rect.height / 2) - rect.top;
    }

    ripple.style.width = ripple.style.height = `${baseSize}px`;
    ripple.style.left = `${originX - baseSize / 2}px`;
    ripple.style.top = `${originY - baseSize / 2}px`;
    ripple.style.animationDuration = '400ms';
    target.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  // Init Teacher Lottie animation
  let teacherLottieInstance = null;
  function initTeacherLottie() {
    if (!window.lottie || !els.teacherLottie) return;
    // Don't reinitialize if already loaded
    if (teacherLottieInstance) return;
    try {
      teacherLottieInstance = window.lottie.loadAnimation({
        container: els.teacherLottie,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'animation_file/Loading_initial.json'
      });
    } catch (e) {
      console.warn('Failed to load teacher lottie:', e);
    }
  }

  // Show/hide teacher lottie based on data availability
  function updateTeacherLottieVisibility() {
    if (!els.teacherLottie) return;
    const hasTeacherName = els.teacherDetailsName && els.teacherDetailsName.textContent.trim() !== '';
    const hasScheduleData = els.teacherScheduleContainer && els.teacherScheduleContainer.children.length > 0;

    if (hasTeacherName || hasScheduleData) {
      // Hide lottie when data is shown
      els.teacherLottie.classList.add('hidden');
      if (teacherLottieInstance) {
        teacherLottieInstance.pause();
      }
    } else {
      // Show lottie when no data
      els.teacherLottie.classList.remove('hidden');
      if (teacherLottieInstance) {
        teacherLottieInstance.play();
      } else {
        initTeacherLottie();
      }
    }
  }

  // Init Lottie animation (first visit landing screen)
  function initLottie() {
    if (!window.lottie || !els.lottie) return;
    try {
      // Use cached animation data if available (instant load)
      if (window.__landingAnimationData) {
        window.lottie.loadAnimation({
          container: els.lottie,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: window.__landingAnimationData
        });
        return;
      }

      // Fallback: try to get from localStorage cache
      try {
        const cached = localStorage.getItem('cse.landingAnimationData');
        const cachedVersion = localStorage.getItem('cse.landingAnimationData.version');
        if (cached && cachedVersion === '1') {
          const animationData = JSON.parse(cached);
          window.__landingAnimationData = animationData;
          window.lottie.loadAnimation({
            container: els.lottie,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData
          });
          return;
        }
      } catch (e) {
        // Cache invalid, use path fallback
      }

      // Final fallback: load from path (slower but works)
      window.lottie.loadAnimation({
        container: els.lottie,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'animation_file/loading.json'
      });
    } catch (_) { }
  }

  // Track empty Lottie animation instance
  let emptyLottieInstance = null;
  let emptyLottieLoading = false;

  // Track query page Lottie animation instances
  let roomQueryLottieInstance = null;
  let roomQueryLottieLoading = false;
  let crInfoLottieInstance = null;
  let crInfoLottieLoading = false;


  // Init empty Lottie animation (panda sleeping)
  function initEmptyLottie() {
    if (emptyLottieInstance || emptyLottieLoading) return;
    emptyLottieLoading = true;
    // Wait for Lottie library to be available
    if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
      emptyLottieLoading = false;
      return;
    }
    if (!els.emptyLottie) {
      emptyLottieLoading = false;
      return;
    }
    // Check if container is visible
    if (els.emptyMessage.classList.contains('hidden')) {
      emptyLottieLoading = false;
      return;
    }
    // Clear container before loading new animation
    els.emptyLottie.innerHTML = '';

    // Fetch the JSON file and load it
    fetch('animation_file/Panda sleeping waiting lottie animation.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(animationData => {
        // Double-check container is still visible and Lottie is available
        if (els.emptyMessage.classList.contains('hidden')) {
          return;
        }
        if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
          emptyLottieLoading = false;
          return;
        }
        try {
          emptyLottieInstance = window.lottie.loadAnimation({
            container: els.emptyLottie,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData
          });
          emptyLottieLoading = false;
        } catch (e) {
          console.error('Failed to initialize Lottie animation:', e);
          emptyLottieLoading = false;
        }
      })
      .catch(error => {
        console.error('Failed to load empty Lottie animation file:', error);
        emptyLottieLoading = false;
      });
  }

  // Init room query Lottie animation (waiting cat)
  function initRoomQueryLottie() {
    if (roomQueryLottieInstance || roomQueryLottieLoading) return;
    roomQueryLottieLoading = true;
    if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
      roomQueryLottieLoading = false;
      return;
    }
    if (!els.roomQueryLottie) {
      roomQueryLottieLoading = false;
      return;
    }
    // Check if container should be visible
    if (!els.roomQueryLottie.classList.contains('showing')) {
      roomQueryLottieLoading = false;
      return;
    }
    // Clear container before loading new animation
    els.roomQueryLottie.innerHTML = '';

    // Fetch the JSON file and load it
    fetch('animation_file/Waiting cat.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(animationData => {
        // Double-check container is still visible and Lottie is available
        if (!els.roomQueryLottie.classList.contains('showing')) {
          return;
        }
        if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
          roomQueryLottieLoading = false;
          return;
        }
        try {
          roomQueryLottieInstance = window.lottie.loadAnimation({
            container: els.roomQueryLottie,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData
          });
          roomQueryLottieLoading = false;
        } catch (e) {
          console.error('Failed to initialize room query Lottie animation:', e);
          roomQueryLottieLoading = false;
        }
      })
      .catch(error => {
        console.error('Failed to load room query Lottie animation file:', error);
        roomQueryLottieLoading = false;
      });
  }

  // Init CR info Lottie animation (lovely cats)
  function initCRInfoLottie() {
    if (crInfoLottieInstance || crInfoLottieLoading) return;
    crInfoLottieLoading = true;
    if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
      crInfoLottieLoading = false;
      return;
    }
    if (!els.crInfoLottie) {
      crInfoLottieLoading = false;
      return;
    }
    // Check if container should be visible
    if (!els.crInfoLottie.classList.contains('showing')) {
      crInfoLottieLoading = false;
      return;
    }
    // Clear container before loading new animation
    els.crInfoLottie.innerHTML = '';

    // Fetch the JSON file and load it
    fetch('animation_file/Lovely cats.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(animationData => {
        // Double-check container is still visible and Lottie is available
        if (!els.crInfoLottie.classList.contains('showing')) {
          return;
        }
        if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
          crInfoLottieLoading = false;
          return;
        }
        try {
          crInfoLottieInstance = window.lottie.loadAnimation({
            container: els.crInfoLottie,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData
          });
          crInfoLottieLoading = false;
        } catch (e) {
          console.error('Failed to initialize CR info Lottie animation:', e);
          crInfoLottieLoading = false;
        }
      })
      .catch(error => {
        console.error('Failed to load CR info Lottie animation file:', error);
        crInfoLottieLoading = false;
      });
  }

  // Show room query lottie
  function showRoomQueryLottie() {
    if (!els.roomQueryLottie) return;
    els.roomQueryLottie.classList.add('showing');
    // Initialize lottie if not already loaded
    if (!roomQueryLottieInstance && !roomQueryLottieLoading) {
      setTimeout(() => {
        if (els.roomQueryLottie.classList.contains('showing')) {
          initRoomQueryLottie();
        }
      }, 150);
    }
  }

  // Hide room query lottie
  function hideRoomQueryLottie() {
    if (els.roomQueryLottie) {
      els.roomQueryLottie.classList.remove('showing');
      // Destroy lottie instance when hiding
      if (roomQueryLottieInstance) {
        roomQueryLottieInstance.destroy();
        roomQueryLottieInstance = null;
      }
    }
  }

  // Show CR info lottie
  function showCRInfoLottie() {
    if (!els.crInfoLottie) return;
    els.crInfoLottie.classList.add('showing');
    // Initialize lottie if not already loaded
    if (!crInfoLottieInstance && !crInfoLottieLoading) {
      setTimeout(() => {
        if (els.crInfoLottie.classList.contains('showing')) {
          initCRInfoLottie();
        }
      }, 150);
    }
  }

  // Hide CR info lottie
  function hideCRInfoLottie() {
    if (els.crInfoLottie) {
      els.crInfoLottie.classList.remove('showing');
      // Destroy lottie instance when hiding
      if (crInfoLottieInstance) {
        crInfoLottieInstance.destroy();
        crInfoLottieInstance = null;
      }
    }
  }

  function showStudentLoading() {
    if (!els.studentLoadingOverlay) return;
    document.body.classList.add('student-loading-lock');
    // Show overlay immediately - CSS animation handles the loader
    els.studentLoadingOverlay.classList.remove('hidden');
  }

  function hideStudentLoading() {
    if (els.studentLoadingOverlay) {
      els.studentLoadingOverlay.classList.add('hidden');
    }
    document.body.classList.remove('student-loading-lock');
  }


  // Utilities
  function setScreen(name) {
    // Force specific scroll reset for "To Do" and "More" transition
    // Ensure the browser registers the scroll to top *after* the layout change
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;

    // Reset scroll for ALL content divs to prevent scroll position inheritance
    const allContentDivs = document.querySelectorAll('.content');
    allContentDivs.forEach(div => {
      div.scrollTop = 0;
    });

    // Fallback for independent screen scrolling if handled by CSS
    const targetScreen = els.screens[name] || document.getElementById(name);
    if (targetScreen) {
      targetScreen.scrollTop = 0;
      // If content is wrapped
      const content = targetScreen.querySelector('.content');
      if (content) content.scrollTop = 0;
    }

    // Load Settings globally
    try {
      if (db) {
        db.ref('settings/timeFormatConfig').on('value', snap => {
          window.globalTimeFormatConfig = snap.val() || { timeFormat: 'format2' };

          // Re-render Student Routine
          if (activeDbRef && currentDay) {
            renderDay(currentDay);
          }

          // Re-render Teacher Routine
          if (currentTeacherDay && els.screens.teacher && !els.screens.teacher.classList.contains('hidden')) {
            if (typeof renderTeacherDay === 'function') {
              renderTeacherDay(currentTeacherDay);
            }
          }
        });
      }
    } catch (e) { }

    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
      if (targetScreen) targetScreen.scrollTop = 0;

      // Reset all content divs again after timeout
      allContentDivs.forEach(div => {
        div.scrollTop = 0;
      });
    }, 10);

    setTimeout(() => {
      // Double check after a longer delay for slower devices
      window.scrollTo(0, 0);

      // Final reset for all content divs
      const contentDivs = document.querySelectorAll('.content');
      contentDivs.forEach(div => {
        div.scrollTop = 0;
      });
    }, 50);

    // Prevent screen switching when landing screen is visible (except when going to student after selection)
    if (els.landingOverlay && !els.landingOverlay.classList.contains('hidden') && name !== 'student') {
      return;
    }

    // Auth Check for More Screen - Force UI refresh
    // Use fallback to legacy 'empty' map if needed
    if (name === 'more' || name === 'empty') {
      name = 'more'; // Ensure we use canonical name internally

      // Simple check: if firebase not ready, check localStorage 'user' key as fallback hint
      // or just default to Auth View if unknown.
      const isAuth = (window.firebase && window.firebase.auth().currentUser);

      if (isAuth) {
        // Logged in
        if (els.authView) els.authView.classList.add('hidden');
        if (els.menuView) els.menuView.classList.remove('hidden');
      } else {
        // Not logged in
        if (els.authView) els.authView.classList.remove('hidden');
        if (els.menuView) els.menuView.classList.add('hidden');
      }
    }

    // Clear Intervals
    if (window.schedioInterval && name !== 'schedio') {
      clearInterval(window.schedioInterval);
      window.schedioInterval = null;
    }
    if (window.overviewTimerInterval) {
      clearInterval(window.overviewTimerInterval);
      window.overviewTimerInterval = null;
    }

    // Update Tab Icons
    updateTabIcons(name);

    // Hide all screens
    Object.values(els.screens).forEach(el => {
      if (el) el.classList.add('hidden');
    });

    // Show target screen
    if (els.screens[name]) {
      els.screens[name].classList.remove('hidden');
    } else if (name === 'empty') {
      // Fallback for legacy
      if (els.screens.more) els.screens.more.classList.remove('hidden');
    }

    // Special: if showing student screen, ensure content is safe
    if (name === 'student') {
      // check if we need to reload or anything
    }


    // Update active tab state
    els.tabs.forEach(btn => {
      // Check data-tab attribute match
      const isMore = (['more', 'booking', 'notice', 'privacy', 'support', 'information', 'todo', 'schedio'].includes(name) && (btn.dataset.tab === 'more' || btn.dataset.tab === 'empty'));
      const isMatch = btn.dataset.tab === name;
      btn.classList.toggle('active', isMatch || isMore);
    });

    // Update icons based on active page
    updateTabIcons(name);

    // Convert landing screen selects to custom dropdowns (same as student page)
    if (name === 'landing') {
      setTimeout(() => {
        if (els.department && !els.department.dataset.converted) convertSelectToCustomDropdown(els.department);
        if (els.semester && !els.semester.dataset.converted) convertSelectToCustomDropdown(els.semester);
        if (els.section && !els.section.dataset.converted) convertSelectToCustomDropdown(els.section);
      }, 200);
    }

    // Convert selects to custom dropdowns when student screen is shown
    if (name === 'student') {
      setTimeout(() => {
        if (els.departmentDisplay && !els.departmentDisplay.dataset.converted) convertSelectToCustomDropdown(els.departmentDisplay);
        if (els.semesterDisplay && !els.semesterDisplay.dataset.converted) convertSelectToCustomDropdown(els.semesterDisplay);
        if (els.sectionDisplay && !els.sectionDisplay.dataset.converted) convertSelectToCustomDropdown(els.sectionDisplay);
      }, 50);
    }

    if (name === 'teacher') {
      setTimeout(() => {
        if (els.teacherDepartment && !els.teacherDepartment.dataset.converted) convertSelectToCustomDropdown(els.teacherDepartment);
      }, 50);
    }

    if (name === 'query') {
      setTimeout(() => {
        if (els.roomQueryDaySelectorWrapper) els.roomQueryDaySelectorWrapper.classList.add('hidden');

        if (els.roomQueryDepartment && !els.roomQueryDepartment.dataset.converted) convertSelectToCustomDropdown(els.roomQueryDepartment);
        if (els.roomQuerySearchBy && !els.roomQuerySearchBy.dataset.converted) convertSelectToCustomDropdown(els.roomQuerySearchBy);
        if (els.roomQueryThirdSelect && !els.roomQueryThirdSelect.dataset.converted) convertSelectToCustomDropdown(els.roomQueryThirdSelect);

        if (els.crInfoDepartment && !els.crInfoDepartment.dataset.converted) convertSelectToCustomDropdown(els.crInfoDepartment);
        if (els.crInfoSemester && !els.crInfoSemester.dataset.converted) convertSelectToCustomDropdown(els.crInfoSemester);
        if (els.crInfoSection && !els.crInfoSection.dataset.converted) convertSelectToCustomDropdown(els.crInfoSection);

        checkRoomQueryDropdowns();
        checkCRInfoDropdowns();
      }, 50);
    }
  }

  window.setScreen = setScreen;

  // ==========================================
  // SCHEDIO FEATURE IMPLEMENTATION
  // ==========================================

  function initSchedioLogic() {
    // Add Schedio elements to els
    els.schedioBackBtn = document.getElementById('schedioBackBtn');
    els.schedioAddBtn = document.getElementById('schedioAddBtn');
    els.schedioContainer = document.getElementById('schedioContainer');
    els.schedioEmptyState = document.getElementById('schedioEmptyState');
    els.schedioEmptyLottie = document.getElementById('schedioEmptyLottie');
    els.schedioAddModal = document.getElementById('schedioAddModal');
    els.schedioAddClose = document.getElementById('schedioAddClose');
    els.schedioAddForm = document.getElementById('schedioAddForm');
    els.schedioType = document.getElementById('schedioType');
    els.schedioMenuOption = document.getElementById('schedioMenuOption');

    // Back Button
    if (els.schedioBackBtn) {
      els.schedioBackBtn.onclick = () => setScreen('more');
    }

    // Menu Option Click
    if (els.schedioMenuOption) {
      els.schedioMenuOption.onclick = () => {
        setScreen('schedio');
        loadSchedioData();
      };
    }

    // Add Button Click
    if (els.schedioAddBtn) {
      els.schedioAddBtn.onclick = () => {
        if (els.schedioAddModal) {
          els.schedioAddModal.classList.remove('hidden');
          setTimeout(() => els.schedioAddModal.classList.add('showing'), 10);
          if (els.schedioAddForm) els.schedioAddForm.reset();
          const typeBtn = document.getElementById('schedioTypeBtn');
          if (typeBtn) typeBtn.textContent = 'Select Type';
          // Reset visibility
          if (typeof updateSchedioFieldsVisibility === 'function') {
            updateSchedioFieldsVisibility('reset-all-true');
          }
        }
      };
    }

    // Close Modal
    if (els.schedioAddClose) {
      els.schedioAddClose.onclick = () => {
        if (els.schedioAddModal) {
          els.schedioAddModal.classList.remove('showing');
          setTimeout(() => els.schedioAddModal.classList.add('hidden'), 200);
        }
      };
    }

    // Form Submit
    if (els.schedioAddForm) {
      els.schedioAddForm.onsubmit = handleSchedioSubmit;
    }

    // Init Dropdown logic
    const typeDropdown = document.getElementById('schedioTypeDropdown');
    // if (typeDropdown) setupSchedioDropdown(typeDropdown, 'schedioType');
    if (typeDropdown) loadSchedioTypesAndSetupDropdown();

    // Init Date/Time Pickers
    initSchedioDateAndTimePickers();
  }

  function initSchedioDateAndTimePickers() {
    // --- Date Picker Logic ---
    const dateInput = document.getElementById('schedioDate');
    const dateWrapper = document.getElementById('schedioDateInputWrapper');
    const datePicker = document.getElementById('schedioCustomDatePicker');
    const dateGrid = document.getElementById('schedioPickerDaysGrid');
    const monthLabel = document.getElementById('schedioPickerMonthYear');
    const prevBtn = document.getElementById('schedioPrevMonthBtn');
    const nextBtn = document.getElementById('schedioNextMonthBtn');

    if (dateInput && dateWrapper && datePicker && dateGrid) {
      let pickerDate = new Date();
      let selectedDate = null;
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      const formatDateDisplay = (date) => {
        const d = String(date.getDate()).padStart(2, '0');
        const m = months[date.getMonth()].slice(0, 3);
        const y = date.getFullYear();
        return `${d} ${m} ${y}`;
      };

      const formatDateISO = (date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const renderCalendar = () => {
        dateGrid.innerHTML = '';
        monthLabel.textContent = `${months[pickerDate.getMonth()]} ${pickerDate.getFullYear()}`;

        const year = pickerDate.getFullYear();
        const month = pickerDate.getMonth();

        const firstDayJS = new Date(year, month, 1).getDay();
        const startOffset = (firstDayJS + 1) % 7;

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        // Previous month
        for (let i = 0; i < startOffset; i++) {
          const day = document.createElement('div');
          day.className = 'datepicker-day empty other-month';
          day.textContent = prevMonthDays - startOffset + 1 + i;
          dateGrid.appendChild(day);
        }

        // Current month
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 1; i <= daysInMonth; i++) {
          const day = document.createElement('div');
          day.className = 'datepicker-day';
          day.textContent = i;

          const currentDayDate = new Date(year, month, i);
          currentDayDate.setHours(0, 0, 0, 0);

          if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            day.classList.add('today');
          }

          if (selectedDate && i === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
            day.classList.add('selected');
          }

          // Disable past dates
          if (currentDayDate < today) {
            day.classList.add('disabled');
          } else {
            day.onclick = (e) => {
              e.stopPropagation();
              selectedDate = new Date(year, month, i);
              dateInput.value = formatDateDisplay(selectedDate);
              dateInput.dataset.iso = formatDateISO(selectedDate);

              // Update UI
              dateGrid.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
              day.classList.add('selected');

              datePicker.classList.remove('showing');
              setTimeout(() => datePicker.classList.add('hidden'), 200);
            };
          }

          dateGrid.appendChild(day);
        }
      };

      // Trigger
      const togglePicker = (e) => {
        e.stopPropagation();
        if (datePicker.classList.contains('hidden')) {
          // Close other pickers
          document.querySelectorAll('.custom-timepicker, .custom-datepicker').forEach(p => {
            if (p !== datePicker) {
              p.classList.remove('showing');
              p.classList.add('hidden');
            }
          });

          // Reset to today/selected
          if (!selectedDate) pickerDate = new Date();
          else pickerDate = new Date(selectedDate);

          renderCalendar();
          datePicker.classList.remove('hidden');
          void datePicker.offsetWidth;
          datePicker.classList.add('showing');

          // Positioning logic (simplified)
          const rect = dateWrapper.getBoundingClientRect();
          if (window.innerHeight - rect.bottom < 320) {
            datePicker.style.bottom = '100%';
            datePicker.style.top = 'auto';
            datePicker.style.marginBottom = '-45px';
          } else {
            datePicker.style.top = '100%';
            datePicker.style.bottom = 'auto';
            datePicker.style.marginTop = '10px';
            datePicker.style.marginBottom = '0';
          }
        } else {
          datePicker.classList.remove('showing');
          setTimeout(() => datePicker.classList.add('hidden'), 200);
        }
      };

      dateWrapper.onclick = togglePicker;
      dateInput.onclick = togglePicker; // Backup

      prevBtn.onclick = (e) => { e.stopPropagation(); pickerDate.setMonth(pickerDate.getMonth() - 1); renderCalendar(); };
      nextBtn.onclick = (e) => { e.stopPropagation(); pickerDate.setMonth(pickerDate.getMonth() + 1); renderCalendar(); };
    }

    // --- Time Picker Logic ---
    const timeInput = document.getElementById('schedioTime');
    const timeWrapper = document.getElementById('schedioTimeInputWrapper');
    const timePicker = document.getElementById('schedioCustomTimePicker');
    const timeHoursObj = document.getElementById('schedioTimeHours');
    const timeMinutesObj = document.getElementById('schedioTimeMinutes');
    const timeSetBtn = document.getElementById('schedioTimeSetBtn');

    if (timeInput && timeWrapper && timePicker && timeHoursObj && timeMinutesObj) {
      let selectedHour = 12; // 12-hour format
      let selectedMinute = 0;
      let selectedAmPm = 'AM';

      // Generate options
      const renderTimeColumn = (container, range, isHour) => {
        container.innerHTML = '';
        // Padding
        container.appendChild(document.createElement('div')).style.height = '50px';

        range.forEach(val => {
          const el = document.createElement('div');
          el.className = 'timepicker-item';
          el.textContent = String(val).padStart(2, '0');
          el.dataset.value = val;

          if ((isHour && val === selectedHour) || (!isHour && val === selectedMinute)) {
            el.classList.add('selected');
          }

          el.onclick = (e) => {
            e.stopPropagation();
            container.querySelectorAll('.selected').forEach(i => i.classList.remove('selected'));
            el.classList.add('selected');
            if (isHour) selectedHour = val;
            else selectedMinute = val;
          };

          container.appendChild(el);
        });
        container.appendChild(document.createElement('div')).style.height = '50px';
      };

      const hours = Array.from({ length: 12 }, (_, i) => i + 1);
      const minutes = Array.from({ length: 60 }, (_, i) => i); // 0-59

      // AmPm logic
      timePicker.querySelectorAll('.timepicker-item-ampm').forEach(item => {
        item.onclick = (e) => {
          e.stopPropagation();
          timePicker.querySelectorAll('.timepicker-item-ampm').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          selectedAmPm = item.dataset.value;
        }
      });

      const toggleTimePicker = (e) => {
        e.stopPropagation();
        if (timePicker.classList.contains('hidden')) {
          // Close others
          document.querySelectorAll('.custom-timepicker, .custom-datepicker').forEach(p => {
            if (p !== timePicker) {
              p.classList.remove('showing');
              p.classList.add('hidden');
            }
          });

          // Init values from input or default
          if (timeInput.value) {
            const parts = timeInput.value.split(' ');
            if (parts.length === 2) {
              selectedAmPm = parts[1];
              const t = parts[0].split(':');
              selectedHour = parseInt(t[0]);
              selectedMinute = parseInt(t[1]);
            }
          } else {
            const now = new Date();
            let h = now.getHours();
            selectedMinute = now.getMinutes();
            selectedAmPm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            selectedHour = h ? h : 12;
          }

          renderTimeColumn(timeHoursObj, hours, true);
          renderTimeColumn(timeMinutesObj, minutes, false);

          // Set AMPM
          timePicker.querySelectorAll('.timepicker-item-ampm').forEach(i => {
            if (i.dataset.value === selectedAmPm) i.classList.add('selected');
            else i.classList.remove('selected');
          });

          timePicker.classList.remove('hidden');
          void timePicker.offsetWidth;
          timePicker.classList.add('showing');

          // Positioning
          const rect = timeWrapper.getBoundingClientRect();
          if (window.innerHeight - rect.bottom < 250) {
            timePicker.style.bottom = '100%';
            timePicker.style.top = 'auto';
            timePicker.style.marginBottom = '-10px';
          } else {
            timePicker.style.top = '100%';
            timePicker.style.bottom = 'auto';
            timePicker.style.marginTop = '10px';
            timePicker.style.marginBottom = '0';
          }

        } else {
          timePicker.classList.remove('showing');
          setTimeout(() => timePicker.classList.add('hidden'), 200);
        }
      };

      timeWrapper.onclick = toggleTimePicker;
      timeInput.onclick = toggleTimePicker;

      timeSetBtn.onclick = (e) => {
        e.stopPropagation();
        const hStr = String(selectedHour).padStart(2, '0');
        const mStr = String(selectedMinute).padStart(2, '0');
        timeInput.value = `${hStr}:${mStr} ${selectedAmPm}`;
        timePicker.classList.remove('showing');
        setTimeout(() => timePicker.classList.add('hidden'), 200);
      };
    }

    // Global click to close
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#schedioAddModal .popup-body')) {
        // Handled somewhat by setupSchedioDropdown/global listeners but good to be safe
      }
    });
  }

  // Global cache for schedio types
  window.schedioTypesCache = {};

  async function loadSchedioTypesAndSetupDropdown() {
    const typeDropdown = document.getElementById('schedioTypeDropdown');

    // We can't return early if dropdown is missing because .on listener needs to be set up?
    // Actually, if dropdown is missing (not on the page), we don't need to listen.
    if (!typeDropdown) return;

    try {
      // Use .on() for real-time updates
      window.firebase.database().ref('schedioTypes').on('value', (snap) => {
        const types = snap.val() || {};
        window.schedioTypesCache = types;

        const menu = typeDropdown.querySelector('.custom-dropdown-menu');
        if (menu) {
          menu.innerHTML = '';

          if (Object.keys(types).length === 0) {
            const defaults = ['Class Test', 'Assignment', 'Lab Report', 'Presentation', 'Quiz', 'Other'];
            defaults.forEach(t => {
              const item = document.createElement('div');
              item.className = 'custom-dropdown-item';
              item.dataset.value = t;
              item.textContent = t;
              menu.appendChild(item);
            });
          } else {
            Object.values(types).forEach(t => {
              const item = document.createElement('div');
              item.className = 'custom-dropdown-item';
              item.dataset.value = t.name;
              item.textContent = t.name;
              menu.appendChild(item);
            });
          }
        }
        // Re-bind listeners for the new items
        setupSchedioDropdown(typeDropdown, 'schedioType');
      });

    } catch (e) {
      console.error("Error loading schedio types", e);
      // Fallback
      setupSchedioDropdown(typeDropdown, 'schedioType');
    }
  }

  function setupSchedioDropdown(wrapper, inputId) {
    if (!wrapper) return;
    const btn = wrapper.querySelector('.custom-dropdown-button');
    const menu = wrapper.querySelector('.custom-dropdown-menu');
    const input = document.getElementById(inputId);

    if (!btn || !menu || !input) return;

    // 1. Clone MENU first to strip old listeners
    const newMenu = menu.cloneNode(true);
    menu.parentNode.replaceChild(newMenu, menu);

    // 2. Clone BUTTON to strip old listeners
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn); // Replace happens here, old 'btn' is gone

    // 3. Setup Button Click -> Toggle newMenu
    newBtn.onclick = (e) => {
      e.stopPropagation();
      // Use newMenu here!
      newMenu.classList.toggle('hidden');
      wrapper.offsetWidth; // Reflow for animation
      newMenu.classList.toggle('showing');
    };

    // 4. Setup Menu Item Click -> Update Input & newBtn
    newMenu.onclick = (e) => {
      const item = e.target.closest('.custom-dropdown-item');
      if (!item) return;
      e.stopPropagation();

      const val = item.dataset.value;
      const text = item.textContent;

      input.value = val;
      newBtn.textContent = text;

      newMenu.classList.remove('showing');
      setTimeout(() => newMenu.classList.add('hidden'), 200);

      // Trigger logic for field visibility
      updateSchedioFieldsVisibility(val);
    };

    // 5. Global Click -> Close newMenu
    // Note: This adds a new listener every time setup is called. 
    // Ideally we should use a named function to remove old ones, but for now 
    // we can rely on the check !wrapper.contains to be harmless if stacked,
    // or better: add a specific class/handler to avoid duplicates?
    // Given the constraints, let's just add it. The overhead is low unless admin updates types 100 times/sec.
    // A cleaner way: store the closer on the wrapper? 
    // Let's stick to simple for now to ensure it works.
    document.addEventListener('click', (e) => {
      if (!wrapper.contains(e.target)) {
        newMenu.classList.remove('showing');
        setTimeout(() => newMenu.classList.add('hidden'), 200);
      }
    });

    // Initial check
    if (input.value) {
      updateSchedioFieldsVisibility(input.value);
    } else {
      updateSchedioFieldsVisibility('reset-all-true');
    }
  }

  function updateSchedioFieldsVisibility(typeName) {
    if (typeName === 'reset-all-true') {
      toggleField('schedioRoom', true);
      toggleField('schedioDateInputWrapper', true);
      toggleField('schedioTime', true);
      return;
    }

    let config = null;
    if (window.schedioTypesCache) {
      const entry = Object.values(window.schedioTypesCache).find(t => t.name === typeName);
      if (entry) config = entry;
    }

    const showRoom = config ? config.req_room : true;
    const showDate = config ? config.req_date : true;
    const showTime = config ? config.req_time : true;

    toggleField('schedioRoom', showRoom);
    toggleField('schedioDateInputWrapper', showDate);
    toggleField('schedioTime', showTime);
  }

  function toggleField(elementId, show) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const fieldContainer = el.closest('.field');
    if (fieldContainer) {
      fieldContainer.style.display = show ? 'block' : 'none';
    }
    el.dataset.hidden = !show;

    // Dynamically add/remove 'required' attribute based on visibility
    // This prevents browser's native form validation from blocking submission of hidden fields
    let inputElement = el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el : el.querySelector('input, textarea');

    // Special handling for date wrapper - find the actual input inside
    if (elementId === 'schedioDateInputWrapper') {
      inputElement = document.getElementById('schedioDate');
    }

    if (inputElement) {
      if (show) {
        inputElement.setAttribute('required', 'required');
      } else {
        inputElement.removeAttribute('required');
      }
    }
  }

  let schedioRef = null;
  let isSchedioListenerAttached = false; // Flag to prevent multiple listeners

  function loadSchedioData() {
    const user = window.firebase ? window.firebase.auth().currentUser : null;
    // Explicitly get the button to ensure we control the right element
    const schedioBtn = document.getElementById('schedioAddBtn');

    if (!user || !db) {
      if (els.schedioContainer) els.schedioContainer.innerHTML = '';
      if (els.schedioEmptyState) {
        els.schedioEmptyState.style.display = 'flex';
        els.schedioEmptyState.querySelector('p').textContent = 'Please login to view schedules';
      }
      if (schedioBtn) schedioBtn.classList.add('hidden');
      return;
    }

    db.ref('users/' + user.uid).once('value').then(snap => {
      const u = snap.val();
      if (!u) return;

      // CR Check - Strict Visibility
      const role = (u.role || '').toLowerCase();
      if (schedioBtn) {
        if (role === 'cr' || role === 'admin') {
          schedioBtn.classList.remove('hidden');
        } else {
          schedioBtn.classList.add('hidden');
        }
      }

      const dept = u.department || u.dept;
      const sem = u.semester || u.sem || u.text_semester;
      const sec = u.section || u.sec;

      if (!dept || !sem || !sec) {
        if (els.schedioEmptyState) els.schedioEmptyState.style.display = 'flex';
        return;
      }

      // Only attach listener once
      if (!isSchedioListenerAttached) {
        if (schedioRef) schedioRef.off();
        schedioRef = db.ref(`schedio/${dept}/${sem}/${sec}`).orderByChild('date');

        // Show empty state instantly if container is empty (fix delayed appearance)
        if (els.schedioContainer && els.schedioContainer.children.length === 0) {
          if (els.schedioEmptyState) els.schedioEmptyState.style.display = 'flex';
        }

        schedioRef.on('value', snapshot => {
          const data = snapshot.val();
          const items = [];
          if (data) {
            Object.keys(data).forEach(k => {
              items.push({ id: k, ...data[k] });
            });
          }

          // Sort ascending by date+time
          items.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

          renderSchedioItems(items);
        });

        isSchedioListenerAttached = true; // Mark as attached
      }
    });
  }

  function renderSchedioItems(items) {
    if (!els.schedioContainer) return;
    els.schedioContainer.innerHTML = '';

    // Add Schedio elements to els
    els.schedioBackBtn = document.getElementById('schedioBackBtn');
    els.schedioAddBtn = document.getElementById('schedioAddBtn');
    els.schedioContainer = document.getElementById('schedioContainer');
    els.schedioEmptyState = document.getElementById('schedioEmptyState');
    els.schedioEmptyLottie = document.getElementById('schedioEmptyLottie');
    els.schedioAddModal = document.getElementById('schedioAddModal');
    els.schedioAddClose = document.getElementById('schedioAddClose');
    els.schedioAddForm = document.getElementById('schedioAddForm');
    els.schedioType = document.getElementById('schedioType');
    els.schedioMenuOption = document.getElementById('schedioMenuOption');

    // Overview Elements
    els.schedioOverviewModal = document.getElementById('schedioOverviewModal');
    els.overviewCloseBtn = document.getElementById('overviewCloseBtn');
    els.overviewDate = document.getElementById('overviewDate');
    els.overviewTag = document.getElementById('overviewTag');
    els.overviewSubject = document.getElementById('overviewSubject');
    els.overviewTime = document.getElementById('overviewTime');
    els.overviewRoom = document.getElementById('overviewRoom');
    els.overviewNote = document.getElementById('overviewNote');
    els.overviewActions = document.getElementById('overviewActions');
    els.overviewEditBtn = document.getElementById('overviewEditBtn');
    els.overviewDeleteBtn = document.getElementById('overviewDeleteBtn');

    // Back Button
    if (els.schedioBackBtn) {
      els.schedioBackBtn.onclick = () => setScreen('more');
    }

    // Menu Option Click
    if (els.schedioMenuOption) {
      els.schedioMenuOption.onclick = () => {
        setScreen('schedio');
        loadSchedioData();
      };
    }

    // Add Button Click
    if (els.schedioAddBtn) {
      els.schedioAddBtn.onclick = () => {
        resetSchedioForm();
        if (els.schedioAddModal) {
          els.schedioAddModal.classList.remove('hidden');
          setTimeout(() => els.schedioAddModal.classList.add('showing'), 10);
        }
      };
    }

    // Close Modal
    if (els.schedioAddClose) {
      els.schedioAddClose.onclick = () => {
        closeSchedioModal();
      };
    }

    // Overview Close
    if (els.overviewCloseBtn) {
      els.overviewCloseBtn.onclick = () => {
        closeSchedioOverview();
      };
    }

    // Form Submit
    if (els.schedioAddForm) {
      els.schedioAddForm.onsubmit = handleSchedioSubmit;
    }

    // Init Dropdown logic
    const typeDropdown = document.getElementById('schedioTypeDropdown');
    if (typeDropdown) setupSchedioDropdown(typeDropdown, 'schedioType');

    // Init Date/Time Pickers
    initSchedioDateAndTimePickers();
  }

  function resetSchedioForm() {
    if (els.schedioAddForm) els.schedioAddForm.reset();
    const typeBtn = document.getElementById('schedioTypeBtn');
    if (typeBtn) typeBtn.textContent = 'Select Type';
    const dateInput = document.getElementById('schedioDate');
    if (dateInput) { dateInput.value = ''; delete dateInput.dataset.iso; }
    const editIdInput = document.getElementById('schedioEditId');
    if (editIdInput) editIdInput.value = '';
  }

  function closeSchedioModal() {
    if (els.schedioAddModal) {
      els.schedioAddModal.classList.remove('showing');
      setTimeout(() => els.schedioAddModal.classList.add('hidden'), 200);
    }
  }

  function closeSchedioOverview() {
    if (els.schedioOverviewModal) {
      els.schedioOverviewModal.classList.remove('showing');
      setTimeout(() => els.schedioOverviewModal.classList.add('hidden'), 200); // Wait for transition
    }
  }

  // ... (setupSchedioDropdown, initSchedioDateAndTimePickers kept as is, assumed defined outside range or below) ...
  // Note: Since I am replacing initSchedioLogic which was at the top of the viewed range, 
  // I must be careful not to delete referenced functions if they were inside.
  // The viewed range started at 1150 (renderSchedioItems). initSchedioLogic was earlier.
  // Wait, I am replacing renderSchedioItems and handleSchedioSubmit.
  // Need to verify where initSchedioLogic was. It was at 722. 
  // I should only replace renderSchedioItems and handleSchedioSubmit here.
  // I will inject the element selection inside initSchedioLogic via another replace call if needed, 
  // OR I can just look up elements dynamically. Global `els` object is convenient.

  // To be safe and minimal, I will stick to modifying renderSchedioItems and handleSchedioSubmit 
  // and adding helper functions. I won't rewrite initSchedioLogic in this block since it's far above.
  // I will grab elements lazily or assume they are available if I add getters.

  // Actually, I can just reimplement initSchedioLogic if I view it again? 
  // No, let's just add the listeners in a new init function or check lazily.
  // BUT the user interaction flow requires buttons to work.
  // I will add a helper `initSchedioOverviewListeners` and call it.

  function renderSchedioItems(items) {
    if (!els.schedioContainer) return;
    els.schedioContainer.innerHTML = '';

    // Clear any existing intervals for schedio countdowns to prevent leaks
    if (window.schedioInterval) {
      clearInterval(window.schedioInterval);
      window.schedioInterval = null;
    }

    if (items.length === 0) {
      if (els.schedioEmptyState) {
        els.schedioEmptyState.style.display = 'flex';
        if (els.schedioEmptyState.querySelector('p')) els.schedioEmptyState.querySelector('p').textContent = 'No upcoming schedules';
      }
      if (els.schedioEmptyLottie && window.lottie) {
        window.lottie.loadAnimation({
          container: els.schedioEmptyLottie,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          path: 'animation_file/Panda sleeping waiting lottie animation.json'
        });
      }
      return;
    }

    if (els.schedioEmptyState) els.schedioEmptyState.style.display = 'none';

    // Filter and Sort Items
    const now = new Date();
    const upcoming = [];
    const expired = [];

    items.forEach(item => {
      // Determine if item is expired
      // Assume if no date, it's upcoming (or just timeless), treated as upcoming for now.
      // If date exists, check time.
      if (item.date) {
        // Construct date object
        // If time exists, use it. Else default to end of day? User request implies expiration.
        // Let's use End of Day if no time is specified, or strict Midnight if user wants it.
        // Usually, if no time, it's valid for the whole day.
        let itemDate = new Date(item.date);
        if (item.time) {
          const [h, m] = item.time.split(':');
          itemDate.setHours(h, m, 0, 0);
        } else {
          itemDate.setHours(23, 59, 59, 999); // Valid until end of day
        }
        item.sortTime = itemDate.getTime();
        item.isExpired = itemDate < now;
      } else {
        item.sortTime = 9999999999999; // Far future
        item.isExpired = false;
      }

      if (item.isExpired) {
        expired.push(item);
      } else {
        upcoming.push(item);
      }
    });

    // Sort Upcoming: Earliest first (ASC)
    upcoming.sort((a, b) => a.sortTime - b.sortTime);

    // Sort Expired: Latest expiry first (DESC) -> "j ta pore expired hobe seta nic er diker list a age thakbe"
    expired.sort((a, b) => b.sortTime - a.sortTime);

    // Combine
    const sortedItems = [...upcoming, ...expired];

    // Arrays to hold countdown elements for updating
    const countdownElements = [];

    sortedItems.forEach(item => {
      // Check admin configuration for this type
      let showTime = true;
      let showRoom = true;
      let showDate = true;

      if (window.schedioTypesCache && item.type) {
        const typeConfig = Object.values(window.schedioTypesCache).find(t => t.name === item.type);
        if (typeConfig) {
          showTime = typeConfig.req_time === true;
          showRoom = typeConfig.req_room === true;
          showDate = typeConfig.req_date === true;
        }
      }

      // Handle optional date field
      let dateBoxHTML = '';
      if (showDate && item.date) {
        // Show normal date
        const dateObj = new Date(item.date);
        const month = dateObj.toLocaleString('default', { month: 'short' });
        const day = dateObj.getDate();
        dateBoxHTML = `
          <div class="schedio-date-box">
            <div class="schedio-month">${month}</div>
            <div class="schedio-day">${day}</div>
          </div>`;
      } else {
        // Show clock icon when date is not required or not available
        dateBoxHTML = `
          <div class="schedio-date-box" style="display: flex; align-items: center; justify-content: center;">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.6">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>`;
      }

      // Handle optional time field
      let timeStr = 'N/A';
      if (item.time) {
        let [h, m] = item.time.split(':');
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        timeStr = `${h}:${m} ${ampm}`;
      }

      const typeClass = item.type.toLowerCase().replace(/\s+/g, '-');

      const card = document.createElement('div');
      card.className = 'schedio-card';
      // Add animation
      card.style.animation = 'fadeIn 0.3s ease';
      card.style.cursor = 'pointer'; // Make clickable
      // If expired, maybe dim it slightly?
      if (item.isExpired) {
        card.style.opacity = '0.8';
        card.style.filter = 'grayscale(0.3)';
      }

      card.onclick = () => openSchedioOverview(item, timeStr, showTime, showRoom);

      // Build info row HTML conditionally
      let infoRowHTML = '';
      if (showTime || showRoom) {
        infoRowHTML = '<div class="schedio-info-row">';

        if (showTime) {
          infoRowHTML += `
            <div class="schedio-info-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
              ${timeStr}
            </div>`;
        }

        if (showRoom) {
          infoRowHTML += `
            <div class="schedio-info-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              ${item.room || 'N/A'}
            </div>`;
        }

        infoRowHTML += '</div>';
      }

      // Prepare Top Row: Tag + (Expired Label OR Countdown)
      let statusHTML = '';
      let countdownId = '';

      if (item.isExpired) {
        // Red Expired Label
        statusHTML = `<span style="font-size: 10px; font-weight: 700; color: #E74C3C; background: rgba(231, 76, 60, 0.15); padding: 4px 8px; border-radius: 6px; letter-spacing: 0.5px;">EXPIRED</span>`;
      } else if (item.date) {
        // Countdown
        // Generate a unique ID for this item's countdown to update later
        countdownId = 'schedio-timer-' + item.id;
        statusHTML = `<span id="${countdownId}" style="font-size: 11px; font-weight: 600; color: var(--accent);"></span>`;
        // We will push to an array to initialize logic after render
        countdownElements.push({ id: countdownId, targetTime: item.sortTime });
      }

      card.innerHTML = `
              ${dateBoxHTML}
              <div class="schedio-content">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                    <span class="schedio-tag ${typeClass}" style="margin-bottom:0;">${item.type}</span>
                    ${statusHTML}
                  </div>
                  <div class="schedio-title" style="font-weight:600; font-size:15px; margin-bottom:4px;">${item.subject || item.type}</div>
                  ${infoRowHTML}
                  <div class="schedio-note-list">${item.note}</div>
              </div>
          `;
      els.schedioContainer.appendChild(card);
    });

    // Start Countdown Interval if there are upcoming items
    if (countdownElements.length > 0) {
      function updateSchedioCountdowns() {
        const nowMs = Date.now();
        countdownElements.forEach(el => {
          const dom = document.getElementById(el.id);
          if (!dom) return;
          const diff = el.targetTime - nowMs;
          if (diff <= 0) {
            // Became expired just now
            dom.textContent = 'Expired';
            dom.style.color = '#E74C3C';
          } else {
            // Check scope: Days? Hours?
            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            let txt = '';
            if (d > 0) {
              txt = `${d}d ${h}h`; // e.g. 2d 5h left
            } else if (h > 0) {
              txt = `${h}h ${m}m`;
            } else {
              txt = `${m}m` + (m < 1 ? ' ' + Math.floor((diff % (1000 * 60)) / 1000) + 's' : '');
            }
            dom.textContent = 'In ' + txt;
          }
        });
      }

      // Run once immediately
      updateSchedioCountdowns();
      // Loop every minute (or second if we want seconds detail for close items)
      // User said "count down", usually implies ticking. Let's do 1s for better UX, or 30s?
      // 1s is fine for performance if list isn't huge.
      window.schedioInterval = setInterval(updateSchedioCountdowns, 1000);
    }
  }

  function openSchedioOverview(item, formattedTime, showTime = true, showRoom = true) {
    const modal = document.getElementById('schedioOverviewModal');
    if (!modal) return;

    // Populate Data
    let fullDate = 'N/A';
    if (item.date) {
      const dateObj = new Date(item.date);
      fullDate = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    document.getElementById('overviewDate').textContent = fullDate;
    document.getElementById('overviewTag').textContent = item.type;

    const typeClass = item.type.toLowerCase().replace(/\s+/g, '-');
    // Reset classes for tag
    const tagEl = document.getElementById('overviewTag');
    tagEl.className = 'glass-tag';
    tagEl.classList.add(typeClass); // Uses same color logic if CSS matches

    document.getElementById('overviewSubject').textContent = item.subject || item.type;

    // Conditionally show/hide Time field
    const timeItem = document.querySelector('.glass-info-item:has(#overviewTime)');
    if (timeItem) {
      if (showTime) {
        timeItem.style.display = '';
        document.getElementById('overviewTime').textContent = formattedTime;
      } else {
        timeItem.style.display = 'none';
      }
    }

    // Conditionally show/hide Room field
    const roomItem = document.querySelector('.glass-info-item:has(#overviewRoom)');
    if (roomItem) {
      if (showRoom) {
        roomItem.style.display = '';
        document.getElementById('overviewRoom').textContent = item.room || 'N/A';
      } else {
        roomItem.style.display = 'none';
      }
    }

    document.getElementById('overviewNote').textContent = item.note || 'No description provided.';

    // Actions for CR
    const actionsDiv = document.getElementById('overviewActions');
    const user = window.firebase.auth().currentUser;
    const db = window.firebase.database();

    if (user) {
      db.ref('users/' + user.uid).once('value').then(snap => {
        const u = snap.val();
        if (u && (u.role === 'cr' || u.role === 'CR')) {
          actionsDiv.classList.remove('hidden');

          // Setup buttons
          const editBtn = document.getElementById('overviewEditBtn');
          const deleteBtn = document.getElementById('overviewDeleteBtn');

          editBtn.onclick = () => {
            closeSchedioOverview();
            openEditSchedio(item);
          };

          deleteBtn.onclick = () => {
            deleteSchedioItem(item);
          };

        } else {
          actionsDiv.classList.add('hidden');
        }
      });
    }

    // Show Modal
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('showing'), 10);

    // Close listener
    const closeBtn = document.getElementById('overviewCloseBtn');
    if (closeBtn) {
      closeBtn.onclick = closeSchedioOverview;
    }
    modal.onclick = (e) => {
      if (e.target === modal) closeSchedioOverview();
    }
  }

  function closeSchedioOverview() {
    const modal = document.getElementById('schedioOverviewModal');
    if (modal) {
      modal.classList.remove('showing');
      setTimeout(() => modal.classList.add('hidden'), 200);
    }
  }

  function openEditSchedio(item) {
    // Pre-fill form
    const form = document.getElementById('schedioAddForm');
    if (!form) return;

    document.getElementById('schedioType').value = item.type;
    document.getElementById('schedioTypeBtn').textContent = item.type;

    // Update visibility based on type
    updateSchedioFieldsVisibility(item.type);

    document.getElementById('schedioSubject').value = item.subject || '';

    // Check if room, date, time are hidden before setting? 
    // Setting value on hidden input is fine, user won't see it.
    document.getElementById('schedioRoom').value = item.room || '';

    // Date: ISO format directly
    const dateInput = document.getElementById('schedioDate');
    if (item.date) {
      dateInput.value = formatDateDisplay(new Date(item.date));
      dateInput.dataset.iso = item.date;
    }

    // Time
    if (item.time) {
      let [h, m] = item.time.split(':');
      h = parseInt(h);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      document.getElementById('schedioTime').value = `${String(h).padStart(2, '0')}:${m} ${ampm}`;
    }

    document.getElementById('schedioNote').value = item.note || '';
    document.getElementById('schedioEditId').value = item.id;

    // Open Modal
    const modal = document.getElementById('schedioAddModal');
    modal.classList.remove('hidden');
    setTimeout(() => modal.classList.add('showing'), 10);
  }

  // Need this helper since it was inside closure in previous turn
  function formatDateDisplay(date) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const d = String(date.getDate()).padStart(2, '0');
    const m = months[date.getMonth()].slice(0, 3);
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
  }

  function deleteSchedioItem(item) {
    const user = window.firebase.auth().currentUser;
    if (!user) return;

    const db = window.firebase.database();
    db.ref('users/' + user.uid).once('value').then(snap => {
      const u = snap.val();
      const dept = u.department || u.dept;
      const sem = u.semester || u.sem || u.text_semester;
      const sec = u.section || u.sec;

      db.ref(`schedio/${dept}/${sem}/${sec}/${item.id}`).remove().then(() => {
        closeSchedioOverview();
        // UI updates automatically via .on listener
      });
    });
  }

  function handleSchedioSubmit(e) {
    e.preventDefault();
    const user = window.firebase.auth().currentUser;
    if (!user) return;

    const type = document.getElementById('schedioType').value;
    const subject = document.getElementById('schedioSubject').value;

    const roomInput = document.getElementById('schedioRoom');
    const room = roomInput.value;
    const isRoomHidden = roomInput.dataset.hidden === 'true';

    // Date logic
    const dateInput = document.getElementById('schedioDate');
    const dateWrapper = document.getElementById('schedioDateInputWrapper');
    const date = dateInput.dataset.iso || dateInput.value;
    const isDateHidden = dateWrapper && dateWrapper.dataset.hidden === 'true';

    // Time logic
    const timeInput = document.getElementById('schedioTime');
    let timeInputVal = timeInput.value;
    const isTimeHidden = timeInput.dataset.hidden === 'true';

    let time = timeInputVal;
    // Convert to HH:mm 24h format if in 12h
    if (timeInputVal && timeInputVal.includes(' ')) {
      const [t, ampm] = timeInputVal.split(' ');
      let [h, m] = t.split(':');
      h = parseInt(h);
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      time = `${String(h).padStart(2, '0')}:${m}`;
    }

    const note = document.getElementById('schedioNote').value;
    const editId = document.getElementById('schedioEditId').value;

    if (!type || !subject || !note) {
      alert('Type, Subject, and Note are required');
      return;
    }
    if (!isDateHidden && !date) {
      alert('Date is required'); return;
    }
    if (!isTimeHidden && !time) {
      alert('Time is required'); return;
    }
    // Room optional? "Room No" logic implies it might be needed if visible.
    // If user says "configure input fields (Room No, Date, Time)... not needed... hide or disable".
    // If visible, is it mandated? Let's assume yes if it's a "Required" configuration in admin.
    // Admin checkbox said "Required Fields". So if checked in Admin, it's required here (and visible).
    if (!isRoomHidden && !room) {
      alert('Room is required'); return;
    }

    const db = window.firebase.database();

    db.ref('users/' + user.uid).once('value').then(snap => {
      const u = snap.val();
      if (!u) {
        alert('User profile not found. Cannot add schedule.');
        return;
      }
      const dept = u.department || u.dept;
      const sem = u.semester || u.sem || u.text_semester;
      const sec = u.section || u.sec;

      if (!dept || !sem || !sec) {
        alert('User missing academic info (Department/Semester/Section). Cannot add schedule.');
        return;
      }

      const itemData = {
        type, subject, note,
        createdBy: user.uid,
        timestamp: window.firebase.database.ServerValue.TIMESTAMP
      };

      if (!isRoomHidden) itemData.room = room;
      if (!isDateHidden) itemData.date = date;
      if (!isTimeHidden) itemData.time = time;

      const savePromise = editId
        ? db.ref(`schedio/${dept}/${sem}/${sec}/${editId}`).update(itemData)
        : db.ref(`schedio/${dept}/${sem}/${sec}`).push(itemData);

      savePromise.then(successHandler).catch(err => {
        console.error('Schedio Save Error:', err);
        alert('Failed to save schedule: ' + err.message);
      });

      function successHandler() {
        if (els.schedioAddModal) {
          els.schedioAddModal.classList.remove('showing');
          setTimeout(() => els.schedioAddModal.classList.add('hidden'), 200);
        }
        // Reset
        e.target.reset();
        const typeBtn = document.getElementById('schedioTypeBtn');
        if (typeBtn) typeBtn.textContent = 'Select Type';

        // Reset inputs
        const dInput = document.getElementById('schedioDate');
        if (dInput) { dInput.value = ''; delete dInput.dataset.iso; }
        document.getElementById('schedioEditId').value = '';

        if (typeof updateSchedioFieldsVisibility === 'function') {
          updateSchedioFieldsVisibility('reset-all-true');
        }
      }
    }).catch(err => {
      console.error('User Fetch Error:', err);
      alert('Failed to fetch user data: ' + err.message);
    });
  } // Close handleSchedioSubmit


  // Need this helper since it was inside closure in previous turn
  function formatDateDisplay(date) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const d = String(date.getDate()).padStart(2, '0');
    const m = months[date.getMonth()].slice(0, 3);
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
  }

  function deleteSchedioItem(item) {
    const user = window.firebase.auth().currentUser;
    if (!user) return;

    const db = window.firebase.database();
    db.ref('users/' + user.uid).once('value').then(snap => {
      const u = snap.val();
      const dept = u.department || u.dept;
      const sem = u.semester || u.sem || u.text_semester;
      const sec = u.section || u.sec;

      db.ref(`schedio/${dept}/${sem}/${sec}/${item.id}`).remove().then(() => {
        closeSchedioOverview();
        // UI updates automatically via .on listener
      });
    });
  }

  function handleSchedioSubmit(e) {
    e.preventDefault();
    const user = window.firebase.auth().currentUser;
    if (!user) return;

    const type = document.getElementById('schedioType').value;
    const subject = document.getElementById('schedioSubject').value;

    const roomInput = document.getElementById('schedioRoom');
    const room = roomInput.value;
    const isRoomHidden = roomInput.dataset.hidden === 'true';

    // Date logic
    const dateInput = document.getElementById('schedioDate');
    const dateWrapper = document.getElementById('schedioDateInputWrapper');
    const date = dateInput.dataset.iso || dateInput.value;
    const isDateHidden = dateWrapper && dateWrapper.dataset.hidden === 'true';

    // Time logic
    const timeInput = document.getElementById('schedioTime');
    let timeInputVal = timeInput.value;
    const isTimeHidden = timeInput.dataset.hidden === 'true';

    let time = timeInputVal;
    // Convert to HH:mm 24h format if in 12h
    if (timeInputVal && timeInputVal.includes(' ')) {
      const [t, ampm] = timeInputVal.split(' ');
      let [h, m] = t.split(':');
      h = parseInt(h);
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      time = `${String(h).padStart(2, '0')}:${m}`;
    }

    const note = document.getElementById('schedioNote').value;
    const editId = document.getElementById('schedioEditId').value;

    if (!type || !subject || !note) {
      alert('Type, Subject, and Note are required');
      return;
    }
    if (!isDateHidden && !date) {
      alert('Date is required'); return;
    }
    if (!isTimeHidden && !time) {
      alert('Time is required'); return;
    }
    if (!isRoomHidden && !room) {
      alert('Room is required'); return;
    }

    db.ref('users/' + user.uid).once('value').then(snap => {
      const u = snap.val();
      if (!u) {
        alert('User profile not found. Cannot add schedule.');
        return;
      }
      const dept = u.department || u.dept;
      const sem = u.semester || u.sem || u.text_semester;
      const sec = u.section || u.sec;

      if (!dept || !sem || !sec) {
        alert('User missing academic info (Department/Semester/Section). Cannot add schedule.');
        return;
      }

      const itemData = {
        type, subject, note,
        createdBy: user.uid,
        timestamp: window.firebase.database.ServerValue.TIMESTAMP
      };

      if (!isRoomHidden) itemData.room = room;
      if (!isDateHidden) itemData.date = date;
      if (!isTimeHidden) itemData.time = time;

      const savePromise = editId
        ? db.ref(`schedio/${dept}/${sem}/${sec}/${editId}`).update(itemData)
        : db.ref(`schedio/${dept}/${sem}/${sec}`).push(itemData);

      savePromise.then(successHandler).catch(err => {
        console.error('Schedio Save Error:', err);
        alert('Failed to save schedule: ' + err.message);
      });

      function successHandler() {
        if (els.schedioAddModal) {
          els.schedioAddModal.classList.remove('showing');
          setTimeout(() => els.schedioAddModal.classList.add('hidden'), 200);
        }
        // Reset
        e.target.reset();
        const typeBtn = document.getElementById('schedioTypeBtn');
        if (typeBtn) typeBtn.textContent = 'Select Type';
        if (dateInput) { dateInput.value = ''; delete dateInput.dataset.iso; }
        document.getElementById('schedioEditId').value = '';

        if (typeof updateSchedioFieldsVisibility === 'function') {
          updateSchedioFieldsVisibility('reset-all-true');
        }
      }
    }).catch(err => {
      console.error('User Fetch Error:', err);
      alert('Failed to fetch user data: ' + err.message);
    });
  }

  // Init Schedio
  initSchedioLogic();

  // Dropdown animation helpers
  function showDropdown(dropdown) {
    if (!dropdown) return;
    // Remove hidden class first to make element visible
    dropdown.classList.remove('hidden', 'hiding');
    // Force reflow to ensure display change is applied
    dropdown.offsetHeight;
    // Add showing class to trigger animation
    dropdown.classList.add('showing');
  }

  function hideDropdown(dropdown) {
    if (!dropdown) return;
    // Remove showing class and add hiding class to trigger close animation
    dropdown.classList.remove('showing');
    dropdown.classList.add('hiding');
    // Wait for animation to complete before hiding
    setTimeout(() => {
      dropdown.classList.remove('hiding');
      dropdown.classList.add('hidden');
    }, 200); // Match CSS transition duration
  }

  // Helper function to check if an option is a placeholder
  function isPlaceholderOption(option) {
    if (!option) return false;
    const value = option.value || '';
    const text = option.textContent.trim() || '';
    // Check if it's a placeholder: empty value OR text starts with "Select" or is empty
    return value === '' || text === '' || /^select\s/i.test(text);
  }

  // Helper function to get button display text
  function getButtonText(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    if (!selectedOption) return '';

    // Check if this is a placeholder option
    if (isPlaceholderOption(selectedOption)) {
      // For specific selects, show just "Select" instead of full placeholder text
      const selectId = selectElement.id;
      if (
        selectId === 'crInfoSemester' ||
        selectId === 'crInfoSection') {
        return 'Select';
      }
    }

    // Always show the selected option's text (whether placeholder or real option)
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

    // Get current selected option and set button text
    button.textContent = getButtonText(selectElement);

    // Populate menu with options (excluding placeholder options)
    function updateMenu() {
      menu.innerHTML = '';
      Array.from(selectElement.options).forEach((option, index) => {
        // Skip placeholder options from the menu
        if (isPlaceholderOption(option)) {
          return;
        }

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
          // Update selected state
          menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        });

        menu.appendChild(item);
      });
    }

    updateMenu();

    // Toggle dropdown
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectElement.disabled) return;

      const isOpen = menu.classList.contains('showing');

      // Close all other dropdowns
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

    // Close dropdown when clicking outside - handled by global listener

    // Update button when select changes programmatically
    const observer = new MutationObserver(() => {
      button.textContent = getButtonText(selectElement);
      updateMenu();
    });
    observer.observe(selectElement, { childList: true, attributes: true, attributeFilter: ['selected'] });

    // Also listen to change events to update button text
    selectElement.addEventListener('change', () => {
      button.textContent = getButtonText(selectElement);
      updateMenu();
    });

    // Handle disabled state changes
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

    // Replace select with custom dropdown
    selectElement.style.display = 'none';
    selectElement.dataset.converted = 'true';
    selectElement.parentNode.insertBefore(wrapper, selectElement);
    wrapper.appendChild(selectElement); // Keep select for form submission

    return wrapper;
  }

  function refreshCustomDropdown(selectElement) {
    if (!selectElement) return;
    const customWrapper = selectElement.closest('.custom-dropdown');
    if (!customWrapper) return;
    const button = customWrapper.querySelector('.custom-dropdown-button');
    const menu = customWrapper.querySelector('.custom-dropdown-menu');
    if (!button || !menu) return;

    button.textContent = getButtonText(selectElement);
    if (selectElement.disabled) {
      button.classList.add('disabled');
    } else {
      button.classList.remove('disabled');
    }

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

  function lockDepartmentSelect(selectElement) {
    if (!selectElement) return;

    // Department availability is now handled in updateAllDepartmentDropdowns
    // Unavailable departments are shown but disabled (cursor blocked)
    // This function is kept for backward compatibility
  }

  // Update tab icons based on active page
  function updateTabIcons(activeTab) {
    const studentIcon = document.getElementById('student-icon');
    const teacherIcon = document.getElementById('teacher-icon');
    const queryIcon = document.getElementById('query-icon');
    const moreIcon = document.getElementById('more-icon');

    if (!studentIcon || !teacherIcon || !queryIcon || !moreIcon) return;

    // Reset all icons to inactive state
    if (activeTab === 'student') {
      studentIcon.src = 'attachment/student.png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history (1).png';
      moreIcon.src = 'attachment/application (1).png';
    } else if (activeTab === 'teacher') {
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card.png';
      queryIcon.src = 'attachment/history (1).png';
      moreIcon.src = 'attachment/application (1).png';
    } else if (activeTab === 'query') {
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history.png';
      moreIcon.src = 'attachment/application (1).png';
    } else if (activeTab === 'more' || activeTab === 'empty' || activeTab === 'booking' || activeTab === 'privacy' || activeTab === 'support' || activeTab === 'information' || activeTab === 'todo' || activeTab === 'schedio') {
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history (1).png';
      moreIcon.src = 'attachment/application.png';
    } else {
      // For landing or other pages, use inactive icons
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history (1).png';
      moreIcon.src = 'attachment/application (1).png';
    }
  }

  // Cache helpers for offline support
  function getCacheKey(department, semester, section) {
    return `cse.routine.${department}.${semester}.${section}`;
  }

  function saveRoutineToCache(department, semester, section, data) {
    try {
      localStorage.setItem(getCacheKey(department, semester, section), JSON.stringify(data || {}));
    } catch (_) { }
  }

  function loadRoutineFromCache(department, semester, section) {
    try {
      const raw = localStorage.getItem(getCacheKey(department, semester, section));
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function ensureNested(obj, k1, k2, k3) {
    if (!obj[k1]) obj[k1] = {};
    if (!obj[k1][k2]) obj[k1][k2] = {};
    if (!obj[k1][k2][k3]) obj[k1][k2][k3] = { Saturday: [], Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [] };
    return obj[k1][k2][k3];
  }

  let currentDepartment = '';
  let currentSemester = '';
  let currentSection = '';
  let currentDay = '';

  // Teacher page state
  let allTeachers = {}; // { shortForm: { fullName, contact, mail, designation } }
  let departmentTeachers = new Set(); // Lowercased teacher short forms for current department
  let currentTeacherShort = '';
  let currentTeacherDept = '';
  let teacherRoutineData = {}; // { semester: { section: { day: [slots] } } }
  let currentTeacherDay = '';
  let activeTeacherDbRef = null;
  let teacherDataLoaded = false; // Track if teacher data is already loaded
  let loadedTeacherKey = ''; // Track which teacher+dept combination is loaded

  // Load department availability from Firebase
  async function loadDepartmentAvailability() {
    if (!db) return;
    try {
      const snap = await db.ref('departmentAvailability').once('value');
      const data = snap.val();
      if (data) {
        departmentAvailability = data;
      } else {
        // Initialize: all departments enabled by default
        departments.forEach(dept => {
          if (departmentAvailability[dept.name] === undefined) {
            departmentAvailability[dept.name] = true;
          }
        });
      }
      updateAllDepartmentDropdowns();
    } catch (e) {
      console.error('Failed to load department availability:', e);
      // Initialize defaults
      departments.forEach(dept => {
        if (departmentAvailability[dept.name] === undefined) {
          departmentAvailability[dept.name] = true;
        }
      });
      updateAllDepartmentDropdowns();
    }
  }

  // Load departments from Firebase
  async function loadDepartments() {
    if (!db) return;
    try {
      const snap = await db.ref('departments').once('value');
      const deptData = snap.val();
      if (deptData && Array.isArray(deptData)) {
        departments = deptData.sort((a, b) => (a.order || 0) - (b.order || 0));
      } else if (deptData) {
        departments = Object.values(deptData).sort((a, b) => (a.order || 0) - (b.order || 0));
      } else {
        // Default to EEE if no departments exist
        departments = [{ name: 'EEE', order: 0 }];
      }
      await loadDepartmentAvailability();
      updateAllDepartmentDropdowns();
    } catch (e) {
      console.error('Failed to load departments:', e);
      departments = [{ name: 'EEE', order: 0 }];
      await loadDepartmentAvailability();
      updateAllDepartmentDropdowns();
    }
  }

  // Load sections for a department and semester
  async function loadDepartmentSections(dept, semester) {
    if (!db || !dept || !semester) return [];
    try {
      const snap = await db.ref(`departmentSections/${dept}/${semester}`).once('value');
      return snap.val() || [];
    } catch (e) {
      console.error('Failed to load sections:', e);
      return [];
    }
  }

  // Update all department dropdowns across all pages
  function updateAllDepartmentDropdowns() {
    const deptSelects = [
      els.department, els.departmentDisplay, els.teacherDepartment,
      els.roomQueryDepartment, els.crInfoDepartment, els.bookingQueryDepartment,
      document.getElementById('s_dept') // Signup department dropdown
    ].filter(el => el);

    deptSelects.forEach(select => {
      const currentVal = select.value || '';
      select.innerHTML = '';
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = 'Select Department';
      select.appendChild(ph);

      // Show all departments but disable unavailable ones (like before)
      departments.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept.name;
        opt.textContent = dept.name;

        // Disable if department is not available (cursor will be blocked)
        const isAvailable = departmentAvailability[dept.name] !== false; // Default to true if not set
        if (!isAvailable) {
          opt.disabled = true;
        }

        if (dept.name === currentVal || (currentVal === '' && dept.name === 'EEE' && isAvailable)) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      // Apply department lock after populating options (if needed)
      lockDepartmentSelect(select);
    });
  }

  // Attach real-time listener to RTDB path routines/{department}/{semester}/{section}
  let activeDbRef = null;
  function attachRoutineListener(department, semester, section) {
    if (!db) return;
    if (activeDbRef) activeDbRef.off();
    const ref = db.ref(`routines/${department}/${semester}/${section}`);
    activeDbRef = ref;
    ref.on('value', (snap) => {
      const value = snap.val() || { Saturday: [], Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [] };
      if (!routineData[department]) routineData[department] = {};
      if (!routineData[department][semester]) routineData[department][semester] = {};
      routineData[department][semester][section] = value;
      saveRoutineToCache(department, semester, section, value);
      // If user is viewing this dept/sem/sec, refresh current day
      if (department === currentDepartment && semester === currentSemester && section === currentSection) {
        const dayToRender = currentDay || getTodayInfo().dayName || 'Saturday';
        renderDay(dayToRender);
      }
    }, () => {
      // On error, fallback silently; UI shows last cached
    });

    // Also listen to CRs for this department, semester and section
    try {
      db.ref(`cr/${department}/${semester}/${section}`).on('value', (snap) => {
        if (!crDetails[department]) crDetails[department] = {};
        if (!crDetails[department][semester]) crDetails[department][semester] = {};
        crDetails[department][semester][section] = snap.val() || null;
        updateCRUI(department, semester, section);
      });
      // Also listen to version for this department and semester
      db.ref(`versions/${department}/${semester}`).on('value', (snap) => {
        if (!versionLabels[department]) versionLabels[department] = {};
        versionLabels[department][semester] = snap.val() || '';
        updateVersionUI(department, semester);
        // Update teacher version if on teacher page
        if (currentTeacherShort) {
          updateTeacherVersionInfo();
        }
      });
    } catch (_) { }
  }

  const persistSelection = window.AppUtils?.persistSelection || function (department, semester, section) {
    localStorage.setItem('cse.department', department);
    localStorage.setItem('cse.semester', semester);
    localStorage.setItem('cse.section', section);
    localStorage.setItem('cse.hasVisitedNEW', '1');
  };

  const getPersistedSelection = window.AppUtils?.getPersistedSelection || function () {
    const department = localStorage.getItem('cse.department');
    const semester = localStorage.getItem('cse.semester');
    const section = localStorage.getItem('cse.section');
    return department && semester && section ? { department, semester, section } : null;
  };

  // Use utility functions from module if available
  const getTodayInfo = window.AppUtils?.getTodayInfo || function () {
    const now = new Date();
    const wd = now.getDay();
    const map = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
    const dayName = map[wd];
    const dd = String(now.getDate()).padStart(2, '0');
    const short = now.toLocaleString(undefined, { weekday: 'short' });
    return { dayName, label: `${short} ${dd}` };
  };

  const getDateForDay = window.AppUtils?.getDateForDay || function (dayName) {
    const now = new Date();
    const currentDay = now.getDay();
    const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Saturday': 6 };
    const targetDay = dayMap[dayName];
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);
    return String(targetDate.getDate()).padStart(2, '0');
  };

  const semLabel = window.AppUtils?.semLabel || function (code) {
    const map = {
      '1-1': '1st', '1-2': '2nd',
      '2-1': '3rd', '2-2': '4th',
      '3-1': '5th', '3-2': '6th',
      '4-1': '7th', '4-2': '8th'
    };
    return map[code] || code || '';
  };

  // Predefined time slot order (same as admin page dropdown menu)
  // This ensures serial-wise sorting without clock conversion
  // Predefined time slot order (same as admin page dropdown menu)
  // This ensures serial-wise sorting without clock conversion
  const TIME_SLOT_ORDER = [
    '9:00 - 10:25',
    '10:25 - 11:50',
    '11:50 - 1:15',
    '1:45 - 3:10',
    '3:10 - 4:35',
    '4:35 - 6:00'
  ];

  // Helper to get global time settings (loaded in init)
  function getTimeDisplay(originalTime) {
    const config = window.globalTimeFormatConfig || { timeFormat: 'format2' }; // Default to standard

    if (config.timeFormat === 'format1' && config.slotLabels) {
      // Map standard ranges to slot names
      // Normalize input time
      const norm = originalTime.replace(/\s+/g, ' ').trim();

      if (norm === '9:00 - 10:25') return config.slotLabels.slot1 || 'Slot 1(09:00 AM)';
      if (norm === '10:25 - 11:50') return config.slotLabels.slot2 || 'Slot 2(10:25 AM)';
      if (norm === '11:50 - 1:15') return config.slotLabels.slot3 || 'Slot 3(11:50 AM)';
      if (norm === '1:45 - 3:10') return config.slotLabels.slot4 || 'Slot 4(01:45 PM)';
      if (norm === '3:10 - 4:35') return config.slotLabels.slot5 || 'Slot 5(03:10 PM)';
      if (norm === '4:35 - 6:00') return config.slotLabels.slot6 || 'Slot 6(04:35 PM)';

      return originalTime; // Fallback if no match
    } else {
      // Standard Format
      return originalTime.replace('-', '→');
    }
  }

  // Helper to parse time for sorting
  function parseTime(timeStr) {
    if (!timeStr) return 0;
    // Extract first time part: "9:00 - 10:25" -> "9:00"
    const start = timeStr.split('-')[0].trim();
    const parts = start.split(':');
    let h = parseInt(parts[0], 10);
    let m = parseInt(parts[1], 10) || 0;

    // Very basic heuristic for PM adjustment if needed (e.g. 1:00 -> 13:00)
    // But standard routine format is 9-6 without AM/PM usually.
    // 9, 10, 11 are AM. 12, 1, 2, 3, 4, 5, 6 are PM.
    // If h is 1-6, add 12. If h is 9-12, keep.
    if (h >= 1 && h <= 6) h += 12;

    return h * 60 + m;
  }

  // Get time slot index for sorting (serial wise)
  const getTimeSlotIndex = window.AppUtils?.getTimeSlotIndex || function (timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 999; // Put unknown times at end

    // Clean the time string (remove extra spaces, normalize format)
    timeStr = timeStr.trim();

    // Try exact match first
    const exactIndex = TIME_SLOT_ORDER.indexOf(timeStr);
    if (exactIndex !== -1) return exactIndex;

    // Try matching with different separators (handle variations)
    for (let i = 0; i < TIME_SLOT_ORDER.length; i++) {
      const slot = TIME_SLOT_ORDER[i];
      // Normalize both strings for comparison (remove spaces, handle different separators)
      const normalizedSlot = slot.replace(/\s+/g, ' ').trim();
      const normalizedTime = timeStr.replace(/\s+/g, ' ').trim();
      if (normalizedSlot === normalizedTime) return i;
    }
    return 999;
  };



  // Landing: Get Schedule

  // Landing: Get Schedule
  els.getSchedule.addEventListener('click', async () => {
    const dept = els.department.value.trim();
    const sem = els.semester.value.trim();
    const sec = els.section.value.trim();
    if (!dept || !sem || !sec) {
      els.landingError.textContent = 'Please select Department, Semester and Section.';
      return;
    }
    els.landingError.textContent = '';
    persistSelection(dept, sem, sec);
    // Hide landing overlay before switching to student screen
    if (els.landingOverlay) {
      els.landingOverlay.classList.add('hidden');
      document.body.classList.remove('landing-lock');
    }
    setScreen('student');
    await loadStudent(dept, sem, sec);
  });

  // Bottom tabs - enable ripple effect for all tabs
  els.tabs.forEach(btn => {
    enableRipple(btn);
    btn.addEventListener('click', () => {
      // Prevent tab switching when landing screen is visible
      if (els.landingOverlay && !els.landingOverlay.classList.contains('hidden')) {
        return;
      }
      let tab = btn.dataset.tab;
      // Handle legacy 'empty' as 'more'
      if (tab === 'empty') tab = 'more';
      setScreen(tab);
      // Teacher data is already preloaded on page load, just show the UI
      // No need to reload when switching tabs
    });
  });

  // Placeholder for the ID of the booking to be cancelled
  let bookingIdToCancel = null;

  async function loadUserBookingHistory(uid) {
    const container = document.getElementById('bookingHistoryContainer');
    if (!container) return;
    container.innerHTML = '<div style="font-size:12px;color:var(--muted);">Loading history...</div>';

    try {
      // Create a query for bookings by this user
      // Note: This requires index on 'userId' in Firebase rules for best performance
      const snap = await db.ref('booking_requests').orderByChild('userId').equalTo(uid).once('value');
      const data = snap.val() || {};

      // Convert to array with keys to allow updates
      const requests = Object.entries(data).map(([key, val]) => ({ ...val, key }));

      // Sort: Newest first
      requests.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // --- Auto-Expire Logic ---
      const now = new Date();
      const updates = {};
      let hasUpdates = false;

      requests.forEach(req => {
        if (req.status === 'pending') {
          if (isBookingExpired(req.date, req.time)) {
            req.status = 'expired'; // Update local for immediate feedback
            updates[`/booking_requests/${req.key}/status`] = 'expired';
            hasUpdates = true;
          }
        }
      });

      if (hasUpdates) {
        // Update Firebase in background
        db.ref().update(updates).catch(console.error);
      }
      // -------------------------

      container.innerHTML = '';
      if (requests.length === 0) {
        container.innerHTML = '<div style="font-size:12px;color:var(--muted);">No booking history.</div>';
        return;
      }

      requests.forEach(req => {
        const item = document.createElement('div');
        item.className = `history-card status-${req.status}`;

        const dateStr = req.date ? new Date(req.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const reqTimeStr = req.timestamp ? new Date(req.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

        // Check cancellations eligibility
        // Allow cancel if: (Pending OR Confirmed) AND (Not Expired)
        const isExpired = isBookingExpired(req.date, req.time);
        const canCancel = (req.status === 'pending' || req.status === 'confirmed') && !isExpired;

        let actionBtnHtml = '';
        if (canCancel) {
          actionBtnHtml = `
                <button onclick="window.cancelBooking('${req.key}')" 
                    class="cancel-request-btn"
                    style="background: transparent; border: 1px solid rgba(231, 76, 60, 0.4); color: #e74c3c; 
                    padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 600; cursor: pointer; float: right; margin-top: -2px; transition: all 0.2s;">
                    Cancel Request
                </button>
            `;
        }

        item.innerHTML = `
            <div class="history-header">
                <div class="history-reason">${req.reason || 'No Reason'}</div>
                <div class="history-status">${req.status}</div>
            </div>
            <div class="history-body">
                <div class="history-row">
                    <span class="history-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
                    <span>${req.room}</span>
                </div>
                <div class="history-row">
                    <span class="history-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span>
                    <span>${req.time}</span>
                </div>
                <div class="history-row">
                    <span class="history-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
                    <span>${dateStr}</span>
                </div>
            </div>
            <div class="history-footer" style="display:flex; justify-content:space-between; align-items:center;">
                <span class="history-req-time">Requested on ${reqTimeStr}</span>
                ${actionBtnHtml}
            </div>
        `;
        container.appendChild(item);
      });
    } catch (e) {
      console.error(e);
      container.innerHTML = '<div style="font-size:12px;color:var(--error);">Failed to load history.</div>';
    }
  }

  // --- Cancel Booking Logic ---
  window.cancelBooking = function (key) {
    bookingIdToCancel = key;
    const popup = document.getElementById('cancelBookingConfirmPopup');
    if (popup) {
      popup.classList.remove('hidden');
      requestAnimationFrame(() => popup.classList.add('showing'));
    }
  };

  function setupCancelBookingPopup() {
    const popup = document.getElementById('cancelBookingConfirmPopup');
    const yesBtn = document.getElementById('cancelBookingYesBtn');
    const noBtn = document.getElementById('cancelBookingNoBtn');

    if (!popup || !yesBtn || !noBtn) return;

    // Avoid multiple listeners if called repeatedly
    if (popup.dataset.wired) return;

    const closePopup = () => {
      popup.classList.remove('showing');
      setTimeout(() => popup.classList.add('hidden'), 200);
      bookingIdToCancel = null;
    };

    noBtn.addEventListener('click', closePopup);

    yesBtn.addEventListener('click', async () => {
      if (!bookingIdToCancel) return;

      const originalText = yesBtn.textContent;
      yesBtn.disabled = true;
      yesBtn.textContent = 'Cancelling...';

      try {
        await db.ref(`booking_requests/${bookingIdToCancel}`).update({ status: 'cancelled' });

        // Refresh History UI
        const user = firebase.auth().currentUser;
        if (user) loadUserBookingHistory(user.uid);

        closePopup();
      } catch (e) {
        console.error(e);
        alert('Failed to cancel booking.');
      } finally {
        yesBtn.disabled = false;
        yesBtn.textContent = originalText;
      }
    });

    popup.dataset.wired = "true";
  }

  // Call setup once
  setupCancelBookingPopup();

  function isBookingExpired(dateStr, timeSlotStr) {
    if (!dateStr || !timeSlotStr) return false;
    try {
      // timeSlotStr example: "9:00 - 10:25" or "1:45 - 3:10"
      const startTimePart = timeSlotStr.split('-')[0].trim();

      const [hStr, mStr] = startTimePart.split(':');
      let h = parseInt(hStr);
      const m = parseInt(mStr);

      // Convert logic: 
      // 9, 10, 11 -> AM (unchanged)
      // 12 -> PM (unchanged, 12 is > 7)
      // 1, 2, 3, 4, 5, 6 -> PM (add 12)
      // Assumption: No classes before 7 AM.
      if (h < 7) {
        h += 12;
      }

      const d = new Date(dateStr);
      // Set time. Note: This creates a Date in local timezone.
      d.setHours(h, m, 0, 0);

      const now = new Date();
      // Expire if current time is strictly after the start time
      return now > d;
    } catch (e) {
      return false;
    }
  }

  // Booking Management - Global Handler
  // Booking Management - Global Handler
  window.handleBookingClick = function () {
    const btn = document.getElementById('bookingMenuOption');
    if (btn) {
      // Visual feedback
      btn.style.opacity = '0.7';
      setTimeout(() => btn.style.opacity = '1', 150);
    }

    // Verify Firebase
    if (!window.firebase || !window.firebase.auth) {
      alert('Firebase not initialized. Please refresh.');
      return;
    }

    const user = window.firebase.auth().currentUser;
    if (!user) {
      // If not logged in, ensure we are on 'more' screen (login view)
      setScreen('more');
      return;
    }

    // Priority 1: Check Local Storage (User explicitly requested "local theke check hobe")
    let role = localStorage.getItem('user_role');

    // Priority 2: Check UI Text (User mentioned "name er nic a profile role show kortese")
    if (!role) {
      const roleEl = document.getElementById('userRole');
      if (roleEl && roleEl.textContent) {
        role = roleEl.textContent.trim();
      }
    }

    // Priority 3: Check Memory
    if (!role && userProfile && userProfile.role) {
      role = userProfile.role;
    }

    // Normalization
    role = (role || 'student').toLowerCase();

    // Fail-safe: if role is clearly student, deny access.
    if (role === 'student') {
      // Show access denied message
      const msg = document.createElement('div');
      msg.textContent = 'Access Denied: Restricted to CRs & Teachers';
      msg.style.position = 'fixed';
      msg.style.bottom = '80px';
      msg.style.left = '50%';
      msg.style.transform = 'translateX(-50%)';
      msg.style.background = '#e74c3c';
      msg.style.color = '#fff';
      msg.style.padding = '12px 24px';
      msg.style.borderRadius = '24px';
      msg.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      msg.style.zIndex = '9999';
      msg.style.animation = 'fadeInOut 3s ease forwards';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3000);
      return;
    }

    // Allow access for CR and Teacher
    // Switch to dedicated Booking Screen instead of Modal
    if (els.screens && els.screens.booking) {
      setScreen('booking');

      // Initialize Booking Query UI
      initBookingQueryUI();

      // Load History
      if (typeof loadUserBookingHistory === 'function') {
        loadUserBookingHistory(user.uid);
      }
    } else {
      console.error('Booking screen not found');
      alert('Internal Error: Booking screen missing.');
    }
  };

  // Booking Back Button (New Screen)
  const bookingBackBtn = document.getElementById('bookingBackBtn');
  if (bookingBackBtn) {
    bookingBackBtn.addEventListener('click', () => {
      setScreen('more');
    });
  }

  // Support Back Button
  const supportBackBtn = document.getElementById('supportBackBtn');
  if (supportBackBtn) {
    supportBackBtn.addEventListener('click', () => {
      setScreen('more');
    });
  }

  // Support Menu Option Handler
  const supportOption = document.getElementById('supportOption');
  if (supportOption) {
    supportOption.addEventListener('click', () => {
      setScreen('support');
    });
  }

  // Support Logic
  const supportForm = document.getElementById('supportForm');
  const supportTypeBug = document.getElementById('supportTypeBug');
  const supportTypeReview = document.getElementById('supportTypeReview');
  const supportTypeInput = document.getElementById('supportTypeInput');
  const supportSubjectField = document.getElementById('supportSubjectField');
  const supportRatingField = document.getElementById('supportRatingField');
  const supportMessage = document.getElementById('supportMessage');
  const supportSubmitBtn = document.getElementById('supportSubmitBtn');

  // Star Rating Logic
  const starContainer = document.querySelector('.star-rating');
  const stars = document.querySelectorAll('.star-rating .star');
  const ratingValueInput = document.getElementById('supportRatingValue');

  function updateStars(value) {
    if (!stars) return;
    stars.forEach(s => {
      if (parseInt(s.dataset.value) <= parseInt(value)) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  }

  if (starContainer && stars.length > 0) {
    stars.forEach(star => {
      star.addEventListener('click', function () {
        const value = this.dataset.value;
        ratingValueInput.value = value;
        updateStars(value);
      });
    });

    // Init stars
    if (ratingValueInput) updateStars(ratingValueInput.value);
  }

  // Toggle Handler
  function updateSupportUI(type) {
    if (type === 'review') {
      // Review Mode
      supportTypeReview.classList.add('active');
      supportTypeBug.classList.remove('active');
      supportTypeInput.value = 'review';

      supportSubjectField.style.display = 'none';
      supportSubjectField.querySelector('input').required = false;

      supportRatingField.style.display = 'block';

      supportMessage.placeholder = "Share your feedback about the app...";
      supportSubmitBtn.textContent = "Submit Review";
    } else {
      // Report Mode
      supportTypeBug.classList.add('active');
      supportTypeReview.classList.remove('active');
      supportTypeInput.value = 'bug_report';

      supportSubjectField.style.display = 'block';
      supportSubjectField.querySelector('input').required = true;

      supportRatingField.style.display = 'none';

      supportMessage.placeholder = "Describe the bug or issue in detail...";
      supportSubmitBtn.textContent = "Send Report";
    }
  }

  if (supportTypeBug && supportTypeReview) {
    supportTypeBug.addEventListener('click', () => updateSupportUI('bug_report'));
    supportTypeReview.addEventListener('click', () => updateSupportUI('review'));
  }

  // Submit Handler
  if (supportForm) {
    supportForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const user = firebase.auth().currentUser;
      const type = supportTypeInput.value;
      const message = supportMessage.value.trim();
      const statusMsg = document.getElementById('supportStatusMessage');
      if (statusMsg) statusMsg.textContent = '';

      const submitBtn = supportForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      try {
        const timestamp = firebase.database.ServerValue.TIMESTAMP;
        const userEmail = user ? user.email : 'Anonymous';
        const uid = user ? user.uid : 'anon';

        if (type === 'review') {
          const rating = ratingValueInput.value;

          if (!rating || rating === '0') {
            throw new Error("Please select a star rating.");
          }

          await db.ref('reviews').push({
            uid: uid,
            email: userEmail,
            rating: parseInt(rating),
            feedback: message,
            timestamp: timestamp,
            status: 'new'
          });

          if (statusMsg) {
            statusMsg.textContent = "✓ Review sent successfully!";
            statusMsg.style.color = "var(--success)";
            setTimeout(() => { if (statusMsg) statusMsg.textContent = ''; }, 3000);
          }

          // Clear feedback and stars
          supportMessage.value = '';
          ratingValueInput.value = '0';
          if (typeof updateStars === 'function') updateStars(0);

        } else {
          const subject = document.getElementById('supportSubject').value.trim();
          await db.ref('support_tickets').push({
            uid: uid,
            email: userEmail,
            subject: subject,
            description: message,
            timestamp: timestamp,
            status: 'open',
            type: 'bug_report'
          });

          if (statusMsg) {
            statusMsg.textContent = "✓ Report sent successfully!";
            statusMsg.style.color = "var(--success)";
          }

          setTimeout(() => {
            supportForm.reset();
            updateSupportUI('bug_report');
            if (typeof updateStars === 'function') updateStars(0);
            setScreen('more');
            if (statusMsg) statusMsg.textContent = '';
          }, 1500);
        }

      } catch (error) {
        console.error("Support submission error:", error);
        if (statusMsg) {
          statusMsg.textContent = "✗ " + (error.message || "Failed to send.");
          statusMsg.style.color = "#e74c3c";
        } else {
          alert(error.message || "Failed to send.");
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Privacy Policy Global Handler (Accessible to all users)
  const privacyOption = document.getElementById('privacyOption');
  if (privacyOption) {
    privacyOption.addEventListener('click', () => {
      setScreen('privacy');
    });
  }

  // Privacy Back Button
  const privacyBackBtn = document.getElementById('privacyBackBtn');
  if (privacyBackBtn) {
    privacyBackBtn.addEventListener('click', () => {
      setScreen('more');
    });
  }

  // User Profile Card - Hover Effects
  const userProfileCard = document.getElementById('userProfileCard');
  if (userProfileCard) {
    userProfileCard.addEventListener('mouseenter', () => {
      userProfileCard.style.transform = 'translateY(-2px)';
      userProfileCard.style.boxShadow = '0 4px 12px rgba(108, 99, 255, 0.2)';
    });
    userProfileCard.addEventListener('mouseleave', () => {
      userProfileCard.style.transform = 'translateY(0)';
      userProfileCard.style.boxShadow = '';
    });
  }

  // Profile Edit Modal Functions
  window.openProfileEditModal = function () {
    const modal = document.getElementById('profileEditModal');
    const user = window.firebase?.auth()?.currentUser;

    if (!user) {
      alert('Please login first');
      return;
    }

    if (!modal) {
      console.error('Profile edit modal not found');
      return;
    }

    // Load user data from Firebase
    if (db) {
      db.ref(`users/${user.uid}`).once('value').then((snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          loadUserDataToForm(userData, user.email);
          modal.classList.remove('hidden');
          setTimeout(() => modal.classList.add('showing'), 10);
        } else {
          alert('No user data found');
        }
      }).catch((error) => {
        console.error('Error loading user data:', error);
        alert('Failed to load profile data');
      });
    }
  };

  function loadUserDataToForm(userData, email) {
    console.log("Loading Profile Data:", userData); // Debugging

    // Set common fields
    const nameInput = document.getElementById('editName');
    if (nameInput) nameInput.value = userData.name || '';

    const emailEl = document.getElementById('editEmail');
    if (emailEl) emailEl.textContent = email || userData.email || '-';

    // Check for phone number with high priority on 'phone' key
    const phoneEl = document.getElementById('editPhone');
    if (phoneEl) {
      const rawPhone = userData.phone;
      console.log('Raw Phone Value:', rawPhone);
      phoneEl.textContent = rawPhone || userData.mobile || 'Not Provided';
    }

    const roleEl = document.getElementById('editRole');
    if (roleEl) {
      let roleText = userData.role || '-';
      if (roleText.toLowerCase() === 'cr') {
        roleText = 'CR';
      }
      roleEl.textContent = roleText;
    }

    const initialEl = document.getElementById('editUserInitials');
    if (initialEl) initialEl.textContent = (userData.name || 'U').charAt(0).toUpperCase();

    // Show/hide role-specific fields
    const studentFields = document.getElementById('studentEditFields');
    const teacherFields = document.getElementById('teacherEditFields');

    if (userData.role === 'student' || userData.role === 'cr') {
      studentFields.classList.remove('hidden');
      teacherFields.classList.add('hidden');

      document.getElementById('editStudentId').textContent = userData.studentId || userData.id || '-';
      document.getElementById('editDepartment').textContent = userData.department || userData.dept || '-';

      // Map semester code to text (e.g. 1-1 -> 1st)
      const semCode = userData.semester || userData.text_semester || userData.sem || userData.term || '';
      const semMap = {
        '1-1': '1st', '1-2': '2nd',
        '2-1': '3rd', '2-2': '4th',
        '3-1': '5th', '3-2': '6th',
        '4-1': '7th', '4-2': '8th'
      };
      const semText = semMap[semCode] || semCode || '-';
      document.getElementById('editSemester').textContent = semText;

      document.getElementById('editSection').textContent = userData.section || userData.sec || '-';
    } else if (userData.role === 'teacher') {
      teacherFields.classList.remove('hidden');
      studentFields.classList.add('hidden');

      document.getElementById('editTeacherId').textContent = userData.teacherId || userData.id || '-';
      document.getElementById('editTeacherDepartment').textContent = userData.department || userData.dept || '-';
      document.getElementById('editShortForm').textContent = userData.shortForm || userData.initial || '-';
      document.getElementById('editDesignation').textContent = userData.designation || '-';
    }
  }

  function closeProfileEditModal() {
    const modal = document.getElementById('profileEditModal');
    if (modal) {
      modal.classList.remove('showing');
      setTimeout(() => modal.classList.add('hidden'), 200);
    }
  }

  // Profile Edit Modal Close Handlers
  const profileEditClose = document.getElementById('profileEditClose');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  if (profileEditClose) {
    profileEditClose.addEventListener('click', closeProfileEditModal);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', closeProfileEditModal);
  }

  // Profile Edit Form Submission
  const profileEditForm = document.getElementById('profileEditForm');
  if (profileEditForm) {
    profileEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const user = window.firebase?.auth()?.currentUser;
      if (!user || !db) return;

      const messageDiv = document.getElementById('profileEditMessage');
      const submitBtn = profileEditForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        // Get current user data to check role
        const snapshot = await db.ref(`users/${user.uid}`).once('value');
        const currentData = snapshot.val();

        if (!currentData) {
          throw new Error('User data not found');
        }

        // Prepare updated data
        // Prepare updated data - ONLY NAME is editable now
        const updatedData = {
          name: document.getElementById('editName').value.trim()
        };

        // We do not update other fields as they are read-only
        // Role, ID, Department, etc. are preserved in Firebase automatically
        // as we will use .update() with only the fields that changed.

        // Update in Firebase
        await db.ref(`users/${user.uid}`).update(updatedData);


        // Update UI
        document.getElementById('userName').textContent = updatedData.name;
        document.getElementById('userInitials').textContent = updatedData.name.charAt(0).toUpperCase();

        // Update localStorage
        localStorage.setItem('user_role', currentData.role);

        // Show success message
        messageDiv.textContent = '✓ Profile updated successfully!';
        messageDiv.style.background = 'rgba(46, 204, 113, 0.1)';
        messageDiv.style.color = '#2ecc71';
        messageDiv.style.border = '1px solid rgba(46, 204, 113, 0.2)';
        messageDiv.style.display = 'block';

        setTimeout(() => {
          closeProfileEditModal();
          messageDiv.style.display = 'none';
        }, 2000);

      } catch (error) {
        console.error('Error updating profile:', error);
        messageDiv.textContent = '✗ Failed to update profile: ' + error.message;
        messageDiv.style.background = 'rgba(231, 76, 60, 0.1)';
        messageDiv.style.color = '#e74c3c';
        messageDiv.style.border = '1px solid rgba(231, 76, 60, 0.2)';
        messageDiv.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // --- Booking Query Logic ---

  function initBookingQueryUI() {
    // Auto-load departments
    populateBookingDepartments();

    // Booking Tab Switching
    if (els.bookingTab && els.historyTab) {
      els.bookingTab.addEventListener('click', () => {
        els.bookingTab.classList.add('active');
        els.historyTab.classList.remove('active');
        els.bookingInterface.classList.remove('hidden');
        els.historyInterface.classList.add('hidden');
        // Validate dropdowns when switching back
        checkBookingQueryDropdowns();
      });

      els.historyTab.addEventListener('click', () => {
        els.historyTab.classList.add('active');
        els.bookingTab.classList.remove('active');
        els.historyInterface.classList.remove('hidden');
        els.bookingInterface.classList.add('hidden');
      });
    }

    // Initialize Dropdowns if needed
    setTimeout(() => {
      if (els.bookingQueryDepartment && !els.bookingQueryDepartment.dataset.converted) convertSelectToCustomDropdown(els.bookingQueryDepartment);
      if (els.bookingQuerySearchBy && !els.bookingQuerySearchBy.dataset.converted) convertSelectToCustomDropdown(els.bookingQuerySearchBy);
      if (els.bookingQueryThirdSelect && !els.bookingQueryThirdSelect.dataset.converted) convertSelectToCustomDropdown(els.bookingQueryThirdSelect);
      if (els.bookingQueryDay && !els.bookingQueryDay.dataset.converted) convertSelectToCustomDropdown(els.bookingQueryDay);

      checkBookingQueryDropdowns();
      populateBookingQueryDays();
    }, 50);
  }

  function populateBookingDepartments() {
    if (!els.bookingQueryDepartment) return;

    // Leverage the global updater to ensure consistency with other screens
    updateAllDepartmentDropdowns();

    // Refresh custom dropdown UI if initialized
    if (els.bookingQueryDepartment.nextElementSibling && els.bookingQueryDepartment.nextElementSibling.classList.contains('custom-select-container')) {
      refreshCustomDropdown(els.bookingQueryDepartment);
    }
  }

  function populateBookingQueryDays() {
    if (!els.bookingQueryDay) return;
    els.bookingQueryDay.innerHTML = '';

    const today = new Date();
    let count = 0;
    let d = new Date(today);

    // Generate next 6 valid working days (consistent with valid days)
    for (let i = 0; i < 30 && count < 6; i++) {
      // Skip Friday (Day 5) 
      if (d.getDay() !== 5) {
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
        // Only add if it's a valid routine day (extra check, though Friday check covers most)
        if (DAYS_ORDER.includes(dayName)) {
          const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
          const valStr = d.toISOString().split('T')[0]; // YYYY-MM-DD

          const opt = document.createElement('option');
          opt.value = valStr; // Set value to YYYY-MM-DD
          opt.textContent = `${dayName} (${dateStr})`;
          // Store dayName for routine lookup since value is now date
          opt.dataset.dayName = dayName;

          if (count === 0) opt.selected = true;

          els.bookingQueryDay.appendChild(opt);
          count++;
        }
      }
      d.setDate(d.getDate() + 1);
    }
    refreshCustomDropdown(els.bookingQueryDay);
  }

  function checkBookingQueryDropdowns() {
    if (!els.bookingQueryDepartment || !els.bookingQuerySearchBy || !els.bookingQueryThirdSelect) return;

    const department = els.bookingQueryDepartment.value;
    const searchBy = els.bookingQuerySearchBy.value;

    if (searchBy === 'room') {
      if (els.bookingQueryThirdLabel) els.bookingQueryThirdLabel.textContent = 'Room Number';
      // Load Room Numbers for dept
      populateBookingRoomNumbers(department);
    } else {
      if (els.bookingQueryThirdLabel) els.bookingQueryThirdLabel.textContent = 'Time Slot';
      // Load Time Slots
      populateBookingTimeSlots();
    }
  }

  function populateBookingRoomNumbers(department) {
    if (!els.bookingQueryThirdSelect) return;
    const dept = department || 'EEE';

    // Use the cache from query tab logic if available, or fetch
    ensureRoomQueryData(dept);

    const rooms = roomQueryDataCache.roomsByDept[dept] || [];

    // Sort logic
    rooms.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    els.bookingQueryThirdSelect.innerHTML = '<option value="">Select Room</option>';
    if (rooms.length > 0) {
      rooms.forEach(room => {
        const opt = document.createElement('option');
        opt.value = room;
        opt.textContent = room;
        els.bookingQueryThirdSelect.appendChild(opt);
      });
      els.bookingQueryThirdSelect.disabled = false;
    } else {
      els.bookingQueryThirdSelect.disabled = true;
    }
    refreshCustomDropdown(els.bookingQueryThirdSelect);
  }

  function populateBookingTimeSlots() {
    if (!els.bookingQueryThirdSelect) return;
    const timeSlots = [
      '9:00 - 10:25',
      '10:25 - 11:50',
      '11:50 - 1:15',
      '1:45 - 3:10',
      '3:10 - 4:35',
      '4:35 - 6:00'
    ];
    els.bookingQueryThirdSelect.innerHTML = '<option value="">Select Time Slot</option>';
    timeSlots.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot;
      opt.textContent = formatTimeDisplay(slot);
      els.bookingQueryThirdSelect.appendChild(opt);
    });
    els.bookingQueryThirdSelect.disabled = false;
    refreshCustomDropdown(els.bookingQueryThirdSelect);
  }

  // Event Listeners for Booking Query
  // Event Listeners for Booking Query
  if (els.bookingQueryDepartment) {
    els.bookingQueryDepartment.addEventListener('change', () => {
      checkBookingQueryDropdowns();
      clearBookingQueryResults();
    });
  }
  if (els.bookingQuerySearchBy) {
    els.bookingQuerySearchBy.addEventListener('change', () => {
      checkBookingQueryDropdowns();
      clearBookingQueryResults();
    });
  }

  if (els.bookingQueryThirdSelect) {
    els.bookingQueryThirdSelect.addEventListener('change', clearBookingQueryResults);
  }

  if (els.bookingQueryDay) {
    els.bookingQueryDay.addEventListener('change', clearBookingQueryResults);
  }

  function clearBookingQueryResults() {
    if (els.bookingQueryResults) els.bookingQueryResults.innerHTML = '';
  }

  if (els.bookingQuerySearchBtn) {
    els.bookingQuerySearchBtn.addEventListener('click', () => {
      const dept = els.bookingQueryDepartment.value;
      const searchBy = els.bookingQuerySearchBy.value;
      const thirdVal = els.bookingQueryThirdSelect.value;
      const dateStr = els.bookingQueryDay.value; // YYYY-MM-DD

      let isValid = true;
      const validate = (el) => {
        if (!el) return;
        if (!el.value) {
          isValid = false;
          // Strategy: Find the parent custom wrapper if it exists
          const wrapper = el.closest('.custom-dropdown');
          if (wrapper) {
            const btn = wrapper.querySelector('.custom-dropdown-button');
            if (btn) {
              btn.style.borderColor = '#e74c3c';
              btn.style.boxShadow = '0 0 0 1px #e74c3c';

              // Remove error on change
              const r = () => {
                btn.style.borderColor = '';
                btn.style.boxShadow = '';
                el.removeEventListener('change', r);
              };
              el.addEventListener('change', r);
            }
          } else {
            // Fallback for native or unconverted select
            el.style.borderColor = '#e74c3c';
            el.style.boxShadow = '0 0 0 1px #e74c3c';
            const r = () => {
              el.style.borderColor = '';
              el.style.boxShadow = '';
              el.removeEventListener('change', r);
            };
            el.addEventListener('change', r);
          }
        }
      };

      validate(els.bookingQueryDepartment);
      validate(els.bookingQuerySearchBy);
      validate(els.bookingQueryThirdSelect); // This is Room Number / Time Slot
      validate(els.bookingQueryDay);

      if (!isValid) return;

      // Derive dayName from dropdown option or date dateStr
      let dayName = '';
      if (els.bookingQueryDay.selectedOptions && els.bookingQueryDay.selectedOptions[0]) {
        dayName = els.bookingQueryDay.selectedOptions[0].dataset.dayName;
      }
      // Fallback if dataset missing (e.g. customized manually)
      if (!dayName) {
        dayName = new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });
      }

      // Show loading
      if (els.bookingQueryResults) els.bookingQueryResults.innerHTML = '<div class="muted" style="text-align:center;">Searching...</div>';

      // Similar logic to queryRoom logic, but renders buttons to book
      if (searchBy === 'room') {
        queryBookingRoomByNumber(thirdVal, dept, dayName, dateStr);
      } else {
        queryBookingRoomByTimeSlot(thirdVal, dept, dayName, dateStr);
      }
    });
  }

  function renderBookingQueryResults(data, selectedDateStr) {
    if (!els.bookingQueryResults) return;
    els.bookingQueryResults.innerHTML = '';
    if (data.length === 0) {
      els.bookingQueryResults.innerHTML = '<div class="empty">No available slots found.</div>';
      return;
    }

    data.forEach(item => {
      const block = document.createElement('div');
      block.className = 'class-card clickable-slot';

      const isBooked = item.isBooked;
      const bgStyle = isBooked
        ? 'background: rgba(231, 76, 60, 0.1); border: 1px solid rgba(231, 76, 60, 0.3); opacity: 0.8;'
        : 'background: rgba(158, 140, 255, 0.1); border: 1px solid var(--outline);';

      const actionText = isBooked
        ? '<span style="color: #e74c3c; font-weight:600;">Booked</span>'
        : '<span style="color:var(--accent);">Tap to Book</span>';

      block.style.cssText = `padding: 14px; border-radius: 12px; margin-bottom: 10px; ${bgStyle} ${isBooked ? '' : 'cursor: pointer;'}`;

      block.innerHTML = `
             <div style="font-weight:500; font-size:15px; color:var(--text); margin-bottom:6px;">Room: ${item.room}</div>
             <div style="color:var(--muted); font-size:13px;">${formatTimeDisplay(item.timeSlot)}</div>
             <div style="font-size:12px; margin-top:4px;">${actionText}</div>
          `;

      if (!isBooked) {
        enableRipple(block);
        block.addEventListener('click', () => {
          openBookingConfirmPopup(item.room, item.timeSlot, selectedDateStr);
        });
      }

      els.bookingQueryResults.appendChild(block);
    });
  }

  // Helper to fetch confirmed bookings for a date
  async function getConfirmedBookingsMap(dateStr) {
    const map = {}; // { "room_time": true }
    try {
      // Query booking_requests by date
      // Ideally requires .indexOn: ["date"] rule in Firebase
      const snap = await db.ref('booking_requests').orderByChild('date').equalTo(dateStr).once('value');
      if (snap.exists()) {
        const data = snap.val();
        Object.values(data).forEach(req => {
          if (req.status === 'confirmed' && req.room && req.time) {
            map[`${req.room}_${req.time}`] = true;
          }
        });
      }
    } catch (e) {
      console.error("Error fetching overlapping bookings:", e);
    }
    return map;
  }

  async function queryBookingRoomByNumber(roomNumber, department, selectedDay, selectedDateStr) {
    // Reuse query logic logic
    const routines = roomQueryDataCache.routinesByDept[department];
    if (!routines) {
      ensureRoomQueryData(department);
      setTimeout(() => queryBookingRoomByNumber(roomNumber, department, selectedDay, selectedDateStr), 500); // Retry logic
      return;
    }

    // Fetch existing confirm bookings first
    const confirmedMap = await getConfirmedBookingsMap(selectedDateStr);

    const dayToUse = selectedDay;
    const allTimeSlots = [
      '9:00 - 10:25', '10:25 - 11:50', '11:50 - 1:15',
      '1:45 - 3:10', '3:10 - 4:35', '4:35 - 6:00'
    ];
    const occupiedSlots = new Set();

    Object.values(routines).forEach(sem => {
      Object.values(sem || {}).forEach(section => {
        const slots = (section?.[dayToUse]) || [];
        slots.forEach(slot => {
          if (slot && slot.room === roomNumber && slot.time) {
            occupiedSlots.add(slot.time);
          }
        });
      });
    });

    const results = [];
    allTimeSlots.forEach(slot => {
      if (!occupiedSlots.has(slot)) {
        // It is free from routine, now check if booked by user
        const isBooked = !!confirmedMap[`${roomNumber}_${slot}`];
        results.push({ room: roomNumber, timeSlot: slot, isBooked });
      }
    });

    renderBookingQueryResults(results, selectedDateStr);
  }

  async function queryBookingRoomByTimeSlot(timeSlot, department, selectedDay, selectedDateStr) {
    const routines = roomQueryDataCache.routinesByDept[department];
    if (!routines) {
      ensureRoomQueryData(department);
      setTimeout(() => queryBookingRoomByTimeSlot(timeSlot, department, selectedDay, selectedDateStr), 500);
      return;
    }

    // Fetch existing confirm bookings first
    const confirmedMap = await getConfirmedBookingsMap(selectedDateStr);

    const dayToUse = selectedDay;
    const allRooms = new Set(roomQueryDataCache.roomsByDept[department] || []);
    const occupiedRooms = new Set();

    Object.values(routines).forEach(sem => {
      Object.values(sem || {}).forEach(section => {
        const slots = (section?.[dayToUse]) || [];
        slots.forEach(slot => {
          if (!slot || !slot.room) return;
          allRooms.add(slot.room);
          if (slot.time === timeSlot) {
            occupiedRooms.add(slot.room);
          }
        });
      });
    });

    const freeRooms = Array.from(allRooms).filter(room => !occupiedRooms.has(room));

    const results = freeRooms.map(room => {
      const isBooked = !!confirmedMap[`${room}_${timeSlot}`];
      return { room, timeSlot: timeSlot, isBooked };
    });

    renderBookingQueryResults(results, selectedDateStr);
  }

  // --- Booking Confirmation Popup Logic ---

  function openBookingConfirmPopup(room, time, selectedDateStr) {
    const popup = els.bookingConfirmPopup;
    if (!popup) return;

    // Populate Details
    if (els.bookingConfirmDetails) {
      els.bookingConfirmDetails.innerHTML = `
             <div class="booking-confirm-label">Requesting Booking for</div>
             <div class="booking-confirm-room">Room ${room}</div>
             <div class="booking-confirm-time">${formatTimeDisplay(time)}</div>
          `;
    }

    // Hidden inputs
    if (els.bookingConfirmRoom) els.bookingConfirmRoom.value = room;
    if (els.bookingConfirmTime) els.bookingConfirmTime.value = time;

    // Populate Date Dropdown - LOCKED to selected search date
    if (els.bookingConfirmDate) {
      els.bookingConfirmDate.innerHTML = '';

      const d = new Date(selectedDateStr);
      // Format: "Sat (12 Oct)" 
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

      const opt = document.createElement('option');
      opt.value = selectedDateStr; // YYYY-MM-DD
      opt.textContent = `${dayName} (${displayDate})`;
      opt.selected = true;
      els.bookingConfirmDate.appendChild(opt);

      // Disable interaction
      els.bookingConfirmDate.disabled = true;

      // Refresh custom dropdown UI to reflect single option
      refreshCustomDropdown(els.bookingConfirmDate);

      // Explicitly disable the custom dropdown button wrapper
      const wrapper = els.bookingConfirmDate.closest('.custom-select-container');
      if (wrapper) {
        const btn = wrapper.querySelector('.custom-dropdown-button');
        if (btn) {
          btn.classList.add('disabled');
          btn.style.pointerEvents = 'none'; // Ensure no clicks
          btn.style.opacity = '0.7';
        }
      }
    }

    // Show Popup
    popup.classList.remove('hidden');
    requestAnimationFrame(() => popup.classList.add('showing'));
  }

  if (els.bookingConfirmClose) {
    els.bookingConfirmClose.addEventListener('click', () => {
      els.bookingConfirmPopup.classList.remove('showing');
      setTimeout(() => els.bookingConfirmPopup.classList.add('hidden'), 200);
    });
  }

  if (els.bookingConfirmForm) {
    els.bookingConfirmForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = window.firebase.auth().currentUser;
      if (!user) return;

      const room = els.bookingConfirmRoom.value;
      const time = els.bookingConfirmTime.value;
      const date = els.bookingConfirmDate.value;
      const reason = els.bookingConfirmReason.value;

      const submitBtn = els.bookingConfirmForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending Request...';

      try {
        // get info
        const userSnap = await db.ref(`users/${user.uid}`).once('value');
        const userData = userSnap.val() || {};

        const request = {
          userId: user.uid,
          userName: userData.name || 'Unknown',
          userRole: userData.role || 'unknown',
          room, time, date, reason,
          status: 'pending',
          timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        await db.ref('booking_requests').push(request);

        alert('Request Sent! Waiting for Admin Approval.');
        // Close popup
        els.bookingConfirmPopup.classList.remove('showing');
        setTimeout(() => els.bookingConfirmPopup.classList.add('hidden'), 200);

        // Clear reason
        els.bookingConfirmReason.value = '';

        // Refresh history
        if (typeof loadUserBookingHistory === 'function') {
          loadUserBookingHistory(user.uid);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to send request: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Landing: dependent section options
  els.department.addEventListener('change', async () => {
    const dept = els.department.value.trim();
    const sem = els.semester.value.trim();
    if (dept && sem) {
      await populateSections(els.section, sem, '', dept);
    }
  });
  els.semester.addEventListener('change', async () => {
    const dept = els.department.value.trim();
    const sem = els.semester.value.trim();
    if (dept && sem) {
      await populateSections(els.section, sem, '', dept);
    }
  });

  // Student screen: direct change handlers
  async function onStudentDepartmentChange() {
    const dept = els.departmentDisplay.value.trim();
    const sem = els.semesterDisplay.value.trim();
    if (dept && sem) {
      await populateSections(els.sectionDisplay, sem, '', dept);
    }
  }

  async function onStudentSemesterChange() {
    const dept = els.departmentDisplay.value.trim();
    const sem = els.semesterDisplay.value.trim();
    if (dept && sem) {
      await populateSections(els.sectionDisplay, sem, '', dept);
      const sec = els.sectionDisplay.value.trim();
      if (sec) {
        persistSelection(dept, sem, sec);
        await loadStudent(dept, sem, sec);
      }
    }
  }

  async function onStudentSectionChange() {
    const dept = els.departmentDisplay.value.trim();
    const sem = els.semesterDisplay.value.trim();
    const sec = els.sectionDisplay.value.trim();
    if (dept && sem && sec) {
      persistSelection(dept, sem, sec);
      await loadStudent(dept, sem, sec);
    }
  }

  // Days scroller build
  function buildDays(activeDay) {
    els.dayScroller.innerHTML = '';
    DAYS_ORDER.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day' + (day === activeDay ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.title = day;

      const dayLabel = document.createElement('span');
      dayLabel.className = 'day-name';
      dayLabel.textContent = day.slice(0, 3);

      const dateLabel = document.createElement('span');
      dateLabel.className = 'day-date';
      dateLabel.textContent = getDateForDay(day);

      btn.appendChild(dayLabel);
      btn.appendChild(dateLabel);
      btn.addEventListener('click', () => renderDay(day));
      enableRipple(btn);
      els.dayScroller.appendChild(btn);
    });
  }

  function renderDay(day) {
    const dept = els.departmentDisplay.value;
    const sem = els.semesterDisplay.value;
    const sec = els.sectionDisplay.value;
    currentDay = day;
    // Update day active UI
    Array.from(els.dayScroller.children).forEach(btn => {
      if (btn.classList.contains('day')) {
        btn.classList.toggle('active', btn.title === day);
      }
    });
    // Update date hint for chosen day if it's today
    const today = getTodayInfo();
    els.dateToday.textContent = day === today.dayName ? today.label : '';

    try {
      const items = ((((routineData || {})[dept] || {})[sem] || {})[sec] || {})[day] || [];
      renderSchedule(items);
    } catch (e) {
      showNetworkError();
    }
  }

  function renderSchedule(items) {
    els.scheduleContainer.innerHTML = '';
    els.emptyMessage.classList.add('hidden');
    els.networkMessage.classList.add('hidden');
    // Destroy empty Lottie animation when there are items
    if (emptyLottieInstance) {
      emptyLottieInstance.destroy();
      emptyLottieInstance = null;
    }
    if (!items || items.length === 0) {
      els.detailsTotal.textContent = '0';
      els.emptyMessage.classList.remove('hidden');
      if (!emptyLottieInstance && !emptyLottieLoading) {
        setTimeout(() => {
          if (!els.emptyMessage.classList.contains('hidden')) {
            initEmptyLottie();
          }
        }, 150);
      }
      return;
    }

    // Sort items by time slot order (serial wise - same as admin page dropdown)
    // Uses predefined time slot order instead of clock conversion
    const sortedItems = [...items].sort((a, b) => {
      const indexA = getTimeSlotIndex(a.time || '');
      const indexB = getTimeSlotIndex(b.time || '');
      // Sort by predefined order index (0 = first slot, 1 = second slot, etc.)
      return indexA - indexB;
    });

    els.detailsTotal.textContent = String(sortedItems.length);
    for (const it of sortedItems) {
      const card = document.createElement('div');
      card.className = 'slot-card';

      const time = document.createElement('div');
      time.className = 'slot-time';
      time.textContent = formatTimeDisplay(it.time);

      const main = document.createElement('div');
      main.className = 'slot-main';

      const title = document.createElement('div');
      title.className = 'slot-title';
      title.textContent = it.course;

      const grid = document.createElement('div');
      grid.className = 'grid';

      grid.appendChild(kv('Course', it.code));
      grid.appendChild(kv('Section', (it.section || els.sectionDisplay.value)));
      grid.appendChild(kv('Semester', semLabel(els.semesterDisplay.value)));
      grid.appendChild(kv('Room', it.room));

      // --- Time Range Display (Slot Mode) ---
      const config = window.globalTimeFormatConfig || { timeFormat: 'format2' };
      if (config.timeFormat === 'format1' && it.time) {
        // Get the range string from config based on slot
        const cleanTime = it.time.trim();
        const ranges = config.slotRanges || {};
        let rangeStr = it.time.replace('-', '→'); // Default fallback

        // Map cleanTime to Slot ID to Range
        if (cleanTime === '9:00 - 10:25') rangeStr = ranges.slot1 || '09:00 - 10:25';
        else if (cleanTime === '10:25 - 11:50') rangeStr = ranges.slot2 || '10:25 - 11:50';
        else if (cleanTime === '11:50 - 1:15') rangeStr = ranges.slot3 || '11:50 - 1:15';
        else if (cleanTime === '1:45 - 3:10') rangeStr = ranges.slot4 || '1:45 - 3:10';
        else if (cleanTime === '3:10 - 4:35') rangeStr = ranges.slot5 || '3:10 - 4:35';
        else if (cleanTime === '4:35 - 6:00') rangeStr = ranges.slot6 || '4:35 - 6:00';

        grid.appendChild(kv('Class Time', rangeStr));
      }
      // -------------------------------------

      const teacher = document.createElement('div');
      teacher.className = 'kv';
      const k = document.createElement('span'); k.textContent = 'Teacher:';
      const v = document.createElement('b');
      v.textContent = it.teacher;
      if (it.teacher && it.teacher !== '—') {
        v.style.color = 'var(--accent)';
        v.style.cursor = 'pointer';
        v.onclick = (e) => {
          e.stopPropagation();
          showTeacherContactPopup(it.teacher);
        };
      }
      teacher.appendChild(k); teacher.appendChild(v);

      main.appendChild(title);
      main.appendChild(grid);
      main.appendChild(teacher);

      card.appendChild(time);
      card.appendChild(main);
      els.scheduleContainer.appendChild(card);
    }


  }

  function formatTimeDisplay(timeStr) {
    if (!timeStr) return '';
    const config = window.globalTimeFormatConfig || { timeFormat: 'format2' };

    if (config.timeFormat === 'format1') {
      // Use custom labels if available
      const cleanTime = timeStr.trim();
      const labels = config.slotLabels || {};

      let label = '';
      if (cleanTime === '9:00 - 10:25') label = labels.slot1 || 'Slot 1(09:00 AM)';
      else if (cleanTime === '10:25 - 11:50') label = labels.slot2 || 'Slot 2(10:25 AM)';
      else if (cleanTime === '11:50 - 1:15') label = labels.slot3 || 'Slot 3(11:50 AM)';
      else if (cleanTime === '1:45 - 3:10') label = labels.slot4 || 'Slot 4(01:45 PM)';
      else if (cleanTime === '3:10 - 4:35') label = labels.slot5 || 'Slot 5(03:10 PM)';
      else if (cleanTime === '4:35 - 6:00') label = labels.slot6 || 'Slot 6(04:35 PM)';

      return label || timeStr.replace('-', '→');
    }

    // Default / Format 2
    return timeStr.replace('-', '→');
  }

  function kv(label, value) {
    const el = document.createElement('div');
    el.className = 'kv';
    const k = document.createElement('span'); k.textContent = label + ':';
    const v = document.createElement('b'); v.textContent = value;
    el.appendChild(k); el.appendChild(v);
    return el;
  }

  function showNetworkError() {
    els.scheduleContainer.innerHTML = '';
    els.emptyMessage.classList.add('hidden');
    els.networkMessage.classList.remove('hidden');
  }

  async function loadStudent(department, semester, section) {
    showStudentLoading();
    // Fill displays
    if (els.departmentDisplay) {
      els.departmentDisplay.value = department;
      refreshCustomDropdown(els.departmentDisplay);
    }
    fillSemesterSelect(els.semesterDisplay, semester);
    await populateSections(els.sectionDisplay, semester, section, department);
    els.detailsSemester.textContent = semLabel(semester);
    els.detailsSection.textContent = section;

    updateCRUI(department, semester, section);

    // Track current selection
    currentDepartment = department;
    currentSemester = semester;
    currentSection = section;
    localStorage.setItem('cse.lastSelectionDate', new Date().toISOString());

    // Load from cache immediately for offline/first paint
    const cached = loadRoutineFromCache(department, semester, section);
    if (cached) {
      ensureNested(routineData, department, semester, section);
      routineData[department][semester][section] = cached;
    } else {
      // ensure path exists to avoid errors before data arrives
      ensureNested(routineData, department, semester, section);
    }

    // Subscribe to live updates
    attachRoutineListener(department, semester, section);

    // Build day scroller and select default (today if present)
    const today = getTodayInfo();
    buildDays(today.dayName);

    // Render today or first day from cache; live listener will refresh
    const startDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
    renderDay(startDay);

    // Show version label if loaded
    updateVersionUI(department, semester);
    hideStudentLoading();
  }

  function fillSemesterSelect(select, selected) {
    const semesters = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select Semester';
    select.appendChild(placeholder);
    semesters.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = semLabel(s); if (s === selected) opt.selected = true;
      select.appendChild(opt);
    });
    // wire listeners once
    if (!select.__wired) {
      select.addEventListener('change', onStudentSemesterChange);
      select.__wired = true;
    }

    // Wire department change handler
    if (els.departmentDisplay && !els.departmentDisplay.__wired) {
      els.departmentDisplay.addEventListener('change', onStudentDepartmentChange);
      els.departmentDisplay.__wired = true;
    }
    refreshCustomDropdown(select);
  }

  async function populateSections(select, semester, selectedSection, department) {
    if (!select || !semester || !department) {
      if (select) {
        select.innerHTML = '<option value="">Select Department and Semester first</option>';
        select.disabled = true;
      }
      return;
    }

    // Load sections from Firebase
    const sections = await loadDepartmentSections(department, semester);
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = sections.length ? 'Select' : 'No sec.';
    select.appendChild(placeholder);
    sections.forEach(sec => {
      const opt = document.createElement('option');
      opt.value = sec;
      opt.textContent = sec;
      if (sec === selectedSection) opt.selected = true;
      select.appendChild(opt);
    });
    select.disabled = sections.length === 0;
    // attach handler if student select
    if (select.id === 'sectionDisplay' && !select.__wired) {
      select.addEventListener('change', onStudentSectionChange);
      select.__wired = true;
    }
    refreshCustomDropdown(select);
  }

  function updateCRUI(department, semester, section) {
    const node1 = document.getElementById('detailsCR1');
    const node2 = document.getElementById('detailsCR2');
    if (!node1 || !node2) return;
    const info = (((crDetails[department] || {})[semester] || {})[section]) || null;

    // Helper function to create clickable phone number
    function createClickablePhone(node, name, phone) {
      // Clear previous content and event listeners
      node.innerHTML = '';
      node.onclick = null;

      if (name && phone) {
        // Set text content normally (no special styling)
        node.textContent = `${name} (${phone})`;
        // Make entire node clickable
        node.style.cursor = 'pointer';
        node.addEventListener('click', (e) => {
          e.stopPropagation();
          // Clean phone number: remove spaces and keep only digits and +
          const phoneNumber = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
          if (phoneNumber) {
            window.location.href = `tel:${phoneNumber}`;
          }
        });
      } else if (name) {
        node.textContent = name;
      } else {
        node.textContent = 'Not assigned';
      }
    }

    if (info && (info.cr1 || info.cr2)) {
      const cr1 = info.cr1 || {};
      const cr2 = info.cr2 || {};
      createClickablePhone(node1, cr1.name, cr1.phone);
      createClickablePhone(node2, cr2.name, cr2.phone);
    } else {
      node1.textContent = 'Not assigned';
      node2.textContent = 'Not assigned';
    }
  }

  function updateVersionUI(department, semester) {
    const node = document.getElementById('detailsVersion');
    if (!node) return;
    const label = ((versionLabels[department] || {})[semester]) || '';
    node.textContent = label || '—';
  }

  // ========== TEACHER PAGE FUNCTIONALITY ==========

  // Cache keys for teacher data
  const TEACHER_CACHE_VERSION = '1';
  const TEACHER_LIST_CACHE_KEY = 'cse.teachersByDept';
  const TEACHER_ROUTINE_CACHE_KEY = 'cse.teacherRoutineCache';

  // Load all teachers from database and cache them
  function loadAllTeachers() {
    if (!db) return;
    db.ref('teachers').on('value', (snap) => {
      const teachers = snap.val() || {};
      allTeachers = teachers;
      // Cache all teachers data for offline access
      try {
        localStorage.setItem('cse.allTeachers', JSON.stringify(teachers));
        localStorage.setItem('cse.allTeachers.version', TEACHER_CACHE_VERSION);
      } catch (e) {
        console.warn('Failed to cache teachers:', e);
      }
    });

    // Try to load from cache immediately for instant display
    try {
      const cached = localStorage.getItem('cse.allTeachers');
      const version = localStorage.getItem('cse.allTeachers.version');
      if (cached && version === TEACHER_CACHE_VERSION) {
        allTeachers = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to load cached teachers:', e);
    }
  }

  // Load teachers for a specific department by scanning routines
  async function loadDepartmentTeachers(department) {
    if (!db || !department) {
      departmentTeachers.clear();
      return;
    }

    const teachersSet = new Set();
    const semesters = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

    // STRATEGY 1: Fast load from new teacher_routines node (if synced)
    try {
      const snap = await db.ref(`teacher_routines/${department}`).once('value');
      const data = snap.val() || {};
      Object.keys(data).forEach(key => {
        const rawKey = key.toLowerCase();
        teachersSet.add(rawKey);
        if (rawKey.includes('_')) {
          teachersSet.add(rawKey.replace(/_/g, '.'));
        }
      });
    } catch (e) {
      console.warn('Fast teacher load failed, relying on deep scan:', e);
    }

    // STRATEGY 2: Deep scan of student routines (The "Legacy" robust way)
    // This ensures we find teachers even if 'teacher_routines' is incomplete
    const scanPromises = semesters.map(async (sem) => {
      try {
        // Get sections for this semester
        const secSnap = await db.ref(`departmentSections/${department}/${sem}`).once('value');
        const sections = secSnap.val() || [];

        // For each section, fetch the routine
        const routinePromises = sections.map(async (sec) => {
          try {
            const rSnap = await db.ref(`routines/${department}/${sem}/${sec}`).once('value');
            const rData = rSnap.val();
            if (!rData) return;

            // Extract teachers from all days
            DAYS_ORDER.forEach(day => {
              const slots = rData[day] || [];
              slots.forEach(slot => {
                if (slot.teacher && slot.teacher.trim()) {
                  let tName = slot.teacher.trim().toLowerCase();
                  teachersSet.add(tName);
                  // Also normalize dot/underscore variations
                  if (tName.includes('.')) teachersSet.add(tName.replace(/\./g, '_'));
                  if (tName.includes('_')) teachersSet.add(tName.replace(/_/g, '.'));
                }
              });
            });
          } catch (err) { }
        });

        await Promise.all(routinePromises);
      } catch (err) { }
    });

    // Wait for deep scan to complete
    await Promise.all(scanPromises);

    departmentTeachers = teachersSet;

    // Update Cache
    try {
      localStorage.setItem(`${TEACHER_LIST_CACHE_KEY}.${department}`, JSON.stringify(Array.from(teachersSet)));
      localStorage.setItem(`${TEACHER_LIST_CACHE_KEY}.${department}.version`, TEACHER_CACHE_VERSION);
    } catch (e) {
      console.warn('Failed to cache department teachers:', e);
    }
  }

  // Teacher search autocomplete
  function showTeacherSuggestions(query) {
    if (!els.teacherSuggestions) return;
    const queryLower = query.toLowerCase().trim();
    if (!queryLower) {
      hideDropdown(els.teacherSuggestions);
      return;
    }

    const matches = [];
    const currentDept = els.teacherDepartment ? els.teacherDepartment.value : currentTeacherDept;

    // NEW STRATEGY: Filter teachers by their department field from teacher info database
    // This ensures all teachers added via admin panel appear in search, even without routines

    // Step 1: Check teachers from teacher info database (filtered by department field)
    Object.entries(allTeachers).forEach(([shortForm, data]) => {
      const shortFormLower = shortForm.toLowerCase();

      // If department is selected, filter by teacher's department field
      if (currentDept) {
        // Check if teacher belongs to selected department (from teacher info)
        const teacherDept = data.department || data.dept || '';
        if (teacherDept !== currentDept) {
          // Teacher not in selected department, skip
          return;
        }
      }

      // Check if teacher matches search query
      const fullName = (data.fullName || '').toLowerCase();
      if (fullName.includes(queryLower) || shortFormLower.includes(queryLower)) {
        matches.push({ shortForm, fullName: data.fullName || shortForm });
      }
    });

    // Step 2: Check active routine teachers who might lack a profile (Ghosts)
    // These are teachers found in routines but not in teacher info database
    if (currentDept && departmentTeachers) {
      departmentTeachers.forEach(shortLower => {
        // Check if matches query
        if (shortLower.includes(queryLower)) {
          // Check if we already added this one from Step 1
          const alreadyAdded = matches.some(m => m.shortForm.toLowerCase() === shortLower);
          if (!alreadyAdded) {
            // Convert to display format (Uppercased usually good for initials)
            const shortDisplay = shortLower.toUpperCase().replace(/_/g, '.');
            matches.push({ shortForm: shortDisplay, fullName: 'Active Teacher' });
          }
        }
      });
    }

    els.teacherSuggestions.innerHTML = '';
    if (matches.length === 0) {
      hideDropdown(els.teacherSuggestions);
      return;
    }

    matches.forEach(({ shortForm, fullName }) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `
        <div class="autocomplete-item-name">${fullName} (${shortForm})</div>
      `;
      // Use mousedown instead of click for better trackpad support
      const handleSelect = (e) => {
        e.preventDefault();
        e.stopPropagation();
        els.teacherSearch.value = shortForm;
        hideDropdown(els.teacherSuggestions);
        // Immediately blur the input to complete the search
        if (els.teacherSearch) {
          els.teacherSearch.blur();
        }
        currentTeacherShort = shortForm;
        // Save last searched teacher
        localStorage.setItem('cse.lastTeacher', shortForm);
        localStorage.setItem('cse.lastTeacherDept', els.teacherDepartment ? els.teacherDepartment.value : currentTeacherDept);
        // Update teacher details
        const teacherInfo = allTeachers[shortForm] || {};
        if (els.teacherDetailsName) {
          els.teacherDetailsName.textContent = shortForm;
        }
        // Update lottie visibility when teacher is selected
        updateTeacherLottieVisibility();
        // Load routine if department is already selected
        const dept = els.teacherDepartment ? els.teacherDepartment.value : currentTeacherDept;
        if (dept) {
          currentTeacherDept = dept;
          loadTeacherRoutine(shortForm, dept);
        }
      };
      item.addEventListener('mousedown', handleSelect);
      item.addEventListener('touchstart', handleSelect);
      els.teacherSuggestions.appendChild(item);
    });
    showDropdown(els.teacherSuggestions);
  }

  // Teacher search input handler
  if (els.teacherSearch) {
    els.teacherSearch.addEventListener('input', (e) => {
      // Force uppercase
      const val = e.target.value.toUpperCase();
      if (e.target.value !== val) {
        e.target.value = val;
      }
      showTeacherSuggestions(val);
    });

    els.teacherSearch.addEventListener('blur', () => {
      // Hide suggestions after a delay to allow clicks
      setTimeout(() => {
        if (els.teacherSuggestions) hideDropdown(els.teacherSuggestions);
      }, 200);
    });
  }

  // Teacher department change handler
  if (els.teacherDepartment) {
    els.teacherDepartment.addEventListener('change', async () => {
      const newDept = els.teacherDepartment.value;
      const previousDept = currentTeacherDept;
      currentTeacherDept = newDept;

      // Load teachers for this department (from cache first)
      await loadDepartmentTeachers(newDept);

      // Check if current teacher exists in the new department
      if (currentTeacherShort) {
        // First check teacher info database for department
        const teacherInfo = allTeachers[currentTeacherShort];
        const teacherDept = teacherInfo ? (teacherInfo.department || teacherInfo.dept || '') : '';

        // Teacher belongs to new department if:
        // 1. Their department field matches, OR
        // 2. They have routines in this department (found in departmentTeachers)
        let teacherInNewDept = (teacherDept === newDept);

        if (!teacherInNewDept && departmentTeachers.size > 0) {
          const shortLower = currentTeacherShort.toLowerCase();
          teacherInNewDept = departmentTeachers.has(shortLower);

          // Try sanitized match
          if (!teacherInNewDept) {
            teacherInNewDept = departmentTeachers.has(shortLower.replace(/[.#$[\]\/]/g, '_'));
          }
        }

        if (!teacherInNewDept) {
          // Teacher is not in this department, clear the display
          if (els.teacherSearch) {
            els.teacherSearch.value = '';
          }
          currentTeacherShort = '';
          if (els.teacherDetailsName) {
            els.teacherDetailsName.textContent = '';
          }
          // Clear the routine display
          if (els.teacherScheduleContainer) {
            els.teacherScheduleContainer.innerHTML = '';
          }
          if (els.teacherDetailsTotal) {
            els.teacherDetailsTotal.textContent = '0';
          }
          if (els.teacherDetailsBatch) {
            els.teacherDetailsBatch.textContent = '—';
          }
          updateTeacherLottieVisibility();
        } else {
          // Valid teacher in new dept, just reload data for new dept context
          loadTeacherRoutine(currentTeacherShort, newDept);
        }
      }
    });
  }


  // Initialize department value
  if (els.teacherDepartment) {
    if (!els.teacherDepartment.value) {
      els.teacherDepartment.value = 'EEE'; // Default fallback
    }
    currentTeacherDept = els.teacherDepartment.value;
    // Load teachers for initial department
    // Load teachers for initial department
    if (!currentTeacherDept) {
      currentTeacherDept = (departments[0] && departments[0].name) || 'EEE';
      els.teacherDepartment.value = currentTeacherDept;
    }

    if (currentTeacherDept) {
      loadDepartmentTeachers(currentTeacherDept);
    }
  }

  // Teacher Contact Popup handlers
  function showTeacherContactPopup(targetTeacherShort) {
    const teacherShort = targetTeacherShort || currentTeacherShort;

    if (!teacherShort || !els.teacherContactPopup) return;

    // Use exact match first, then case-insensitive match
    let teacherInfo = allTeachers[teacherShort];
    if (!teacherInfo) {
      // Try case-insensitive lookup
      const lowerShort = teacherShort.toLowerCase();
      const foundEntry = Object.entries(allTeachers).find(([k, v]) => k.toLowerCase() === lowerShort);
      if (foundEntry) {
        teacherInfo = foundEntry[1];
      } else {
        teacherInfo = {};
      }
    }

    const fullName = teacherInfo.fullName || teacherShort;
    const designation = teacherInfo.designation || '—';
    const phone = teacherInfo.contact || '—';
    const email = teacherInfo.mail || '—';
    // If opening for current teacher, show current dept. Else show teacher's default dept.
    const department = (targetTeacherShort ? teacherInfo.dept : (els.teacherDepartment ? els.teacherDepartment.value : currentTeacherDept)) || teacherInfo.dept || '—';

    // Set popup content
    if (els.teacherContactTitle) {
      els.teacherContactTitle.textContent = `${fullName} (${teacherShort})`;
    }
    if (els.teacherContactDesignation) {
      els.teacherContactDesignation.textContent = designation;
    }
    if (els.teacherContactPhone) {
      els.teacherContactPhone.textContent = phone;
      // Make phone clickable if it's not a placeholder (normal appearance, no special styling)
      if (phone && phone !== '—') {
        els.teacherContactPhone.style.cursor = 'pointer';
        els.teacherContactPhone.onclick = (e) => {
          e.stopPropagation();
          const phoneNumber = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
          if (phoneNumber) {
            window.location.href = `tel:${phoneNumber}`;
          }
        };
      } else {
        els.teacherContactPhone.style.cursor = 'default';
        els.teacherContactPhone.onclick = null;
      }
    }
    if (els.teacherContactEmail) {
      els.teacherContactEmail.textContent = email;
      // Make email clickable if it's not a placeholder (normal appearance, no special styling)
      if (email && email !== '—') {
        els.teacherContactEmail.style.cursor = 'pointer';
        els.teacherContactEmail.onclick = (e) => {
          e.stopPropagation();
          window.location.href = `mailto:${email}`;
        };
      } else {
        els.teacherContactEmail.style.cursor = 'default';
        els.teacherContactEmail.onclick = null;
      }
    }
    if (els.teacherContactDepartment) {
      els.teacherContactDepartment.textContent = department;
    }

    // Show popup with animation
    els.teacherContactPopup.classList.remove('hidden');
    setTimeout(() => {
      els.teacherContactPopup.classList.add('showing');
    }, 10);
  }

  function hideTeacherContactPopup() {
    if (!els.teacherContactPopup) return;
    els.teacherContactPopup.classList.remove('showing');
    setTimeout(() => {
      els.teacherContactPopup.classList.add('hidden');
    }, 200);
  }

  if (els.teacherContactBtn) {
    els.teacherContactBtn.addEventListener('click', () => {
      if (currentTeacherShort) {
        showTeacherContactPopup();
      }
    });
  }

  if (els.teacherContactClose) {
    els.teacherContactClose.addEventListener('click', hideTeacherContactPopup);
  }

  // Close popup when clicking outside
  if (els.teacherContactPopup) {
    els.teacherContactPopup.addEventListener('click', (e) => {
      if (e.target === els.teacherContactPopup) {
        hideTeacherContactPopup();
      }
    });
  }

  // Close popup with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.teacherContactPopup && els.teacherContactPopup.classList.contains('showing')) {
      hideTeacherContactPopup();
    }
  });

  // Load teacher routine for selected teacher and department
  async function loadTeacherRoutine(teacherShort, department, forceReload = false) {
    if (!db || !teacherShort || !department) {
      updateTeacherLottieVisibility();
      return;
    }

    teacherDataLoaded = false;
    loadedTeacherKey = '';

    // Check if data is already loaded for this teacher+department combination
    const teacherKey = `${teacherShort.toLowerCase().trim()}_${department}`;

    // Try to load from cache first for instant display
    let cacheLoaded = false;
    try {
      const cacheKey = `${TEACHER_ROUTINE_CACHE_KEY}.${teacherKey}`;
      const cached = localStorage.getItem(cacheKey);
      const version = localStorage.getItem(`${cacheKey}.version`);
      if (cached && version === TEACHER_CACHE_VERSION) {
        const cachedData = JSON.parse(cached);
        teacherRoutineData = cachedData;
        teacherDataLoaded = true;
        loadedTeacherKey = teacherKey;
        cacheLoaded = true;

        // Render from cache immediately
        const today = getTodayInfo();
        const dayToShow = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
        buildTeacherDays(dayToShow);
        renderTeacherDay(dayToShow);
        updateTeacherBatchInfo();
        updateTeacherVersionInfo();
        updateTeacherLottieVisibility();

        // Continue loading from database in background to update cache
        if (!forceReload) {
          // Return early if we don't need to force reload
          // Database will still update in background via listeners
        }
      }
    } catch (e) {
      console.warn('Failed to load cached teacher routine:', e);
    }

    if (!forceReload && teacherDataLoaded && loadedTeacherKey === teacherKey && Object.keys(teacherRoutineData).length > 0 && !cacheLoaded) {
      // Data already loaded in memory, just render it
      const today = getTodayInfo();
      const dayToShow = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
      buildTeacherDays(dayToShow);
      renderTeacherDay(dayToShow);
      updateTeacherBatchInfo();
      updateTeacherVersionInfo();
      updateTeacherLottieVisibility();
      return;
    }

    // Clear previous listener
    if (activeTeacherDbRef) {
      activeTeacherDbRef.off();
      activeTeacherDbRef = null;
      if (window.AppState) {
        window.AppState.activeTeacherDbRef = null;
      }
    }

    // Update UI
    if (els.teacherDetailsName) {
      els.teacherDetailsName.textContent = teacherShort;
    }

    // Load all routines for this department and filter by teacher
    const freshRoutineData = {};
    let freshDataLoaded = false;

    // Sync with AppState
    if (window.AppState) {
      window.AppState.teacherRoutineData = teacherRoutineData;
      window.AppState.teacherDataLoaded = teacherDataLoaded;
      window.AppState.loadedTeacherKey = loadedTeacherKey;
      window.AppState.activeTeacherDbRef = activeTeacherDbRef;
    }

    // Direct fetch from teacher_routines for real-time updates and performance
    // Use strict sanitization to match Admin's storage key
    // Admin uses: replace(/[.#$[\]\/]/g, '_')
    // We should try the sanitized key first.
    let storageKey = teacherShort.trim().replace(/[.#$[\]\/]/g, '_').toUpperCase();

    // Attach listener
    const ref = db.ref(`teacher_routines/${department}/${storageKey}`);
    activeTeacherDbRef = ref;

    // Check if we need to try legacy/lowercase key if initial load is empty
    let usingLegacyKey = false;

    // Listener for data
    ref.on('value', (snap) => {
      handleRoutineData(snap.val());

      // Fallback: If data is null, try lowercase key (legacy data might be stored lowercase)
      if (!snap.exists() && !usingLegacyKey) {
        usingLegacyKey = true;
        // Try strict lowercase
        const legacyKeyLower = storageKey.toLowerCase();
        ref.off(); // Detach current

        const legacyRef = db.ref(`teacher_routines/${department}/${legacyKeyLower}`);
        activeTeacherDbRef = legacyRef;
        legacyRef.on('value', (s) => handleRoutineData(s.val()));
      }
    });

    if (window.AppState) {
      window.AppState.activeTeacherDbRef = activeTeacherDbRef;
    }

    function handleRoutineData(data) {
      const freshRoutineData = {};

      // Handle empty data case explicitly
      if (!data) {
        // Clear everything
        teacherRoutineData = {};
        teacherDataLoaded = true;
        loadedTeacherKey = `${teacherShort.toLowerCase().trim()}_${department}`;

        // Update UI to empty state
        renderTeacherDay(currentTeacherDay || (DAYS_ORDER.includes(getTodayInfo().dayName) ? getTodayInfo().dayName : DAYS_ORDER[0]));
        updateTeacherBatchInfo();
        updateTeacherVersionInfo();
        updateTeacherLottieVisibility();

        return;
      }

      DAYS_ORDER.forEach(day => {
        const daySections = data[day];
        if (daySections) {
          Object.values(daySections).forEach(slots => {
            if (Array.isArray(slots)) {
              slots.forEach(slot => {
                const sem = slot.semester;
                const sec = slot.section;
                if (sem && sec) {
                  if (!freshRoutineData[sem]) freshRoutineData[sem] = {};
                  if (!freshRoutineData[sem][sec]) freshRoutineData[sem][sec] = {};
                  if (!freshRoutineData[sem][sec][day]) freshRoutineData[sem][sec][day] = [];

                  freshRoutineData[sem][sec][day].push(slot);
                }
              });
            }
          });
        }
      });

      // Update Global State
      teacherRoutineData = freshRoutineData;
      teacherDataLoaded = true;
      loadedTeacherKey = `${teacherShort.toLowerCase().trim()}_${department}`; // Keep original key format for internal consistency

      // Cache the routine data
      try {
        const cacheKey = `${TEACHER_ROUTINE_CACHE_KEY}.${loadedTeacherKey}`;
        localStorage.setItem(cacheKey, JSON.stringify(freshRoutineData));
        localStorage.setItem(`${cacheKey}.version`, TEACHER_CACHE_VERSION);

        // Also update last teacher cache with priority
        localStorage.setItem('cse.lastTeacher', teacherShort);
        localStorage.setItem('cse.lastTeacherDept', department);
      } catch (e) {
        console.warn('Failed to cache teacher routine:', e);
      }

      // Determine day to show
      const today = getTodayInfo();
      const dayToShow = (currentTeacherDay && DAYS_ORDER.includes(currentTeacherDay))
        ? currentTeacherDay
        : (DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0]);

      // Update UI
      if (!els.teacherDayScroller?.children.length) {
        buildTeacherDays(dayToShow);
      }
      renderTeacherDay(dayToShow);
      updateTeacherBatchInfo();
      updateTeacherVersionInfo();
      updateTeacherLottieVisibility();

      if (window.AppState) {
        window.AppState.teacherRoutineData = teacherRoutineData;
        window.AppState.teacherDataLoaded = teacherDataLoaded;
        window.AppState.loadedTeacherKey = loadedTeacherKey;
      }
    }

    // Build day scroller initially (will be updated when data loads) - only if cache wasn't loaded
    if (!cacheLoaded) {
      const today = getTodayInfo();
      buildTeacherDays(today.dayName);
    }
  }

  // Update teacher batch info
  function updateTeacherBatchInfo() {
    if (!els.teacherDetailsBatch) return;
    const semesters = new Set();
    Object.keys(teacherRoutineData).forEach(sem => {
      semesters.add(sem);
    });
    const batchLabels = Array.from(semesters).map(sem => semLabel(sem)).join(', ');
    els.teacherDetailsBatch.textContent = batchLabels || '—';
  }

  // Update teacher version info
  function updateTeacherVersionInfo() {
    if (!els.teacherDetailsVersion) return;
    // Get version from first semester that has classes
    const firstSem = Object.keys(teacherRoutineData)[0];
    const dept = els.teacherDepartment?.value || currentTeacherDept || '';
    if (firstSem && dept && versionLabels[dept] && versionLabels[dept][firstSem]) {
      els.teacherDetailsVersion.textContent = versionLabels[dept][firstSem];
    } else {
      els.teacherDetailsVersion.textContent = '—';
    }
  }

  // Build teacher days scroller
  function buildTeacherDays(activeDay) {
    if (!els.teacherDayScroller) return;
    els.teacherDayScroller.innerHTML = '';
    DAYS_ORDER.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day' + (day === activeDay ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.title = day;

      const dayLabel = document.createElement('span');
      dayLabel.className = 'day-name';
      dayLabel.textContent = day.slice(0, 3);

      const dateLabel = document.createElement('span');
      dateLabel.className = 'day-date';
      dateLabel.textContent = getDateForDay(day);

      btn.appendChild(dayLabel);
      btn.appendChild(dateLabel);
      btn.addEventListener('click', () => renderTeacherDay(day));
      enableRipple(btn);
      els.teacherDayScroller.appendChild(btn);
    });
  }

  // Render teacher day schedule
  function renderTeacherDay(day) {
    if (!els.teacherScheduleContainer) return;
    currentTeacherDay = day;

    // Update day active UI
    if (els.teacherDayScroller) {
      Array.from(els.teacherDayScroller.children).forEach(btn => {
        if (btn.classList.contains('day')) {
          btn.classList.toggle('active', btn.title === day);
        }
      });
    }

    // Update date hint
    const today = getTodayInfo();
    if (els.teacherDateToday) {
      els.teacherDateToday.textContent = day === today.dayName ? today.label : '';
    }

    // Collect all classes for this day across all semesters/sections
    const allClasses = [];
    Object.entries(teacherRoutineData).forEach(([sem, sections]) => {
      Object.entries(sections).forEach(([sec, days]) => {
        const daySlots = days[day] || [];
        daySlots.forEach(slot => {
          allClasses.push({
            ...slot,
            semester: sem,
            section: sec
          });
        });
      });
    });

    // Sort by time
    allClasses.sort((a, b) => {
      const timeA = parseTime(a.time || '0:00');
      const timeB = parseTime(b.time || '0:00');
      return timeA - timeB;
    });

    // Update state
    if (window.AppState) {
      window.AppState.currentTeacherDay = currentTeacherDay;
    }

    // Render
    els.teacherScheduleContainer.innerHTML = '';
    els.teacherEmptyMessage?.classList.add('hidden');
    els.teacherNetworkMessage?.classList.add('hidden');

    if (allClasses.length === 0) {
      els.teacherEmptyMessage?.classList.remove('hidden');
      if (els.teacherDetailsTotal) els.teacherDetailsTotal.textContent = '0';
      // Hide lottie when data is shown (even if empty)
      updateTeacherLottieVisibility();
      return;
    }

    if (els.teacherDetailsTotal) {
      els.teacherDetailsTotal.textContent = String(allClasses.length);
    }

    allClasses.forEach(slot => {
      const card = document.createElement('div');
      card.className = 'slot-card';

      const time = document.createElement('div');
      time.className = 'slot-time';
      time.textContent = formatTimeDisplay(slot.time || '');

      const main = document.createElement('div');
      main.className = 'slot-main';

      const title = document.createElement('div');
      title.className = 'slot-title';
      title.textContent = slot.course || '';

      const grid = document.createElement('div');
      grid.className = 'grid';

      grid.appendChild(kv('Course', slot.code || ''));
      grid.appendChild(kv('Section', slot.section || ''));
      grid.appendChild(kv('Semester', semLabel(slot.semester || '')));
      grid.appendChild(kv('Room', slot.room || ''));

      main.appendChild(title);
      main.appendChild(grid);

      card.appendChild(time);
      card.appendChild(main);
      els.teacherScheduleContainer.appendChild(card);
    });

    // Hide lottie when data is shown
    updateTeacherLottieVisibility();
  }

  // Load last searched teacher when teacher tab is clicked
  async function loadLastTeacher() {
    const lastTeacher = localStorage.getItem('cse.lastTeacher');
    const lastDept = localStorage.getItem('cse.lastTeacherDept') || 'EEE';

    // Set department dropdown value first
    if (lastDept && els.teacherDepartment) {
      els.teacherDepartment.value = lastDept;
      currentTeacherDept = lastDept;
      // Refresh custom dropdown to show selected value
      refreshCustomDropdown(els.teacherDepartment);
    }

    // Load teachers for the department (from cache first, then database)
    if (lastDept) {
      await loadDepartmentTeachers(lastDept);
    } else if (els.teacherDepartment && els.teacherDepartment.value) {
      await loadDepartmentTeachers(els.teacherDepartment.value);
    }

    if (lastTeacher && els.teacherSearch && els.teacherDepartment) {
      els.teacherSearch.value = lastTeacher;
      currentTeacherShort = lastTeacher;
      currentTeacherDept = lastDept;
      if (els.teacherDetailsName) {
        els.teacherDetailsName.textContent = lastTeacher;
      }
      // Update lottie visibility when last teacher is loaded
      updateTeacherLottieVisibility();
      // Load version labels for all semesters for this department
      const semesters = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
      semesters.forEach(sem => {
        if (db) {
          db.ref(`versions/${lastDept}/${sem}`).once('value', (snap) => {
            if (!versionLabels[lastDept]) versionLabels[lastDept] = {};
            versionLabels[lastDept][sem] = snap.val() || '';
          });
        }
      });
      // Load routine - this will use cache first for instant display
      loadTeacherRoutine(lastTeacher, lastDept);
    } else {
      // No last teacher, show lottie
      updateTeacherLottieVisibility();
    }
  }

  async function initEntry() {
    // Initialize Auth
    initAuth();

    // Try to init landing Lottie immediately if library is ready
    initLottie();

    // Also check periodically if Lottie library loads asynchronously
    let lottieCheckCount = 0;
    const lottieCheckInterval = setInterval(() => {
      lottieCheckCount++;
      if (window.lottie && els.lottie && !els.lottie.querySelector('svg')) {
        initLottie();
        clearInterval(lottieCheckInterval);
      } else if (lottieCheckCount >= 20) {
        clearInterval(lottieCheckInterval);
      }
    }, 50);

    // Load departments first
    await loadDepartments();

    // Set up real-time listener for department availability changes
    if (db) {
      db.ref('departmentAvailability').on('value', (snap) => {
        const data = snap.val();
        if (data) {
          departmentAvailability = data;
          updateAllDepartmentDropdowns();
        }
      });

      // Listen for Time Format Settings
      db.ref('settings/timeFormat').on('value', (snap) => {
        currentTimeFormat = snap.val() || 'format2';
        // Re-render current views if they are active
        if (els.screens.student.classList.contains('active')) {
          const day = document.querySelector('#dayScroller .day.active')?.title;
          if (day) renderDay(day);
        }
        if (els.screens.teacher.classList.contains('active')) {
          const day = document.querySelector('#teacherDayScroller .day.active')?.title;
          if (day) renderTeacherDay(day);
        }
        // Refresh Booking Time Slot Dropdown if visible
        if (els.screens.booking && els.screens.booking.classList.contains('active')) {
          if (els.bookingQuerySearchBy && els.bookingQuerySearchBy.value !== 'room') {
            populateBookingTimeSlots();
          }
        }
        // Refresh Room Query Time Slot Dropdown if visible
        if (els.screens.query && els.screens.query.classList.contains('active')) {
          if (els.roomQuerySearchBy && els.roomQuerySearchBy.value === 'timeslot') {
            populateTimeSlots();
          }
        }
      });
    }

    const defaultQueryDept = (departments[0] && departments[0].name) || 'EEE';
    ensureRoomQueryData(defaultQueryDept);

    // Set up global click handler for closing dropdowns
    if (!document.__dropdownCloseHandler) {
      document.__dropdownCloseHandler = true;
      document.addEventListener('click', (e) => {
        document.querySelectorAll('.custom-dropdown-menu.showing').forEach(openMenu => {
          const openWrapper = openMenu.closest('.custom-dropdown');
          if (openWrapper && !openWrapper.contains(e.target)) {
            hideDropdown(openMenu);
            openWrapper.querySelector('.custom-dropdown-button')?.classList.remove('open');
          }
        });
      }, true);
    }

    // Convert student page selects to custom animated dropdowns (if student screen is shown)
    // This will be handled by setScreen when student screen is displayed

    // Load teachers
    loadAllTeachers();

    // Preload and display teacher data immediately on page load
    // This ensures teacher page is ready when user clicks the tab
    const lastTeacher = localStorage.getItem('cse.lastTeacher');
    const lastDept = localStorage.getItem('cse.lastTeacherDept') || 'EEE';
    if (lastTeacher && lastDept) {
      // Load teacher data immediately (uses cache for instant display)
      loadLastTeacher().catch(err => {
        console.warn('Failed to preload teacher data:', err);
      });
    } else {
      // No last teacher, just preload department teachers for first department
      const defaultDept = (departments[0] && departments[0].name) || 'EEE';

      // Explicitly clear teacher UI state to prevent stale data
      // Use setTimeout to override any browser autofill that happens after load
      setTimeout(() => {
        if (els.teacherSearch) els.teacherSearch.value = '';
        if (els.teacherDetailsName) els.teacherDetailsName.textContent = '';
        if (els.teacherScheduleContainer) els.teacherScheduleContainer.innerHTML = '';
        if (els.teacherDetailsBatch) els.teacherDetailsBatch.textContent = '';
        if (els.teacherDetailsTotal) els.teacherDetailsTotal.textContent = '';
        // Reset internal state
        currentTeacherShort = '';
        currentTeacherDept = defaultDept;

        // Reset Department Dropdown
        if (els.teacherDepartment) {
          els.teacherDepartment.value = defaultDept;
          // If custom dropdown exists, update it visually
          refreshCustomDropdown(els.teacherDepartment);
        }

        // Hide Lottie or update its visibility
        updateTeacherLottieVisibility();
      }, 50);

      loadDepartmentTeachers(defaultDept).catch(err => {
        console.warn('Failed to preload department teachers:', err);
      });
    }

    // Initialize sections when department and semester are selected
    if (els.department && els.semester) {
      const dept = els.department.value || (departments[0] ? departments[0].name : 'EEE');
      const sem = els.semester.value.trim();
      if (dept && sem) {
        await populateSections(els.section, sem, '', dept);
      }
    }

    const persisted = getPersistedSelection();
    // Simplified check: If we have valid persisted data, just use it.
    if (persisted) {
      // Skip landing, go straight to student
      if (els.landingOverlay) {
        els.landingOverlay.classList.add('hidden');
        document.body.classList.remove('landing-lock');
      }
      setScreen('student');
      await loadStudent(persisted.department, persisted.semester, persisted.section);
    } else {
      // Show landing with overlay
      if (els.landingOverlay) {
        els.landingOverlay.classList.remove('hidden');
        document.body.classList.add('landing-lock');
      }

      // Hide default student loader if going to landing
      if (els.studentLoadingOverlay) {
        els.studentLoadingOverlay.classList.add('hidden');
      }
      document.body.classList.remove('student-loading-lock');

      setScreen('landing');

      // Force convert dropdowns after landing screen is shown (multiple attempts to ensure it works)
      const convertLandingDropdowns = () => {
        if (els.department && !els.department.dataset.converted) {
          convertSelectToCustomDropdown(els.department);
        }
        if (els.semester && !els.semester.dataset.converted) {
          convertSelectToCustomDropdown(els.semester);
        }
        if (els.section && !els.section.dataset.converted) {
          convertSelectToCustomDropdown(els.section);
        }
      };

      // Try multiple times to ensure conversion happens
      setTimeout(convertLandingDropdowns, 100);
      setTimeout(convertLandingDropdowns, 300);
      setTimeout(convertLandingDropdowns, 500);
    }

    // Lock body when landing is visible
    if (els.landingOverlay && !els.landingOverlay.classList.contains('hidden')) {
      document.body.classList.add('landing-lock');
    }
  }

  // ========== QUERY PAGE FUNCTIONALITY ==========

  // Tab switching for Room Query / CR Info
  if (els.roomQueryTab && els.crInfoTab) {
    els.roomQueryTab.addEventListener('click', () => {
      els.roomQueryTab.classList.add('active');
      els.crInfoTab.classList.remove('active');
      els.roomQueryInterface.classList.remove('hidden');
      els.crInfoInterface.classList.add('hidden');
      // Check dropdowns and show/hide lottie
      checkRoomQueryDropdowns();
    });

    els.crInfoTab.addEventListener('click', () => {
      els.crInfoTab.classList.add('active');
      els.roomQueryTab.classList.remove('active');
      els.crInfoInterface.classList.remove('hidden');
      els.roomQueryInterface.classList.add('hidden');
      // Check dropdowns and show/hide lottie
      checkCRInfoDropdowns();
    });
  }

  // Booking / History Tab Switching
  if (els.bookingTab && els.historyTab) {
    els.bookingTab.addEventListener('click', () => {
      els.bookingTab.classList.add('active');
      els.historyTab.classList.remove('active');
      els.bookingInterface.classList.remove('hidden');
      els.historyInterface.classList.add('hidden');
    });

    els.historyTab.addEventListener('click', () => {
      els.historyTab.classList.add('active');
      els.bookingTab.classList.remove('active');
      els.historyInterface.classList.remove('hidden');
      els.bookingInterface.classList.add('hidden');

      const user = window.firebase?.auth()?.currentUser;
      if (user && typeof loadUserBookingHistory === 'function') {
        loadUserBookingHistory(user.uid);
      }
    });
  }

  // Room Query functionality
  let roomQueryCurrentDay = null;
  let roomQuerySelectedTimeSlot = null;
  const roomQueryDataCache = {
    routinesByDept: {},
    roomsByDept: {},
    listeners: {}
  };

  // Format time slot to AM/PM format
  function formatTimeSlot(timeSlot) {
    if (!timeSlot) return '';
    return timeSlot.split(' - ').map(time => {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const m = minutes || '00';
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      return `${displayHour}:${m} ${period}`;
    }).join(' - ');
  }

  // Build day scroller for room query
  function buildRoomQueryDays(activeDay) {
    if (!els.roomQueryDayScroller) return;
    els.roomQueryDayScroller.innerHTML = '';
    DAYS_ORDER.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day' + (day === activeDay ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.title = day;

      const dayLabel = document.createElement('span');
      dayLabel.className = 'day-name';
      dayLabel.textContent = day.slice(0, 3);

      const dateLabel = document.createElement('span');
      dateLabel.className = 'day-date';
      dateLabel.textContent = getDateForDay(day);

      btn.appendChild(dayLabel);
      btn.appendChild(dateLabel);
      btn.addEventListener('click', () => {
        roomQueryCurrentDay = day;
        // Update active state
        Array.from(els.roomQueryDayScroller.children).forEach(b => {
          if (b.classList.contains('day')) {
            b.classList.toggle('active', b.title === day);
          }
        });
        // Update date hint
        const today = getTodayInfo();
        if (els.roomQueryDateToday) {
          els.roomQueryDateToday.textContent = day === today.dayName ? today.label : '';
        }
        // Re-run query if we have selections
        const searchBy = els.roomQuerySearchBy?.value;
        const value = els.roomQueryThirdSelect?.value;
        const department = els.roomQueryDepartment?.value || 'EEE';
        if (searchBy === 'room' && value) {
          queryRoomByNumber(value, department, day);
        } else if (searchBy === 'timeslot' && value) {
          queryRoomByTimeSlot(value, department, day);
        }
      });
      enableRipple(btn);
      els.roomQueryDayScroller.appendChild(btn);
    });

    // Set initial day to today
    const today = getTodayInfo();
    roomQueryCurrentDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
    if (els.roomQueryDateToday) {
      els.roomQueryDateToday.textContent = roomQueryCurrentDay === today.dayName ? today.label : '';
    }
  }

  function extractRoomsFromRoutineTree(routineTree) {
    const rooms = new Set();
    Object.values(routineTree || {}).forEach(sem => {
      Object.values(sem || {}).forEach(section => {
        Object.values(section || {}).forEach(daySlots => {
          (daySlots || []).forEach(slot => {
            if (slot && slot.room) rooms.add(slot.room);
          });
        });
      });
    });
    return Array.from(rooms).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  function ensureRoomQueryData(department) {
    if (!db || !department) return;
    if (roomQueryDataCache.listeners[department]) return;

    const ref = db.ref(`routines/${department}`);
    roomQueryDataCache.listeners[department] = ref;
    ref.on('value', (snap) => {
      const data = snap.val() || {};
      roomQueryDataCache.routinesByDept[department] = data;
      roomQueryDataCache.roomsByDept[department] = extractRoomsFromRoutineTree(data);

      if (els.roomQuerySearchBy?.value === 'room') {
        const currentDept = els.roomQueryDepartment?.value || 'EEE';
        if (currentDept === department) {
          refreshRoomNumberDropdown(department);
        }
      }
    }, (error) => {
      console.error('Failed to watch room query data:', error);
    });
  }

  function refreshRoomNumberDropdown(department) {
    if (!els.roomQueryThirdSelect) return;
    const select = els.roomQueryThirdSelect;
    const previousValue = select.value;
    const rooms = roomQueryDataCache.roomsByDept[department] || [];

    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = rooms.length ? 'Select Room' : 'Loading rooms...';
    select.appendChild(placeholder);

    rooms.forEach(room => {
      const opt = document.createElement('option');
      opt.value = room;
      opt.textContent = room;
      select.appendChild(opt);
    });

    if (rooms.includes(previousValue)) {
      select.value = previousValue;
    } else {
      select.value = '';
    }

    select.disabled = rooms.length === 0;
    refreshCustomDropdown(select);
  }

  function showRoomQueryLoading(message = 'Loading latest room data...') {
    if (els.roomQueryResults) {
      els.roomQueryResults.innerHTML = `<div class="empty">${message}</div>`;
    }
    // Hide lottie when showing loading message
    hideRoomQueryLottie();
  }

  function populateRoomNumbers(department) {
    if (!els.roomQueryThirdSelect) return;
    const dept = department || 'EEE';
    ensureRoomQueryData(dept);
    refreshRoomNumberDropdown(dept);
  }

  function populateTimeSlots() {
    if (!els.roomQueryThirdSelect) return;
    const timeSlots = [
      '9:00 - 10:25',
      '10:25 - 11:50',
      '11:50 - 1:15',
      '1:45 - 3:10',
      '3:10 - 4:35',
      '4:35 - 6:00'
    ];

    els.roomQueryThirdSelect.innerHTML = '<option value="">Select Time Slot</option>';
    timeSlots.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot;
      opt.textContent = formatTimeDisplay(slot);
      els.roomQueryThirdSelect.appendChild(opt);
    });
    els.roomQueryThirdSelect.disabled = false;
    refreshCustomDropdown(els.roomQueryThirdSelect);
  }

  function queryRoomByNumber(roomNumber, department, selectedDay) {
    if (!roomNumber || !department) return;
    const routines = roomQueryDataCache.routinesByDept[department];
    if (!routines) {
      showRoomQueryLoading();
      ensureRoomQueryData(department);
      return;
    }

    // Use selected day or current day, default to first day
    const dayToUse = selectedDay || roomQueryCurrentDay || DAYS_ORDER[0];

    const allTimeSlots = [
      '9:00 - 10:25',
      '10:25 - 11:50',
      '11:50 - 1:15',
      '1:45 - 3:10',
      '3:10 - 4:35',
      '4:35 - 6:00'
    ];
    const occupiedSlots = new Set();

    // Only check the selected day for free slots
    Object.values(routines).forEach(sem => {
      Object.values(sem || {}).forEach(section => {
        const slots = (section?.[dayToUse]) || [];
        slots.forEach(slot => {
          if (slot && slot.room === roomNumber && slot.time) {
            occupiedSlots.add(slot.time);
          }
        });
      });
    });

    const freeSlots = allTimeSlots.filter(slot => !occupiedSlots.has(slot));
    renderRoomQueryResults(freeSlots.map(slot => ({ room: roomNumber, timeSlot: slot })), 'room', roomNumber);
  }

  function queryRoomByTimeSlot(timeSlot, department, selectedDay) {
    if (!timeSlot || !department) return;
    const routines = roomQueryDataCache.routinesByDept[department];
    if (!routines) {
      showRoomQueryLoading();
      ensureRoomQueryData(department);
      return;
    }
    const dayToUse = selectedDay || roomQueryCurrentDay || DAYS_ORDER[0];
    const allRooms = new Set(roomQueryDataCache.roomsByDept[department] || []);
    const occupiedRooms = new Set();

    Object.values(routines).forEach(sem => {
      Object.values(sem || {}).forEach(section => {
        const slots = (section?.[dayToUse]) || [];
        slots.forEach(slot => {
          if (!slot || !slot.room) return;
          allRooms.add(slot.room);
          if (slot.time === timeSlot) {
            occupiedRooms.add(slot.room);
          }
        });
      });
    });

    const freeRooms = Array.from(allRooms).filter(room => !occupiedRooms.has(room));
    renderRoomQueryResults(freeRooms.map(room => ({ room, timeSlot })), 'timeslot', timeSlot, dayToUse);
  }

  function renderRoomQueryResults(data, type, queryValue, selectedDay) {
    if (!els.roomQueryResults) return;
    els.roomQueryResults.innerHTML = '';

    // Hide lottie when showing results
    hideRoomQueryLottie();

    if (data.length === 0) {
      if (type === 'room') {
        els.roomQueryResults.innerHTML = '<div class="empty">No free time slots available for this room.</div>';
      } else {
        els.roomQueryResults.innerHTML = '<div class="empty">No empty rooms available for this time slot on the selected day.</div>';
      }
      return;
    }

    // Common container style
    const container = document.createElement('div');
    container.className = 'room-query-free-slots';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.marginTop = '16px';

    data.forEach(item => {
      const block = document.createElement('div');
      block.className = 'room-query-free-slot-block class-card clickable-slot'; // Added clickable classes
      block.style.cssText = 'padding: 14px; background: rgba(158, 140, 255, 0.1); border: 1px solid var(--outline); border-radius: 12px; width: 100%; cursor: pointer; position: relative;';

      // Add ripple effect
      enableRipple(block);

      const title = document.createElement('div');
      title.className = 'room-query-free-slot-title';
      title.style.cssText = 'color: var(--text); margin-bottom: 6px; font-weight: 600;';
      title.textContent = `Room: ${item.room}`;

      const subtitle = document.createElement('div');
      subtitle.className = 'room-query-free-slot-time';
      subtitle.style.cssText = 'color: var(--muted);';
      subtitle.textContent = formatTimeDisplay(item.timeSlot);

      block.appendChild(title);
      block.appendChild(subtitle);

      // Click handler for booking
      block.addEventListener('click', (e) => {
        if (window.handleSlotClick) {
          window.handleSlotClick(item.room, item.timeSlot);
        }
      });

      container.appendChild(block);
    });

    els.roomQueryResults.appendChild(container);
  }

  // Helper function to check if all room query dropdowns are selected
  function checkRoomQueryDropdowns() {
    const dept = els.roomQueryDepartment?.value || '';
    const searchBy = els.roomQuerySearchBy?.value || '';
    const thirdSelect = els.roomQueryThirdSelect?.value || '';

    // Show lottie if not all dropdowns are selected
    if (!dept || !searchBy || !thirdSelect) {
      showRoomQueryLottie();
    } else {
      hideRoomQueryLottie();
    }
  }

  // Helper function to check if all CR info dropdowns are selected
  function checkCRInfoDropdowns() {
    const dept = els.crInfoDepartment?.value || '';
    const sem = els.crInfoSemester?.value || '';
    const sec = els.crInfoSection?.value || '';

    // Show lottie if not all dropdowns are selected
    if (!dept || !sem || !sec) {
      showCRInfoLottie();
    } else {
      hideCRInfoLottie();
    }
  }

  // Room Query event handlers
  if (els.roomQuerySearchBy) {
    els.roomQuerySearchBy.addEventListener('change', () => {
      const searchBy = els.roomQuerySearchBy.value;

      // Clear previous selections and results when changing search type
      if (els.roomQueryThirdSelect) {
        els.roomQueryThirdSelect.value = '';
        els.roomQueryThirdSelect.innerHTML = '<option value="">Select Option</option>';
      }
      if (els.roomQueryResults) {
        els.roomQueryResults.innerHTML = '';
      }
      // Hide and clear day selector when search type changes (will show after selecting value)
      if (els.roomQueryDaySelectorWrapper) els.roomQueryDaySelectorWrapper.classList.add('hidden');
      if (els.roomQueryDayScroller) els.roomQueryDayScroller.innerHTML = '';
      if (els.roomQueryDateToday) els.roomQueryDateToday.textContent = '';
      roomQuerySelectedTimeSlot = null;
      roomQueryCurrentDay = null;

      // Check dropdowns and show/hide lottie
      checkRoomQueryDropdowns();

      if (searchBy === 'room') {
        els.roomQueryThirdLabel.textContent = 'Room Number';
        populateRoomNumbers(els.roomQueryDepartment?.value || 'EEE');
      } else if (searchBy === 'timeslot') {
        els.roomQueryThirdLabel.textContent = 'Time Slot';
        populateTimeSlots();
      } else {
        els.roomQueryThirdSelect.disabled = true;
        els.roomQueryThirdSelect.innerHTML = '<option value="">Select type</option>';
        els.roomQueryResults.innerHTML = '';
      }
    });
  }

  if (els.roomQueryThirdSelect) {
    els.roomQueryThirdSelect.addEventListener('change', () => {
      const searchBy = els.roomQuerySearchBy?.value;
      const value = els.roomQueryThirdSelect.value;
      const department = els.roomQueryDepartment?.value || 'EEE';

      // Check dropdowns and show/hide lottie
      checkRoomQueryDropdowns();

      if (searchBy === 'room' && value) {
        // Show day selector for room number search
        if (els.roomQueryDaySelectorWrapper) {
          els.roomQueryDaySelectorWrapper.classList.remove('hidden');
          if (els.roomQueryDayTitle) {
            els.roomQueryDayTitle.textContent = `Free slots for Room ${value}`;
          }
        }
        // Initialize day scroller if not already built
        if (els.roomQueryDayScroller && els.roomQueryDayScroller.children.length === 0) {
          if (!roomQueryCurrentDay) {
            const today = getTodayInfo();
            roomQueryCurrentDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
          }
          buildRoomQueryDays(roomQueryCurrentDay);
        }
        queryRoomByNumber(value, department, roomQueryCurrentDay);
      } else if (searchBy === 'timeslot' && value) {
        roomQuerySelectedTimeSlot = value;
        // Show day selector for time slot search (empty rooms)
        if (els.roomQueryDaySelectorWrapper) {
          els.roomQueryDaySelectorWrapper.classList.remove('hidden');
          if (els.roomQueryDayTitle) {
            els.roomQueryDayTitle.textContent = `Free slots for this time (${formatTimeDisplay(value)})`;
          }
        }
        // Initialize day scroller if not already built
        if (els.roomQueryDayScroller && els.roomQueryDayScroller.children.length === 0) {
          if (!roomQueryCurrentDay) {
            const today = getTodayInfo();
            roomQueryCurrentDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
          }
          buildRoomQueryDays(roomQueryCurrentDay);
        }
        const selectedDay = roomQueryCurrentDay || DAYS_ORDER[0];
        queryRoomByTimeSlot(value, department, selectedDay).catch(() => { });
      } else {
        // Hide day selector when no value selected
        if (els.roomQueryDaySelectorWrapper) els.roomQueryDaySelectorWrapper.classList.add('hidden');
        roomQuerySelectedTimeSlot = null;
      }
    });
  }

  if (els.roomQueryDepartment) {
    els.roomQueryDepartment.addEventListener('change', () => {
      const searchBy = els.roomQuerySearchBy?.value;
      ensureRoomQueryData(els.roomQueryDepartment.value || 'EEE');
      if (searchBy === 'room') {
        populateRoomNumbers(els.roomQueryDepartment.value);
      }
      els.roomQueryResults.innerHTML = '';
      // Check dropdowns and show/hide lottie
      checkRoomQueryDropdowns();
    });
  }

  // CR Info functionality
  function loadCRInfo(department, semester, section) {
    if (!db || !department || !semester || !section) return;

    // Load CR data
    db.ref(`cr/${department}/${semester}/${section}`).once('value', (snap) => {
      const crData = snap.val() || {};

      // Load section info (batch, coordinator, total students)
      db.ref(`sectionInfo/${department}/${semester}/${section}`).once('value', (sectionSnap) => {
        const sectionInfo = sectionSnap.val() || {};

        renderCRInfo({
          department,
          semester,
          section,
          crData,
          sectionInfo
        });
      });
    });
  }

  function renderCRInfo(data) {
    if (!els.crInfoResults) return;
    els.crInfoResults.innerHTML = '';

    // Hide lottie when showing results
    hideCRInfoLottie();

    const { department, semester, section, crData, sectionInfo } = data;

    // Block 1: Basic Info
    const block1 = document.createElement('div');
    block1.className = 'cr-info-block';
    block1.innerHTML = `
      <div class="cr-info-block-title">Basic Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Department</span>
        <span class="cr-info-value">${department || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Batch</span>
        <span class="cr-info-value">${sectionInfo.batch || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Semester</span>
        <span class="cr-info-value">${semLabel(semester)}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Section</span>
        <span class="cr-info-value">${section}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Total Students</span>
        <span class="cr-info-value">${sectionInfo.totalStudents || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block1);

    // Block 2: Coordinator Info
    const block2 = document.createElement('div');
    block2.className = 'cr-info-block';
    block2.innerHTML = `
      <div class="cr-info-block-title">Coordinator Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Name</span>
        <span class="cr-info-value">${sectionInfo.coordinatorName || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Phone</span>
        <span class="cr-info-value">${sectionInfo.coordinatorPhone || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Email</span>
        <span class="cr-info-value">${sectionInfo.coordinatorEmail || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block2);

    // Block 3: First CR Info
    const block3 = document.createElement('div');
    block3.className = 'cr-info-block';
    const cr1 = crData.cr1 || {};
    block3.innerHTML = `
      <div class="cr-info-block-title">First CR Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Name</span>
        <span class="cr-info-value">${cr1.name || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">ID</span>
        <span class="cr-info-value">${cr1.id || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Phone Number</span>
        <span class="cr-info-value">${cr1.phone || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block3);

    // Block 4: Second CR Info
    const block4 = document.createElement('div');
    block4.className = 'cr-info-block';
    const cr2 = crData.cr2 || {};
    block4.innerHTML = `
      <div class="cr-info-block-title">Second CR Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Name</span>
        <span class="cr-info-value">${cr2.name || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">ID</span>
        <span class="cr-info-value">${cr2.id || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Phone Number</span>
        <span class="cr-info-value">${cr2.phone || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block4);
  }

  // CR Info event handlers
  if (els.crInfoDepartment) {
    els.crInfoDepartment.addEventListener('change', async () => {
      const dept = els.crInfoDepartment.value;
      const sem = els.crInfoSemester?.value;
      if (dept && sem) {
        await populateSections(els.crInfoSection, sem, '', dept);
      }
      // Clear results when department changes
      els.crInfoResults.innerHTML = '';
      // Check dropdowns and show/hide lottie
      checkCRInfoDropdowns();
    });
  }

  if (els.crInfoSemester) {
    els.crInfoSemester.addEventListener('change', async () => {
      const dept = els.crInfoDepartment?.value;
      const sem = els.crInfoSemester.value;
      if (dept && sem) {
        await populateSections(els.crInfoSection, sem, '', dept);
      } else {
        els.crInfoSection.disabled = true;
        els.crInfoSection.innerHTML = '<option value="">Select Department and Semester first</option>';
      }
      // Clear results when semester changes
      els.crInfoResults.innerHTML = '';
      // Check dropdowns and show/hide lottie
      checkCRInfoDropdowns();
    });
  }

  if (els.crInfoSection) {
    els.crInfoSection.addEventListener('change', () => {
      const dept = els.crInfoDepartment?.value;
      const sem = els.crInfoSemester?.value;
      const sec = els.crInfoSection.value;
      if (dept && sem && sec) {
        loadCRInfo(dept, sem, sec);
      } else {
        els.crInfoResults.innerHTML = '';
      }
      // Check dropdowns and show/hide lottie
      checkCRInfoDropdowns();
    });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', initEntry);
  // --- Auth & Booking System ---

  let currentUser = null;
  let userProfile = {};

  async function initAuth() {
    console.log("Initializing Auth...");
    const authEls = {
      loginForm: document.getElementById('loginForm'),
      signupForm: document.getElementById('signupForm'),
      loginContainer: document.getElementById('loginContainer'),
      signupContainer: document.getElementById('signupContainer'),
      showSignup: document.getElementById('showSignup'),
      showLogin: document.getElementById('showLogin'),
      showForgotPassword: document.getElementById('showForgotPassword'),
      backToLoginFromForgot: document.getElementById('backToLoginFromForgot'),
      forgotPasswordForm: document.getElementById('forgotPasswordForm'),
      forgotPasswordContainer: document.getElementById('forgotPasswordContainer'),
      signupTypeStudent: document.getElementById('signupTypeStudent'),
      signupTypeTeacher: document.getElementById('signupTypeTeacher'),
      signupFields: document.getElementById('signupFields'),
      authView: document.getElementById('authView'),
      menuView: document.getElementById('menuView'),
      profileIcon: document.getElementById('profileIcon'),
      logoutBtn: document.getElementById('logoutBtn'),
      userName: document.getElementById('userName'),
      userRole: document.getElementById('userRole'),
      userInitials: document.getElementById('userInitials'),
      cardUserId: document.getElementById('cardUserId'),
      bookingMenuOption: document.getElementById('bookingMenuOption'),
      bookingModal: document.getElementById('bookingModal'),
      bookingForm: document.getElementById('bookingForm'),
      bookingModalClose: document.getElementById('bookingModalClose'),
      profileModal: document.getElementById('profileModal'),
      profileForm: document.getElementById('profileForm'),
      profileModalClose: document.getElementById('profileModalClose'),
      privacyOption: document.getElementById('privacyOption'),
      privacyModal: document.getElementById('privacyModal'),
      privacyModalClose: document.getElementById('privacyModalClose'),
      bookingBackBtn: document.getElementById('bookingBackBtn')
    };

    // Booking Back Button
    if (authEls.bookingBackBtn) {
      authEls.bookingBackBtn.onclick = () => {
        setScreen('more');
      };
    }

    // Privacy & Policy Navigation (for logged-in users)
    const privacyOption = document.getElementById('privacyOption');
    if (privacyOption) {
      privacyOption.onclick = () => {
        setScreen('privacy');
      };
    }

    // Privacy Back Button
    const privacyBackBtn = document.getElementById('privacyBackBtn');
    if (privacyBackBtn) {
      privacyBackBtn.onclick = () => {
        setScreen('more');
      };
    }

    // Support Navigation (for logged-in users)
    const supportOption = document.getElementById('supportOption');
    if (supportOption) {
      supportOption.onclick = () => {
        setScreen('support');
      };
    }

    // Support Back Button
    const supportBackBtn = document.getElementById('supportBackBtn');
    if (supportBackBtn) {
      supportBackBtn.onclick = () => {
        setScreen('more');
      };
    }

    // Information/About Navigation (for logged-in users)
    const informationOption = document.getElementById('informationOption');
    if (informationOption) {
      informationOption.onclick = () => {
        setScreen('information');
      };
    }

    // Information Back Button
    const informationBackBtn = document.getElementById('informationBackBtn');
    if (informationBackBtn) {
      informationBackBtn.onclick = () => {
        setScreen('more');
      };
    }

    // Public Access Buttons (for logged-out users)
    const publicPrivacyBtn = document.getElementById('publicPrivacyBtn');
    if (publicPrivacyBtn) {
      publicPrivacyBtn.onclick = () => {
        setScreen('privacy');
      };
    }

    const publicSupportBtn = document.getElementById('publicSupportBtn');
    if (publicSupportBtn) {
      publicSupportBtn.onclick = () => {
        setScreen('support');
      };
    }

    // Toggle Login/Signup
    if (authEls.showSignup) authEls.showSignup.onclick = () => {
      authEls.loginContainer.classList.add('hidden');
      authEls.signupContainer.classList.remove('hidden');
      if (authEls.forgotPasswordContainer) authEls.forgotPasswordContainer.classList.add('hidden');
    };
    if (authEls.showLogin) authEls.showLogin.onclick = () => {
      authEls.signupContainer.classList.add('hidden');
      authEls.loginContainer.classList.remove('hidden');
      if (authEls.forgotPasswordContainer) authEls.forgotPasswordContainer.classList.add('hidden');
    };

    // Forgot Password Toggles
    if (authEls.showForgotPassword) authEls.showForgotPassword.onclick = () => {
      authEls.loginContainer.classList.add('hidden');
      authEls.signupContainer.classList.add('hidden');
      authEls.forgotPasswordContainer.classList.remove('hidden');
    }

    if (authEls.backToLoginFromForgot) authEls.backToLoginFromForgot.onclick = () => {
      authEls.forgotPasswordContainer.classList.add('hidden');
      authEls.loginContainer.classList.remove('hidden');
    }

    // Forgot Password Submit
    // Forgot Password Submit
    // Forgot Password Submit
    if (authEls.forgotPasswordForm) authEls.forgotPasswordForm.onsubmit = async (e) => {
      e.preventDefault();
      const rawEmail = document.getElementById('forgotPasswordEmail').value;
      const email = rawEmail ? rawEmail.trim() : '';

      const btn = authEls.forgotPasswordForm.querySelector('button[type="submit"]');
      const errEl = document.getElementById('forgotPasswordError');
      const succEl = document.getElementById('forgotPasswordSuccess');

      errEl.classList.remove('show');
      succEl.classList.remove('show');

      if (!email) {
        errEl.textContent = "Please enter your email.";
        errEl.classList.add('show');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Verifying Account...';

      try {
        let userFound = false;

        // LAYER 1: Auth Check (Fast & Reliable if Protection is OFF)
        try {
          const methods = await firebase.auth().fetchSignInMethodsForEmail(email);
          if (methods && methods.length > 0) userFound = true;
        } catch (e) {
          // Often blocked by policy or network. Ignore specific error.
          console.warn("Auth check ignored", e);
        }

        // LAYER 2: Database Check (Primary verification if Auth is protected)
        if (!userFound) {
          try {
            // Try scanning users table
            const snapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
            if (snapshot.exists()) userFound = true;
          } catch (dbErr) {
            console.warn("DB check denied", dbErr);
            // If permission denied, we cannot verify status.
          }
        }

        // DECISION LOGIC
        // If we still haven't found the user after Layer 1 & 2...
        if (!userFound) {
          // ... AND we want strict "Error on Invalid", we must assume they don't exist.
          // WARNING: This blocks valid users if DB is unreadable.
          // But this is what the user explicitly requested ("Invalid email -> No account found").
          throw new Error("No account found with this email address.");
        }

        // If User Found or we are proceeding...
        btn.textContent = 'Sending Link...';
        await firebase.auth().sendPasswordResetEmail(email);

        succEl.textContent = "Reset link sent! Please check your Inbox and Spam folder.";
        succEl.classList.add('show');
        btn.textContent = 'Link Sent';

        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = 'Send Reset Link';
        }, 5000);

      } catch (err) {
        let msg = "Failed: " + err.message;
        if (err.message.includes("No account found")) msg = "No account found with this email address. Please Register first.";
        if (err.code === 'auth/user-not-found') msg = "No account found with this email address.";
        if (err.code === 'auth/invalid-email') msg = "Invalid email format.";

        errEl.textContent = msg;
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Send Reset Link';
      }
    };

    // Toggle Signup Type
    let signupType = 'student';
    function updateSignupType(type) {
      signupType = type;
      if (type === 'student') {
        authEls.signupTypeStudent.classList.add('active');
        authEls.signupTypeTeacher.classList.remove('active');
        renderStudentFields();
      } else {
        authEls.signupTypeTeacher.classList.add('active');
        authEls.signupTypeStudent.classList.remove('active');
        renderTeacherFields();
      }
    }

    if (authEls.signupTypeStudent) authEls.signupTypeStudent.onclick = () => updateSignupType('student');
    if (authEls.signupTypeTeacher) authEls.signupTypeTeacher.onclick = () => updateSignupType('teacher');

    function renderStudentFields() {
      if (!authEls.signupFields) return;
      authEls.signupFields.innerHTML = `
            <div class="field"><span>Full Name</span><input type="text" id="s_name" class="auth-input" required placeholder="Enter your name" spellcheck="false"></div>
            <div class="field"><span>Student ID</span><input type="text" id="s_id" class="auth-input" required placeholder="Enter your id" inputmode="numeric" pattern="[0-9]*" spellcheck="false"></div>
            
            <label class="field control">
                <span>Department</span>
                <select id="s_dept" class="dropdown auth-input">
                    <option value="">Select Department</option>
                </select>
            </label>
            <label class="field control">
                <span>Semester</span>
                <select id="s_sem" class="dropdown auth-input">
                    <option value="">Select Semester</option>
                    <option value="1-1">1st</option>
                    <option value="1-2">2nd</option>
                    <option value="2-1">3rd</option>
                    <option value="2-2">4th</option>
                    <option value="3-1">5th</option>
                    <option value="3-2">6th</option>
                    <option value="4-1">7th</option>
                    <option value="4-2">8th</option>
                </select>
            </label>
            <label class="field control">
                <span>Section</span>
                <select id="s_sec" class="dropdown auth-input" disabled>
                    <option value="">Select Section</option>
                </select>
            </label>

            <div class="field">
                <span>Phone</span>
                <div class="phone-input-container">
                    <div class="country-code">
                        <img src="https://flagcdn.com/w40/bd.png" alt="BD" class="flag-icon">
                        <span>+88</span>
                    </div>
                    <input type="tel" id="s_phone" class="auth-input phone-input-field" required placeholder="01XXXXXXXXX" maxlength="11" oninput="this.value = this.value.replace(/[^0-9]/g, '')" spellcheck="false">
                </div>
            </div>
            <div class="field"><span>Email</span><input type="email" id="s_email" class="auth-input" required placeholder="Enter your email" spellcheck="false"></div>
        `;

      const s_dept = document.getElementById('s_dept');
      const s_sem = document.getElementById('s_sem');
      const s_sec = document.getElementById('s_sec');

      // Populate Departments
      if (s_dept) {
        if (departments && departments.length > 0) {
          departments.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept.name;
            opt.textContent = dept.name;
            const isAvailable = departmentAvailability[dept.name] !== false;
            if (!isAvailable) opt.disabled = true;
            if (dept.name === 'EEE' && isAvailable) opt.selected = true;
            s_dept.appendChild(opt);
          });
        } else {
          // Fallback if departments not yet loaded
          const def = document.createElement('option');
          def.value = 'EEE';
          def.textContent = 'EEE';
          def.selected = true;
          s_dept.appendChild(def);
        }
      }

      // Add change listeners
      const updateSections = async () => {
        const dept = s_dept.value;
        const sem = s_sem.value;

        // Populate sections if both dept and sem are selected
        if (dept && sem) {
          await populateSections(s_sec, sem, '', dept);
        } else {
          s_sec.innerHTML = '<option value="">Select Section</option>';
          s_sec.disabled = true;
          refreshCustomDropdown(s_sec);
        }
      };

      if (s_dept) s_dept.addEventListener('change', updateSections);
      if (s_sem) s_sem.addEventListener('change', updateSections);

      // Apply Custom Dropdown UI
      setTimeout(() => {
        if (s_dept) convertSelectToCustomDropdown(s_dept);
        if (s_sem) convertSelectToCustomDropdown(s_sem);
        if (s_sec) convertSelectToCustomDropdown(s_sec);
      }, 50);
    }

    function renderTeacherFields() {
      if (!authEls.signupFields) return;
      authEls.signupFields.innerHTML = `
            <div class="field"><span>Full Name</span><input type="text" id="t_name" class="auth-input" required placeholder="Enter your name" spellcheck="false"></div>
            <div class="field"><span>Mobile</span><input type="tel" id="t_phone" class="auth-input" required placeholder="Enter your phone number" spellcheck="false"></div>
            <div class="field"><span>Email</span><input type="email" id="t_email" class="auth-input" required placeholder="Enter your email" spellcheck="false"></div>
        `;
    }

    renderStudentFields();

    // Login
    if (authEls.loginForm) authEls.loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPassword').value;
      const btn = authEls.loginForm.querySelector('button[type="submit"]');
      const errEl = document.getElementById('loginError');
      const succEl = document.getElementById('loginSuccess');

      errEl.classList.remove('show');
      succEl.classList.remove('show');
      btn.disabled = true;
      btn.textContent = 'Logging in...';

      try {
        const userCred = await firebase.auth().signInWithEmailAndPassword(email, pass);
        succEl.textContent = "Login Successful!";
        succEl.classList.add('show');

        // Increment Login Count
        if (userCred.user) {
          db.ref('users/' + userCred.user.uid + '/loginCount').transaction(count => {
            return (count || 0) + 1;
          });
        }
        // Redirect handled by onAuthStateChanged
      } catch (err) {
        let msg = "Login Failed: " + err.message;

        // Handle specific error codes/messages
        if (err.code === 'auth/user-not-found') msg = "User not found. Please sign up.";
        else if (err.code === 'auth/wrong-password') msg = "Invalid email or password.";
        else if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') msg = "Invalid email or password.";
        else if (err.message && err.message.includes('INVALID_LOGIN_CREDENTIALS')) msg = "Invalid email or password.";

        errEl.textContent = msg;
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Login';
      }
    };

    // Signup
    if (authEls.signupForm) authEls.signupForm.onsubmit = async (e) => {
      e.preventDefault();
      const pass = document.getElementById('signupPassword').value;
      const confirm = document.getElementById('signupConfirmPassword').value;
      const btn = authEls.signupForm.querySelector('button[type="submit"]');
      const errEl = document.getElementById('signupError');
      const succEl = document.getElementById('signupSuccess');

      errEl.classList.remove('show');
      succEl.classList.remove('show');

      if (pass !== confirm) {
        errEl.textContent = "Passwords do not match";
        errEl.classList.add('show');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Creating Account...';

      try {
        let userData = {};
        let email, phone;

        if (signupType === 'student') {
          email = document.getElementById('s_email').value;
          phone = document.getElementById('s_phone').value;

          // Mobile Validation
          const validPrefixes = ['013', '015', '016', '017', '018', '019'];
          const prefix = phone.substring(0, 3);

          if (phone.length !== 11 || !validPrefixes.includes(prefix)) {
            errEl.textContent = "Invalid mobile number!";
            errEl.classList.add('show');
            btn.disabled = false;
            btn.textContent = 'Sign Up';
            return;
          }
          const name = document.getElementById('s_name').value;
          const id = document.getElementById('s_id').value;
          const dept = document.getElementById('s_dept').value;
          const sem = document.getElementById('s_sem').value;
          const sec = document.getElementById('s_sec').value;

          // Check CR Eligibility - Basic Check
          // Ideally we scan `cr_numbers` node.
          let role = 'student';
          try {
            const snap = await db.ref('cr_numbers').once('value');
            const crNums = snap.val() || {};
            const normPhone = phone.replace(/\D/g, '');
            // Check values
            const isCR = Object.values(crNums).some(n => String(n).replace(/\D/g, '') === normPhone);
            if (isCR) role = 'cr';
          } catch (e) { }

          userData = { name, id, dept, text_semester: sem, section: sec, phone, email, role, type: 'student', createdAt: firebase.database.ServerValue.TIMESTAMP, lastLogin: firebase.database.ServerValue.TIMESTAMP };
        } else {
          email = document.getElementById('t_email').value;
          phone = document.getElementById('t_phone').value;
          const name = document.getElementById('t_name').value;

          // Verify Teacher
          let isTeacher = false;
          try {
            // Check against allTeachers
            const normPhone = phone.replace(/\D/g, '');
            isTeacher = Object.values(allTeachers).some(t => String(t.contact || '').replace(/\D/g, '') === normPhone);
          } catch (e) { }

          if (!isTeacher) {
            throw new Error("You are not eligible for teacher account (Mobile mismatch).");
          }
          userData = { name, phone, email, role: 'teacher', type: 'teacher', createdAt: firebase.database.ServerValue.TIMESTAMP, lastLogin: firebase.database.ServerValue.TIMESTAMP };
        }

        // Check for duplicate phone
        const normalizedPhone = phone.replace(/\D/g, '');
        try {
          const phoneCheckSnap = await db.ref('registered_phones/' + normalizedPhone).once('value');
          if (phoneCheckSnap.exists()) {
            throw new Error("This mobile number is already registered!");
          }
        } catch (dbErr) {
          if (dbErr.message === "This mobile number is already registered!") throw dbErr;
          // If DB read fails (e.g. permission), we proceed with caution or log it. 
          // Ideally we should block, but for now let's assume if we can't read, we can't check.
          console.warn("Could not check duplicate phone:", dbErr);
        }

        // Check for duplicate Student ID (only for students)
        if (signupType === 'student') {
          const studentId = userData.id;
          const normalizedId = String(studentId).trim();
          try {
            const idCheckSnap = await db.ref('registered_student_ids/' + normalizedId).once('value');
            if (idCheckSnap.exists()) {
              throw new Error("This Student ID is already registered!");
            }
          } catch (dbErr) {
            if (dbErr.message === "This Student ID is already registered!") throw dbErr;
            console.warn("Could not check duplicate student ID:", dbErr);
          }
        }

        const cred = await firebase.auth().createUserWithEmailAndPassword(email, pass);
        await db.ref('users/' + cred.user.uid).set(userData);

        // Register phone number
        await db.ref('registered_phones/' + normalizedPhone).set({
          uid: cred.user.uid,
          timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        // Register Student ID (if student)
        if (signupType === 'student' && userData.id) {
          const normalizedId = String(userData.id).trim();
          await db.ref('registered_student_ids/' + normalizedId).set({
            uid: cred.user.uid,
            timestamp: firebase.database.ServerValue.TIMESTAMP
          });
        }

        succEl.textContent = "Account Created! Logging in...";
        succEl.classList.add('show');
        // Redirect handled by onAuthStateChanged
      } catch (err) {
        errEl.textContent = "Signup Failed: " + err.message;
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Sign Up';
      }
    };

    // Auth State
    // Auth State - Real-time Listener
    let userListenerRef = null;

    firebase.auth().onAuthStateChanged((user) => {
      currentUser = user;
      if (user) {
        if (authEls.authView) authEls.authView.classList.add('hidden');
        if (authEls.menuView) authEls.menuView.classList.remove('hidden');
        if (authEls.profileIcon) authEls.profileIcon.classList.remove('hidden');

        // Update Last Login
        db.ref('users/' + user.uid).update({
          lastLogin: firebase.database.ServerValue.TIMESTAMP
        });

        // Set up real-time listener for user profile
        if (userListenerRef) userListenerRef.off(); // clear previous if any

        userListenerRef = db.ref('users/' + user.uid);
        userListenerRef.on('value', (snap) => {
          if (snap.exists()) {
            userProfile = snap.val();
            // Save to localStorage for Lab Rat access
            localStorage.setItem('cse.userProfile', JSON.stringify(userProfile));

            if (authEls.userName) authEls.userName.textContent = userProfile.name;
            if (authEls.userRole) authEls.userRole.textContent = userProfile.role;
            if (authEls.userInitials) authEls.userInitials.textContent = (userProfile.name || 'U').charAt(0).toUpperCase();
            if (authEls.cardUserId) {
              const displayId = userProfile.id || userProfile.studentId || userProfile.teacherId || '--';
              authEls.cardUserId.innerHTML = `ID: <span style="font-family: 'Poppins', sans-serif; font-weight: 500; letter-spacing: 0.5px;">${displayId}</span>`;
            }

            // Update booking menu based on role immediately
            // Synced with Local Storage as per user request
            localStorage.setItem('user_role', userProfile.role || 'student');
            updateBookingMenu(userProfile.role);

            // Force check Schedio button visibility on login/profile load
            const schedioBtn = document.getElementById('schedioAddBtn');
            if (schedioBtn) {
              const role = (userProfile.role || 'student').toLowerCase();
              if (role === 'cr' || role === 'admin') {
                schedioBtn.classList.remove('hidden');
              } else {
                schedioBtn.classList.add('hidden');
              }
            }
          }
        });
      } else {
        if (authEls.authView) authEls.authView.classList.remove('hidden');
        if (authEls.menuView) authEls.menuView.classList.add('hidden');
        if (authEls.profileIcon) authEls.profileIcon.classList.add('hidden');

        // Scroll to top when showing auth view
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;

        // Reset Login Form State
        if (authEls.loginForm) {
          authEls.loginForm.reset(); // clear inputs
          const btn = authEls.loginForm.querySelector('button[type="submit"]');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Login';
          }
          const succEl = document.getElementById('loginSuccess');
          const errEl = document.getElementById('loginError');
          if (succEl) { succEl.classList.remove('show'); succEl.textContent = ''; }
          if (errEl) { errEl.classList.remove('show'); errEl.textContent = ''; }
        }

        // Reset Signup Form State (just in case)
        if (authEls.signupForm) {
          authEls.signupForm.reset();
          const btn = authEls.signupForm.querySelector('button[type="submit"]');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Sign Up';
          }
          const succEl = document.getElementById('signupSuccess');
          const errEl = document.getElementById('signupError');
          if (succEl) { succEl.classList.remove('show'); succEl.textContent = ''; }
          if (errEl) { errEl.classList.remove('show'); errEl.textContent = ''; }
        }

        // Reset Forgot Password Form State
        if (authEls.forgotPasswordForm) {
          authEls.forgotPasswordForm.reset();
          const btn = authEls.forgotPasswordForm.querySelector('button[type="submit"]');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Send Reset Link';
          }
          const succEl = document.getElementById('forgotPasswordSuccess');
          const errEl = document.getElementById('forgotPasswordError');
          if (succEl) { succEl.classList.remove('show'); succEl.textContent = ''; }
          if (errEl) { errEl.classList.remove('show'); errEl.textContent = ''; }
          if (authEls.forgotPasswordContainer) {
            authEls.forgotPasswordContainer.classList.add('hidden');
          }
        }

        if (userListenerRef) {
          userListenerRef.off();
          userListenerRef = null;
        }
        userProfile = {};
        localStorage.removeItem('user_role');
        updateBookingMenu('student'); // Default to restricted

        // Hide Schedio Button on Logout
        const schedioBtn = document.getElementById('schedioAddBtn');
        if (schedioBtn) schedioBtn.classList.add('hidden');
      }
    });

    function updateBookingMenu(role) {
      const btn = document.getElementById('bookingMenuOption');
      if (!btn) return;

      const normalizedRole = (role || 'student').toLowerCase();
      const isAllowed = normalizedRole === 'cr' || normalizedRole === 'teacher' || normalizedRole === 'admin';

      const titleEl = btn.querySelector('.more-block-title');
      let badgeEl = btn.querySelector('.more-block-badge');

      if (isAllowed) {
        if (titleEl) titleEl.textContent = 'Slot Book';
        // Remove badge if exists
        if (badgeEl) badgeEl.remove();

        btn.classList.remove('disabled-menu-option');
        btn.classList.add('more-block-clickable'); // Ensure hover effects
        btn.classList.remove('more-block-disabled');
        btn.style.opacity = '1';
        btn.style.filter = 'none';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
      } else {
        if (titleEl) titleEl.textContent = 'Slot Book';
        // Add badge if missing
        if (!badgeEl) {
          badgeEl = document.createElement('div');
          badgeEl.className = 'more-block-badge';
          badgeEl.textContent = 'NOT AVAILABLE';
          btn.insertBefore(badgeEl, btn.firstChild);
        } else {
          badgeEl.textContent = 'NOT AVAILABLE';
        }

        btn.classList.add('disabled-menu-option');
        // Add clickable class to allow hover animation (lift effect) even when disabled
        btn.classList.add('more-block-clickable');
        btn.classList.add('more-block-disabled'); // Re-use disabled style

        // Keep visual disabled style but allow interaction for popup
        btn.style.opacity = '0.7';
        btn.style.filter = 'grayscale(100%)';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
      }
    }

    // Use event delegation for logout button to ensure it works properly
    document.addEventListener('click', (e) => {
      if (e.target.closest('#logoutBtn')) {
        const popup = document.getElementById('logoutConfirmPopup');
        if (popup) {
          popup.classList.remove('hidden');
          // Small delay to allow display:block to apply before opacity transition
          requestAnimationFrame(() => {
            popup.classList.add('showing');
          });
        }
      }
    });

    const logoutCancelBtn = document.getElementById('logoutCancelBtn');
    const logoutConfirmBtn = document.getElementById('logoutConfirmBtn');

    if (logoutCancelBtn) {
      logoutCancelBtn.onclick = () => {
        const popup = document.getElementById('logoutConfirmPopup');
        if (popup) {
          popup.classList.remove('showing');
          setTimeout(() => popup.classList.add('hidden'), 200);
        }
      };
    }

    if (logoutConfirmBtn) {
      logoutConfirmBtn.onclick = async () => {
        const popup = document.getElementById('logoutConfirmPopup');
        const originalText = logoutConfirmBtn.textContent;
        logoutConfirmBtn.textContent = 'Logging out...';
        logoutConfirmBtn.disabled = true;

        try {
          await firebase.auth().signOut();
          // Scroll to top immediately after sign out triggers
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
        } catch (e) {
          console.error('Logout error', e);
        } finally {
          logoutConfirmBtn.textContent = originalText; // Reset for next time
          logoutConfirmBtn.disabled = false;
          if (popup) {
            popup.classList.remove('showing');
            setTimeout(() => popup.classList.add('hidden'), 200);
          }
        }
      };
    }

    // Privacy handlers moved to global scope
    // Profile

    // Profile
    if (authEls.profileIcon) authEls.profileIcon.onclick = () => {
      authEls.profileModal.classList.remove('hidden');
      if (userProfile.name) document.getElementById('profileName').value = userProfile.name;
    };
    if (authEls.profileModalClose) authEls.profileModalClose.onclick = () => authEls.profileModal.classList.add('hidden');
    if (authEls.profileForm) authEls.profileForm.onsubmit = async (e) => {
      e.preventDefault();
      const newName = document.getElementById('profileName').value;
      const newPass = document.getElementById('profilePassword').value;
      if (currentUser) {
        await db.ref('users/' + currentUser.uid + '/name').set(newName);
        if (newPass) await currentUser.updatePassword(newPass);
        alert("Profile Updated");
        authEls.profileModal.classList.add('hidden');
      }
    };

    // Booking
    if (authEls.bookingModalClose) authEls.bookingModalClose.onclick = () => authEls.bookingModal.classList.add('hidden');

    if (authEls.bookingForm) authEls.bookingForm.onsubmit = async (e) => {
      e.preventDefault();
      const date = document.getElementById('bookingDate').value;
      const reason = document.getElementById('bookingReason').value;
      const room = document.getElementById('bookingRoom').value;
      const time = document.getElementById('bookingTime').value;

      if (currentUser) {
        await db.ref('booking_requests').push({
          uid: currentUser.uid,
          name: userProfile.name,
          role: userProfile.role,
          room, time, date, reason,
          status: 'pending',
          timestamp: Date.now()
        });
        alert("Booking Request Sent for Admin Approval");
        // Clear form
        e.target.reset();
        // Refresh history
        if (typeof loadUserBookingHistory === 'function') {
          loadUserBookingHistory(currentUser.uid);
        }
      }
    };

    // Support Form Toggle Logic
    // Support Form Toggle Logic
    const supportTypeBug = document.getElementById('supportTypeBug');
    const supportTypeReview = document.getElementById('supportTypeReview');
    const supportTypeInput = document.getElementById('supportTypeInput');

    // UI Elements for dynamic updates
    const supportSubjectLabel = document.getElementById('supportSubjectLabel');
    const supportMessageLabel = document.getElementById('supportMessageLabel');
    const supportSubject = document.getElementById('supportSubject');
    const supportMessage = document.getElementById('supportMessage');
    const supportSubmitBtn = document.getElementById('supportSubmitBtn');

    if (supportTypeBug && supportTypeReview && supportTypeInput) {
      supportTypeBug.addEventListener('click', () => {
        supportTypeBug.classList.add('active');
        supportTypeReview.classList.remove('active');
        supportTypeInput.value = 'bug_report';

        // Update UI for Report
        if (supportSubjectLabel) supportSubjectLabel.textContent = 'Subject';
        if (supportMessageLabel) supportMessageLabel.textContent = 'Description';
        if (supportSubject) supportSubject.placeholder = 'Brief summary of the issue';
        if (supportMessage) supportMessage.placeholder = 'Describe the bug or issue in detail...';
        if (supportSubmitBtn) supportSubmitBtn.textContent = 'Send Report';
      });

      supportTypeReview.addEventListener('click', () => {
        supportTypeReview.classList.add('active');
        supportTypeBug.classList.remove('active');
        supportTypeInput.value = 'review';

        // Update UI for Review
        if (supportSubjectLabel) supportSubjectLabel.textContent = 'Review Title';
        if (supportMessageLabel) supportMessageLabel.textContent = 'Feedback';
        if (supportSubject) supportSubject.placeholder = 'e.g. Great App!';
        if (supportMessage) supportMessage.placeholder = 'What did you like or what can we improve?';
        if (supportSubmitBtn) supportSubmitBtn.textContent = 'Submit Review';
      });
    }
  }

  // Handle new popup close
  const slotAccessCloseBtn = document.getElementById('slotAccessCloseBtn');
  const slotAccessPopup = document.getElementById('slotAccessPopup');

  if (slotAccessCloseBtn && slotAccessPopup) {
    const closeSlotPopup = () => {
      slotAccessPopup.classList.remove('showing');
      setTimeout(() => slotAccessPopup.classList.add('hidden'), 200);
    };

    slotAccessCloseBtn.addEventListener('click', closeSlotPopup);

    // Also close on backdrop click
    slotAccessPopup.addEventListener('click', (e) => {
      if (e.target === slotAccessPopup) closeSlotPopup();
    });
  }

  // Password Visibility Toggle
  window.togglePasswordVisibility = function (inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';
      // Switch to Eye Off (Slash) icon
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
      btn.style.color = 'var(--accent)';
    } else {
      input.type = 'password';
      // Switch back to Eye icon
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
      btn.style.color = '';
    }
  };

  // Slot Click Handler
  window.handleSlotClick = function (room, time) {
    if (!currentUser) {
      alert("Please login to book a slot.");
      // redirect to more?
      setScreen('more');
      return;
    }
    if (userProfile.role !== 'cr' && userProfile.role !== 'teacher' && userProfile.role !== 'admin') {
      alert("Only CRs and Teachers can book slots.");
      return;
    }

    const modal = document.getElementById('bookingModal');
    if (modal) {
      document.getElementById('bookingRoom').value = room;
      document.getElementById('bookingTime').value = time;
      modal.classList.remove('hidden');
    }
  };

  // Handle Booking Block Click (More Page)
  window.handleBookingClick = function () {
    if (!currentUser) {
      // Should logically be logged in to see this, but safe check
      alert('Please login first');
      return;
    }

    const role = (userProfile.role || 'student').toLowerCase();

    if (role === 'student') {
      const popup = document.getElementById('slotAccessPopup');
      if (popup) {
        popup.classList.remove('hidden');
        setTimeout(() => popup.classList.add('showing'), 10);
      }
    } else {
      // Allow access for CR, Teacher, Admin
      setScreen('booking');
      // Initialize booking UI after screen is shown
      setTimeout(() => {
        if (typeof initBookingQueryUI === 'function') {
          initBookingQueryUI();
        }
      }, 150);
    }
  };

  // Ensure initAuth runs when app loads
  // We prefer running it inside initEntry, but redundancy ensures it works even if initEntry stalls
  if (document.readyState === 'loading') {
  }

  /* ================= TO DO MODULE LOGIC ================= */
  (function initTodoListeners() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setupTodoEvents);
    } else {
      setupTodoEvents();
    }

    function setupTodoEvents() {
      const todoBtn = document.getElementById('todoMenuOption');
      const schedioBtn = document.getElementById('schedioMenuOption');

      if (todoBtn) {
        todoBtn.addEventListener('click', () => {
          const user = firebase.auth().currentUser;
          if (!user) { alert('Please login first'); return; }

          // Reset scroll position BEFORE showing the screen
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;

          // Also reset scroll for all content divs
          const contentDivs = document.querySelectorAll('.content');
          contentDivs.forEach(div => {
            div.scrollTop = 0;
          });

          window.setScreen('todo');

          // Double-check scroll reset after screen transition
          requestAnimationFrame(() => {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;

            // Reset todo screen content scroll specifically
            const todoScreen = document.getElementById('todo');
            if (todoScreen) {
              const todoContent = todoScreen.querySelector('.content');
              if (todoContent) {
                todoContent.scrollTop = 0;
              }
            }
          });

          initTodoModule();
        });
      }

      if (schedioBtn) {
        schedioBtn.addEventListener('click', () => {
          window.setScreen('schedio');
        });
      }

      const todoBack = document.getElementById('todoBackBtn');
      if (todoBack) {
        todoBack.onclick = () => window.setScreen('more');
      }

      const schedioBack = document.getElementById('schedioBackBtn');
      if (schedioBack) {
        schedioBack.onclick = () => window.setScreen('more');
      }

      // Modal Logic
      // Date Helper Functions
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      function formatDateDisplay(date) {
        const d = String(date.getDate()).padStart(2, '0');
        const m = months[date.getMonth()].slice(0, 3);
        const y = date.getFullYear();
        return `${d} ${m} ${y}`;
      }

      function formatDateISO(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }

      // Custom Date Picker Logic
      let pickerDate = new Date(); // Month being viewed
      let selectedDate = new Date(); // Currently selected date

      // Expose helpers for Edit Task
      window.formatDateDisplay = formatDateDisplay;
      window.formatDateISO = formatDateISO;

      window.updateDatePickerState = function (dateObj) {
        if (!dateObj) return;
        selectedDate = new Date(dateObj);
        pickerDate = new Date(dateObj);
        // Input update is handled by caller or we can do it here
        // But main purpose is to sync the picker's internal state
      };

      function initCustomDatePicker() {
        const input = document.getElementById('taskDate');
        const picker = document.getElementById('customDatePicker');
        const grid = document.getElementById('pickerDaysGrid');
        const monthLabel = document.getElementById('pickerMonthYear');
        const prevBtn = document.getElementById('prevMonthBtn');
        const nextBtn = document.getElementById('nextMonthBtn');

        if (!input || !picker || !grid) return;

        // Toggle Picker
        input.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = picker.classList.contains('hidden');
          // Close others if needed
          if (isHidden) {
            picker.classList.remove('hidden');
            // force reflow
            void picker.offsetWidth;
            picker.classList.add('showing');
            renderCalendar();
          } else {
            picker.classList.remove('showing');
            setTimeout(() => picker.classList.add('hidden'), 200);
          }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
          if (picker.classList.contains('showing') && !picker.contains(e.target) && e.target !== input) {
            picker.classList.remove('showing');
            setTimeout(() => picker.classList.add('hidden'), 200);
          }
        });

        // Navigation
        prevBtn.onclick = (e) => { e.stopPropagation(); pickerDate.setMonth(pickerDate.getMonth() - 1); renderCalendar(); };
        nextBtn.onclick = (e) => { e.stopPropagation(); pickerDate.setMonth(pickerDate.getMonth() + 1); renderCalendar(); };

        function renderCalendar() {
          grid.innerHTML = '';
          monthLabel.textContent = `${months[pickerDate.getMonth()]} ${pickerDate.getFullYear()}`;

          const year = pickerDate.getFullYear();
          const month = pickerDate.getMonth();

          // Layout: Sat, Sun, Mon, Tue, Wed, Thu, Fri
          // getDay(): Sun=0, Mon=1, ..., Sat=6
          // Target Indices (0-6): Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
          // Formula to map getDay() to Index: (d + 1) % 7

          const firstDayJS = new Date(year, month, 1).getDay(); // Standard JS Day
          const startOffset = (firstDayJS + 1) % 7; // Map to Sat-Start

          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const prevMonthDays = new Date(year, month, 0).getDate();

          // Previous Month Padding
          for (let i = 0; i < startOffset; i++) {
            const day = document.createElement('div');
            day.className = 'datepicker-day empty other-month';
            day.textContent = prevMonthDays - startOffset + 1 + i;
            grid.appendChild(day);
          }

          // Current Month
          const today = new Date();
          for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'datepicker-day';
            day.textContent = i;

            // Check if Today
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
              day.classList.add('today');
            }

            // Check Selected
            if (selectedDate && i === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
              day.classList.add('selected');
            }

            day.onclick = (e) => {
              e.stopPropagation();
              selectedDate = new Date(year, month, i);
              input.value = formatDateDisplay(selectedDate); // Display format
              input.dataset.iso = formatDateISO(selectedDate); // Store ISO

              // Update visual selection
              document.querySelectorAll('.datepicker-day.selected').forEach(el => el.classList.remove('selected'));
              day.classList.add('selected');

              // Close picker
              picker.classList.remove('showing');
              setTimeout(() => picker.classList.add('hidden'), 200);
            };

            grid.appendChild(day);
          }
        }
      }

      // Initialize once
      function initCustomDatePicker() {
        const input = document.getElementById('taskDate');
        const wrapper = document.getElementById('dateInputWrapper');
        const picker = document.getElementById('customDatePicker');

        // Time Input Trigger Logic
        const timeWrapper = document.getElementById('timeInputWrapper');
        const timeInput = document.getElementById('taskTime');



        const grid = document.getElementById('pickerDaysGrid');
        const monthLabel = document.getElementById('pickerMonthYear');
        const prevBtn = document.getElementById('prevMonthBtn');
        const nextBtn = document.getElementById('nextMonthBtn');

        if (!input || !picker || !grid) return;

        // Use the wrapper for the click trigger
        const trigger = wrapper || input;

        // Helper to adjust position For Date Picker
        function adjustPosition(triggerEl, pickerEl) {
          const rect = triggerEl.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const pickerHeight = 320; // Avg height of date picker

          if (spaceBelow < pickerHeight && rect.top > pickerHeight) {
            // Open Upwards
            pickerEl.style.top = 'auto';
            pickerEl.style.bottom = '100%';
            pickerEl.style.marginTop = '0';
            pickerEl.style.marginBottom = '-24px';
            pickerEl.style.transformOrigin = 'bottom center';
          } else {
            // Open Downwards (Default)
            pickerEl.style.top = '100%';
            pickerEl.style.bottom = 'auto';
            pickerEl.style.marginTop = '4px';
            pickerEl.style.marginBottom = '0';
            pickerEl.style.transformOrigin = 'top center';
          }
        }

        // Toggle Picker
        trigger.addEventListener('click', (e) => {
          e.stopPropagation();
          const isHidden = picker.classList.contains('hidden');
          // Close others if needed
          if (isHidden) {
            adjustPosition(trigger, picker); // Dynamic positioning
            picker.classList.remove('hidden');
            // force reflow
            void picker.offsetWidth;
            picker.classList.add('showing');
            renderCalendar();
          } else {
            picker.classList.remove('showing');
            setTimeout(() => picker.classList.add('hidden'), 200);
          }
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
          if (picker.classList.contains('showing') &&
            !picker.contains(e.target) &&
            !trigger.contains(e.target)) {
            picker.classList.remove('showing');
            setTimeout(() => picker.classList.add('hidden'), 200);
          }
        });

        // Navigation
        prevBtn.onclick = (e) => { e.stopPropagation(); pickerDate.setMonth(pickerDate.getMonth() - 1); renderCalendar(); };
        nextBtn.onclick = (e) => { e.stopPropagation(); pickerDate.setMonth(pickerDate.getMonth() + 1); renderCalendar(); };

        function renderCalendar() {
          grid.innerHTML = '';
          monthLabel.textContent = `${months[pickerDate.getMonth()]} ${pickerDate.getFullYear()}`;

          const year = pickerDate.getFullYear();
          const month = pickerDate.getMonth();

          // Layout: Sat, Sun, Mon, Tue, Wed, Thu, Fri
          // getDay(): Sun=0, Mon=1, ..., Sat=6
          // Target Indices (0-6): Sat=0, Sun=1, Mon=2, Tue=3, Wed=4, Thu=5, Fri=6
          // Formula to map getDay() to Index: (d + 1) % 7

          const firstDayJS = new Date(year, month, 1).getDay(); // Standard JS Day
          const startOffset = (firstDayJS + 1) % 7; // Map to Sat-Start

          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const prevMonthDays = new Date(year, month, 0).getDate();

          // Previous Month Padding
          for (let i = 0; i < startOffset; i++) {
            const day = document.createElement('div');
            day.className = 'datepicker-day empty other-month';
            day.textContent = prevMonthDays - startOffset + 1 + i;
            grid.appendChild(day);
          }

          // Current Month
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Normalize today for comparison

          for (let i = 1; i <= daysInMonth; i++) {
            const day = document.createElement('div');
            day.className = 'datepicker-day';
            day.textContent = i;

            const currentDayDate = new Date(year, month, i);
            currentDayDate.setHours(0, 0, 0, 0);

            // Check if Today
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
              day.classList.add('today');
            }

            // Check Selected
            if (selectedDate && i === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear()) {
              day.classList.add('selected');
            }

            // Disable Past Dates
            if (currentDayDate < today) {
              day.classList.add('disabled');
            } else {
              day.onclick = (e) => {
                e.stopPropagation();
                selectedDate = new Date(year, month, i);
                input.value = formatDateDisplay(selectedDate); // Display format
                input.dataset.iso = formatDateISO(selectedDate); // Store ISO

                // Update visual selection
                document.querySelectorAll('.datepicker-day.selected').forEach(el => el.classList.remove('selected'));
                day.classList.add('selected');

                // Close picker
                picker.classList.remove('showing');
                setTimeout(() => picker.classList.add('hidden'), 200);
              };
            }

            grid.appendChild(day);
          }
        }
      }

      initCustomDatePicker();

      window.openAddTaskModal = function () {
        const modal = document.getElementById('addTaskModal');
        if (modal) {
          modal.classList.remove('hidden');
          // Force reflow
          void modal.offsetWidth;
          modal.classList.add('showing');

          // Initialize Fields
          // We DO NOT set default date here so "Select Date" placeholder shows.
          // We only set pickerDate to today so navigation starts correctly.

          const input = document.getElementById('taskDate');
          if (input && !input.value) {
            const now = new Date();
            selectedDate = null; // No date selected yet
            pickerDate = new Date(now); // Picker starts at current month

            // Ensure Time is handled - Pre-fill time or leave empty?
            // Screenshot suggests time is pre-filled. We'll keep time pre-fill for convenience
            // "Select Date" text was main request.
            const timeInput = document.getElementById('taskTime');
            if (timeInput && !timeInput.value) {
              let h = now.getHours();
              const m = String(now.getMinutes()).padStart(2, '0');
              const amp = h >= 12 ? 'PM' : 'AM';
              h = h % 12;
              h = h ? h : 12;
              const hh = String(h).padStart(2, '0');

              timeInput.value = `${hh}:${m} ${amp}`;
            }
          }

          // Re-init Date Picker (ensure clean state) & Time Picker
          if (window.initCustomDatePicker) window.initCustomDatePicker(); // if reachable
          // Init custom time picker
          if (typeof initCustomTimePicker === 'function') initCustomTimePicker();
        }
      };

      const btnOpenAddTask = document.getElementById('btnOpenAddTask');
      if (btnOpenAddTask) {
        btnOpenAddTask.onclick = (e) => {
          if (e) e.preventDefault();
          if (window.resetAddTaskState) window.resetAddTaskState();
          window.openAddTaskModal();
        };
      }

      window.closeAddTaskModal = function () {
        const modal = document.getElementById('addTaskModal');
        if (modal) {
          modal.classList.remove('showing');
          setTimeout(() => {
            modal.classList.add('hidden');
          }, 200);
        }
      };

      const btnCloseAddTask = document.getElementById('btnCloseAddTask');
      if (btnCloseAddTask) {
        btnCloseAddTask.onclick = window.closeAddTaskModal;
      }

      // Add Task Form
      const addTaskForm = document.getElementById('addTaskForm');
      if (addTaskForm) {
        addTaskForm.addEventListener('submit', (e) => {
          e.preventDefault();
          saveTask();
        });
      }

      // Custom Repeat Dropdown Functionality
      const repeatButton = document.getElementById('taskRepeatButton');
      const repeatMenu = document.getElementById('taskRepeatMenu');
      const repeatValue = document.getElementById('taskRepeatValue');
      const repeatHidden = document.getElementById('taskRepeat');

      if (repeatButton && repeatMenu) {
        // Toggle dropdown
        repeatButton.addEventListener('click', (e) => {
          e.stopPropagation();
          const isOpen = repeatMenu.classList.contains('showing');

          // Close all other dropdowns
          document.querySelectorAll('.custom-dropdown-menu.showing').forEach(menu => {
            if (menu !== repeatMenu) {
              menu.classList.remove('showing');
              menu.classList.add('hiding');
              setTimeout(() => {
                menu.classList.add('hidden');
                menu.classList.remove('hiding');
              }, 200);
            }
          });

          if (isOpen) {
            repeatMenu.classList.remove('showing');
            repeatMenu.classList.add('hiding');
            repeatButton.classList.remove('open');
            setTimeout(() => {
              repeatMenu.classList.add('hidden');
              repeatMenu.classList.remove('hiding');
            }, 200);
          } else {
            repeatMenu.classList.remove('hidden');
            void repeatMenu.offsetWidth; // Force reflow
            repeatMenu.classList.add('showing');
            repeatButton.classList.add('open');
          }
        });

        // Select item
        repeatMenu.querySelectorAll('.custom-dropdown-item').forEach(item => {
          item.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = item.getAttribute('data-value');
            const text = item.textContent;

            // Update display and hidden input
            repeatValue.textContent = text;
            repeatHidden.value = value;

            // Update selected state
            repeatMenu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');

            // Close dropdown
            repeatMenu.classList.remove('showing');
            repeatMenu.classList.add('hiding');
            repeatButton.classList.remove('open');
            setTimeout(() => {
              repeatMenu.classList.add('hidden');
              repeatMenu.classList.remove('hiding');
            }, 200);
          });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
          if (!repeatButton.contains(e.target) && !repeatMenu.contains(e.target)) {
            if (repeatMenu.classList.contains('showing')) {
              repeatMenu.classList.remove('showing');
              repeatMenu.classList.add('hiding');
              repeatButton.classList.remove('open');
              setTimeout(() => {
                repeatMenu.classList.add('hidden');
                repeatMenu.classList.remove('hiding');
              }, 200);
            }
          }
        });

        // Set initial selected state
        const initialValue = repeatHidden.value || 'once';
        const initialItem = repeatMenu.querySelector(`[data-value="${initialValue}"]`);
        if (initialItem) {
          initialItem.classList.add('selected');
          repeatValue.textContent = initialItem.textContent;
        }
      }

      // Expose Filter Function
      window.filterTodo = function (type) {
        renderTodoTasks(type);
      };

      // Expose Task Actions
      window.toggleTodoComplete = function (id, status) {
        const user = firebase.auth().currentUser;
        if (!user) return;
        firebase.database().ref(`users/${user.uid}/todo_tasks/${id}`).update({ completed: status });
      };

      window.deleteTodoTask = function (e, id) {
        e.stopPropagation();
        const user = firebase.auth().currentUser;
        if (!user) return;
        firebase.database().ref(`users/${user.uid}/todo_tasks/${id}`).remove();
      };

      window.toggleTaskMenu = function (el) {
        // toggle class show on the .todo-dropdown inside this element
        const dd = el.querySelector('.todo-dropdown');
        // Close others
        document.querySelectorAll('.todo-dropdown').forEach(d => {
          if (d !== dd) d.classList.remove('show');
        });
        if (dd) dd.classList.toggle('show');
      };

      // Close dropdowns on outside click
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.todo-actions')) {
          document.querySelectorAll('.todo-dropdown').forEach(d => d.classList.remove('show'));
        }
      });
    }
  })();

  let allTasks = [];
  let todoDbRef = null;

  function initTodoModule() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Get user's actual name from database
    const nameEl = document.getElementById('todoUserName');
    if (nameEl) {
      firebase.database().ref('users/' + user.uid).once('value').then(snap => {
        const userData = snap.val();
        if (userData && userData.name) {
          // Get first name only
          const firstName = userData.name.split(' ')[0];
          nameEl.textContent = firstName;
        } else {
          nameEl.textContent = 'User';
        }
      }).catch(() => {
        nameEl.textContent = 'User';
      });
    }

    // Initial render state - Scroll handled by setScreen
    updateTodoStats(); // clear stats

    // Cleanup previous listener
    if (todoDbRef) {
      todoDbRef.off();
    }

    const db = firebase.database();
    todoDbRef = db.ref(`users/${user.uid}/todo_tasks`);
    todoDbRef.on('value', (snap) => {
      allTasks = [];
      snap.forEach(child => {
        allTasks.push({ id: child.key, ...child.val() });
      });

      updateTodoStats();

      // Determine current filter or default to today
      const titleEl = document.getElementById('todoListTitle');
      const currentTitle = titleEl ? titleEl.textContent : '';

      if (currentTitle.includes('Today')) renderTodoTasks('today');
      else if (currentTitle.includes('Overview')) renderTodoTasks('overview');
      else if (currentTitle.includes('All')) renderTodoTasks('all');
      else if (currentTitle.includes('Overdue')) renderTodoTasks('overdue');
      else renderTodoTasks('today');
    });
  }

  function updateTodoStats() {
    if (!document.getElementById('statTodayCount')) return;

    // Count Today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = allTasks.filter(t => t.date === todayStr && !t.completed).length;
    document.getElementById('statTodayCount').textContent = todayCount;

    // Count Overview (Completed %)
    const total = allTasks.length;
    const completed = allTasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
    document.getElementById('statOverviewCount').textContent = percent + '%';

    // Count All
    document.getElementById('statAllCount').textContent = total;

    // Count Overdue
    const nowMs = Date.now();
    const overdueCount = allTasks.filter(t => {
      if (t.completed) return false;
      // Simple validation
      if (!t.date) return false;
      const taskTime = new Date(t.date + 'T' + (t.time || '23:59')).getTime();
      return taskTime < nowMs;
    }).length;

    document.getElementById('statOverdueCount').textContent = overdueCount;
  }

  let editingTaskId = null; // Track which task is being edited

  function renderTodoTasks(filter) {
    const container = document.getElementById('todoListItems');
    if (!container) return;

    container.innerHTML = '';
    const titleEl = document.getElementById('todoListTitle');

    let filtered = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const nowMs = Date.now();

    if (filter === 'today') {
      if (titleEl) titleEl.textContent = "Today's Task";
      filtered = allTasks.filter(t => t.date === todayStr);
    } else if (filter === 'all') {
      if (titleEl) titleEl.textContent = "All Tasks";
      filtered = allTasks;
    } else if (filter === 'overdue') {
      if (titleEl) titleEl.textContent = "Overdue Tasks";
      // Explicit Overdue filter
      filtered = allTasks.filter(t => {
        if (t.completed) return false;
        const taskTime = new Date(t.date + 'T' + (t.time || '23:59')).getTime();
        return taskTime < nowMs;
      });
    } else if (filter === 'overview') {
      if (titleEl) titleEl.textContent = "Overview (Scheduled)";
      filtered = allTasks.filter(t => !t.completed);
    }

    // --- SORTING LOGIC ---
    // 1. Separate Buckets
    const pinned = [];
    const active = [];   // Future/Upcoming
    const overdue = [];  // Overdue
    const completed = []; // Completed (unpinned)

    filtered.forEach(task => {
      // Calculate Status
      let isOverdue = false;
      if (!task.completed && task.date && task.repeat !== 'daily') {
        const taskTime = new Date(task.date + 'T' + (task.time || '23:59')).getTime();
        if (taskTime < nowMs) isOverdue = true;
      }
      task._isOverdue = isOverdue;

      // Grouping Priority
      if (task.pinned) {
        pinned.push(task);
      } else if (task.completed) {
        completed.push(task);
      } else if (isOverdue) {
        overdue.push(task);
      } else {
        active.push(task);
      }
    });

    // Helper Sorts
    const sortDateAsc = (a, b) => (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));
    const sortDateDesc = (a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || ''));

    // Apply Sorting Rules
    pinned.sort((a, b) => (b.pinnedAt || 0) - (a.pinnedAt || 0)); // Newest pin first
    active.sort(sortDateAsc);   // Earliest due first
    overdue.sort(sortDateDesc); // Latest due/Recent overdue first
    completed.sort(sortDateDesc); // Recent completed/due first

    // Combine: Pinned -> Active -> Overdue -> Completed
    const sortedTasks = [...pinned, ...active, ...overdue, ...completed];

    if (sortedTasks.length === 0) {
      container.innerHTML = '<div class="empty-state" style="text-align:center; padding:40px; color:var(--muted);"><p>No tasks found</p></div>';
      return;
    }

    sortedTasks.forEach(task => {
      const div = document.createElement('div');
      div.className = 'todo-item';

      // Format Time
      let timeDisplay = task.time;
      try {
        const [h, m] = task.time.split(':');
        const suffix = h >= 12 ? 'PM' : 'AM';
        const hours = h % 12 || 12;
        timeDisplay = `${hours}:${m} ${suffix}`;
      } catch (e) { }

      // Date Display Logic
      let dateDisplay = task.date;
      if (task.repeat === 'daily') {
        dateDisplay = 'Daily';
      } else if (task.date === todayStr) {
        dateDisplay = 'Today';
      } else {
        // Format YYYY-MM-DD -> DD-MM-YYYY
        const parts = task.date.split('-'); // [YYYY, MM, DD]
        if (parts.length === 3) {
          dateDisplay = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }

      // Check Overdue for Label (User explicit request: red label)
      // Note: We calculated _isOverdue above, but Pinned tasks might also be Overdue.
      // So check again or use property.
      let isOverdue = false;
      if (!task.completed && task.date && task.repeat !== 'daily') {
        const taskTime = new Date(task.date + 'T' + (task.time || '23:59')).getTime();
        if (taskTime < nowMs) isOverdue = true;
      }

      //To Do Pin Icon Style
      div.innerHTML = `
              ${task.pinned ? `<div class="todo-pin-indicator"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" /></svg></div>` : ''}
              <div class="todo-check ${task.completed ? 'completed' : ''}" onclick="window.toggleTodoComplete('${task.id}', ${!task.completed})">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
                     <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
              </div>
              <div class="todo-content" onclick="window.openTaskOverview('${task.id}')">
                  <div class="todo-meta" ${isOverdue ? 'style="color: #E74C3C;"' : ''}>
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                     <span>${dateDisplay}</span>
                     ${task.time ? `
                     <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-left:3px;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                     <span>${timeDisplay}</span>` : ''}
                     ${isOverdue ? `<span class="overdue-badge">Overdue</span>` : ''}
                  </div>
                  <div class="todo-title ${task.completed ? 'completed' : ''}">${escapeHtml(task.title)}</div>
              </div>
              <div class="todo-actions" onclick="toggleTaskMenu(this)">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="12" cy="5" r="1"></circle><circle cx="12" cy="19" r="1"></circle></svg>
                  <div class="todo-dropdown">
                      <div class="todo-option" onclick="window.toggleTaskPin(event, '${task.id}', ${!task.pinned})">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="${task.pinned ? 'fill:currentColor' : ''}"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>
                         ${task.pinned ? 'Unpin' : 'Pin'}
                      </div>
                      <div class="todo-option edit" onclick="window.editTodoTask(event, '${task.id}')">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                         Edit
                      </div>
                      <div class="todo-option delete" onclick="window.deleteTodoTask(event, '${task.id}')">
                         <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                         Delete
                      </div>
                  </div>
              </div>
          `;
      container.appendChild(div);
    });
  }

  // Simple Escape to prevent XSS
  function escapeHtml(text) {
    if (!text) return text;
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function saveTask() {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // Get values
    const title = document.getElementById('taskTitle').value;
    const note = document.getElementById('taskNote').value;
    // Use ISO date from dataset
    const dateInput = document.getElementById('taskDate');
    const date = dateInput.dataset.iso;

    // Parse Time (Display "05:30 PM" -> Store "17:30")
    let time = document.getElementById('taskTime').value;
    if (time && time.includes(' ')) {
      const [t, amp] = time.split(' ');
      let [h, m] = t.split(':');
      h = parseInt(h);
      if (amp === 'PM' && h < 12) h += 12;
      if (amp === 'AM' && h === 12) h = 0;
      time = `${String(h).padStart(2, '0')}:${m}`;
    }
    const repeat = document.getElementById('taskRepeat').value;

    if (!title || !date) {
      alert('Please enter a title and date');
      return;
    }

    const taskData = {
      title, note, date, time, repeat,
      // If editing, preserve completed status (updated via separate call if needed, or assume false for new)
      // For updates, we should probably fetch existing or pass it in? 
      // Simplified: Just update fields. 'completed' is separate.
      // But for new task:
      updatedAt: firebase.database.ServerValue.TIMESTAMP
    };

    // For new tasks ONLY
    if (!editingTaskId) {
      taskData.completed = false;
      taskData.createdAt = firebase.database.ServerValue.TIMESTAMP;
    }

    const dbRef = firebase.database().ref(`users/${user.uid}/todo_tasks`);
    const promise = editingTaskId
      ? dbRef.child(editingTaskId).update(taskData)
      : dbRef.push(taskData);

    promise.then(() => {
      document.getElementById('addTaskModal').classList.add('hidden');
      document.getElementById('addTaskForm').reset();

      // Reset Edit State
      editingTaskId = null;
      document.querySelector('#addTaskModal .popup-title').textContent = 'Add New Task';
      document.querySelector('#addTaskModal button[type="submit"]').textContent = 'Add Task';
    });
  }


  // Expose functions globally for onclick handlers
  window.toggleTaskMenu = function (el) {
    if (!el) return;

    const dropdown = el.querySelector('.todo-dropdown');
    if (!dropdown) return;

    const isCurrentlyOpen = dropdown.classList.contains('show');

    // Close all other open dropdowns first
    document.querySelectorAll('.todo-dropdown.show').forEach(d => {
      if (d !== dropdown) d.classList.remove('show');
    });

    // Toggle current dropdown
    if (isCurrentlyOpen) {
      dropdown.classList.remove('show');
    } else {
      dropdown.classList.add('show');

      // Close when clicking outside
      const closeHandler = function (e) {
        if (!el.contains(e.target)) {
          dropdown.classList.remove('show');
          document.removeEventListener('click', closeHandler);
        }
      };

      // Delay adding listener to avoid immediate trigger
      setTimeout(() => {
        document.addEventListener('click', closeHandler);
      }, 10);
    }
  };


  window.deleteTodoTask = function (event, id) {
    // Stop all event propagation
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Close all open dropdowns immediately
    document.querySelectorAll('.todo-dropdown.show').forEach(d => {
      d.classList.remove('show');
    });

    const user = firebase.auth().currentUser;
    if (!user) return;

    firebase.database().ref(`users/${user.uid}/todo_tasks/${id}`).remove()
      .then(() => {
        console.log('Task deleted successfully');
      })
      .catch((error) => {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      });

    // Also close overview if open
    const overview = document.getElementById('taskOverviewModal');
    if (overview) overview.classList.add('hidden');
  };


  window.toggleTodoComplete = function (id, status) {
    // Stop propagation if needed (handled in html onclick)
    const user = firebase.auth().currentUser;
    if (!user) return;
    firebase.database().ref(`users/${user.uid}/todo_tasks/${id}`).update({ completed: status });
  };

  window.openTaskOverview = function (id) {
    const task = allTasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('taskOverviewTitle').textContent = task.title;
    document.getElementById('taskOverviewNote').textContent = task.note || 'No description provided.';

    // Date Format YYYY-MM-DD -> DD-MM-YYYY
    let dStr = task.date;
    const parts = task.date.split('-');
    if (parts.length === 3) dStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    if (task.date === new Date().toISOString().split('T')[0]) dStr = 'Today';

    document.getElementById('taskOverviewDate').textContent = dStr;

    // Format Time for Overview
    let timeDisplay = task.time || '-';
    let taskTimeMs = null;

    try {
      if (task.time) {
        const [h, m] = task.time.split(':');
        const suffix = h >= 12 ? 'PM' : 'AM';
        const hours = h % 12 || 12;
        timeDisplay = `${hours}:${m} ${suffix}`;

        // Calculate Timestamp for Countdown
        if (task.repeat === 'daily') {
          const now = new Date();
          const target = new Date();
          const [hh, mm] = (task.time || '23:59').split(':');
          target.setHours(parseInt(hh), parseInt(mm), 0, 0);
          if (target.getTime() < now.getTime()) {
            target.setDate(target.getDate() + 1);
          }
          taskTimeMs = target.getTime();
        } else {
          taskTimeMs = new Date(task.date + 'T' + task.time).getTime();
        }
      } else {
        // If no time
        if (task.repeat === 'daily') {
          const now = new Date();
          const target = new Date();
          target.setHours(23, 59, 0, 0); // End of day default
          if (target.getTime() < now.getTime()) target.setDate(target.getDate() + 1);
          taskTimeMs = target.getTime();
        } else {
          taskTimeMs = new Date(task.date + 'T23:59').getTime();
        }
      }
    } catch (e) { }
    document.getElementById('taskOverviewTime').textContent = timeDisplay;

    // Countdown / Status Logic
    // If element doesn't exist, create it dynamically under Time div
    let statusEl = document.getElementById('taskOverviewStatusLabel');
    if (!statusEl) {
      const timeDiv = document.getElementById('taskOverviewTime').parentNode;
      statusEl = document.createElement('div');
      statusEl.id = 'taskOverviewStatusLabel';
      statusEl.className = 'overview-status';
      timeDiv.appendChild(statusEl);
    }

    // Clear previous interval
    if (window.overviewTimerInterval) clearInterval(window.overviewTimerInterval);

    if (taskTimeMs && !task.completed) {
      const updateTimer = () => {
        const now = Date.now();
        const diff = taskTimeMs - now;

        if (diff < 0) {
          if (task.repeat === 'daily') {
            // If daily task passes, reset for next day immediately
            taskTimeMs += 24 * 60 * 60 * 1000;
            // Recursive call to update display immediately
            updateTimer();
          } else {
            // Overdue
            statusEl.textContent = 'Overdue';
            statusEl.style.color = '#E74C3C'; // Red
            clearInterval(window.overviewTimerInterval);
          }
        } else {
          // Future
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);

          let timeStr = '';
          if (h > 24) {
            const d = Math.floor(h / 24);
            const remH = h % 24;
            timeStr = `In ${d}d ${remH}h`; // e.g. In 2d 5h
          } else {
            // In 2h 30m 15s
            if (h > 0) timeStr += `${h}h `;
            if (m > 0 || h > 0) timeStr += `${m}m `;
            timeStr += `${s}s`;
            timeStr = 'In ' + timeStr;
          }

          statusEl.textContent = timeStr;
          statusEl.style.color = 'var(--accent)';
        }
      };

      // Run immediately
      updateTimer();
      // Start Interval
      window.overviewTimerInterval = setInterval(updateTimer, 1000);

    } else {
      statusEl.textContent = '';
    }


    const repeatEl = document.getElementById('taskOverviewRepeatSection');
    if (task.repeat && task.repeat !== 'no') {
      repeatEl.style.display = 'block';
      document.getElementById('taskOverviewRepeat').textContent = task.repeat.charAt(0).toUpperCase() + task.repeat.slice(1);
    } else {
      repeatEl.style.display = 'none';
    }


    // Show Modal
    const modal = document.getElementById('taskOverviewModal');
    modal.classList.remove('hidden');
    // small delay for transition if needed, but keeping it simple
    requestAnimationFrame(() => {
      modal.classList.add('showing');
    });
  };

  window.toggleTaskPin = function (event, id, status) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Close all open dropdowns
    document.querySelectorAll('.todo-dropdown.show').forEach(d => {
      d.classList.remove('show');
    });

    const user = firebase.auth().currentUser;
    if (!user) return;

    const updates = {
      pinned: status,
      pinnedAt: status ? firebase.database.ServerValue.TIMESTAMP : null
    };

    firebase.database().ref(`users/${user.uid}/todo_tasks/${id}`).update(updates);
  };



  window.deleteTodoTask = function (event, id) {
    // Stop all event propagation
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Close all open dropdowns immediately
    document.querySelectorAll('.todo-dropdown.show').forEach(d => {
      d.classList.remove('show');
    });

    const user = firebase.auth().currentUser;
    if (!user) return;

    firebase.database().ref(`users/${user.uid}/todo_tasks/${id}`).remove()
      .then(() => {
        console.log('Task deleted successfully');
      })
      .catch((error) => {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      });

    // Also close overview if open
    const overview = document.getElementById('taskOverviewModal');
    if (overview) overview.classList.add('hidden');
  };

  window.editTodoTask = function (event, id) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Close all open dropdowns
    document.querySelectorAll('.todo-dropdown.show').forEach(d => {
      d.classList.remove('show');
    });

    const task = allTasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;

    // Populate Form
    document.getElementById('taskTitle').value = task.title || '';
    document.getElementById('taskNote').value = task.note || '';

    // Handle Date for Custom Picker
    const dateInput = document.getElementById('taskDate');
    if (Date.parse(task.date)) {
      const dObj = new Date(task.date);
      // Use exposed helper to sync picker state
      if (window.updateDatePickerState) window.updateDatePickerState(dObj);

      if (window.formatDateDisplay) {
        dateInput.value = window.formatDateDisplay(dObj);
      } else {
        dateInput.value = task.date;
      }
      dateInput.dataset.iso = task.date;
    } else {
      dateInput.value = '';
    }

    // Format time for custom picker (HH:mm -> hh:mm AM/PM)
    if (task.time) {
      const [h, m] = task.time.split(':');
      const hour = parseInt(h);
      const suffix = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12; // 0 -> 12
      const displayTime = `${String(displayHour).padStart(2, '0')}:${m} ${suffix}`;
      document.getElementById('taskTime').value = displayTime;
    } else {
      document.getElementById('taskTime').value = '';
    }

    const repeatValue = task.repeat || 'once';
    const repeatHidden = document.getElementById('taskRepeat');
    const repeatDisplay = document.getElementById('taskRepeatValue');
    const repeatMenu = document.getElementById('taskRepeatMenu');

    if (repeatHidden) repeatHidden.value = repeatValue;

    // Update custom dropdown display and selected state
    if (repeatDisplay && repeatMenu) {
      const selectedItem = repeatMenu.querySelector(`[data-value="${repeatValue}"]`);
      if (selectedItem) {
        repeatDisplay.textContent = selectedItem.textContent;
        repeatMenu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
        selectedItem.classList.add('selected');
      }
    }

    // Update Modal UI
    document.querySelector('#addTaskModal .popup-title').textContent = 'Edit Task';
    document.querySelector('#addTaskModal button[type="submit"]').textContent = 'Save Changes';

    // Open Modal
    window.openAddTaskModal();
  };

  // Hook up the Open Add Task button to clear state
  // We can't easily find the button element if it's not ID'd or we don't want to querySelector every time. 
  // But we can expose a cleaner function.
  window.resetAddTaskState = function () {
    editingTaskId = null;
    document.getElementById('addTaskForm').reset();
    document.querySelector('#addTaskModal .popup-title').textContent = 'Add New Task';
    document.querySelector('#addTaskModal button[type="submit"]').textContent = 'Add Task';
    const dateInput = document.getElementById('taskDate');
    if (dateInput) {
      dateInput.value = '';
      delete dateInput.dataset.iso;
    }

    // Reset custom repeat dropdown to default (Once)
    const repeatHidden = document.getElementById('taskRepeat');
    const repeatDisplay = document.getElementById('taskRepeatValue');
    const repeatMenu = document.getElementById('taskRepeatMenu');

    if (repeatHidden) repeatHidden.value = 'once';
    if (repeatDisplay) repeatDisplay.textContent = 'Once';
    if (repeatMenu) {
      repeatMenu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
      const onceItem = repeatMenu.querySelector('[data-value="once"]');
      if (onceItem) onceItem.classList.add('selected');
    }
  };

  // Attach this reset to the main FAB or button if possible?
  // The user clicked "New Task" -> calls `window.openAddTaskModal()`.
  // Wait, `window.openAddTaskModal` is defined where? 
  // It was defined in lines 4740 in previous context. I should MODIFY it to call reset.
  // BUT I can't reach it easily here without redefining.
  // I will redefine `window.openAddTaskModal` here to wrap the logic if I can find the original reference, 
  // OR I will just rely on the onclick handler in HTML to key into `window.resetAddTaskState`?
  // User's HTML: `<button id="btnOpenAddTask" ... >`
  // I will attach a listener to `btnOpenAddTask` to reset state.

  const addTaskBtn = document.getElementById('btnOpenAddTask');
  if (addTaskBtn) {
    addTaskBtn.addEventListener('click', () => {
      window.resetAddTaskState();
      window.openAddTaskModal(); // Assuming this function exists globally from standard app.js
    });
  }

})();





// Initialize Custom Time Picker
function initCustomTimePicker() {
  const input = document.getElementById('taskTime');
  const wrapper = document.getElementById('timeInputWrapper');
  const picker = document.getElementById('customTimePicker');

  if (!input || !wrapper || !picker) return;

  const hoursCol = document.getElementById('timeHours');
  const minutesCol = document.getElementById('timeMinutes');
  const ampmItems = document.querySelectorAll('.timepicker-item-ampm');
  const setBtn = document.getElementById('timeSetBtn');

  // State
  let selectedHour = 12;
  let selectedMinute = 0;
  let selectedAmPm = 'AM';

  // Helper: Create spacer for scrolling alignment
  function createSpacer() {
    const div = document.createElement('div');
    div.style.height = '60px';
    div.style.flexShrink = '0';
    return div; // Allows scroller to center items
  }

  // Populate lists
  function populate() {
    // Hours 1-12
    hoursCol.innerHTML = '';
    hoursCol.appendChild(createSpacer());

    for (let i = 1; i <= 12; i++) {
      const div = document.createElement('div');
      div.className = 'timepicker-item';
      div.textContent = i.toString().padStart(2, '0');
      div.dataset.val = i;

      div.onclick = (e) => {
        e.stopPropagation();
        selectedHour = i;
        updateUI();
      };
      hoursCol.appendChild(div);
    }
    hoursCol.appendChild(createSpacer());


    // Minutes 00-59
    minutesCol.innerHTML = '';
    minutesCol.appendChild(createSpacer());

    for (let i = 0; i < 60; i++) {
      const div = document.createElement('div');
      div.className = 'timepicker-item';
      div.textContent = i.toString().padStart(2, '0');
      div.dataset.val = i;

      div.onclick = (e) => {
        e.stopPropagation();
        selectedMinute = i;
        updateUI();
      };
      minutesCol.appendChild(div);
    }
    minutesCol.appendChild(createSpacer());
  }

  function updateUI() {
    // Determine if Today is selected using robust ISO check
    const dateInput = document.getElementById('taskDate');
    let isToday = false;
    const now = new Date();

    if (dateInput) {
      // Use ISO data attribute set by the date picker for accuracy
      const isoDate = dateInput.dataset.iso; // YYYY-MM-DD
      const todayISO = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

      if (isoDate === todayISO) {
        isToday = true;
      } else if (!dateInput.value || dateInput.value === 'Today') { // Fallback & Default
        isToday = true;
      }
    }

    const currentH = now.getHours();
    const currentM = now.getMinutes();

    // Update Headers/Selection classes & Disabled state
    Array.from(hoursCol.children).forEach(child => {
      if (child.classList.contains('timepicker-item')) {
        const val = parseInt(child.dataset.val);
        child.classList.toggle('selected', val === selectedHour);

        let disabled = false;
        if (isToday && selectedAmPm) {
          let h24 = val % 12;
          if (selectedAmPm === 'PM') h24 += 12;
          if (selectedAmPm === 'AM' && val === 12) h24 = 0;
          if (selectedAmPm === 'PM' && val === 12) h24 = 12; // 12 PM is 12

          if (h24 < currentH) disabled = true;
        }
        child.classList.toggle('disabled', disabled);
      }
    });

    Array.from(minutesCol.children).forEach(child => {
      if (child.classList.contains('timepicker-item')) {
        const val = parseInt(child.dataset.val);
        child.classList.toggle('selected', val === selectedMinute);

        let disabled = false;
        if (isToday && selectedAmPm) {
          let h24 = selectedHour % 12;
          if (selectedAmPm === 'PM') h24 += 12;
          if (selectedAmPm === 'AM' && selectedHour === 12) h24 = 0;
          if (selectedAmPm === 'PM' && selectedHour === 12) h24 = 12;

          if (h24 < currentH) {
            disabled = true;
          } else if (h24 === currentH) {
            if (val < currentM) disabled = true;
          }
        }
        child.classList.toggle('disabled', disabled);
      }
    });

    ampmItems.forEach(item => {
      item.classList.toggle('selected', item.dataset.value === selectedAmPm);
    });

    // Scroll to selected
    const hEl = Array.from(hoursCol.children).find(c => parseInt(c.dataset.val) === selectedHour);
    if (hEl) {
      hoursCol.scrollTo({ top: hEl.offsetTop - hoursCol.offsetHeight / 2 + hEl.offsetHeight / 2, behavior: 'smooth' });
    }

    const mEl = Array.from(minutesCol.children).find(c => parseInt(c.dataset.val) === selectedMinute);
    if (mEl) {
      minutesCol.scrollTo({ top: mEl.offsetTop - minutesCol.offsetHeight / 2 + mEl.offsetHeight / 2, behavior: 'smooth' });
    }

    // Update input value
    const hh = selectedHour.toString().padStart(2, '0');
    const mm = selectedMinute.toString().padStart(2, '0');
    input.value = `${hh}:${mm} ${selectedAmPm}`;
  }

  // AM/PM click
  ampmItems.forEach(item => {
    item.onclick = (e) => {
      e.stopPropagation();
      selectedAmPm = item.dataset.value;
      updateUI();
    };
  });

  // Helper to adjust position For Time Picker
  function adjustPosition(triggerEl, pickerEl) {
    const rect = triggerEl.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const pickerHeight = 250; // Avg height of time picker

    if (spaceBelow < pickerHeight && rect.top > pickerHeight) {
      // Open Upwards
      pickerEl.style.top = 'auto';
      pickerEl.style.bottom = '100%';
      pickerEl.style.marginTop = '0';
      pickerEl.style.marginBottom = '-15px';
      pickerEl.style.transformOrigin = 'bottom center';
    } else {
      // Open Downwards (Default)
      pickerEl.style.top = '100%';
      pickerEl.style.bottom = 'auto';
      pickerEl.style.marginTop = '4px';
      pickerEl.style.marginBottom = '0';
      pickerEl.style.transformOrigin = 'top center';
    }
  }

  // Trigger Open
  wrapper.onclick = (e) => {
    e.stopPropagation();
    // Close date picker if open
    const datePicker = document.getElementById('customDatePicker');
    if (datePicker) {
      datePicker.classList.remove('showing');
      setTimeout(() => datePicker.classList.add('hidden'), 200);
    }

    if (picker.classList.contains('showing')) {
      picker.classList.remove('showing');
      setTimeout(() => picker.classList.add('hidden'), 200);
    } else {
      picker.classList.remove('hidden');
      adjustPosition(wrapper, picker); // Dynamic positioning
      // Force Reflow
      void picker.offsetWidth;
      picker.classList.add('showing');

      // Init logic: parse current value or default to now
      if (!input.value) {
        const now = new Date();
        let h = now.getHours();
        const m = now.getMinutes();
        selectedAmPm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        selectedHour = h;
        selectedMinute = m;
      } else {
        // Parse existing value "05:30 PM"
        const parts = input.value.split(' '); // ["05:30", "PM"]
        if (parts.length === 2) {
          selectedAmPm = parts[1];
          const timeParts = parts[0].split(':');
          if (timeParts.length === 2) {
            selectedHour = parseInt(timeParts[0]);
            selectedMinute = parseInt(timeParts[1]);
          }
        }
      }
      populate();
      setTimeout(updateUI, 50); // Delay for layout
    }
  };

  // Done btn
  setBtn.onclick = (e) => {
    e.stopPropagation();
    picker.classList.remove('showing');
    setTimeout(() => picker.classList.add('hidden'), 200);
  };

  // Outside click (reuse existing listener or add strict one)
  document.addEventListener('click', (e) => {
    if (picker.classList.contains('showing') &&
      !wrapper.contains(e.target) &&
      !picker.contains(e.target)) {
      picker.classList.remove('showing');
      setTimeout(() => picker.classList.add('hidden'), 200);
    }
  });

  // Initial populate to ensure lists are ready
  populate();

  // Expose initBookingQueryUI globally so it can be called from handleBookingClick
  // (The actual function is defined earlier in the code around line 1655)
  window.initBookingQueryUI = initBookingQueryUI;
}

// Support Form Logic (Web3Forms)
function initSupportForm() {
  const form = document.getElementById('supportForm');
  if (!form) return;

  // Toggle Logic
  const btnBug = document.getElementById('supportTypeBug');
  const btnReview = document.getElementById('supportTypeReview');
  const inputType = document.getElementById('supportTypeInput');
  const subjectField = document.getElementById('supportSubjectField');
  const ratingField = document.getElementById('supportRatingField');
  const subjectInput = document.getElementById('supportSubject');

  if (btnBug && btnReview && inputType) {
    btnBug.addEventListener('click', () => {
      btnBug.classList.add('active');
      btnReview.classList.remove('active');
      inputType.value = 'bug_report';
      if (subjectField) subjectField.style.display = 'block';
      if (ratingField) ratingField.style.display = 'none';
      if (subjectInput) subjectInput.required = true;
    });

    btnReview.addEventListener('click', () => {
      btnReview.classList.add('active');
      btnBug.classList.remove('active');
      inputType.value = 'review';
      if (subjectField) subjectField.style.display = 'none';
      if (ratingField) ratingField.style.display = 'block';
      if (subjectInput) subjectInput.required = false;
    });
  }

  // Star Rating Logic
  const stars = document.querySelectorAll('.star');
  const ratingInput = document.getElementById('supportRatingValue');
  if (stars.length > 0 && ratingInput) {
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = star.dataset.value;
        ratingInput.value = val;
        stars.forEach(s => {
          // Reset all first
          s.style.color = '#ccc'; // Default gray
          s.style.cursor = 'pointer';
        });
        // Color active ones
        stars.forEach(s => {
          if (s.dataset.value <= val) s.style.color = '#FFD700'; // Gold
        });
      });
      // Init style
      star.style.color = '#ccc';
      star.style.cursor = 'pointer';
    });
  }

  // Form Submission
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const statusEl = document.getElementById('supportStatusMessage');
    const submitBtn = document.getElementById('supportSubmitBtn');

    // Validation for Rating
    if (inputType.value === 'review' && (ratingInput.value === '0' || !ratingInput.value)) {
      if (statusEl) {
        statusEl.textContent = 'Please select a star rating.';
        statusEl.style.color = '#e74c3c';
      }
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.style.color = 'var(--text)';
    }

    const type = inputType.value;
    const message = document.getElementById('supportMessage').value;
    const subject = document.getElementById('supportSubject').value;

    // Try to get user name if available (firebase)
    let userName = 'Anonymous';
    if (window.firebase && window.firebase.auth().currentUser) {
      userName = window.firebase.auth().currentUser.displayName || window.firebase.auth().currentUser.email || 'User';
    }

    // Format Message Type nicely (bug_report -> Bug report, review -> Review)
    let typeDisplay = type;
    if (type === 'bug_report') typeDisplay = 'Bug report';
    else if (type === 'review') typeDisplay = 'Review';

    // Construct formatted message
    const formattedMessage = `Message Type: ${typeDisplay}

    Subject: ${type === 'review' ? `New Review (${ratingInput.value} Stars)` : subject}

    Message: ${message}`;

    const payload = {
      access_key: '8797a755-2194-4c76-a5c7-24c4b53754cb',
      from_name: userName,
      subject: type === 'review' ? `New Review (${ratingInput.value} Stars)` : `Support: ${subject}`,
      message: formattedMessage,
      botcheck: ''
    };

    const json = JSON.stringify(payload);

    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: json
    })
      .then(async (response) => {
        if (response.status === 200) {
          if (statusEl) {
            statusEl.textContent = 'Message sent successfully!';
            statusEl.style.color = '#2ecc71';
          }
          form.reset();
          // Reset UI elements
          if (btnBug) btnBug.click(); // Reset to Bug view
          // Reset stars
          if (stars.length > 0) {
            stars.forEach(s => s.style.color = '#ccc');
            ratingInput.value = '0';
          }
        } else {
          console.log(response);
          if (statusEl) {
            statusEl.textContent = 'Something went wrong!';
            statusEl.style.color = '#e74c3c';
          }
        }
      })
      .catch(error => {
        console.log(error);
        if (statusEl) {
          statusEl.textContent = 'Error sending message.';
          statusEl.style.color = '#e74c3c';
        }
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Report';
        }
        setTimeout(() => {
          if (statusEl) statusEl.textContent = '';
        }, 5000);
      });
  });
}

// Initialize when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSupportForm);
} else {
  initSupportForm();
}

// ==========================================
// SETTINGS & THEME IMPLEMENTATION
// ==========================================

function initSettings() {
  const db = window.firebase ? window.firebase.database() : null;
  const settingsOption = document.getElementById('settingsOption');
  const settingsModal = document.getElementById('settingsModal');
  const settingsClose = document.getElementById('settingsModalClose');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const clearCacheBtn = document.getElementById('clearCacheBtn');

  // 1. Modal Logic
  if (settingsOption && settingsModal) {
    settingsOption.onclick = () => {
      // Update Last Selection Date
      const lastDate = localStorage.getItem('cse.lastSelectionDate');
      const lastDateEl = document.getElementById('lastSelectionDate');
      if (lastDateEl) {
        if (lastDate) {
          try {
            const dateObj = new Date(lastDate);
            // Format: Oct 24, 2024, 10:30 AM
            lastDateEl.textContent = dateObj.toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch (e) {
            lastDateEl.textContent = 'Unknown';
          }
        } else {
          lastDateEl.textContent = 'Never';
        }
      }

      settingsModal.classList.remove('hidden');
      setTimeout(() => settingsModal.classList.add('showing'), 10);
    };
  }

  // Load App Version
  if (db) {
    db.ref('settings/appVersion').on('value', snap => {
      const ver = snap.val() || 'Version 1.0';
      const aboutEl = document.getElementById('aboutPageVersionDisplay');
      const settingsEl = document.getElementById('settingsAppVersionDisplay');
      if (aboutEl) aboutEl.textContent = ver;
      if (settingsEl) settingsEl.textContent = ver;
    });
  }

  if (settingsClose && settingsModal) {
    settingsClose.onclick = () => {
      settingsModal.classList.remove('showing');
      setTimeout(() => settingsModal.classList.add('hidden'), 200);
    };
  }

  // 2. Dark Mode Logic
  // Check saved state or default to Dark (checked = dark)
  const savedTheme = localStorage.getItem('appTheme') || 'dark'; // 'dark' is default

  function applyTheme(theme) {
    // Headers
    const headerIconStudent = document.getElementById('headerIconStudent');
    const headerIconTeacher = document.getElementById('headerIconTeacher');
    const headerIconMore = document.getElementById('headerIconMore');
    const headerIconQuery = document.getElementById('headerIconQuery');

    // Tabs
    const tabStudent = document.getElementById('student-icon');
    const tabTeacher = document.getElementById('teacher-icon');
    const tabMore = document.getElementById('more-icon');
    const tabQuery = document.getElementById('query-icon');

    if (theme === 'light') {
      document.body.classList.add('light-mode');
      if (darkModeToggle) darkModeToggle.checked = false;

      // Swap to Black Icons (Light Mode)
      if (headerIconStudent) headerIconStudent.src = 'attachment/student_black.png';
      if (headerIconTeacher) headerIconTeacher.src = 'attachment/id-card_black.png';
      if (headerIconMore) headerIconMore.src = 'attachment/application_black.png';
      if (headerIconQuery) headerIconQuery.src = 'attachment/search-file_black.png';

    } else {
      document.body.classList.remove('light-mode');
      if (darkModeToggle) darkModeToggle.checked = true;

      // Headers
      if (headerIconStudent) headerIconStudent.src = 'attachment/student_white.png';
      if (headerIconTeacher) headerIconTeacher.src = 'attachment/id-card_white.png';
      if (headerIconMore) headerIconMore.src = 'attachment/application_white.png';
      if (headerIconQuery) headerIconQuery.src = 'attachment/search-file_white.png';


    }
  }

  // Apply initially
  applyTheme(savedTheme);

  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', (e) => {
      if (e.target.checked) {
        // Dark Mode
        applyTheme('dark');
        localStorage.setItem('appTheme', 'dark');
      } else {
        // Light Mode
        applyTheme('light');
        localStorage.setItem('appTheme', 'light');
      }
    });
  }

  // 3. Clear Cache Logic
  if (clearCacheBtn) {
    clearCacheBtn.onclick = () => {
      // Capture current theme
      const currentTheme = localStorage.getItem('appTheme');

      // Explicitly remove critical keys to ensure they are gone
      localStorage.removeItem('cse.department');
      localStorage.removeItem('cse.semester');
      localStorage.removeItem('cse.section');
      localStorage.removeItem('cse.hasVisited');
      localStorage.removeItem('cse.hasVisitedNEW');
      localStorage.removeItem('cse.lastTeacher');
      localStorage.removeItem('cse.lastTeacherDept');

      // Clear everything else
      localStorage.clear();

      // Restore theme if it existed
      if (currentTheme) {
        localStorage.setItem('appTheme', currentTheme);
      }

      // Visual Feedback: Change text and disable to show success
      // No automatic reload as requested
      clearCacheBtn.textContent = 'Cleared';
      clearCacheBtn.disabled = true;
    };
  }
}

// Initialize Settings
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSettings);
} else {
  initSettings();
}

// ========================================
// NOTICE SECTION IMPLEMENTATION
// ========================================

(function () {
  // Notice state
  let allNotices = [];
  let userReadNotices = new Set();
  let currentFilter = 'all';
  let currentUser = null;
  let userDepartment = '';
  let userSemester = '';
  let userSection = '';
  let activeNoticeRef = null; // Track active listener

  // Elements
  const noticeElements = {
    screen: document.getElementById('notice'),
    backBtn: document.getElementById('noticeBackBtn'),
    menuOption: document.getElementById('noticeMenuOption'),
    filterTabs: document.querySelectorAll('.notice-filter-tab'),
    markAllReadBtn: document.getElementById('markAllReadBtn'),
    noticesList: document.getElementById('noticesList'),
    noticesEmpty: document.getElementById('noticesEmpty'),
    noticesLoading: document.getElementById('noticesLoading'),
    detailModal: document.getElementById('noticeDetailModal'),
    detailClose: document.getElementById('noticeDetailClose'),
    detailTitle: document.getElementById('noticeDetailTitle'),
    detailDate: document.getElementById('noticeDetailDate'),
    detailAuthor: document.getElementById('noticeDetailAuthor'),
    detailTarget: document.getElementById('noticeDetailTarget'),
    detailContent: document.getElementById('noticeDetailContent'),
    countAll: document.getElementById('countAll'),
    countUnread: document.getElementById('countUnread'),
    countRead: document.getElementById('countRead')
  };

  // Initialize notice section
  function initNoticeSection() {
    if (!noticeElements.screen) return;

    // Back button
    if (noticeElements.backBtn) {
      noticeElements.backBtn.onclick = () => {
        if (typeof window.setScreen === 'function') {
          window.setScreen('more');
        }
      };
    }

    // Menu option click
    if (noticeElements.menuOption) {
      noticeElements.menuOption.onclick = () => {
        if (typeof window.setScreen === 'function') {
          window.setScreen('notice');
        }
        loadNotices();
      };
    }

    // Filter tabs
    noticeElements.filterTabs.forEach(tab => {
      tab.onclick = () => {
        const filter = tab.dataset.filter;
        currentFilter = filter;

        // Update active state
        noticeElements.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Render filtered notices
        renderNotices();
      };
    });

    // Mark all read button
    if (noticeElements.markAllReadBtn) {
      noticeElements.markAllReadBtn.onclick = () => {
        markAllAsRead();
      };
    }

    // Close modal
    if (noticeElements.detailClose) {
      noticeElements.detailClose.onclick = () => {
        closeNoticeModal();
      };
    }

    // Close modal on overlay click
    if (noticeElements.detailModal) {
      noticeElements.detailModal.onclick = (e) => {
        if (e.target === noticeElements.detailModal || e.target.classList.contains('notice-modal-overlay')) {
          closeNoticeModal();
        }
      };
    }

    // Listen for auth state
    if (window.firebase && window.firebase.auth()) {
      window.firebase.auth().onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
          loadUserData();
        }
      });
    }
  }

  // Load user data
  function loadUserData() {
    if (!currentUser || !window.firebase) return;

    const db = window.firebase.database();
    db.ref(`users/${currentUser.uid}`).once('value', snapshot => {
      const userData = snapshot.val();
      if (userData) {
        userDepartment = userData.department || userData.dept || '';
        userSemester = userData.semester || userData.text_semester || '';
        userSection = userData.section || '';
        userReadNotices = new Set(userData.readNotices || []);
      }
    });
  }

  // Load notices from Firebase
  function loadNotices() {
    if (!window.firebase || !currentUser) return;

    // Show loading
    if (noticeElements.noticesLoading) {
      noticeElements.noticesLoading.classList.remove('hidden');
    }
    if (noticeElements.noticesEmpty) {
      noticeElements.noticesEmpty.classList.add('hidden');
    }
    if (noticeElements.noticesList) {
      noticeElements.noticesList.innerHTML = '';
    }

    const db = window.firebase.database();

    // Load user data first
    db.ref(`users/${currentUser.uid}`).once('value', userSnapshot => {
      const userData = userSnapshot.val();
      if (userData) {
        userDepartment = userData.department || userData.dept || '';
        // Handle both semester formats (admin writes text_semester)
        userSemester = userData.semester || userData.text_semester || '';
        userSection = userData.section || '';
        userReadNotices = new Set(userData.readNotices || []);

        console.log('User Data:', {
          department: userDepartment,
          semester: userSemester,
          section: userSection
        });
      }

      // Then load notices (Real-time)
      if (activeNoticeRef) {
        activeNoticeRef.off();
      }

      activeNoticeRef = db.ref('notices').orderByChild('published').equalTo(true);

      activeNoticeRef.on('value', snapshot => {
        allNotices = [];

        snapshot.forEach(child => {
          const notice = { id: child.key, ...child.val() };

          // Check if notice is for this user
          if (isNoticeForUser(notice)) {
            allNotices.push(notice);
          }
        });

        // Sort by date (newest first)
        allNotices.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Hide loading
        if (noticeElements.noticesLoading) {
          noticeElements.noticesLoading.classList.add('hidden');
        }

        // Render notices
        renderNotices();
      });
    });
  }

  // Check if notice is for current user
  function isNoticeForUser(notice) {
    if (notice.targetType === 'university') {
      return true;
    }

    if (notice.targetType === 'department') {
      return (notice.targetDepartment || '').trim() === (userDepartment || '').trim();
    }

    if (notice.targetType === 'semester') {
      return (notice.targetDepartment || '').trim() === (userDepartment || '').trim() &&
        (notice.targetSemester || '').trim() === (userSemester || '').trim();
    }

    if (notice.targetType === 'section') {
      return (notice.targetDepartment || '').trim() === (userDepartment || '').trim() &&
        (notice.targetSemester || '').trim() === (userSemester || '').trim() &&
        (notice.targetSection || '').trim() === (userSection || '').trim();
    }

    return false;
  }

  // Render notices
  function renderNotices() {
    if (!noticeElements.noticesList) return;

    // Filter notices
    let filteredNotices = allNotices;
    if (currentFilter === 'unread') {
      filteredNotices = allNotices.filter(n => !userReadNotices.has(n.id));
    } else if (currentFilter === 'read') {
      filteredNotices = allNotices.filter(n => userReadNotices.has(n.id));
    }

    // Update counts
    const unreadCount = allNotices.filter(n => !userReadNotices.has(n.id)).length;
    const readCount = allNotices.filter(n => userReadNotices.has(n.id)).length;

    if (noticeElements.countAll) noticeElements.countAll.textContent = allNotices.length;
    if (noticeElements.countUnread) noticeElements.countUnread.textContent = unreadCount;
    if (noticeElements.countRead) noticeElements.countRead.textContent = readCount;

    // Show empty state if no notices
    if (filteredNotices.length === 0) {
      noticeElements.noticesList.innerHTML = '';
      if (noticeElements.noticesEmpty) {
        noticeElements.noticesEmpty.classList.remove('hidden');
      }
      return;
    }

    // Hide empty state
    if (noticeElements.noticesEmpty) {
      noticeElements.noticesEmpty.classList.add('hidden');
    }

    // Render notice cards
    noticeElements.noticesList.innerHTML = filteredNotices.map(notice => {
      const isUnread = !userReadNotices.has(notice.id);
      const isUrgent = notice.priority === 'urgent';
      const date = notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'Unknown';

      return `
        <div class="notice-card ${isUnread ? 'unread' : ''} ${isUrgent ? 'urgent' : ''}" onclick="window.openNoticeDetail('${notice.id}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px;">
            <div style="flex:1;">
              <span class="notice-card-title" style="margin-right:8px;">${escapeHtml(notice.title)}</span>
              ${isUrgent ? '<span class="notice-badge urgent" style="display:inline-block;vertical-align:text-bottom;">URGENT</span>' : ''}
            </div>
            ${isUnread ? '<div style="flex-shrink:0;"><span class="notice-badge unread-indicator">NEW</span></div>' : ''}
          </div>
          <div class="notice-card-content">${escapeHtml(notice.content)}</div>
          <div class="notice-card-footer">
            <div class="notice-card-meta">
              <div class="notice-card-meta-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                ${date}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Get target badge HTML
  function getTargetBadge(notice) {
    // Helper to convert semester code to name
    const getSemesterName = (sem) => {
      const semesterMap = {
        '1-1': '1st Sem',
        '1-2': '2nd Sem',
        '2-1': '3rd Sem',
        '2-2': '4th Sem',
        '3-1': '5th Sem',
        '3-2': '6th Sem',
        '4-1': '7th Sem',
        '4-2': '8th Sem'
      };
      return semesterMap[sem] || sem;
    };

    if (notice.targetType === 'university') {
      return '<span class="notice-badge university">ALL UNIVERSITY</span>';
    } else if (notice.targetType === 'department') {
      return `<span class="notice-badge department">${notice.targetDepartment}</span>`;
    } else if (notice.targetType === 'semester') {
      return `<span class="notice-badge semester">${notice.targetDepartment} - ${getSemesterName(notice.targetSemester)}</span>`;
    } else if (notice.targetType === 'section') {
      return `<span class="notice-badge section">${notice.targetDepartment} - ${getSemesterName(notice.targetSemester)} - ${notice.targetSection}</span>`;
    }
    return '';
  }

  // Open notice detail modal
  window.openNoticeDetail = function (noticeId) {
    const notice = allNotices.find(n => n.id === noticeId);
    if (!notice) return;

    // Mark as read
    markAsRead(noticeId);

    // Populate modal
    if (noticeElements.detailTitle) {
      noticeElements.detailTitle.textContent = notice.title;
    }
    if (noticeElements.detailDate) {
      const date = notice.createdAt ? new Date(notice.createdAt).toLocaleDateString() : 'Unknown';
      noticeElements.detailDate.textContent = date;
    }
    // Author and Target removed as per request
    if (noticeElements.detailAuthor) {
      // noticeElements.detailAuthor.textContent = notice.authorName || 'Admin';
    }
    if (noticeElements.detailTarget) {
      // noticeElements.detailTarget.textContent = getTargetText(notice);
    }
    if (noticeElements.detailContent) {
      noticeElements.detailContent.textContent = notice.content;
    }

    // Show modal
    if (noticeElements.detailModal) {
      noticeElements.detailModal.classList.remove('hidden');
    }
  };

  // Get target text
  function getTargetText(notice) {
    // Helper to convert semester code to name
    const getSemesterName = (sem) => {
      const semesterMap = {
        '1-1': '1st Semester',
        '1-2': '2nd Semester',
        '2-1': '3rd Semester',
        '2-2': '4th Semester',
        '3-1': '5th Semester',
        '3-2': '6th Semester',
        '4-1': '7th Semester',
        '4-2': '8th Semester'
      };
      return semesterMap[sem] || sem;
    };

    if (notice.targetType === 'university') {
      return 'All University Students';
    } else if (notice.targetType === 'department') {
      return `${notice.targetDepartment} Department`;
    } else if (notice.targetType === 'semester') {
      return `${notice.targetDepartment} - ${getSemesterName(notice.targetSemester)}`;
    } else if (notice.targetType === 'section') {
      return `${notice.targetDepartment} - ${getSemesterName(notice.targetSemester)} - Section ${notice.targetSection}`;
    }
    return '';
  }

  // Close notice modal
  function closeNoticeModal() {
    if (noticeElements.detailModal) {
      noticeElements.detailModal.classList.add('hidden');
    }
  }

  // Mark notice as read
  function markAsRead(noticeId) {
    if (!currentUser || !window.firebase || userReadNotices.has(noticeId)) return;

    userReadNotices.add(noticeId);

    // Update Firebase
    const db = window.firebase.database();
    db.ref(`users/${currentUser.uid}/readNotices`).set(Array.from(userReadNotices));

    // Re-render
    renderNotices();
  }

  // Mark all as read
  function markAllAsRead() {
    if (!currentUser || !window.firebase) return;

    allNotices.forEach(notice => {
      userReadNotices.add(notice.id);
    });

    // Update Firebase
    const db = window.firebase.database();
    db.ref(`users/${currentUser.uid}/readNotices`).set(Array.from(userReadNotices));

    // Re-render
    renderNotices();
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNoticeSection);
  } else {
    initNoticeSection();
  }
})();

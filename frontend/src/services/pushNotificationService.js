// Push Notification Service
// Handles browser push notifications that work even when tab is not active

class PushNotificationService {
  constructor() {
    this.isSupported = 'Notification' in window;
    this.permission = this.isSupported ? Notification.permission : 'denied';
    this.registrationAttempted = false;
  }

  /**
   * Check if push notifications are supported
   */
  isNotificationSupported() {
    return this.isSupported;
  }

  /**
   * Get current permission status
   */
  getPermissionStatus() {
    return this.isSupported ? Notification.permission : 'denied';
  }

  /**
   * Show permission request modal (custom UI)
   */
  showPermissionModal() {
    return new Promise((resolve) => {
      // Create custom modal for better UX
      const modal = document.createElement('div');
      modal.id = 'notification-permission-modal';
      modal.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 400px;
            margin: 20px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            text-align: center;
          ">
            <div style="
              width: 64px;
              height: 64px;
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 24px auto;
              font-size: 28px;
            ">
              🔔
            </div>
            
            <h2 style="
              margin: 0 0 16px 0;
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
            ">
              Stay Updated!
            </h2>
            
            <p style="
              margin: 0 0 24px 0;
              color: #6b7280;
              line-height: 1.6;
              font-size: 16px;
            ">
              Get instant notifications about your exams, results, and important updates - even when this tab isn't active.
            </p>
            
            <div style="
              display: flex;
              gap: 12px;
              justify-content: center;
            ">
              <button id="allow-notifications" style="
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                🔔 Allow Notifications
              </button>
              
              <button id="deny-notifications" style="
                background: #f3f4f6;
                color: #6b7280;
                border: none;
                padding: 12px 24px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                font-size: 14px;
                transition: transform 0.2s ease;
              " onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                Not Now
              </button>
            </div>
            
            <p style="
              margin: 16px 0 0 0;
              color: #9ca3af;
              font-size: 12px;
              line-height: 1.4;
            ">
              💡 You can always change this in your browser settings later
            </p>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      // Handle allow button
      document.getElementById('allow-notifications').onclick = async () => {
        document.body.removeChild(modal);
        
        // Immediately request browser permission
        try {
          const permission = await Notification.requestPermission();
          console.log('Browser permission result:', permission);
          resolve(permission);
        } catch (error) {
          console.error('Permission request failed:', error);
          resolve('denied');
        }
      };

      // Handle deny button
      document.getElementById('deny-notifications').onclick = () => {
        document.body.removeChild(modal);
        resolve('deny');
      };

      // Handle click outside modal
      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve('deny');
        }
      };
    });
  }

  /**
   * Request notification permission with custom UI
   */
  async requestPermission() {
    if (!this.isSupported) {
      console.log('Push notifications not supported');
      return 'denied';
    }

    if (this.permission === 'granted') {
      console.log('✅ Push notifications already enabled!');
      this.showWelcomeNotification();
      return 'granted';
    }

    if (this.permission === 'denied') {
      console.log('❌ Push notifications previously denied');
      // Still show modal to let user know they can enable in browser settings
      alert('🔔 Push notifications are disabled.\n\nTo enable them:\n1. Click the 🔒 icon in your address bar\n2. Set Notifications to "Allow"\n3. Refresh the page');
      return 'denied';
    }

    try {
      console.log('📱 Requesting notification permission...');
      
      // Show custom modal and handle permission in one step
      const permission = await this.showPermissionModal();
      
      if (permission === 'granted') {
        console.log('✅ Push notifications enabled!');
        this.permission = permission;
        this.showWelcomeNotification();
        return permission;
      } else if (permission === 'denied') {
        console.log('❌ Push notifications denied by user');
        this.permission = permission;
        return permission;
      } else {
        console.log('👋 User declined notifications');
        return 'denied';
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show welcome notification after permission granted
   */
  showWelcomeNotification() {
    if (this.permission === 'granted') {
      new Notification('🎉 Notifications Enabled!', {
        body: 'You\'ll now receive instant updates about your exams and results.',
        icon: '/favicon.ico',
        tag: 'welcome',
        requireInteraction: false
      });
    }
  }

  /**
   * Show push notification
   */
  showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.log('Cannot show notification - permission not granted');
      return null;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      silent: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto close after 5 seconds unless requireInteraction is true
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  /**
   * Show notification based on type with appropriate styling
   */
  showTypedNotification(notification) {
    if (this.permission !== 'granted') return null;

    const typeConfig = {
      'USER_REGISTERED': {
        icon: '🎉',
        requireInteraction: false,
        silent: false
      },
      'EMAIL_VERIFIED': {
        icon: '✅',
        requireInteraction: false,
        silent: false
      },
      'BOOKING_CONFIRMED': {
        icon: '📅',
        requireInteraction: true,
        silent: false
      },
      'PAYMENT_SUCCESS': {
        icon: '💳',
        requireInteraction: false,
        silent: false
      },
      'PAYMENT_FAILED': {
        icon: '⚠️',
        requireInteraction: true,
        silent: false
      },
      'EXAM_STARTED': {
        icon: '📝',
        requireInteraction: true,
        silent: false
      },
      'EXAM_COMPLETED': {
        icon: '🎯',
        requireInteraction: false,
        silent: false
      },
      'CERTIFICATE_READY': {
        icon: '🏆',
        requireInteraction: true,
        silent: false
      },
      'EXAM_REMINDER': {
        icon: '⏰',
        requireInteraction: true,
        silent: false
      },
      'SYSTEM_ALERT': {
        icon: '🚨',
        requireInteraction: true,
        silent: false
      }
    };

    const config = typeConfig[notification.type] || {
      icon: '🔔',
      requireInteraction: false,
      silent: false
    };

    return this.showNotification(notification.title, {
      body: notification.message,
      icon: `/favicon.ico`,
      tag: notification.id,
      data: notification.data,
      ...config
    });
  }

  /**
   * Check if should show permission request
   */
  shouldRequestPermission() {
    return (
      this.isSupported &&
      this.permission === 'default' &&
      !this.registrationAttempted &&
      !localStorage.getItem('notification-permission-asked')
    );
  }

  /**
   * Mark permission as asked to avoid repeated prompts
   */
  markPermissionAsked() {
    this.registrationAttempted = true;
    localStorage.setItem('notification-permission-asked', 'true');
    localStorage.setItem('notification-permission-asked-at', Date.now().toString());
  }

  /**
   * Check if enough time has passed to ask again (7 days)
   */
  canAskAgain() {
    const lastAsked = localStorage.getItem('notification-permission-asked-at');
    if (!lastAsked) return true;
    
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return parseInt(lastAsked) < sevenDaysAgo;
  }

  /**
   * Initialize push notification service
   */
  async initialize() {
    if (!this.isSupported) {
      console.log('Push notifications not supported in this browser');
      return false;
    }

    this.permission = Notification.permission;

    // If permission already granted, we're good
    if (this.permission === 'granted') {
      console.log('✅ Push notifications already enabled');
      return true;
    }

    // If permission denied and we can't ask again, skip
    if (this.permission === 'denied' || !this.canAskAgain()) {
      console.log('Push notifications denied or asked recently');
      return false;
    }

    // Ask for permission after a short delay (better UX)
    setTimeout(() => {
      if (this.shouldRequestPermission()) {
        this.requestPermission().then(() => {
          this.markPermissionAsked();
        });
      }
    }, 3000); // 3 second delay

    return this.permission === 'granted';
  }

  /**
   * Show notification permission banner (alternative to modal)
   */
  showPermissionBanner() {
    if (!this.shouldRequestPermission()) return;

    const banner = document.createElement('div');
    banner.id = 'notification-banner';
    banner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        padding: 16px;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 20px;">🔔</span>
          <div>
            <div style="font-weight: 600; font-size: 14px;">Stay updated with notifications</div>
            <div style="font-size: 12px; opacity: 0.9;">Get instant alerts about your exams and results</div>
          </div>
        </div>
        
        <div style="display: flex; gap: 8px; align-items: center;">
          <button id="enable-notifications-banner" style="
            background: rgba(255, 255, 255, 0.2);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 12px;
            backdrop-filter: blur(10px);
          ">
            Enable
          </button>
          <button id="close-notification-banner" style="
            background: none;
            color: white;
            border: none;
            padding: 8px;
            cursor: pointer;
            font-size: 16px;
            opacity: 0.8;
          ">
            ×
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    // Handle enable button
    document.getElementById('enable-notifications-banner').onclick = () => {
      document.body.removeChild(banner);
      this.requestPermission().then(() => {
        this.markPermissionAsked();
      });
    };

    // Handle close button
    document.getElementById('close-notification-banner').onclick = () => {
      document.body.removeChild(banner);
      this.markPermissionAsked();
    };

    // Auto hide after 10 seconds
    setTimeout(() => {
      if (document.getElementById('notification-banner')) {
        document.body.removeChild(banner);
        this.markPermissionAsked();
      }
    }, 10000);
  }
}

export default PushNotificationService;
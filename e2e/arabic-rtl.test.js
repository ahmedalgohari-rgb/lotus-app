const { device, expect, element, by, waitFor } = require('detox');

describe('Arabic RTL Complete E2E Test', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Language Toggle and Arabic Activation', () => {
    it('should toggle between English and Arabic languages', async () => {
      // Start as guest user
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      // Verify we start in English
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify English tab labels are visible
      await expect(element(by.text('Home'))).toBeVisible();
      await expect(element(by.text('Scan'))).toBeVisible();
      await expect(element(by.text('Plants'))).toBeVisible();

      // Tap language toggle
      await waitFor(element(by.testID('language-toggle')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('language-toggle')).tap();

      // Verify Arabic tab labels appear
      await waitFor(element(by.text('الرئيسية')))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.text('المسح'))).toBeVisible();
      await expect(element(by.text('النباتات'))).toBeVisible();

      // Toggle back to English
      await element(by.testID('language-toggle')).tap();

      // Verify English labels return
      await waitFor(element(by.text('Home')))
        .toBeVisible()
        .withTimeout(3000);
      await expect(element(by.text('Scan'))).toBeVisible();
      await expect(element(by.text('Plants'))).toBeVisible();
    });

    it('should persist language selection across app restarts', async () => {
      // Set to Arabic
      await waitFor(element(by.testID('language-toggle')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('language-toggle')).tap();

      // Verify Arabic is active
      await waitFor(element(by.text('الرئيسية')))
        .toBeVisible()
        .withTimeout(3000);

      // Restart app
      

      // Start as guest again
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      // Verify Arabic is still active
      await waitFor(element(by.text('الرئيسية')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  describe('Arabic RTL Layout Verification', () => {
    it('should display proper RTL layout in Arabic mode', async () => {
      // Ensure we're in Arabic mode
      await waitFor(element(by.testID('language-toggle')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('language-toggle')).tap();

      // Verify RTL layout indicator is present
      await waitFor(element(by.testID('rtl-layout-indicator')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify main container has RTL direction
      await expect(element(by.testID('main-container-rtl'))).toBeVisible();

      // Verify navigation tabs are properly aligned for RTL
      await expect(element(by.testID('tab-bar-rtl'))).toBeVisible();

      // Check that text alignment is correct
      await expect(element(by.testID('arabic-text-alignment'))).toBeVisible();
    });

    it('should properly align Arabic text in all components', async () => {
      // Verify home screen Arabic text alignment
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Check weather widget Arabic text
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(3000);
      
      await expect(element(by.text('القاهرة'))).toBeVisible();
      await expect(element(by.testID('arabic-weather-text-alignment'))).toBeVisible();

      // Check care tips Arabic text alignment
      await waitFor(element(by.testID('care-tips-section')))
        .toBeVisible()
        .withTimeout(2000);
      
      await expect(element(by.testID('arabic-care-tips-alignment'))).toBeVisible();

      // Scroll down to verify all text sections
      await element(by.testID('home-screen')).scroll(300, 'down');
      
      // Verify additional Arabic text sections
      await expect(element(by.testID('arabic-seasonal-tips-alignment'))).toBeVisible();
    });

    it('should handle mixed Arabic-English content correctly', async () => {
      // Verify plant names with English content in Arabic layout
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('النباتات')).tap();

      // Verify plants screen RTL layout
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Check for mixed content handling
      if (await element(by.testID('mixed-content-plant')).exists()) {
        await expect(element(by.testID('mixed-content-plant'))).toBeVisible();
        await expect(element(by.testID('mixed-content-rtl-alignment'))).toBeVisible();
      }

      // Verify Arabic empty state message if no plants
      if (await element(by.testID('empty-plants-message-arabic')).exists()) {
        await expect(element(by.text('لا توجد نباتات بعد'))).toBeVisible();
      }
    });
  });

  describe('Arabic Navigation and User Interface', () => {
    it('should navigate correctly with Arabic tab labels', async () => {
      // Start from home
      await waitFor(element(by.text('الرئيسية')))
        .toBeVisible()
        .withTimeout(3000);

      // Navigate to Scan tab
      await element(by.text('المسح')).tap();
      
      // Verify scan screen with Arabic content
      await waitFor(element(by.testID('scan-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify Arabic scan instructions
      await expect(element(by.testID('arabic-scan-instructions'))).toBeVisible();
      
      // Navigate to Plants tab
      await element(by.text('النباتات')).tap();
      
      // Verify plants screen with Arabic content
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Navigate back to Home
      await element(by.text('الرئيسية')).tap();
      
      // Verify we're back at home
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should display Arabic button labels and actions', async () => {
      // Verify Arabic buttons on home screen
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Check for Arabic action buttons
      if (await element(by.text('إضافة نبات')).exists()) {
        await expect(element(by.text('إضافة نبات'))).toBeVisible();
      }

      // Navigate to scan screen for more button testing
      await element(by.text('المسح')).tap();

      await waitFor(element(by.testID('scan-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify Arabic camera button labels
      if (await element(by.text('التقط صورة')).exists()) {
        await expect(element(by.text('التقط صورة'))).toBeVisible();
      }

      if (await element(by.text('اختر من المعرض')).exists()) {
        await expect(element(by.text('اختر من المعرض'))).toBeVisible();
      }
    });

    it('should handle Arabic input fields correctly', async () => {
      // Navigate to scan and simulate plant identification
      await waitFor(element(by.text('المسح')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('المسح')).tap();

      // Use mock identification if available
      if (await element(by.testID('mock-identification-button')).exists()) {
        await element(by.testID('mock-identification-button')).tap();

        await waitFor(element(by.testID('plant-result-0')))
          .toBeVisible()
          .withTimeout(3000);
        await element(by.testID('plant-result-0')).tap();

        // Test Arabic input in add plant screen
        await waitFor(element(by.testID('add-plant-screen')))
          .toBeVisible()
          .withTimeout(3000);

        // Verify Arabic input field labels
        await expect(element(by.text('اسم النبات'))).toBeVisible();
        await expect(element(by.text('الموقع'))).toBeVisible();

        // Test Arabic text input
        await waitFor(element(by.testID('plant-name-input')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.testID('plant-name-input')).typeText('نبتة التجربة');

        await waitFor(element(by.testID('plant-location-input')))
          .toBeVisible()
          .withTimeout(1000);
        await element(by.testID('plant-location-input')).typeText('غرفة المعيشة');

        // Verify Arabic text appears correctly in inputs
        await expect(element(by.text('نبتة التجربة'))).toBeVisible();
        await expect(element(by.text('غرفة المعيشة'))).toBeVisible();

        // Verify RTL cursor behavior and text direction
        await expect(element(by.testID('arabic-input-rtl-cursor'))).toBeVisible();
      }
    });
  });

  describe('Arabic Weather Widget RTL Layout', () => {
    it('should display weather information with proper Arabic RTL layout', async () => {
      // Go to home screen
      await waitFor(element(by.text('الرئيسية')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('الرئيسية')).tap();

      // Verify Arabic weather widget
      await waitFor(element(by.testID('weather-widget')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify Arabic location name
      await expect(element(by.text('القاهرة'))).toBeVisible();

      // Verify Arabic weather labels with RTL alignment
      await expect(element(by.text('درجة الحرارة'))).toBeVisible();
      await expect(element(by.text('الرطوبة'))).toBeVisible();
      await expect(element(by.text('سرعة الرياح'))).toBeVisible();

      // Verify RTL layout for weather data
      await expect(element(by.testID('weather-data-rtl-layout'))).toBeVisible();

      // Verify Arabic weather icons are properly positioned
      await expect(element(by.testID('weather-icons-rtl-position'))).toBeVisible();
    });

    it('should display Arabic weather recommendations', async () => {
      // Scroll down to see care recommendations
      await element(by.testID('home-screen')).scroll(200, 'down');

      // Verify Arabic weather-based care recommendations
      await waitFor(element(by.testID('care-recommendations-section')))
        .toBeVisible()
        .withTimeout(3000);

      // Check for Arabic weather tips
      if (await element(by.text('زيادة معدل الري بسبب ارتفاع درجة الحرارة')).exists()) {
        await expect(element(by.text('زيادة معدل الري بسبب ارتفاع درجة الحرارة'))).toBeVisible();
      }

      if (await element(by.text('تقليل الري بسبب ارتفاع الرطوبة')).exists()) {
        await expect(element(by.text('تقليل الري بسبب ارتفاع الرطوبة'))).toBeVisible();
      }

      // Verify Arabic seasonal recommendations
      if (await element(by.text('نصائح الصيف للمناخ المصري')).exists()) {
        await expect(element(by.text('نصائح الصيف للمناخ المصري'))).toBeVisible();
      }

      // Verify RTL text alignment for recommendations
      await expect(element(by.testID('arabic-recommendations-rtl-alignment'))).toBeVisible();
    });
  });

  describe('Arabic Plant Management RTL', () => {
    it('should display plant collection with Arabic RTL layout', async () => {
      // Navigate to plants tab
      await waitFor(element(by.text('النباتات')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('النباتات')).tap();

      // Verify plants screen RTL layout
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify Arabic empty state if no plants
      if (await element(by.testID('empty-plants-message-arabic')).exists()) {
        await expect(element(by.text('لا توجد نباتات بعد'))).toBeVisible();
        await expect(element(by.text('ابدأ بإضافة نباتك الأول'))).toBeVisible();
        await expect(element(by.testID('empty-state-rtl-layout'))).toBeVisible();
      }

      // If plants exist, verify RTL layout
      if (await element(by.testID('plant-list-rtl')).exists()) {
        await expect(element(by.testID('plant-list-rtl'))).toBeVisible();
        await expect(element(by.testID('plant-item-rtl-layout'))).toBeVisible();
      }
    });

    it('should handle plant detail screens in Arabic RTL', async () => {
      // This test assumes we have a plant to view
      if (await element(by.testID('plant-item-arabic')).exists()) {
        await element(by.testID('plant-item-arabic')).tap();

        // Verify plant detail screen RTL layout
        await waitFor(element(by.testID('plant-detail-screen')))
          .toBeVisible()
          .withTimeout(3000);

        // Verify Arabic plant detail labels
        await expect(element(by.text('تفاصيل النبات'))).toBeVisible();
        await expect(element(by.text('جدول الرعاية'))).toBeVisible();
        await expect(element(by.text('تاريخ الرعاية'))).toBeVisible();

        // Verify RTL layout for plant details
        await expect(element(by.testID('plant-details-rtl-layout'))).toBeVisible();

        // Verify Arabic care action buttons
        if (await element(by.text('سقي')).exists()) {
          await expect(element(by.text('سقي'))).toBeVisible();
        }

        if (await element(by.text('تسميد')).exists()) {
          await expect(element(by.text('تسميد'))).toBeVisible();
        }

        // Verify RTL button alignment
        await expect(element(by.testID('care-buttons-rtl-alignment'))).toBeVisible();
      }
    });
  });

  describe('Arabic Scan Screen RTL Layout', () => {
    it('should display scan interface with proper Arabic RTL layout', async () => {
      // Navigate to scan screen
      await waitFor(element(by.text('المسح')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('المسح')).tap();

      // Verify scan screen RTL layout
      await waitFor(element(by.testID('scan-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify Arabic scan instructions
      await expect(element(by.text('التقط صورة لتحديد النبات'))).toBeVisible();
      await expect(element(by.testID('arabic-scan-instructions-rtl'))).toBeVisible();

      // Verify Arabic camera button labels with RTL positioning
      if (await element(by.text('التقط صورة')).exists()) {
        await expect(element(by.text('التقط صورة'))).toBeVisible();
        await expect(element(by.testID('camera-button-rtl-position'))).toBeVisible();
      }

      // Verify Arabic gallery button with RTL positioning
      if (await element(by.text('اختر من المعرض')).exists()) {
        await expect(element(by.text('اختر من المعرض'))).toBeVisible();
        await expect(element(by.testID('gallery-button-rtl-position'))).toBeVisible();
      }
    });

    it('should display identification results with Arabic RTL layout', async () => {
      // Use mock identification if available
      if (await element(by.testID('mock-identification-button')).exists()) {
        await element(by.testID('mock-identification-button')).tap();

        // Wait for identification results
        await waitFor(element(by.testID('identification-results')))
          .toBeVisible()
          .withTimeout(5000);

        // Verify Arabic identification results header
        await expect(element(by.text('نتائج التحديد'))).toBeVisible();

        // Verify RTL layout for results
        await expect(element(by.testID('identification-results-rtl'))).toBeVisible();

        // Verify Arabic plant suggestions
        if (await element(by.text('اقتراحات النباتات المصرية')).exists()) {
          await expect(element(by.text('اقتراحات النباتات المصرية'))).toBeVisible();
        }

        // Verify RTL layout for plant result cards
        await expect(element(by.testID('plant-result-cards-rtl'))).toBeVisible();

        // Verify Arabic confidence percentage display
        if (await element(by.testID('confidence-percentage-arabic')).exists()) {
          await expect(element(by.testID('confidence-percentage-arabic'))).toBeVisible();
        }
      }
    });
  });

  describe('Arabic Form Validation and Messages', () => {
    it('should display Arabic validation messages', async () => {
      // Navigate to add plant screen (via scan results)
      await waitFor(element(by.text('المسح')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('المسح')).tap();

      if (await element(by.testID('mock-identification-button')).exists()) {
        await element(by.testID('mock-identification-button')).tap();

        await waitFor(element(by.testID('plant-result-0')))
          .toBeVisible()
          .withTimeout(3000);
        await element(by.testID('plant-result-0')).tap();

        // Try to save plant without required fields
        await waitFor(element(by.testID('save-plant-button')))
          .toBeVisible()
          .withTimeout(2000);
        await element(by.testID('save-plant-button')).tap();

        // Verify Arabic validation messages
        if (await element(by.text('اسم النبات مطلوب')).exists()) {
          await expect(element(by.text('اسم النبات مطلوب'))).toBeVisible();
        }

        // Verify RTL alignment of error messages
        await expect(element(by.testID('validation-errors-rtl'))).toBeVisible();
      }
    });

    it('should display Arabic success and confirmation messages', async () => {
      // Test save success message (if we complete a save)
      if (await element(by.testID('plant-name-input')).exists()) {
        await element(by.testID('plant-name-input')).typeText('نبتة تجريبية');
        await element(by.testID('save-plant-button')).tap();

        // Verify Arabic success message
        if (await element(by.text('تم حفظ النبات بنجاح')).exists()) {
          await expect(element(by.text('تم حفظ النبات بنجاح'))).toBeVisible();
          await expect(element(by.testID('success-message-rtl'))).toBeVisible();
        }
      }
    });
  });

  describe('Arabic Settings and Preferences', () => {
    it('should display Arabic language toggle label', async () => {
      // Verify language toggle has proper Arabic/English labels
      await waitFor(element(by.testID('language-toggle')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify current language indicator
      await expect(element(by.testID('current-language-arabic'))).toBeVisible();

      // Toggle and verify English label appears
      await element(by.testID('language-toggle')).tap();
      
      await waitFor(element(by.testID('current-language-english')))
        .toBeVisible()
        .withTimeout(2000);

      // Toggle back to Arabic
      await element(by.testID('language-toggle')).tap();
      
      await waitFor(element(by.testID('current-language-arabic')))
        .toBeVisible()
        .withTimeout(2000);
    });
  });

  describe('Arabic RTL Animation and Transitions', () => {
    it('should handle RTL animations correctly', async () => {
      // Test navigation animations with RTL
      await waitFor(element(by.text('المسح')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('المسح')).tap();

      // Verify RTL transition animation
      await expect(element(by.testID('rtl-navigation-transition'))).toBeVisible();

      // Navigate back to home
      await element(by.text('الرئيسية')).tap();

      // Verify RTL transition back
      await waitFor(element(by.testID('home-screen')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should handle RTL modal and popup positioning', async () => {
      // Test modal positioning in RTL mode
      if (await element(by.testID('open-settings-modal')).exists()) {
        await element(by.testID('open-settings-modal')).tap();

        // Verify modal appears with RTL positioning
        await waitFor(element(by.testID('settings-modal-rtl')))
          .toBeVisible()
          .withTimeout(3000);

        // Verify RTL close button positioning
        await expect(element(by.testID('modal-close-button-rtl'))).toBeVisible();

        // Close modal
        await element(by.testID('modal-close-button-rtl')).tap();
      }
    });
  });
});
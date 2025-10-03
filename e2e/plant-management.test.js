const { device, expect, element, by, waitFor } = require('detox');

describe('Plant Management Complete E2E Test', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Complete Plant Management Workflow', () => {
    it('should complete full plant lifecycle - add, view, edit, delete', async () => {
      // Start as guest user for testing
      await waitFor(element(by.testID('guest-button')))
        .toBeVisible()
        .withTimeout(5000);
      await element(by.testID('guest-button')).tap();

      // Navigate to Scan screen to add a plant
      await waitFor(element(by.testID('scan-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('scan-tab')).tap();

      // Verify scan screen is loaded
      await waitFor(element(by.testID('scan-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Test plant identification simulation (without actual camera)
      await waitFor(element(by.testID('mock-identification-button')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('mock-identification-button')).tap();

      // Wait for identification results
      await waitFor(element(by.testID('identification-results')))
        .toBeVisible()
        .withTimeout(5000);

      // Verify Egyptian plant suggestions appear
      await expect(element(by.testID('egyptian-plant-suggestions'))).toBeVisible();
      
      // Select first plant from identification results
      await waitFor(element(by.testID('plant-result-0')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('plant-result-0')).tap();

      // Navigate to Add Plant screen
      await waitFor(element(by.testID('add-plant-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Fill in plant details
      await waitFor(element(by.testID('plant-name-input')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('plant-name-input')).clearText();
      await element(by.testID('plant-name-input')).typeText('My Test Plant');

      await waitFor(element(by.testID('plant-location-input')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('plant-location-input')).clearText();
      await element(by.testID('plant-location-input')).typeText('Living Room');

      // Set care schedule
      await waitFor(element(by.testID('watering-frequency-picker')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('watering-frequency-picker')).tap();
      
      await waitFor(element(by.text('Every 3 days')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.text('Every 3 days')).tap();

      // Save the plant
      await waitFor(element(by.testID('save-plant-button')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('save-plant-button')).tap();

      // Verify plant was added and navigate to Plants screen
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      // Verify plant appears in collection
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);
      
      await waitFor(element(by.testID('plant-item-My Test Plant')))
        .toBeVisible()
        .withTimeout(3000);
      
      // Verify plant details are displayed correctly
      await expect(element(by.text('My Test Plant'))).toBeVisible();
      await expect(element(by.text('Living Room'))).toBeVisible();
    });

    it('should view plant details and history', async () => {
      // Navigate to Plants screen
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      // Tap on plant to view details
      await waitFor(element(by.testID('plant-item-My Test Plant')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plant-item-My Test Plant')).tap();

      // Verify plant detail screen
      await waitFor(element(by.testID('plant-detail-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify plant information is displayed
      await expect(element(by.testID('plant-name-display'))).toBeVisible();
      await expect(element(by.testID('plant-location-display'))).toBeVisible();
      await expect(element(by.testID('plant-care-schedule'))).toBeVisible();

      // Verify care history section
      await expect(element(by.testID('care-history-section'))).toBeVisible();
      
      // Test care action - watering
      await waitFor(element(by.testID('water-plant-button')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('water-plant-button')).tap();

      // Verify care event was recorded
      await waitFor(element(by.testID('care-event-water')))
        .toBeVisible()
        .withTimeout(2000);

      // Test care action - fertilizing
      await waitFor(element(by.testID('fertilize-plant-button')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('fertilize-plant-button')).tap();

      // Verify fertilizing event was recorded
      await waitFor(element(by.testID('care-event-fertilize')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should edit plant details successfully', async () => {
      // From plant detail screen, tap edit button
      await waitFor(element(by.testID('edit-plant-button')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('edit-plant-button')).tap();

      // Verify edit screen is loaded
      await waitFor(element(by.testID('edit-plant-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Update plant name
      await waitFor(element(by.testID('plant-name-input')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('plant-name-input')).clearText();
      await element(by.testID('plant-name-input')).typeText('Updated Plant Name');

      // Update location
      await waitFor(element(by.testID('plant-location-input')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('plant-location-input')).clearText();
      await element(by.testID('plant-location-input')).typeText('Balcony');

      // Update watering frequency
      await waitFor(element(by.testID('watering-frequency-picker')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('watering-frequency-picker')).tap();
      
      await waitFor(element(by.text('Daily')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.text('Daily')).tap();

      // Save changes
      await waitFor(element(by.testID('save-plant-changes-button')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('save-plant-changes-button')).tap();

      // Verify we're back to plant detail screen with updated info
      await waitFor(element(by.testID('plant-detail-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify updates are reflected
      await expect(element(by.text('Updated Plant Name'))).toBeVisible();
      await expect(element(by.text('Balcony'))).toBeVisible();
      await expect(element(by.text('Daily'))).toBeVisible();
    });

    it('should handle plant care reminders and scheduling', async () => {
      // Test care reminder functionality
      await waitFor(element(by.testID('care-reminders-section')))
        .toBeVisible()
        .withTimeout(2000);

      // Verify next watering date is displayed
      await expect(element(by.testID('next-watering-date'))).toBeVisible();
      
      // Verify next fertilizing date is displayed
      await expect(element(by.testID('next-fertilizing-date'))).toBeVisible();

      // Test setting custom reminder
      await waitFor(element(by.testID('set-custom-reminder-button')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('set-custom-reminder-button')).tap();

      // Verify reminder modal opens
      await waitFor(element(by.testID('reminder-modal')))
        .toBeVisible()
        .withTimeout(3000);

      // Set reminder type
      await waitFor(element(by.testID('reminder-type-picker')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('reminder-type-picker')).tap();
      
      await waitFor(element(by.text('Pruning')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.text('Pruning')).tap();

      // Set reminder date (simplified - just tap save)
      await waitFor(element(by.testID('save-reminder-button')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('save-reminder-button')).tap();

      // Verify reminder was set
      await waitFor(element(by.testID('pruning-reminder')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should delete plant with confirmation', async () => {
      // Navigate back to plants list first
      await waitFor(element(by.testID('back-button')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('back-button')).tap();

      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Long press on plant item to show delete option
      await waitFor(element(by.testID('plant-item-Updated Plant Name')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plant-item-Updated Plant Name')).longPress(2000);

      // Verify delete option appears
      await waitFor(element(by.testID('delete-plant-option')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('delete-plant-option')).tap();

      // Verify confirmation dialog
      await waitFor(element(by.testID('delete-confirmation-modal')))
        .toBeVisible()
        .withTimeout(3000);

      await expect(element(by.text('Delete Plant'))).toBeVisible();
      await expect(element(by.text('Are you sure you want to delete this plant?'))).toBeVisible();

      // Confirm deletion
      await waitFor(element(by.testID('confirm-delete-button')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('confirm-delete-button')).tap();

      // Verify plant is removed from list
      await waitFor(element(by.testID('plant-item-Updated Plant Name')))
        .not.toExist()
        .withTimeout(3000);

      // Verify empty state is shown if no plants remain
      await waitFor(element(by.testID('empty-plants-message')))
        .toBeVisible()
        .withTimeout(2000);
    });

    it('should handle bulk plant operations', async () => {
      // First add multiple plants for testing bulk operations
      // Navigate to scan screen
      await waitFor(element(by.testID('scan-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('scan-tab')).tap();

      // Add first plant
      await waitFor(element(by.testID('mock-identification-button')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('mock-identification-button')).tap();

      await waitFor(element(by.testID('plant-result-0')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plant-result-0')).tap();

      await waitFor(element(by.testID('plant-name-input')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('plant-name-input')).typeText('Bulk Test Plant 1');
      
      await waitFor(element(by.testID('save-plant-button')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('save-plant-button')).tap();

      // Go back to plants screen
      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      // Test bulk selection mode
      await waitFor(element(by.testID('bulk-edit-button')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('bulk-edit-button')).tap();

      // Verify bulk mode is active
      await expect(element(by.testID('bulk-mode-indicator'))).toBeVisible();
      
      // Select plants
      await waitFor(element(by.testID('plant-checkbox-Bulk Test Plant 1')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('plant-checkbox-Bulk Test Plant 1')).tap();

      // Verify bulk actions are available
      await expect(element(by.testID('bulk-actions-panel'))).toBeVisible();
      await expect(element(by.testID('bulk-water-button'))).toBeVisible();
      await expect(element(by.testID('bulk-delete-button'))).toBeVisible();

      // Exit bulk mode
      await waitFor(element(by.testID('exit-bulk-mode-button')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('exit-bulk-mode-button')).tap();

      // Verify bulk mode is deactivated
      await waitFor(element(by.testID('bulk-mode-indicator')))
        .not.toExist()
        .withTimeout(2000);
    });
  });

  describe('Plant Management Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network error by disabling wifi (if possible)
      // This test verifies offline behavior and error messages

      await waitFor(element(by.testID('plants-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plants-tab')).tap();

      // Try to add a plant while offline
      await waitFor(element(by.testID('add-plant-fab')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('add-plant-fab')).tap();

      // Verify offline message appears (if applicable)
      await waitFor(element(by.testID('offline-mode-indicator')))
        .toBeVisible()
        .withTimeout(3000);
    });

    it('should validate plant input fields', async () => {
      // Navigate to scan and add plant screen
      await waitFor(element(by.testID('scan-tab')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('scan-tab')).tap();

      await waitFor(element(by.testID('mock-identification-button')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('mock-identification-button')).tap();

      await waitFor(element(by.testID('plant-result-0')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('plant-result-0')).tap();

      // Try to save plant without name
      await waitFor(element(by.testID('plant-name-input')))
        .toBeVisible()
        .withTimeout(2000);
      await element(by.testID('plant-name-input')).clearText();

      await waitFor(element(by.testID('save-plant-button')))
        .toBeVisible()
        .withTimeout(1000);
      await element(by.testID('save-plant-button')).tap();

      // Verify validation error appears
      await waitFor(element(by.testID('name-required-error')))
        .toBeVisible()
        .withTimeout(2000);
      
      await expect(element(by.text('Plant name is required'))).toBeVisible();
    });
  });

  describe('Plant Management Arabic RTL Support', () => {
    it('should work correctly in Arabic RTL mode', async () => {
      // Switch to Arabic language
      await waitFor(element(by.testID('language-toggle')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.testID('language-toggle')).tap();

      // Verify Arabic text appears
      await waitFor(element(by.text('النباتات')))
        .toBeVisible()
        .withTimeout(3000);
      await element(by.text('النباتات')).tap();

      // Test plant management in Arabic
      await waitFor(element(by.testID('plants-screen')))
        .toBeVisible()
        .withTimeout(3000);

      // Verify RTL layout is applied
      await expect(element(by.testID('rtl-layout-indicator'))).toBeVisible();
      
      // Verify Arabic plant management text
      if (await element(by.testID('add-plant-fab')).exists()) {
        await expect(element(by.testID('add-plant-fab'))).toBeVisible();
      }
    });
  });
});
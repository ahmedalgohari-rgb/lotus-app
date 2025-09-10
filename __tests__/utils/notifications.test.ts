import * as Notifications from 'expo-notifications';
import { schedulePlantCareNotification } from '@/utils/notifications';

// Mock expo-notifications
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

// Mock global alert
global.alert = jest.fn();

// Mock react-native Alert
jest.mock('react-native', () => ({
  ...jest.requireActual('react-native'),
  Alert: {
    alert: jest.fn(),
  },
}));

describe('notifications utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  });

  it('requests permissions if not granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'undetermined' });

    await schedulePlantCareNotification('Rose', 'water', new Date());

    expect(Notifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it('does not schedule notification if permissions are not granted', async () => {
    (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied' });

    await schedulePlantCareNotification('Rose', 'water', new Date());

    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it('schedules a plant care notification correctly', async () => {
    const mockDate = new Date('2025-09-01T10:00:00.000Z'); // 10 AM UTC
    const plantName = 'Fiddle Leaf Fig';
    const eventType = 'water';

    await schedulePlantCareNotification(plantName, eventType, mockDate);

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
      content: {
        title: `Time to ${eventType} ${plantName}!`, 
        body: `Your ${plantName} needs some ${eventType} today.`,
      },
      trigger: { date: mockDate },
    });
  });
});
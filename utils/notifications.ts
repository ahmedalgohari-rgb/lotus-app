import * as Notifications from 'expo-notifications';

export async function schedulePlantCareNotification(
  plantName: string,
  eventType: 'water' | 'prune' | 'feed',
  date: Date
) {
  try {
    // Check if notifications are available (may not work in Expo Go)
    if (!Notifications.getPermissionsAsync) {
      console.log('Notifications not available in Expo Go environment');
      return;
    }

    // Request permissions if not already granted
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    const triggerDate = new Date(date.getTime());
    triggerDate.setUTCHours(10); // Remind at 10 AM UTC
    triggerDate.setUTCMinutes(0);
    triggerDate.setUTCSeconds(0);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Time to ${eventType} ${plantName}!`, 
        body: `Your ${plantName} needs some ${eventType} today.`,
      },
      trigger: { date: triggerDate },
    });
    
    console.log(`Notification scheduled for ${plantName} - ${eventType}`);
  } catch (error) {
    console.warn('Notification scheduling not available in Expo Go:', error);
  }
}
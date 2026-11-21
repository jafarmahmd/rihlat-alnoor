package com.rihlat.alnoor.app.adhan;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

public class AdhanAlarmReceiver extends BroadcastReceiver {
    public static final String ACTION_FIRE_ADHAN = "com.rihlat.alnoor.app.FIRE_ADHAN";
    public static final String ACTION_STOP_ADHAN = "com.rihlat.alnoor.app.STOP_ADHAN";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();

        if (ACTION_STOP_ADHAN.equals(action)) {
            Intent stopIntent = new Intent(context, AdhanForegroundService.class);
            context.stopService(stopIntent);
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(AdhanForegroundService.FOREGROUND_NOTIF_ID);
            }
            return;
        }

        String title = intent.getStringExtra("title");
        if (title == null || title.isEmpty()) title = "حان الآن موعد الصلاة";
        String body = intent.getStringExtra("body");
        if (body == null) body = "";
        String mode = intent.getStringExtra("mode");
        if (mode == null) mode = "adhan";
        String rawName = intent.getStringExtra("rawName");
        if (rawName == null) rawName = "";
        String channelId = intent.getStringExtra("channelId");
        if (channelId == null || channelId.isEmpty()) channelId = "adhan_silent_alerts";
        int alarmId = intent.getIntExtra("alarm_id", 5100);
        boolean allowDuringAdhan = intent.getBooleanExtra(
            "allowNotificationsDuringAdhan",
            AdhanAlarmStore.getAllowNotificationsDuringAdhan(context)
        );

        if ("silent".equals(mode)) {
            showSilentNotification(context, alarmId, title, body, channelId, allowDuringAdhan);
            return;
        }

        Intent serviceIntent = new Intent(context, AdhanForegroundService.class);
        serviceIntent.putExtra("title", title);
        serviceIntent.putExtra("body", body);
        serviceIntent.putExtra("mode", mode);
        serviceIntent.putExtra("rawName", rawName);
        serviceIntent.putExtra("channelId", channelId);
        serviceIntent.putExtra("allowNotificationsDuringAdhan", allowDuringAdhan);

        try {
            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (Exception e) {
            showSilentNotification(context, alarmId, title, body, channelId, allowDuringAdhan);
        }
    }

    private void showSilentNotification(
        Context context,
        int alarmId,
        String title,
        String body,
        String channelId,
        boolean allowDuringAdhan
    ) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel existing = nm.getNotificationChannel(channelId);
            if (existing == null) {
                NotificationChannel ch = new NotificationChannel(
                    channelId,
                    "تنبيهات مواقيت الصلاة",
                    allowDuringAdhan ? NotificationManager.IMPORTANCE_HIGH : NotificationManager.IMPORTANCE_DEFAULT
                );
                ch.setSound(null, null);
                ch.enableVibration(false);
                ch.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);
                if (allowDuringAdhan) {
                    try {
                        ch.setBypassDnd(true);
                    } catch (Exception ignored) {}
                }
                nm.createNotificationChannel(ch);
            }
        }

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent contentPi = launchIntent != null
            ? PendingIntent.getActivity(context, alarmId, launchIntent, piFlags)
            : null;

        int iconRes = context.getApplicationInfo().icon;
        if (iconRes == 0) iconRes = android.R.drawable.ic_lock_idle_alarm;

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
            .setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setSilent(true)
            .setPriority(allowDuringAdhan ? NotificationCompat.PRIORITY_HIGH : NotificationCompat.PRIORITY_DEFAULT);

        if (contentPi != null) {
            builder.setContentIntent(contentPi);
        }

        try {
            nm.notify(alarmId, builder.build());
        } catch (SecurityException ignored) {}
    }
}

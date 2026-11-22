package com.rihlat.alnoor.app.adhan;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
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
            AdhanForegroundService.isCurrentlyPlaying = false;
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(AdhanForegroundService.FOREGROUND_NOTIF_ID);
            }
            Intent stateBroadcast = new Intent(AdhanForegroundService.ACTION_ADHAN_STATE_CHANGED);
            stateBroadcast.setPackage(context.getPackageName());
            stateBroadcast.putExtra("isPlaying", false);
            stateBroadcast.putExtra("title", "");
            stateBroadcast.putExtra("muezzinRawName", "");
            context.sendBroadcast(stateBroadcast);
            return;
        }

        PowerManager.WakeLock rxWakeLock = null;
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                rxWakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "rihlat:AdhanReceiverWakeLock");
                rxWakeLock.acquire(15_000L);
            }
        } catch (Exception ignored) {}

        try {
            String title = intent.getStringExtra("title");
            if (title == null || title.isEmpty()) title = "حان الآن موعد الصلاة";
            String body = intent.getStringExtra("body");
            if (body == null) body = "";
            String mode = intent.getStringExtra("mode");
            if (mode == null) mode = "adhan";
            String rawName = intent.getStringExtra("rawName");
            if (rawName == null) rawName = "";
            String channelId = intent.getStringExtra("channelId");
            if (channelId == null || channelId.isEmpty()) channelId = "adhan_silent_v2";
            int alarmId = intent.getIntExtra("alarm_id", 5100);
            boolean isTest = intent.getBooleanExtra("isTest", false);
            boolean allowDuringAdhan = intent.getBooleanExtra(
                "allowNotificationsDuringAdhan",
                AdhanAlarmStore.getAllowNotificationsDuringAdhan(context)
            );
            boolean playInSilent = intent.getBooleanExtra(
                "playAdhanInSilentMode",
                AdhanAlarmStore.getPlayAdhanInSilentMode(context)
            );
            String audioUsage = intent.getStringExtra("audioUsage");
            if (audioUsage == null) audioUsage = AdhanAlarmStore.getAudioUsage(context);

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
            serviceIntent.putExtra("isTest", isTest);
            serviceIntent.putExtra("allowNotificationsDuringAdhan", allowDuringAdhan);
            serviceIntent.putExtra("playAdhanInSilentMode", playInSilent);
            serviceIntent.putExtra("audioUsage", audioUsage);

            try {
                ContextCompat.startForegroundService(context, serviceIntent);
            } catch (Exception e) {
                showMuezzinSoundNotification(
                    context,
                    alarmId,
                    title,
                    body,
                    mode,
                    rawName,
                    channelId,
                    allowDuringAdhan,
                    playInSilent || isTest,
                    audioUsage
                );
            }
        } finally {
            if (rxWakeLock != null && rxWakeLock.isHeld()) {
                try {
                    rxWakeLock.release();
                } catch (Exception ignored) {}
            }
        }
    }

    private void showMuezzinSoundNotification(
        Context context,
        int alarmId,
        String title,
        String body,
        String mode,
        String rawName,
        String channelId,
        boolean allowDuringAdhan,
        boolean playInSilent,
        String audioUsage
    ) {
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        Uri soundUri = null;
        if ("adhan".equals(mode) && rawName != null && !rawName.isEmpty()) {
            int resId = context.getResources().getIdentifier(rawName, "raw", context.getPackageName());
            if (resId != 0) {
                soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/raw/" + rawName);
            }
        }
        if (soundUri == null) {
            soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
        }
        if (soundUri == null) {
            soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel existing = nm.getNotificationChannel(channelId);
            if (existing == null) {
                NotificationChannel ch = new NotificationChannel(
                    channelId,
                    "أذان الصلاة",
                    NotificationManager.IMPORTANCE_HIGH
                );
                ch.setDescription("تنبيهات مواقيت الصلاة بصوت المؤذن");
                if (soundUri != null) {
                    int usage = (playInSilent || !"notification".equals(audioUsage))
                        ? AudioAttributes.USAGE_ALARM
                        : AudioAttributes.USAGE_NOTIFICATION_EVENT;
                    AudioAttributes attrs = new AudioAttributes.Builder()
                        .setUsage(usage)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build();
                    ch.setSound(soundUri, attrs);
                }
                ch.enableVibration(true);
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
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setPriority(NotificationCompat.PRIORITY_MAX);

        if (soundUri != null) {
            builder.setSound(soundUri);
        }
        if (contentPi != null) {
            builder.setContentIntent(contentPi);
        }

        try {
            nm.notify(alarmId, builder.build());
        } catch (SecurityException ignored) {}
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

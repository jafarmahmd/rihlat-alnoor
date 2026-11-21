package com.rihlat.alnoor.app.adhan;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;

public class AdhanForegroundService extends Service {
    public static final int FOREGROUND_NOTIF_ID = 5901;
    public static final String PLAYBACK_CHANNEL_ID = "adhan_playback_service";
    public static final String ACTION_ADHAN_STATE_CHANGED = "com.rihlat.alnoor.app.ADHAN_STATE_CHANGED";

    public static volatile boolean isCurrentlyPlaying = false;
    public static volatile String currentTitle = "";
    public static volatile String currentRawName = "";

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String title = intent != null ? intent.getStringExtra("title") : null;
        if (title == null || title.isEmpty()) title = "حان الآن موعد الصلاة";
        String body = intent != null ? intent.getStringExtra("body") : null;
        if (body == null) body = "اضغط على إيقاف الأذان لإنهاء الصوت";
        String mode = intent != null ? intent.getStringExtra("mode") : "adhan";
        if (mode == null) mode = "adhan";
        String rawName = intent != null ? intent.getStringExtra("rawName") : "";
        if (rawName == null) rawName = "";
        boolean allowDuringAdhan = intent != null
            ? intent.getBooleanExtra("allowNotificationsDuringAdhan", AdhanAlarmStore.getAllowNotificationsDuringAdhan(this))
            : AdhanAlarmStore.getAllowNotificationsDuringAdhan(this);

        ensurePlaybackChannel(allowDuringAdhan);
        Notification notification = buildOngoingNotification(title, body);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                FOREGROUND_NOTIF_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            );
        } else {
            startForeground(FOREGROUND_NOTIF_ID, notification);
        }

        acquireWakeLock();
        stopCurrentMedia();

        currentTitle = title;
        currentRawName = rawName;
        isCurrentlyPlaying = true;
        broadcastState(true, title, rawName);

        startAdhanAudio(mode, rawName);
        return START_NOT_STICKY;
    }

    private void ensurePlaybackChannel(boolean allowDuringAdhan) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;

        NotificationChannel existing = nm.getNotificationChannel(PLAYBACK_CHANNEL_ID);
        if (existing == null) {
            NotificationChannel ch = new NotificationChannel(
                PLAYBACK_CHANNEL_ID,
                "تشغيل الأذان الكامل",
                NotificationManager.IMPORTANCE_HIGH
            );
            ch.setDescription("تشغيل الأذان كاملاً في الخلفية مع زر إيقاف الأذان");
            ch.setSound(null, null);
            ch.enableVibration(false);
            ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
            if (allowDuringAdhan) {
                try {
                    ch.setBypassDnd(true);
                } catch (Exception ignored) {}
            }
            nm.createNotificationChannel(ch);
        }
    }

    private Notification buildOngoingNotification(String title, String body) {
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        Intent stopIntent = new Intent(this, AdhanAlarmReceiver.class);
        stopIntent.setAction(AdhanAlarmReceiver.ACTION_STOP_ADHAN);
        PendingIntent stopPi = PendingIntent.getBroadcast(this, 901, stopIntent, piFlags);

        int iconRes = getApplicationInfo().icon;
        if (iconRes == 0) iconRes = android.R.drawable.ic_lock_idle_alarm;

        return new NotificationCompat.Builder(this, PLAYBACK_CHANNEL_ID)
            .setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setOngoing(true)
            .setContentIntent(stopPi)
            .addAction(android.R.drawable.ic_media_pause, "إيقاف الأذان", stopPi)
            .build();
    }

    private void startAdhanAudio(String mode, String rawName) {
        AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
        NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        int ringerMode = am != null ? am.getRingerMode() : AudioManager.RINGER_MODE_NORMAL;
        boolean dndSilenceAll = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && nm != null) {
            int filter = nm.getCurrentInterruptionFilter();
            if (filter == NotificationManager.INTERRUPTION_FILTER_NONE) {
                dndSilenceAll = true;
            }
        }

        // احترام وضع الصامت أو عدم الإزعاج الكامل
        if (dndSilenceAll || ringerMode == AudioManager.RINGER_MODE_SILENT) {
            return;
        }
        if (ringerMode == AudioManager.RINGER_MODE_VIBRATE) {
            triggerGentleVibration();
            return;
        }

        Uri soundUri = null;
        if ("adhan".equals(mode) && rawName != null && !rawName.isEmpty()) {
            int rawId = getResources().getIdentifier(rawName, "raw", getPackageName());
            if (rawId != 0) {
                soundUri = Uri.parse("android.resource://" + getPackageName() + "/" + rawId);
            }
        }

        if (soundUri == null) {
            soundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
        }
        if (soundUri == null) {
            stopSelfSafely();
            return;
        }

        try {
            mediaPlayer = new MediaPlayer();
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                AudioAttributes attrs = new AudioAttributes.Builder()
                    .setUsage("adhan".equals(mode) ? AudioAttributes.USAGE_ALARM : AudioAttributes.USAGE_NOTIFICATION)
                    .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                    .build();
                mediaPlayer.setAudioAttributes(attrs);
            } else {
                mediaPlayer.setAudioStreamType("adhan".equals(mode) ? AudioManager.STREAM_ALARM : AudioManager.STREAM_NOTIFICATION);
            }
            mediaPlayer.setDataSource(this, soundUri);
            mediaPlayer.setOnCompletionListener(mp -> stopSelfSafely());
            mediaPlayer.setOnErrorListener((mp, what, extra) -> {
                stopSelfSafely();
                return true;
            });
            mediaPlayer.prepare();
            mediaPlayer.start();
        } catch (Exception e) {
            stopSelfSafely();
        }
    }

    private void triggerGentleVibration() {
        try {
            Vibrator vib = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (vib == null || !vib.hasVibrator()) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                vib.vibrate(VibrationEffect.createWaveform(new long[]{0, 350, 250, 350}, -1));
            } else {
                vib.vibrate(new long[]{0, 350, 250, 350}, -1);
            }
        } catch (Exception ignored) {}
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null && wakeLock == null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "rihlat:AdhanPlaybackWakeLock");
                wakeLock.acquire(9 * 60 * 1000L);
            }
        } catch (Exception ignored) {}
    }

    private void releaseWakeLock() {
        try {
            if (wakeLock != null && wakeLock.isHeld()) {
                wakeLock.release();
            }
        } catch (Exception ignored) {}
        wakeLock = null;
    }

    private void stopCurrentMedia() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.reset();
                mediaPlayer.release();
            } catch (Exception ignored) {}
            mediaPlayer = null;
        }
    }

    private void stopSelfSafely() {
        stopCurrentMedia();
        releaseWakeLock();
        isCurrentlyPlaying = false;
        broadcastState(false, "", "");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        stopSelf();
    }

    private void broadcastState(boolean playing, String title, String rawName) {
        Intent i = new Intent(ACTION_ADHAN_STATE_CHANGED);
        i.setPackage(getPackageName());
        i.putExtra("isPlaying", playing);
        i.putExtra("title", title);
        i.putExtra("muezzinRawName", rawName);
        sendBroadcast(i);
    }

    @Override
    public void onDestroy() {
        stopCurrentMedia();
        releaseWakeLock();
        isCurrentlyPlaying = false;
        broadcastState(false, "", "");
        super.onDestroy();
    }
}

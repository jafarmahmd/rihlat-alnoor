package com.rihlat.alnoor.app.adhan;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

public final class AdhanAlarmStore {
    private static final String TAG = "AdhanAlarmStore";
    public static final String PREFS_NAME = "rihlat_adhan_prefs";
    private static final String KEY_ALARMS_JSON = "scheduled_alarms_json";
    private static final String KEY_LAST_SCHEDULED_AT = "last_scheduled_at";
    private static final String KEY_MIN_ID = "min_alarm_id";
    private static final String KEY_MAX_ID = "max_alarm_id";
    private static final String KEY_ALLOW_DURING_ADHAN = "allow_notifications_during_adhan";
    private static final String KEY_PLAY_IN_SILENT = "play_adhan_in_silent_mode";
    private static final String KEY_AUDIO_USAGE = "adhan_audio_usage";

    private AdhanAlarmStore() {}

    public static void setAllowNotificationsDuringAdhan(Context context, boolean allow) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_ALLOW_DURING_ADHAN, allow).apply();
    }

    public static boolean getAllowNotificationsDuringAdhan(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getBoolean(KEY_ALLOW_DURING_ADHAN, true);
    }

    public static void setPlayAdhanInSilentMode(Context context, boolean playInSilent) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putBoolean(KEY_PLAY_IN_SILENT, playInSilent).apply();
    }

    public static boolean getPlayAdhanInSilentMode(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getBoolean(KEY_PLAY_IN_SILENT, true);
    }

    public static void setAudioUsage(Context context, String usage) {
        String normalized = "notification".equals(usage) ? "notification" : "alarm";
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_AUDIO_USAGE, normalized).apply();
    }

    public static String getAudioUsage(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_AUDIO_USAGE, "alarm");
    }

    public static boolean canUseExactAlarms(AlarmManager am) {
        if (am == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return am.canScheduleExactAlarms();
        }
        return true;
    }

    public static void cancelStoredAlarms(Context context) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int minId = prefs.getInt(KEY_MIN_ID, 5000);
        int maxId = prefs.getInt(KEY_MAX_ID, 5999);

        if (am != null) {
            int flags = PendingIntent.FLAG_NO_CREATE;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            for (int id = minId; id <= maxId; id++) {
                Intent intent = new Intent(context, AdhanAlarmReceiver.class);
                intent.setAction(AdhanAlarmReceiver.ACTION_FIRE_ADHAN);
                PendingIntent pi = PendingIntent.getBroadcast(context, id, intent, flags);
                if (pi != null) {
                    am.cancel(pi);
                    pi.cancel();
                }
            }
        }
    }

    public static int saveAndScheduleAlarms(Context context, JSONArray alarms) {
        cancelStoredAlarms(context);

        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
            .putString(KEY_ALARMS_JSON, alarms.toString())
            .putLong(KEY_LAST_SCHEDULED_AT, System.currentTimeMillis())
            .apply();

        return armAlarmsFromJson(context, alarms);
    }

    public static boolean scheduleSingleTestAlarm(Context context, JSONObject obj) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null || obj == null) return false;
        return armSingleAlarm(context, am, obj, canUseExactAlarms(am), 5996, true);
    }

    public static int rescheduleStoredAlarms(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String raw = prefs.getString(KEY_ALARMS_JSON, null);
        if (raw == null || raw.isEmpty()) {
            return 0;
        }
        try {
            JSONArray alarms = new JSONArray(raw);
            return armAlarmsFromJson(context, alarms);
        } catch (Exception e) {
            Log.w(TAG, "Failed to parse stored adhan alarms", e);
            return 0;
        }
    }

    public static int getStoredScheduledCount(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String raw = prefs.getString(KEY_ALARMS_JSON, null);
        if (raw == null || raw.isEmpty()) return 0;
        try {
            JSONArray alarms = new JSONArray(raw);
            long now = System.currentTimeMillis();
            int futureCount = 0;
            for (int i = 0; i < alarms.length(); i++) {
                JSONObject item = alarms.optJSONObject(i);
                if (item != null && item.optLong("triggerAtMs", 0L) > now) {
                    futureCount++;
                }
            }
            return futureCount;
        } catch (Exception e) {
            return 0;
        }
    }

    public static long getNextAlarmTriggerAtMs(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String raw = prefs.getString(KEY_ALARMS_JSON, null);
        if (raw == null || raw.isEmpty()) return 0L;
        try {
            JSONArray alarms = new JSONArray(raw);
            long now = System.currentTimeMillis();
            long earliest = Long.MAX_VALUE;
            for (int i = 0; i < alarms.length(); i++) {
                JSONObject item = alarms.optJSONObject(i);
                if (item == null) continue;
                long ts = item.optLong("triggerAtMs", 0L);
                if (ts > now && ts < earliest) {
                    earliest = ts;
                }
            }
            return earliest == Long.MAX_VALUE ? 0L : earliest;
        } catch (Exception e) {
            return 0L;
        }
    }

    public static long getLastScheduledAt(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getLong(KEY_LAST_SCHEDULED_AT, 0L);
    }

    private static boolean armSingleAlarm(
        Context context,
        AlarmManager am,
        JSONObject obj,
        boolean exactAllowed,
        int defaultId,
        boolean isTest
    ) {
        long now = System.currentTimeMillis();
        int id = obj.optInt("id", defaultId);
        long triggerAtMs = obj.optLong("triggerAtMs", 0L);
        if (triggerAtMs <= now + 1500L) return false;

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }

        String title = obj.optString("title", "حان الآن موعد الصلاة");
        String body = obj.optString("body", "");
        String prayerKey = obj.optString("prayerKey", "fajr");
        String mode = obj.optString("mode", "adhan");
        String rawName = obj.optString("rawName", "");
        String channelId = obj.optString("channelId", "adhan_silent_v2");
        boolean allowDuringAdhan = obj.optBoolean(
            "allowNotificationsDuringAdhan",
            getAllowNotificationsDuringAdhan(context)
        );
        boolean playInSilent = obj.optBoolean(
            "playAdhanInSilentMode",
            getPlayAdhanInSilentMode(context)
        );
        String audioUsage = obj.optString("audioUsage", getAudioUsage(context));

        Intent intent = new Intent(context, AdhanAlarmReceiver.class);
        intent.setAction(AdhanAlarmReceiver.ACTION_FIRE_ADHAN);
        intent.putExtra("alarm_id", id);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        intent.putExtra("prayerKey", prayerKey);
        intent.putExtra("mode", mode);
        intent.putExtra("rawName", rawName);
        intent.putExtra("channelId", channelId);
        intent.putExtra("isTest", isTest);
        intent.putExtra("allowNotificationsDuringAdhan", allowDuringAdhan);
        intent.putExtra("playAdhanInSilentMode", playInSilent);
        intent.putExtra("audioUsage", audioUsage);

        PendingIntent operation = PendingIntent.getBroadcast(context, id, intent, piFlags);

        try {
            if (("adhan".equals(mode) || "gentle".equals(mode)) && exactAllowed && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                // setAlarmClock دقيق في Doze ويمنح صلاحية بدء الخدمة الأمامية تلقائياً على أندرويد 12+/HiOS حتى عند إغلاق التطبيق
                Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
                PendingIntent showIntent = launchIntent != null
                    ? PendingIntent.getActivity(context, id, launchIntent, piFlags)
                    : operation;
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(triggerAtMs, showIntent), operation);
            } else if (exactAllowed && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, operation);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, operation);
            } else {
                am.set(AlarmManager.RTC_WAKEUP, triggerAtMs, operation);
            }
            return true;
        } catch (Exception e) {
            Log.w(TAG, "Primary alarm schedule failed for id=" + id + ", trying setExactAndAllowWhileIdle", e);
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, operation);
                } else {
                    am.set(AlarmManager.RTC_WAKEUP, triggerAtMs, operation);
                }
                return true;
            } catch (Exception e2) {
                Log.w(TAG, "Could not schedule alarm id=" + id, e2);
                return false;
            }
        }
    }

    private static int armAlarmsFromJson(Context context, JSONArray alarms) {
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null || alarms == null) return 0;

        boolean exactAllowed = canUseExactAlarms(am);
        int minId = Integer.MAX_VALUE;
        int maxId = Integer.MIN_VALUE;
        int scheduled = 0;

        for (int i = 0; i < alarms.length(); i++) {
            JSONObject obj = alarms.optJSONObject(i);
            if (obj == null) continue;
            int id = obj.optInt("id", 5000 + i);
            if (armSingleAlarm(context, am, obj, exactAllowed, id, false)) {
                if (id < minId) minId = id;
                if (id > maxId) maxId = id;
                scheduled++;
            }
        }

        if (scheduled > 0) {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                .putInt(KEY_MIN_ID, minId)
                .putInt(KEY_MAX_ID, maxId)
                .apply();
        }
        return scheduled;
    }
}

import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  Copy,
  ExternalLink,
  X,
  Sparkles,
  RefreshCw,
  Apple,
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, needRefresh, install, applyUpdate } =
    usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'native'>(
    isIOS ? 'ios' : 'android'
  );

  if (!isOpen) return null;

  const currentUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-akqc23dw6qsgg577uvgzi7-802107894744.europe-west2.run.app';

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleInstallClick = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="تثبيت التطبيق على الجوال"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-white rounded-3xl border border-emerald-200 shadow-2xl overflow-hidden text-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 bg-gradient-to-l from-emerald-950 via-emerald-900 to-teal-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-amber-300">
              <Smartphone className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-300">تطبيق مستقل مع تحديث فوري تلقائي</span>
              <h2 className="font-display font-black text-lg sm:text-xl text-white">
                تثبيت رحلة النور على هاتفك
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Live Auto-Update Guarantee Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-l from-emerald-50 via-teal-50 to-amber-50/70 border border-emerald-200 text-slate-800">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-display font-black text-sm sm:text-base text-emerald-950">
                  ربط التحديثات المباشرة (التحديث التلقائي الفوري)
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                  تم ربط التطبيق بتقنية <strong>PWA المتقدمة (Auto-Update)</strong>. هذا يعني أنك لست بحاجة لإعادة تثبيت أي ملف APK كلما قمنا بتحديث! أي ميزة أو محتوى نحدثه هنا، سيظهر على هاتفك تلقائياً بمجرد فتح التطبيق أو عند الاتصال.
                </p>
              </div>
            </div>
          </div>

          {/* New update alert if available */}
          {needRefresh && (
            <div className="p-3.5 rounded-2xl bg-amber-500 text-white flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" aria-hidden="true" />
                <span className="font-display font-bold text-xs sm:text-sm">
                  يتوفر إصدار أحدث للتطبيق تم نشره للتو!
                </span>
              </div>
              <button
                type="button"
                onClick={applyUpdate}
                className="px-3.5 py-1.5 rounded-xl bg-white text-emerald-950 font-display font-black text-xs cursor-pointer shadow-sm"
              >
                تحديث الآن
              </button>
            </div>
          )}

          {/* Direct Install Button if supported */}
          {isInstallable && (
            <div className="text-center p-4 rounded-2xl bg-emerald-900 text-white shadow-lg border border-amber-300/40">
              <p className="font-display font-extrabold text-sm sm:text-base mb-3">
                جهازك يدعم التثبيت المباشر بضغطة زر واحدة!
              </p>
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full sm:w-auto min-h-[48px] px-8 py-3 rounded-2xl bg-gradient-to-l from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-emerald-950 font-display font-black text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all mx-auto"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                <span>تثبيت التطبيق على الجهاز الآن</span>
              </button>
            </div>
          )}

          {/* Already installed banner */}
          {isInstalled && (
            <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-950 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
              <p className="font-display font-bold text-xs sm:text-sm">
                التطبيق مثبت بالفعل ويعمل بوضع التطبيق المستقل بكامل ميزاته وتحديثاته الفورية!
              </p>
            </div>
          )}

          {/* OS Switcher Tabs */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 min-h-[44px] px-3 py-2 rounded-2xl font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>أندرويد (تحديث مباشر)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 min-h-[44px] px-3 py-2 rounded-2xl font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-sky-600 text-white border-sky-700 shadow-md'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Apple className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>آيفون (Safari)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('native')}
                className={`flex-1 min-h-[44px] px-3 py-2 rounded-2xl font-display font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5 border-2 transition-all cursor-pointer ${
                  activeTab === 'native'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-md'
                    : 'bg-amber-50/80 text-amber-950 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>تصدير APK / iOS (إشعارات خارجية)</span>
              </button>
            </div>

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-slate-800 space-y-3">
                <h4 className="font-display font-bold text-sm text-emerald-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white text-xs flex items-center justify-center">1</span>
                  <span>خطوات التثبيت على أندرويد عبر متصفح Chrome:</span>
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed pr-2">
                  <li>
                    افتح الرابط أدناه في متصفح <strong>Google Chrome</strong> على هاتفك.
                  </li>
                  <li>
                    اضغط على زر <strong>"تثبيت التطبيق"</strong> الذي يظهر أسفل الشاشة أو في القائمة العلوية.
                  </li>
                  <li>
                    أو اضغط على قائمة المتصفح (<strong>الثلاث نقاط ⋮</strong> في أعلى اليسار) ثم اختر <strong>"تثبيت التطبيق"</strong> أو <strong>"الإضافة إلى الشاشة الرئيسية" (Add to Home screen)</strong>.
                  </li>
                  <li>
                    سيتم إنشاء أيقونة رسمية للتطبيق في شاشة هاتفك وتفتح بملء الشاشة، وستتلقى جميع التحديثات فور نشرها مباشرة!
                  </li>
                </ol>
              </div>
            )}

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 text-slate-800 space-y-3">
                <h4 className="font-display font-bold text-sm text-sky-950 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-sky-600 text-white text-xs flex items-center justify-center">1</span>
                  <span>خطوات التثبيت على الآيفون (Safari):</span>
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed pr-2">
                  <li>
                    افتح الرابط في متصفح <strong>Safari</strong> على جهاز الآيفون.
                  </li>
                  <li>
                    اضغط على زر المشاركة <Share2 className="w-3.5 h-3.5 inline text-sky-600" /> في شريط المتصفح بالأسفل.
                  </li>
                  <li>
                    مرر لأسفل واختر <strong>"إضافة إلى الصفحة الرئيسية" (Add to Home Screen)</strong>.
                  </li>
                  <li>
                    اضغط <strong>"إضافة" (Add)</strong>، وستجد التطبيق على شاشتك الرئيسية ويعمل كتطبيق مستقل بدون شريط المتصفح مع التحديث التلقائي.
                  </li>
                </ol>
              </div>
            )}

            {/* Native Capacitor Export Instructions */}
            {activeTab === 'native' && (
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-300 text-slate-800 space-y-3">
                <h4 className="font-display font-bold text-sm text-amber-950">
                  مجلد Android جاهز في المشروع! طرق استخراج ملف APK:
                </h4>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  تم إنشاء مشروع <strong>android/</strong> وتفعيل <strong>الربط المباشر (`server.url`)</strong> مع صلاحيات الإشعارات الدقيقة وإضافة <strong>Local Notifications</strong>، لتصلك التعديلات الجديدة تلقائياً عند فتح التطبيق، وتصلك تنبيهات `12:05 ص` والمناسبات الهجرية <strong>خارج التطبيق وبدون إنترنت</strong>.
                </p>
                <div className="space-y-1.5 text-xs text-slate-700">
                  <div className="font-bold text-emerald-900">١) عبر Android Studio أو سطر الأوامر على جهازك:</div>
                  <div dir="ltr" className="p-3 rounded-xl bg-slate-900 text-amber-200 font-mono text-[11px] sm:text-xs space-y-1 overflow-x-auto">
                    <div>npm install && npm run cap:sync</div>
                    <div>cd android && ./gradlew assembleDebug</div>
                    <div># أو افتح في Android Studio: npm run cap:android</div>
                  </div>
                </div>
                <p className="text-xs text-amber-950 font-bold">
                  ٢) أو تلقائياً عبر GitHub: عند رفع المشروع لـ GitHub سيقوم ملف <code>.github/workflows/build-android-apk.yml</code> ببناء ملف <code>app-debug.apk</code> جاهزاً للتحميل على هاتفك مباشرة!
                </p>
              </div>
            )}
          </div>

          {/* App Direct URL Section */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-600">
              رابط التطبيق المباشر (افتحه من هاتفك):
            </label>
            <div className="flex items-center gap-2" dir="ltr">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full text-xs font-mono bg-white px-3 py-2 rounded-xl border border-slate-300 text-slate-700 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`min-h-[38px] px-4 py-2 rounded-xl font-display font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" aria-hidden="true" />
                    <span>نسخ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-bold text-slate-500">
            تطبيق ويب تقدمي PWA متوافق 100% مع أندرويد وآيفون
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-6 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-display font-bold text-xs cursor-pointer transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

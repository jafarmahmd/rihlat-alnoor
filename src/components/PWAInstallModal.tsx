import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  Copy,
  X,
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
  const { isInstallable, isInstalled, isIOS, needRefresh, install, applyUpdate } =
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#081A14]/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="تثبيت التطبيق على الجوال"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col bg-[#FAF6EC] paper-grain rounded-[6px] border border-[#B8924A]/70 shadow-2xl overflow-hidden text-right text-[#11271F]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 bg-[#0F3D2E] text-[#FAF6EC] border-b border-[#B8924A]/50 shrink-0">
          <div className="flex items-center gap-3">
            <Smartphone className="w-6 h-6 text-[#D9B96A] shrink-0" aria-hidden="true" />
            <div>
              <span className="text-xs font-medium text-[#D9B96A] block">
                تطبيق مستقل مع تحديث فوري تلقائي
              </span>
              <h2 className="font-display text-lg sm:text-xl text-[#FAF6EC]">
                تثبيت رحلة النور على هاتفك
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="min-w-[40px] min-h-[40px] rounded-[4px] border border-[#B8924A]/40 bg-[#081A14]/45 hover:bg-[#1F6B50] flex items-center justify-center text-[#FAF6EC] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Live Auto-Update Guarantee Banner */}
          <div className="p-4 rounded-[6px] bg-[#F3ECDA]/80 border border-[#B8924A]/45 text-[#11271F]">
            <div className="flex items-start gap-2.5">
              <RefreshCw className="w-5 h-5 text-[#1F6B50] shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <h3 className="font-arabic font-bold text-sm sm:text-base text-[#11271F]">
                  ربط التحديثات المباشرة (التحديث التلقائي الفوري)
                </h3>
                <p className="text-xs sm:text-sm text-[#425B51] mt-1 leading-relaxed">
                  تم ربط التطبيق بتقنية <strong>PWA المتقدمة (Auto-Update)</strong>. هذا يعني أنك لست بحاجة لإعادة تثبيت أي ملف APK كلما قمنا بتحديث؛ أي ميزة أو محتوى نحدثه هنا، سيظهر على هاتفك تلقائياً بمجرد فتح التطبيق أو عند الاتصال.
                </p>
              </div>
            </div>
          </div>

          {/* New update alert if available */}
          {needRefresh && (
            <div className="p-3.5 rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#D9B96A] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#D9B96A] animate-spin" aria-hidden="true" />
                <span className="font-medium text-xs sm:text-sm">
                  يتوفر إصدار أحدث للتطبيق تم نشره للتو!
                </span>
              </div>
              <button
                type="button"
                onClick={applyUpdate}
                className="btn-gilded px-3.5 py-1.5 text-xs shrink-0"
              >
                تحديث الآن
              </button>
            </div>
          )}

          {/* Direct Install Button if supported */}
          {isInstallable && (
            <div className="text-center p-4 rounded-[6px] bg-[#0F3D2E] text-[#FAF6EC] border border-[#B8924A]/60">
              <p className="font-arabic font-bold text-sm sm:text-base mb-3">
                جهازك يدعم التثبيت المباشر بضغطة زر واحدة
              </p>
              <button
                type="button"
                onClick={handleInstallClick}
                className="btn-gilded w-full sm:w-auto min-h-[48px] px-8 py-2.5 text-sm sm:text-base inline-flex items-center justify-center gap-2 mx-auto"
              >
                <Download className="w-5 h-5" aria-hidden="true" />
                <span>تثبيت التطبيق على الجهاز الآن</span>
              </button>
            </div>
          )}

          {/* Already installed banner */}
          {isInstalled && (
            <div className="p-4 rounded-[6px] bg-[#F3ECDA] border border-[#1F6B50]/45 text-[#11271F] flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#1F6B50] shrink-0" aria-hidden="true" />
              <p className="font-medium text-xs sm:text-sm">
                التطبيق مثبت بالفعل ويعمل بوضع التطبيق المستقل بكامل ميزاته وتحديثاته الفورية.
              </p>
            </div>
          )}

          {/* OS Switcher Tabs */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('android')}
                className={`flex-1 min-h-[42px] px-3 py-2 rounded-[4px] font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                  activeTab === 'android'
                    ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                    : 'bg-[#FAF6EC] text-[#425B51] border-[#B8924A]/35 hover:border-[#B8924A]'
                }`}
              >
                <Smartphone className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>أندرويد (تحديث مباشر)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ios')}
                className={`flex-1 min-h-[42px] px-3 py-2 rounded-[4px] font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                  activeTab === 'ios'
                    ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                    : 'bg-[#FAF6EC] text-[#425B51] border-[#B8924A]/35 hover:border-[#B8924A]'
                }`}
              >
                <Apple className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>آيفون (Safari)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('native')}
                className={`flex-1 min-h-[42px] px-3 py-2 rounded-[4px] font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 border transition-colors cursor-pointer ${
                  activeTab === 'native'
                    ? 'bg-[#0F3D2E] text-[#FAF6EC] border-[#B8924A]'
                    : 'bg-[#F3ECDA]/80 text-[#11271F] border-[#B8924A]/45 hover:border-[#B8924A]'
                }`}
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>تصدير APK / iOS</span>
              </button>
            </div>

            {/* Android Instructions */}
            {activeTab === 'android' && (
              <div className="p-4 rounded-[6px] bg-[#FAF6EC] border border-[#B8924A]/45 text-[#11271F] space-y-3">
                <h4 className="font-arabic font-bold text-sm text-[#0F3D2E]">
                  خطوات التثبيت على أندرويد عبر متصفح Chrome:
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-[#425B51] leading-relaxed pr-1">
                  <li>
                    افتح الرابط أدناه في متصفح <strong>Google Chrome</strong> على هاتفك.
                  </li>
                  <li>
                    اضغط على زر <strong>«تثبيت التطبيق»</strong> الذي يظهر أسفل الشاشة أو في القائمة العلوية.
                  </li>
                  <li>
                    أو اضغط على قائمة المتصفح (<strong>الثلاث نقاط ⋮</strong> في أعلى اليسار) ثم اختر <strong>«تثبيت التطبيق»</strong> أو <strong>«الإضافة إلى الشاشة الرئيسية» (Add to Home screen)</strong>.
                  </li>
                  <li>
                    سيتم إنشاء أيقونة رسمية للتطبيق في شاشة هاتفك وتفتح بملء الشاشة، وستتلقى جميع التحديثات فور نشرها مباشرة.
                  </li>
                </ol>
              </div>
            )}

            {/* iOS Instructions */}
            {activeTab === 'ios' && (
              <div className="p-4 rounded-[6px] bg-[#FAF6EC] border border-[#B8924A]/45 text-[#11271F] space-y-3">
                <h4 className="font-arabic font-bold text-sm text-[#0F3D2E]">
                  خطوات التثبيت على الآيفون (Safari):
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-[#425B51] leading-relaxed pr-1">
                  <li>
                    افتح الرابط في متصفح <strong>Safari</strong> على جهاز الآيفون.
                  </li>
                  <li>
                    اضغط على زر المشاركة <Share2 className="w-3.5 h-3.5 inline text-[#1F6B50]" /> في شريط المتصفح بالأسفل.
                  </li>
                  <li>
                    مرر لأسفل واختر <strong>«إضافة إلى الصفحة الرئيسية» (Add to Home Screen)</strong>.
                  </li>
                  <li>
                    اضغط <strong>«إضافة» (Add)</strong>، وستجد التطبيق على شاشتك الرئيسية ويعمل كتطبيق مستقل بدون شريط المتصفح مع التحديث التلقائي.
                  </li>
                </ol>
              </div>
            )}

            {/* Native Capacitor Export Instructions */}
            {activeTab === 'native' && (
              <div className="p-4 rounded-[6px] bg-[#F3ECDA]/70 border border-[#B8924A]/55 text-[#11271F] space-y-3">
                <h4 className="font-arabic font-bold text-sm text-[#0F3D2E]">
                  مجلد Android جاهز في المشروع — طرق استخراج ملف APK:
                </h4>
                <p className="text-xs sm:text-sm text-[#425B51] leading-relaxed">
                  تم تجهيز مشروع <strong>android/</strong> بالوضع المدمج المستقل (<code>webDir: &apos;dist&apos;</code>) مع صلاحيات الإشعارات الدقيقة وإضافة <strong>Local Notifications</strong>، ليعمل التطبيق بسرعة ومباشرة على هاتفك <strong>بدون إنترنت</strong> وتصلك تنبيهات <code>12:05 ص</code> والمناسبات الهجرية خارج التطبيق.
                </p>
                <div className="space-y-1.5 text-xs text-[#425B51]">
                  <div className="font-bold text-[#0F3D2E]">١) عبر Android Studio أو سطر الأوامر على جهازك:</div>
                  <div dir="ltr" className="p-3 rounded-[4px] bg-[#081A14] text-[#D9B96A] border border-[#B8924A]/40 font-mono text-[11px] sm:text-xs space-y-1 overflow-x-auto">
                    <div>npm install && npm run cap:sync</div>
                    <div>cd android && ./gradlew assembleDebug</div>
                    <div># أو افتح في Android Studio: npm run cap:android</div>
                  </div>
                </div>
                <p className="text-xs text-[#11271F] font-medium">
                  ٢) أو تلقائياً عبر GitHub: عند رفع المشروع لـ GitHub سيقوم ملف سير العمل ببناء ملف <code>app-debug.apk</code> جاهزاً للتحميل على هاتفك مباشرة.
                </p>
              </div>
            )}
          </div>

          {/* App Direct URL Section */}
          <div className="p-3.5 rounded-[6px] bg-[#F3ECDA]/65 border border-[#B8924A]/35 space-y-2">
            <label className="block text-xs font-medium text-[#425B51]">
              رابط التطبيق المباشر (افتحه من هاتفك):
            </label>
            <div className="flex items-center gap-2" dir="ltr">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full text-xs font-mono bg-[#FAF6EC] px-3 py-2 rounded-[4px] border border-[#B8924A]/45 text-[#11271F] select-all focus:outline-none focus:border-[#0F3D2E]"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`min-h-[38px] px-4 py-2 rounded-[4px] font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 border ${
                  copied
                    ? 'bg-[#1F6B50] text-[#FAF6EC] border-[#0F3D2E]'
                    : 'bg-[#FAF6EC] hover:bg-[#F3ECDA] text-[#0F3D2E] border-[#B8924A]/60'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                    <span>تم النسخ</span>
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
        <div className="p-3.5 sm:p-4 bg-[#F3ECDA] border-t border-[#B8924A]/35 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <span className="text-xs font-medium text-[#425B51]">
            تطبيق ويب تقدمي PWA متوافق ١٠٠٪ مع أندرويد وآيفون
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn-manuscript min-h-[40px] px-6 py-2 text-xs"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};

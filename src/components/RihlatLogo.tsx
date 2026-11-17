import React from 'react';

export const OFFICIAL_LOGO_URL =
  '/assets/aistudio/Gemini_Generated_Image_nrvmafnrvmafnrvm_1d697231.jpg';

interface RihlatLogoProps {
  size?: 'sm' | 'lg';
}

export const RihlatLogo: React.FC<RihlatLogoProps> = ({ size = 'lg' }) => {
  if (size === 'sm') {
    return (
      <div className="flex items-center select-none">
        <img
          src={OFFICIAL_LOGO_URL}
          alt="شعار تطبيق رحلة النور"
          className="h-8 sm:h-10 w-auto object-contain rounded-lg bg-white"
        />
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center lg:items-start select-none w-full">
      <h1 className="sr-only">
        رحلة النور — أدعية، معرفة أهل البيت، وتعلم ممتع
      </h1>
      <img
        src={OFFICIAL_LOGO_URL}
        alt="الشعار الرسمي لتطبيق رحلة النور — أدعية، معرفة أهل البيت، وتعلم ممتع"
        className="w-full max-w-[260px] sm:max-w-[360px] h-auto object-contain rounded-2xl bg-white border border-[#E5E0D5]"
      />
    </div>
  );
};

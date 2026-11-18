<div dir="rtl">

# بررسی CRMهای پیشرو و ویژگی‌های هوش مصنوعی آن‌ها

تاریخ: 2026-11-18

## الگوهای مشترک در CRMهای پیشرو

| الگو | چه کسی دارد | خلاصه |
|---|---|---|
| امتیازدهی لید و احتمال برد معامله | Salesforce Einstein، Pipedrive، Zoho Zia | به هر لید یا معامله یک عدد می‌دهد و اولویت‌بندی می‌کند |
| پیشنهاد اقدام بعدی (Next Best Action) | Pipedrive، Dynamics 365 Copilot | به کارشناس می‌گوید الان با این مشتری چه کند |
| پرسش از CRM با زبان طبیعی | Ask Attio، Sales agent مایکروسافت | «این ماه کدام معامله‌ها گیر کرده‌اند؟» |
| خلاصهٔ رابطه با مشتری و آماده‌سازی جلسه | Close (Chloe)، Folk Recap، Copilot meeting prep | قبل از تماس، کل تاریخچه در چند خط |
| پیش‌نویس پیگیری و بهترین زمان تماس | Folk Follow-up، Zoho Zia | متن پیگیری با لحن کارشناس و زمان مناسب |
| CRM خودبه‌روزشونده | HubSpot Smart CRM، Close | از یادداشت و تماس، فیلدها و تسک‌ها خودکار پر می‌شوند |
| ایجنت پاسخ فوری به لید ورودی (SDR) | Agentforce، HubSpot Prospecting Agent | لید جدید بلافاصله پیام می‌گیرد و واجد شرایط‌سنجی می‌شود |
| تشخیص ناهنجاری و هشدار | Zoho Zia | «لیدهای این هفته ۴۰٪ افت کرده» |
| گام هوش مصنوعی داخل اتوماسیون | HubSpot Agent Builder، Attio Workflows | یک بلوک «AI» در جریان کاری |

CRMهای ایرانی (دیدار با دستیار «آیدا»، پیام‌گستر) تازه وارد این حوزه شده‌اند. پس هوش مصنوعیِ فارسی‌محور هنوز جای خالی دارد.

## انتخاب برای این پروژه

معیار انتخاب: در یک پروژهٔ بوت‌کمپ پیاده‌شدنی باشد، در دمو دیده شود، و به نیازمندی‌های اجباری (صف، اتوماسیون، کمپین) وصل شود.

### هستهٔ تمایز (پیشنهاد اصلی)
1. **یادداشت هوشمند (CRM خودبه‌روزشونده):** کارشناس بعد از تماس یک یادداشت آزاد فارسی می‌نویسد، مثل «تماس گرفتم، بودجه ۵۰ میلیون، هفته بعد جلسه». مدل مرحلهٔ معامله، مبلغ و تسک پیگیری را پیشنهاد می‌دهد و کارشناس با یک کلیک تأیید می‌کند.
2. **خلاصه و آماده‌سازی تماس:** روی صفحهٔ هر مشتری یا لید دکمهٔ «خلاصه» هست: چه گذشته، ریسک‌ها و قدم بعدی.
3. **امتیاز لید + اقدام بعدی:** امتیاز قاعده‌محور (منبع، تعامل، تازگی) که قابل اتکا و قابل تست است. مدل فقط توضیح فارسی و پیشنهاد اقدام بعدی را می‌نویسد.
4. **پیام شخصی‌سازی‌شده در کمپین و اتوماسیون:** یک گام «AI» در اتوماسیون که برای هر گیرنده متن پیامک یا ایمیل اختصاصی می‌سازد. از طریق صف اجرا می‌شود و به نیازمندی صف هم وصل است.

### در صورت داشتن وقت
5. **دستیار پرسش از CRM:** سؤال فارسی ← فراخوانی ابزارهای از پیش تعریف‌شده (نه SQL خام) با رعایت سطح دسترسی کاربر.
6. **هشدار هوشمند در داشبورد مدیر:** معامله‌هایی که N روز بی‌حرکت مانده‌اند و افت ناگهانی لید.

### کنار گذاشته‌شده
- ایجنت تحقیق وب و غنی‌سازی داده: دادهٔ وب فارسی دربارهٔ شرکت‌ها کم است.
- خلاصهٔ تماس تلفنی: سیستم تلفن در پروژه نیست.

## اصول پیاده‌سازی
- هوش مصنوعی اختیاری است و اپ بدون کلید API هم کامل کار می‌کند. هر قابلیت AI بدون کلید پنهان می‌شود.
- خروجی مدل همیشه «پیشنهاد» است و کاربر تأیید می‌کند. مدل مستقیم داده‌ای را عوض نمی‌کند.
- خروجی ساخت‌یافته (JSON schema) با اعتبارسنجی Zod.
- فراخوانی‌های سنگین (کمپین، اتوماسیون) در صف اجرا می‌شوند، نه در درخواست HTTP.
- ارائه‌دهندهٔ مدل: یک API سازگار با OpenAI که از ایران و از سرور لیارا در دسترس باشد. قبل از شروع، در دسترس بودن آن را تست کنید.

## منابع
- [Salesforce — AI for lead qualification](https://www.salesforce.com/blog/ai-for-lead-qualification/)
- [HubSpot Spring 2026 Spotlight](https://www.hubspot.com/company-news/spring-2026-spotlight?data=data)
- [Attio AI](https://attio.com/platform/ai) · [Ask Attio (engineering blog)](https://attio.com/engineering/blog/ask-attio-a-technical-look-at-our-new-agent)
- [Pipedrive AI Sales Assistant](https://pipedrive.com/features/ai-sales-assistant)
- [Zoho Zia — anomalies & best mode to contact](https://help.zoho.com/portal/en/community/topic/new-in-zia-identify-anomalies-in-list-views-plus-best-mode-to-contact-recommendations)
- [Microsoft Sales agent — meeting prep](https://learn.microsoft.com/microsoft-sales-copilot/meeting-prep)
- [Close AI / Call assistant](https://www.close.com/notetaker)
- [Folk — AI follow-up assistant](https://www.folk.app/articles/crm-with-ai-follow-up-assistant)
- [Zoomit — دیدار و آیدا](https://www.zoomit.ir/tech-iran/450340-iran-crm-market-gap-didar-strategy-aida-ai/)

</div>

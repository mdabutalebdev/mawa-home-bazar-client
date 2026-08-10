/**
 * Bengali / English strings for the storefront.
 *
 * `en` is the source of truth: its keys generate `TranslationKey`, and `bn` is
 * typed as a full `Record` of them — so a forgotten Bengali string is a compile
 * error, not a blank label in front of a shopkeeper in Munshiganj.
 *
 * Sentences that wrap a runtime value (a name, a count, an area) are split into
 * prefix/suffix pairs rather than templated, because Bangla puts the value in a
 * different place than English does. Either half may legitimately be ''.
 */

export type Lang = 'en' | 'bn';

const en = {
    /* ─────────── Header / navigation ─────────── */
    'nav.home': 'Home',
    'nav.allProducts': 'All Products',
    'nav.categories': 'Categories',
    'nav.allCategories': 'All Categories',
    'nav.all': 'All',
    'nav.trackOrder': 'Track Order',
    'nav.helpSupport': 'Help & Support',
    'nav.wishlist': 'Wishlist',
    'nav.cart': 'Cart',
    'nav.signIn': 'Sign In',
    'nav.signInRegister': 'Sign In / Register',
    'nav.account': 'Account',
    'nav.myAccount': 'My Account',
    'nav.dashboard': 'Dashboard',
    'nav.myOrders': 'My Orders',
    'nav.logout': 'Logout',
    'nav.menu': 'Menu',
    'nav.searchPlaceholder': 'Search products…',
    'nav.companies': 'Companies',
    'nav.dealers': 'Find a Dealer',
    'nav.join': 'Join',
    'nav.contact': 'Contact Us',
    'nav.terms': 'Terms & Conditions',
    'nav.privacy': 'Privacy Policy',
    'nav.refund': 'Refund Policy',
    'nav.language': 'Language',

    /* ─────────── Footer ─────────── */
    'footer.quickLinks': 'Quick Links',
    'footer.support': 'Support',
    'footer.weAccept': 'We Accept',
    'footer.liveChat': 'Live Chat (WhatsApp)',
    'footer.newsletterTitle': 'Subscribe to our newsletter',
    'footer.newsletterText': 'Get the latest deals, offers and product updates straight to your inbox.',
    'footer.emailPlaceholder': 'Enter your email',
    'footer.subscribe': 'Subscribe',
    'footer.subscribing': 'Subscribing…',
    'footer.rights': 'All Rights Reserved.',
    'footer.developedBy': 'Developed by',

    /* ─────────── /join hub ─────────── */
    'join.badge': 'Partner programme',
    'join.title': 'Join the Mawa Homebazar BD marketplace',
    'join.subtitle':
        'Four ways to partner with us — supply products, own your upazila, stock your shop at trade prices, or work our field team. Pick the one that fits and apply in minutes.',
    'join.signedInPrefix': 'Signed in as ',
    'join.signedInSuffix': ' — your application will be linked to this account.',
    'join.signInNotice': 'You will be asked to sign in before applying.',
    'join.guestToast': 'Sign in first — an application needs an account.',
    'join.chooseTitle': 'Choose how you want to partner',
    'join.chooseSubtitle': 'Every application is reviewed by our team.',
    'join.signInToApply': 'Sign in to apply',

    'join.company.title': 'Company / Supplier',
    'join.company.pitch': 'List your products nationwide and receive orders directly.',
    'join.company.b1': 'Reach dealers and retailers in every district',
    'join.company.b2': 'Manage your own catalogue, stock and trade prices',
    'join.company.b3': 'Orders land in your panel — no middleman markup',
    'join.company.cta': 'Apply as a company',

    'join.dealer.title': 'Dealer',
    'join.dealer.pitch': 'Represent your upazila. One dealer per upazila across Bangladesh.',
    'join.dealer.b1': 'Exclusive rights — only one dealer per upazila',
    'join.dealer.b2': 'Every order in your area is routed to you',
    'join.dealer.b3': 'Commission on each delivery you complete',
    'join.dealer.cta': 'Apply as a dealer',

    'join.retailer.title': 'Retailer / Shopkeeper',
    'join.retailer.pitch': 'Buy wholesale from verified companies at trade prices.',
    'join.retailer.b1': 'Wholesale rates on every verified brand',
    'join.retailer.b2': 'Order from your phone, delivered by your local dealer',
    'join.retailer.b3': 'Track dues, invoices and repeat orders in one place',
    'join.retailer.cta': 'Apply as a retailer',

    'join.officer.title': 'Marketing Officer',
    'join.officer.pitch': 'Join our field team.',
    'join.officer.b1': 'Sign up shops and dealers in your own area',
    'join.officer.b2': 'Earn on every account you bring in',
    'join.officer.b3': 'Targets, visits and payouts tracked in your app',
    'join.officer.cta': 'Apply as an officer',

    'join.how.title': 'How it works',
    'join.how.subtitle': 'Most applications are reviewed within 2–3 working days.',
    'join.step.apply.title': 'Apply',
    'join.step.apply.text': 'Fill the short form for your role.',
    'join.step.verify.title': 'We verify',
    'join.step.verify.text': 'We check your documents and area.',
    'join.step.approved.title': 'You are approved',
    'join.step.approved.text': 'Your panel is unlocked instantly.',
    'join.step.trade.title': 'Start trading',
    'join.step.trade.text': 'Post products or take orders.',

    'join.help.title': 'Not sure which one fits you?',
    'join.help.text':
        'Tell us about your business and we will point you to the right track. Our team replies within one working day.',
    'join.help.cta': 'Talk to our team',

    /* ─────────── /dealers ─────────── */
    'dealers.breadcrumb': 'Find a Dealer',
    'dealers.badge': 'Dealer network',
    'dealers.title': 'Find your local dealer',
    'dealers.subtitle':
        'Every upazila has one authorised dealer. Pick your area to get their number, address and delivery options — then order straight from them.',
    'dealers.chooseArea': 'Choose your area',
    'dealers.showAll': 'Show every dealer instead',

    /* `{covered}` + mid + `{total}` + suffix */
    'dealers.coverageMid': ' of ',
    'dealers.coverageSuffix': ' upazilas covered',
    'dealers.percentPrefix': '',
    'dealers.percentSuffix': '% of Bangladesh',
    'dealers.withHomeDelivery': ' with home delivery',
    'dealers.coverageUnavailable': 'Coverage figures are not available right now.',
    'dealers.becomeDealer': 'Become a dealer',

    'dealers.allDealers': 'All dealers',
    'dealers.inAreaPrefix': 'Dealers in ',
    'dealers.inAreaSuffix': '',
    'dealers.countOne': 'dealer',
    'dealers.countMany': 'dealers',

    'dealers.emptyTitle': 'No dealers listed yet',
    'dealers.emptyText':
        'Dealers are being appointed across the country. Check back soon, or apply to represent your own area.',
    'dealers.emptyAreaTitle': 'No dealer here yet — become the dealer for this upazila',
    'dealers.emptyAreaTextPrefix': 'We have not appointed anyone for ',
    'dealers.emptyAreaTextSuffix':
        '. One dealer holds each upazila exclusively — claim it before someone else does.',
    'dealers.thisArea': 'this area',
    'dealers.applyToBeDealer': 'Apply to be a dealer',
    'dealers.seeOtherAreas': 'See other areas',

    'dealers.homeDelivery': 'Home delivery available',
    'dealers.call': 'Call',
    'dealers.numberCopied': 'Number copied',
    'dealers.copyFailed': 'Could not copy the number',
    'dealers.ctaTitle': 'Is your upazila still open?',
    'dealers.ctaText':
        'One dealer per upazila, exclusive territory, and every order in your area routed to you. Apply and we will review your application.',

    /* ─────────── Common words ─────────── */
    'common.search': 'Search',
    'common.cart': 'Cart',
    'common.orders': 'Orders',
    'common.profile': 'Profile',
    'common.loading': 'Loading…',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.submit': 'Submit',
    'common.apply': 'Apply',
    'common.approved': 'Approved',
    'common.pending': 'Pending',
    'common.rejected': 'Rejected',
    'common.phone': 'Phone',
    'common.whatsapp': 'WhatsApp',
    'common.address': 'Address',
    'common.division': 'Division',
    'common.district': 'District',
    'common.upazila': 'Upazila',
    'common.price': 'Price',
    'common.quantity': 'Quantity',
    'common.total': 'Total',
    'common.status': 'Status',
    'common.home': 'Home',
};

export type TranslationKey = keyof typeof en;

const bn: Record<TranslationKey, string> = {
    /* ─────────── Header / navigation ─────────── */
    'nav.home': 'হোম',
    'nav.allProducts': 'সব পণ্য',
    'nav.categories': 'ক্যাটাগরি',
    'nav.allCategories': 'সব ক্যাটাগরি',
    'nav.all': 'সব',
    'nav.trackOrder': 'অর্ডার ট্র্যাক',
    'nav.helpSupport': 'সাহায্য ও সহায়তা',
    'nav.wishlist': 'পছন্দের তালিকা',
    'nav.cart': 'কার্ট',
    'nav.signIn': 'সাইন ইন',
    'nav.signInRegister': 'সাইন ইন / রেজিস্টার',
    'nav.account': 'অ্যাকাউন্ট',
    'nav.myAccount': 'আমার অ্যাকাউন্ট',
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.myOrders': 'আমার অর্ডার',
    'nav.logout': 'লগআউট',
    'nav.menu': 'মেনু',
    'nav.searchPlaceholder': 'পণ্য খুঁজুন…',
    'nav.companies': 'কোম্পানি',
    'nav.dealers': 'ডিলার খুঁজুন',
    'nav.join': 'যোগ দিন',
    'nav.contact': 'যোগাযোগ',
    'nav.terms': 'শর্তাবলি',
    'nav.privacy': 'গোপনীয়তা নীতি',
    'nav.refund': 'রিফান্ড নীতি',
    'nav.language': 'ভাষা',

    /* ─────────── Footer ─────────── */
    'footer.quickLinks': 'দ্রুত লিংক',
    'footer.support': 'সহায়তা',
    'footer.weAccept': 'পেমেন্ট মাধ্যম',
    'footer.liveChat': 'লাইভ চ্যাট (হোয়াটসঅ্যাপ)',
    'footer.newsletterTitle': 'আমাদের নিউজলেটার নিন',
    'footer.newsletterText': 'নতুন অফার, ছাড় আর পণ্যের খবর সরাসরি আপনার ইনবক্সে পান।',
    'footer.emailPlaceholder': 'আপনার ইমেইল লিখুন',
    'footer.subscribe': 'সাবস্ক্রাইব',
    'footer.subscribing': 'সাবস্ক্রাইব হচ্ছে…',
    'footer.rights': 'সর্বস্বত্ব সংরক্ষিত।',
    'footer.developedBy': 'ডেভেলপ করেছে',

    /* ─────────── /join hub ─────────── */
    'join.badge': 'পার্টনার প্রোগ্রাম',
    'join.title': 'মাওয়া হোমবাজার বিডি মার্কেটপ্লেসে যোগ দিন',
    'join.subtitle':
        'আমাদের সাথে যুক্ত হওয়ার চারটি উপায় — পণ্য সরবরাহ করুন, নিজের উপজেলার দায়িত্ব নিন, ট্রেড দামে দোকানের মাল তুলুন, অথবা আমাদের ফিল্ড টিমে কাজ করুন। আপনার জন্য উপযুক্তটি বেছে নিয়ে কয়েক মিনিটেই আবেদন করুন।',
    'join.signedInPrefix': 'সাইন ইন করেছেন ',
    'join.signedInSuffix': ' নামে — আপনার আবেদন এই অ্যাকাউন্টের সাথে যুক্ত হবে।',
    'join.signInNotice': 'আবেদনের আগে আপনাকে সাইন ইন করতে বলা হবে।',
    'join.guestToast': 'আগে সাইন ইন করুন — আবেদনের জন্য একটি অ্যাকাউন্ট লাগবে।',
    'join.chooseTitle': 'আপনি কীভাবে যুক্ত হতে চান বেছে নিন',
    'join.chooseSubtitle': 'প্রতিটি আবেদন আমাদের টিম যাচাই করে।',
    'join.signInToApply': 'আবেদন করতে সাইন ইন করুন',

    'join.company.title': 'কোম্পানি / সরবরাহকারী',
    'join.company.pitch': 'সারা দেশে আপনার পণ্য তালিকাভুক্ত করুন এবং সরাসরি অর্ডার নিন।',
    'join.company.b1': 'প্রতিটি জেলার ডিলার ও খুচরা দোকানে পৌঁছান',
    'join.company.b2': 'নিজের ক্যাটালগ, স্টক ও ট্রেড দাম নিজেই নিয়ন্ত্রণ করুন',
    'join.company.b3': 'অর্ডার সরাসরি আপনার প্যানেলে — মাঝখানে বাড়তি খরচ নেই',
    'join.company.cta': 'কোম্পানি হিসেবে আবেদন করুন',

    'join.dealer.title': 'ডিলার',
    'join.dealer.pitch': 'নিজের উপজেলার প্রতিনিধি হোন। সারা বাংলাদেশে প্রতি উপজেলায় একজন ডিলার।',
    'join.dealer.b1': 'একচেটিয়া অধিকার — প্রতি উপজেলায় মাত্র একজন ডিলার',
    'join.dealer.b2': 'আপনার এলাকার প্রতিটি অর্ডার আপনার কাছেই যাবে',
    'join.dealer.b3': 'প্রতিটি ডেলিভারি সম্পন্ন করলেই কমিশন',
    'join.dealer.cta': 'ডিলার হিসেবে আবেদন করুন',

    'join.retailer.title': 'খুচরা বিক্রেতা / দোকানদার',
    'join.retailer.pitch': 'যাচাই করা কোম্পানি থেকে ট্রেড দামে পাইকারি কিনুন।',
    'join.retailer.b1': 'প্রতিটি যাচাই করা ব্র্যান্ডে পাইকারি দাম',
    'join.retailer.b2': 'ফোন থেকেই অর্ডার করুন, পৌঁছে দেবে আপনার এলাকার ডিলার',
    'join.retailer.b3': 'বাকি, চালান ও পুরোনো অর্ডার এক জায়গায় দেখুন',
    'join.retailer.cta': 'খুচরা বিক্রেতা হিসেবে আবেদন করুন',

    'join.officer.title': 'মার্কেটিং অফিসার',
    'join.officer.pitch': 'আমাদের ফিল্ড টিমে যোগ দিন।',
    'join.officer.b1': 'নিজের এলাকার দোকান ও ডিলার যুক্ত করুন',
    'join.officer.b2': 'যত অ্যাকাউন্ট আনবেন, তত আয়',
    'join.officer.b3': 'টার্গেট, ভিজিট ও পেমেন্ট অ্যাপেই দেখুন',
    'join.officer.cta': 'অফিসার হিসেবে আবেদন করুন',

    'join.how.title': 'কীভাবে কাজ করে',
    'join.how.subtitle': 'বেশিরভাগ আবেদন ২–৩ কর্মদিবসের মধ্যে যাচাই করা হয়।',
    'join.step.apply.title': 'আবেদন করুন',
    'join.step.apply.text': 'আপনার রোলের ছোট ফর্মটি পূরণ করুন।',
    'join.step.verify.title': 'আমরা যাচাই করি',
    'join.step.verify.text': 'আমরা আপনার কাগজপত্র ও এলাকা যাচাই করি।',
    'join.step.approved.title': 'অনুমোদন পাবেন',
    'join.step.approved.text': 'সঙ্গে সঙ্গেই আপনার প্যানেল খুলে যাবে।',
    'join.step.trade.title': 'ব্যবসা শুরু করুন',
    'join.step.trade.text': 'পণ্য পোস্ট করুন বা অর্ডার নিন।',

    'join.help.title': 'কোনটি আপনার জন্য বুঝতে পারছেন না?',
    'join.help.text':
        'আপনার ব্যবসার কথা জানান, আমরা সঠিক পথটি দেখিয়ে দেব। আমাদের টিম এক কর্মদিবসের মধ্যে উত্তর দেয়।',
    'join.help.cta': 'আমাদের টিমের সাথে কথা বলুন',

    /* ─────────── /dealers ─────────── */
    'dealers.breadcrumb': 'ডিলার খুঁজুন',
    'dealers.badge': 'ডিলার নেটওয়ার্ক',
    'dealers.title': 'আপনার এলাকার ডিলার খুঁজুন',
    'dealers.subtitle':
        'প্রতিটি উপজেলায় একজন অনুমোদিত ডিলার আছেন। আপনার এলাকা বেছে নিন — নম্বর, ঠিকানা ও ডেলিভারির তথ্য দেখে সরাসরি তাঁর কাছেই অর্ডার করুন।',
    'dealers.chooseArea': 'আপনার এলাকা বেছে নিন',
    'dealers.showAll': 'সব ডিলার দেখুন',

    'dealers.coverageMid': ' / ',
    'dealers.coverageSuffix': ' উপজেলায় ডিলার আছে',
    'dealers.percentPrefix': 'বাংলাদেশের ',
    'dealers.percentSuffix': '%',
    'dealers.withHomeDelivery': ' টিতে হোম ডেলিভারি',
    'dealers.coverageUnavailable': 'কভারেজের তথ্য এখন পাওয়া যাচ্ছে না।',
    'dealers.becomeDealer': 'ডিলার হোন',

    'dealers.allDealers': 'সব ডিলার',
    'dealers.inAreaPrefix': '',
    'dealers.inAreaSuffix': ' -এর ডিলার',
    'dealers.countOne': 'জন ডিলার',
    'dealers.countMany': 'জন ডিলার',

    'dealers.emptyTitle': 'এখনো কোনো ডিলার তালিকাভুক্ত হয়নি',
    'dealers.emptyText':
        'সারা দেশে ডিলার নিয়োগ চলছে। কিছুদিন পর আবার দেখুন, অথবা নিজের এলাকার জন্য আবেদন করুন।',
    'dealers.emptyAreaTitle': 'এখানে এখনো ডিলার নেই — এই উপজেলার ডিলার হয়ে যান',
    'dealers.emptyAreaTextPrefix': 'আমরা এখনো ',
    'dealers.emptyAreaTextSuffix':
        ' এলাকার জন্য কাউকে নিয়োগ দিইনি। প্রতিটি উপজেলা একজন ডিলারের একচেটিয়া অধিকারে — অন্য কেউ নেওয়ার আগেই দাবি করুন।',
    'dealers.thisArea': 'এই',
    'dealers.applyToBeDealer': 'ডিলার হতে আবেদন করুন',
    'dealers.seeOtherAreas': 'অন্য এলাকা দেখুন',

    'dealers.homeDelivery': 'হোম ডেলিভারি আছে',
    'dealers.call': 'কল করুন',
    'dealers.numberCopied': 'নম্বর কপি হয়েছে',
    'dealers.copyFailed': 'নম্বর কপি করা যায়নি',
    'dealers.ctaTitle': 'আপনার উপজেলা কি এখনো খালি?',
    'dealers.ctaText':
        'প্রতি উপজেলায় একজন ডিলার, নিজস্ব এলাকা, আর আপনার এলাকার প্রতিটি অর্ডার আপনার কাছেই। আবেদন করুন, আমরা যাচাই করে জানাব।',

    /* ─────────── Common words ─────────── */
    'common.search': 'খুঁজুন',
    'common.cart': 'কার্ট',
    'common.orders': 'অর্ডার',
    'common.profile': 'প্রোফাইল',
    'common.loading': 'লোড হচ্ছে…',
    'common.save': 'সংরক্ষণ',
    'common.cancel': 'বাতিল',
    'common.submit': 'জমা দিন',
    'common.apply': 'আবেদন করুন',
    'common.approved': 'অনুমোদিত',
    'common.pending': 'অপেক্ষমাণ',
    'common.rejected': 'বাতিল হয়েছে',
    'common.phone': 'ফোন',
    'common.whatsapp': 'হোয়াটসঅ্যাপ',
    'common.address': 'ঠিকানা',
    'common.division': 'বিভাগ',
    'common.district': 'জেলা',
    'common.upazila': 'উপজেলা',
    'common.price': 'দাম',
    'common.quantity': 'পরিমাণ',
    'common.total': 'মোট',
    'common.status': 'অবস্থা',
    'common.home': 'হোম',
};

export const dict: Record<Lang, Record<TranslationKey, string>> = { en, bn };

export default dict;

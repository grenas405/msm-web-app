// content.ts — Single source of truth for all ministry data.
// Pure data. No logic. Edit this file to update the site's text.

export const SITE = {
  name: "Mercy Seat Ministries",
  shortName: "MSM",
  tagline: "Oklahoma City",
  mission:
    "Growing in the light, love, and knowledge of Jesus Christ — and becoming beacons unto as many persons and communities as possible.",
  description:
    "A vibrant, Christ-centered church in Oklahoma City, passionate about the Word of God, the Holy Spirit, scriptural prayer, praise and worship, compassionate ministry, and the next generation.",
} as const;

export const CONTACT = {
  pastor: "Pastor James Olufowote",
  // The primary number, used in the footer and the Services page.
  phone: "(405) 402-7274",
  phoneHref: "tel:+14054027274",
  // All numbers, shown on the Contact page.
  phones: [
    { display: "(405) 402-7274", href: "tel:+14054027274" },
    { display: "(765) 409-2623", href: "tel:+17654092623" },
    { display: "(405) 639-1693", href: "tel:+14056391693" },
  ],
  email: "msmokc@outlook.com",
  address: {
    line1: "705 NW 10th Street",
    detail: "Conference Room",
    city: "Newcastle",
    state: "OK",
    zip: "73065",
  },
  zoom: "https://zoom.us/j/92145127989?pwd=ZVYxYlFKRjZpWFRqa1ZhQ24vTUJHQT09",
} as const;

// Online giving. Card/debit giving can be added later via a hosted link.
export const GIVING = {
  zelleEmail: "msmokc@outlook.com",
} as const;

export interface ServiceTime {
  day: string;
  name: string;
  time: string;
  note: string;
}

export const SERVICES: ServiceTime[] = [
  {
    day: "Sunday",
    name: "Sunday School",
    time: "9:30 AM",
    note: "Grow together in the Word before worship.",
  },
  {
    day: "Sunday",
    name: "Sunday Worship Service",
    time: "10:15 – 11:00 AM",
    note: "Praise, the preached Word, and fellowship.",
  },
  {
    day: "Tuesday",
    name: "Praise & Prayers",
    time: "6:00 – 7:00 PM",
    note: "An hour of scriptural, Spirit-led intercession.",
  },
  {
    day: "Friday",
    name: "Holy Communion & Bible Study",
    time: "6:00 – 8:00 PM",
    note: "The Lord's table and deeper study of Scripture.",
  },
];

export interface Pillar {
  title: string;
  body: string;
  icon: string;
}

export const PILLARS: Pillar[] = [
  {
    title: "The Word of God",
    body:
      "Deep engagement with Scripture to know God the Father, Jesus the Son, and the Holy Spirit.",
    icon: "book",
  },
  {
    title: "The Holy Spirit",
    body:
      "Walking in the gifts and the fruit of the Spirit as a living, active community of believers.",
    icon: "flame",
  },
  {
    title: "Scriptural Prayer",
    body:
      "Intentional, Bible-based prayer that anchors every gathering and decision in God's promises.",
    icon: "hands",
  },
  {
    title: "Praise & Worship",
    body: "Consistent, heartfelt praise that lifts the name of Jesus and welcomes His presence.",
    icon: "music",
  },
  {
    title: "Compassion & Evangelism",
    body:
      "Reaching our city and the world through compassionate service and the good news of Christ.",
    icon: "heart",
  },
  {
    title: "The Next Generation",
    body: "Investing in children and young adults as they grow in faith, character, and calling.",
    icon: "sprout",
  },
  {
    title: "Fellowship",
    body:
      "Sharing life together — breaking bread from house to house with glad and sincere hearts, as the early church did.",
    icon: "users",
  },
];

export interface NavItem {
  label: string;
  href: string;
}

export const NAV: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Ministries", href: "/ministries" },
  { label: "Sunday School", href: "/sunday-school" },
  { label: "Prayer Wall", href: "/prayer-wall" },
  { label: "Giving", href: "/giving" },
  { label: "Contact", href: "/contact" },
];

export interface Verse {
  text: string;
  reference: string;
}

// The primary banner verse. In Christ, the mercy seat of the old covenant becomes
// the throne of grace we are invited to approach — the heart of this ministry.
export const SCRIPTURE: Verse = {
  text:
    "Let us then approach God's throne of grace with confidence, so that we may receive mercy and find grace to help us in our time of need.",
  reference: "Hebrews 4:16",
};

// Additional New Testament promises woven through the landing page.
export const VERSES: Verse[] = [
  {
    text: "Come to me, all you who are weary and burdened, and I will give you rest.",
    reference: "Matthew 11:28",
  },
  {
    text: "If anyone is in Christ, the new creation has come: the old has gone, the new is here!",
    reference: "2 Corinthians 5:17",
  },
  {
    text: "For it is by grace you have been saved, through faith — and this is the gift of God.",
    reference: "Ephesians 2:8",
  },
];

// A short, rotating banner verse used to close interior pages.
export const BENEDICTION: Verse = {
  text:
    "Now to him who is able to do immeasurably more than all we ask or imagine, according to his power that is at work within us — to him be glory.",
  reference: "Ephesians 3:20–21",
};

// The verse that anchors the Prayer Wall.
export const PRAYER_VERSE: Verse = {
  text: "Carry each other's burdens, and in this way you will fulfill the law of Christ.",
  reference: "Galatians 6:2",
};

// The verse that anchors the Fellowship ministry.
export const FELLOWSHIP_VERSE: Verse = {
  text:
    "So continuing daily with one accord in the temple, and breaking bread from house to house, they ate their food with gladness and simplicity of heart.",
  reference: "Acts 2:46",
};

// The fixed set of categories offered on the Prayer Wall request form.
export const PRAYER_CATEGORIES = [
  "Healing",
  "Family",
  "Provision",
  "Salvation",
  "Guidance",
  "Thanksgiving",
  "Other",
] as const;

// Encouragements for the pastor, cycled with a typing animation on the dashboard.
export const SHEPHERD_VERSES: Verse[] = [
  {
    text:
      "Be shepherds of God's flock that is under your care, watching over them — not because you must, but because you are willing, as God wants you to be.",
    reference: "1 Peter 5:2",
  },
  {
    text:
      "Let us not become weary in doing good, for at the proper time we will reap a harvest if we do not give up.",
    reference: "Galatians 6:9",
  },
  {
    text:
      "The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.",
    reference: "Numbers 6:24–25",
  },
  {
    text:
      "And the God of all grace will himself restore you and make you strong, firm and steadfast.",
    reference: "1 Peter 5:10",
  },
  {
    text:
      "Well done, good and faithful servant! You have been faithful with a few things; I will put you in charge of many things.",
    reference: "Matthew 25:21",
  },
  {
    text:
      "When Jesus saw the crowds, he had compassion on them, because they were like sheep without a shepherd.",
    reference: "Matthew 9:36",
  },
  {
    text:
      "Therefore, my dear brothers and sisters, stand firm. Let nothing move you. Always give yourselves fully to the work of the Lord, because you know that your labor in the Lord is not in vain.",
    reference: "1 Corinthians 15:58",
  },
  {
    text:
      "Be strong and courageous. Do not be afraid; for the Lord your God will be with you wherever you go.",
    reference: "Joshua 1:9",
  },
  {
    text: "And let us consider how we may spur one another on toward love and good deeds.",
    reference: "Hebrews 10:24",
  },
  {
    text:
      "I thank my God every time I remember you. In all my prayers for all of you, I always pray with joy.",
    reference: "Philippians 1:3–4",
  },
  {
    text:
      "He tends his flock like a shepherd: He gathers the lambs in his arms and carries them close to his heart.",
    reference: "Isaiah 40:11",
  },
];

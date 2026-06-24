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
  phone: "(405) 402-7274",
  phoneHref: "tel:+14054027274",
  email: "msmokc@gmail.com",
  skype: "live:msmokc_1",
  address: {
    line1: "705 NW 10th Street",
    detail: "Conference Room",
    city: "Newcastle",
    state: "OK",
    zip: "73065",
  },
  zoom: "https://zoom.us/j/92145127989?pwd=ZVYxYlFKRjZpWFRqa1ZhQ24vTUJHQT09",
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
  { label: "Prayer Wall", href: "/prayer-wall" },
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

import home from "@/assets/images/home.svg";
import map from "@/assets/images/map.svg";
import business from "@/assets/images/buisnes.svg";
import booking from "@/assets/images/myBooking.svg";
import support from "@/assets/images/support.svg";
import profileIcon from "@/assets/images/ProfileIcon.svg";
import filter from "@/assets/images/filter.svg";
import notification from "@/assets/images/notification.svg";
import ruLang from "@/assets/images/languages/ruLang.png";
import uzLang from "@/assets/images/languages/uzLang.png";
import enLang from "@/assets/images/languages/enLang.png";
import search from "@/assets/images/search.svg";
import mainPhoto1 from "@/assets/images/mainPhoto1.png";
import mainPhoto2 from "@/assets/images/mainPhoto2.png";
import mainPhoto3 from "@/assets/images/mainPhoto3.png";
import categoryHairCare from "@/assets/images/hairCare.svg";
import categoryHealth from "@/assets/images/health.svg";
import categoryGym from "@/assets/images/gym.svg";
import categoryEducation from "@/assets/images/education.svg";
import categoryFood from "@/assets/images/food.svg";
import categoryMore from "@/assets/images/moreIcon.svg";
import popularPhoto1 from "@/assets/images/popularPhoto1.jpg";
import popularPhoto2 from "@/assets/images/popularPhoto2.jpg";
import popularPhoto3 from "@/assets/images/popularPhoto3.jpg";
import starRating from "@/assets/images/starRating.svg";
import timeIcon from "@/assets/images/timeIcon.svg";
import blueMore from "@/assets/images/blueMoreIcon.svg";
import homePng from "@/assets/images/homePng.png";
import mockPhoto1 from "@/assets/images/mockPhoto1.jpg";
import mockPhoto2 from "@/assets/images/mockPhoto2.jpg";
import freeSeat from "@/assets/images/piplSvg.svg";
import geoMark from "@/assets/images/geoMark.svg";
import phoneIcon from "@/assets/images/phoneIcon.svg";
import strenght from "@/assets/images/strenghtIcon.svg";
import quitIcon from "@/assets/images/quitIcon.svg";
import security from "@/assets/images/security.svg";
import close from "@/assets/images/close.svg"
import calendar from "@/assets/images/calendar.svg"
import card from "@/assets/images/card.svg"
import discount from "@/assets/images/discount.svg"
import trash from "@/assets/images/trash.svg"
import kebabIcon from "@/assets/images/kebabIcon.svg"
import gpsIcon from "@/assets/images/gpsIcon.svg"
import guestsIcon from "@/assets/images/guestsIcon.svg"
import bagIcon from "@/assets/images/bagIcon.svg"
import arrowDown from "@/assets/images/arrowDown.svg"

export const assets = {
  nav: {
    home,
    map,
    business,
    booking,
    support,
  },
  header: {
    search,
    filter,
    notification,
    ruLang,
    uzLang,
    enLang,
    profileIcon,
    close,
  },
  notification: {
    calendar,
    card,
    discount,
    trash
  },
  hero: {
    photo1: mainPhoto1,
    photo2: mainPhoto2,
    photo3: mainPhoto3,
  },
  categories: {
    hairCare: categoryHairCare,
    health: categoryHealth,
    gym: categoryGym,
    education: categoryEducation,
    food: categoryFood,
    more: categoryMore,
  },
  popular: {
    photo1: popularPhoto1,
    photo2: popularPhoto2,
    photo3: popularPhoto3,
    starRating,
    timeIcon,
    blueMore,
  },
  marketing: {
    homePng,
  },
  map: {
    photo1: mockPhoto1,
    photo2: mockPhoto2,
    freeSeat,
    geoMark,
    phoneIcon,
    strenght,
    quitIcon,
    security
  },
  booking: {
    kebabIcon,
    gpsIcon,
    guestsIcon,
    bagIcon,
    arrowDown,
  }
} as const;

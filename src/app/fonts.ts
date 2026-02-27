import localFont from "next/font/local";

export const googleSansFont = localFont({
  src: [
    {
      path: "../../public/fonts/google_sans/GoogleSans-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/google_sans/GoogleSans-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/google_sans/GoogleSans-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/google_sans/GoogleSans-Bold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-google-sans",
  display: "swap",
});

export const sukhumvitFont = localFont({
  src: [
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_Thin.ttf",
      weight: "100",
      style: "normal",
    },
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_Text.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/sukhumvit/Sukhumvit-Set_Bold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-sukhumvit",
  display: "swap",
});

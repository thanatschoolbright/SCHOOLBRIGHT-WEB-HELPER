export const registerServiceWorker = () => {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").then(
        (registration) => {
          // ServiceWorker registration successful
        },
        (err) => {
          console.error("ServiceWorker registration failed: ", err);
        },
      );
    });
  }
};

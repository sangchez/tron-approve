import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "@/App.vue";
import errorHandler from "@/plugins/error-handler";
import i18n from "@/plugins/i18n";
import primevue from "@/plugins/primevue";
import router from "@/router";
import { setupWagmi } from "@/plugins/wagmi";
import { initThemeFromStorage } from "@/utils/theme-util";

import "primeicons/primeicons.css";

initThemeFromStorage();

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(primevue);
app.use(i18n);
setupWagmi(app);
app.use(errorHandler);

app.mount("#app");
